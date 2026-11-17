from datetime import datetime, timezone
from pathlib import Path
import re
from typing import Any

from django.conf import settings

from apps.repositories.models import Repository

MAX_BLOB_BYTES = 1_000_000
MAX_TREE_ENTRIES = 5_000


class GitStorageUnavailable(RuntimeError):
    pass


class GitObjectNotFound(LookupError):
    pass


class InvalidGitPath(ValueError):
    pass


class GitBlobTooLarge(ValueError):
    pass


class GitTreeTooLarge(ValueError):
    pass


class GitBinaryFile(ValueError):
    pass


def validate_tree_path(path: str) -> list[str]:
    if path in ("", ".", "root"):
        return []
    if len(path) > 500 or path.startswith("/") or "\\" in path or "\0" in path:
        raise InvalidGitPath("Chemin Git invalide.")
    parts = path.split("/")
    if any(part in ("", ".", "..") for part in parts):
        raise InvalidGitPath("Chemin Git invalide.")
    return parts


def _repository_path(repository: Repository) -> Path:
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,119}", repository.name) or ".." in repository.name:
        raise GitStorageUnavailable("Le chemin du dépôt est invalide.")
    configured_root = Path(settings.GIT_REPOSITORY_ROOT).expanduser().absolute()
    try:
        root = configured_root.resolve(strict=True)
    except OSError as error:
        raise GitStorageUnavailable("Le stockage Git est indisponible.") from error
    owner_path = configured_root / str(repository.owner_id)
    repo_path = owner_path / repository.name
    if owner_path.is_symlink() or repo_path.is_symlink():
        raise GitStorageUnavailable("Le chemin du dépôt est invalide.")
    try:
        repo_path = repo_path.resolve(strict=True)
        owner_root = owner_path.resolve(strict=True)
    except OSError as error:
        raise GitStorageUnavailable("Le stockage Git est indisponible.") from error
    if not repo_path.is_relative_to(root) or repo_path.parent != owner_root:
        raise GitStorageUnavailable("Le chemin du dépôt est invalide.")
    if not repo_path.is_dir():
        raise GitStorageUnavailable("Le stockage Git du dépôt est indisponible.")
    return repo_path


def _open_repository(repository: Repository) -> tuple[Any, Any]:
    try:
        import pygit2
    except ImportError as error:
        raise GitStorageUnavailable("Le moteur Git n’est pas installé.") from error

    try:
        repo_path = _repository_path(repository)
        git_repository = pygit2.Repository(str(repo_path))
    except (OSError, pygit2.GitError, ValueError) as error:
        raise GitStorageUnavailable("Le stockage Git du dépôt est illisible.") from error
    return git_repository, pygit2


def _get_commit(git_repository: Any, repository: Repository, branch: str | None, pygit2: Any) -> Any | None:
    branch_name = branch or repository.default_branch
    if not branch_name or len(branch_name) > 255:
        raise GitObjectNotFound("Branche introuvable.")

    reference_name = f"refs/heads/{branch_name}"
    try:
        if not pygit2.reference_is_valid_name(reference_name):
            raise GitObjectNotFound("Branche introuvable.")
    except (TypeError, ValueError) as error:
        raise GitObjectNotFound("Branche introuvable.") from error
    try:
        commit, _ = git_repository.resolve_refish(reference_name)
    except (KeyError, ValueError, pygit2.GitError) as error:
        if not list(git_repository.branches.local) and branch_name == repository.default_branch:
            return None
        raise GitObjectNotFound("Branche introuvable.") from error
    if not isinstance(commit, pygit2.Commit):
        raise GitObjectNotFound("Branche introuvable.")
    return commit


def list_repository_branches(repository: Repository) -> list[str]:
    git_repository, _ = _open_repository(repository)
    from apps.git_server.git_tools import get_repo_metadata

    return sorted(get_repo_metadata(git_repository)["branches"])


def read_repository_tree(repository: Repository, path: str = "", branch: str | None = None) -> list[dict[str, Any]]:
    path_parts = validate_tree_path(path)
    git_repository, pygit2 = _open_repository(repository)
    commit = _get_commit(git_repository, repository, branch, pygit2)
    if commit is None:
        return []

    tree = commit.tree
    for part in path_parts:
        entry = next((candidate for candidate in tree if candidate.name == part), None)
        if entry is None:
            raise GitObjectNotFound("Chemin Git introuvable.")
        obj = git_repository[entry.id]
        if not isinstance(obj, pygit2.Tree):
            raise GitObjectNotFound("Le chemin ne désigne pas un dossier.")
        tree = obj

    if len(tree) > MAX_TREE_ENTRIES:
        raise GitTreeTooLarge("Ce dossier contient trop d’éléments pour être affiché.")

    items = []
    for entry in tree:
        obj = git_repository[entry.id]
        is_directory = isinstance(obj, pygit2.Tree)
        items.append(
            {
                "name": entry.name,
                "path": "/".join([*path_parts, entry.name]),
                "type": "dir" if is_directory else "file",
                "size": None if is_directory else getattr(obj, "size", None),
            }
        )
    return sorted(items, key=lambda item: (item["type"] != "dir", item["name"].casefold()))


def read_repository_blob(repository: Repository, path: str, branch: str | None = None) -> dict[str, Any]:
    path_parts = validate_tree_path(path)
    if not path_parts:
        raise InvalidGitPath("Un chemin de fichier est requis.")

    git_repository, pygit2 = _open_repository(repository)
    commit = _get_commit(git_repository, repository, branch, pygit2)
    if commit is None:
        raise GitObjectNotFound("Fichier Git introuvable.")

    tree = commit.tree
    for part in path_parts[:-1]:
        entry = next((candidate for candidate in tree if candidate.name == part), None)
        if entry is None:
            raise GitObjectNotFound("Fichier Git introuvable.")
        obj = git_repository[entry.id]
        if not isinstance(obj, pygit2.Tree):
            raise GitObjectNotFound("Fichier Git introuvable.")
        tree = obj

    entry = next((candidate for candidate in tree if candidate.name == path_parts[-1]), None)
    if entry is None:
        raise GitObjectNotFound("Fichier Git introuvable.")
    blob = git_repository[entry.id]
    if not isinstance(blob, pygit2.Blob):
        raise GitObjectNotFound("Fichier Git introuvable.")
    if blob.size > MAX_BLOB_BYTES:
        raise GitBlobTooLarge("Ce fichier dépasse la limite de lecture en ligne.")

    content = blob.data
    if b"\0" in content[:8192]:
        raise GitBinaryFile("Les fichiers binaires ne peuvent pas être affichés en ligne.")
    try:
        decoded_content = content.decode("utf-8")
    except UnicodeDecodeError as error:
        raise GitBinaryFile("Ce fichier n’est pas un texte UTF-8 affichable.") from error
    return {"path": "/".join(path_parts), "size": blob.size, "content": decoded_content}


def list_repository_commits(repository: Repository, branch: str | None = None,
    limit: int = 100,
) -> list[dict[str, Any]]:
    git_repository, pygit2 = _open_repository(repository)
    commit = _get_commit(git_repository, repository, branch, pygit2)
    if commit is None:
        return []

    from apps.git_server.git_tools import get_repo_metadata

    metadata = get_repo_metadata(
        git_repository,
        commit=commit,
        limit=max(1, min(limit, 100)),
    )
    return [
        {
            "id": item["sha"],
            "message": item["message"][:2000],
            "authorName": item["author_name"] or "Contributeur",
            "authorEmail": item["author_email"] or "",
            "date": datetime.fromtimestamp(item["time"], tz=timezone.utc).isoformat(),
        }
        for item in metadata["commits"]
    ]