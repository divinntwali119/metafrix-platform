import json
import re
import shutil
from datetime import date
from pathlib import Path
from typing import Any
from urllib.parse import quote
from urllib.request import Request, urlopen

from django.conf import settings
from django.contrib.auth.models import AbstractUser

from apps.git_server.git_tools import init_repo


def create_formatted_license(license_template: str | None, full_name: str, year: int | None = None) -> str | None:
    if not license_template:
        return None

    full_name = full_name.strip()
    if not full_name:
        raise ValueError('A full name is required to format the license.')

    request = Request(
        f'https://api.github.com/licenses/{quote(license_template, safe="")}',
        headers={
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'Metafrix',
        },
    )
    with urlopen(request, timeout=10) as response:
        license_data: Any = json.loads(response.read().decode('utf-8'))

    if not isinstance(license_data, dict):
        raise ValueError(f'GitHub returned an invalid license response for {license_template!r}.')

    license_text = license_data.get('body')
    if not isinstance(license_text, str):
        raise ValueError(f'GitHub did not return a license body for {license_template!r}.')

    license_year = date.today().year if year is None else year
    return license_text.replace('[year]', str(license_year)).replace('[fullname]', full_name)


def create_gitignore_from_template(gitignore_template: str | None) -> str | None:
    if not gitignore_template:
        return None

    request = Request(
        f'https://api.github.com/gitignore/templates/{quote(gitignore_template, safe="")}',
        headers={
            'Accept': 'application/vnd.github.raw',
            'User-Agent': 'Metafrix',
        },
    )
    with urlopen(request, timeout=10) as response:
        gitignore_text = response.read().decode('utf-8')

    if not gitignore_text:
        raise ValueError(f'GitHub returned an empty .gitignore template for {gitignore_template!r}.')

    return gitignore_text


def create_repo_from_data(user: AbstractUser, data: dict[str, Any]) -> Path:
    name = str(data.get('name', ''))
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]{0,119}', name) or '..' in name:
        raise ValueError('Invalid repository name.')

    repository_root = Path(settings.GIT_REPOSITORY_ROOT).resolve()
    repo_path = (repository_root / str(user.pk) / name).resolve()
    if not repo_path.is_relative_to(repository_root):
        raise ValueError('Repository path escapes the configured storage directory.')
    if repo_path.exists():
        raise FileExistsError('A Git repository already exists at this path.')

    author_name = user.get_full_name().strip() or user.get_username()
    readme_text = None
    if data.get('initializeReadme', True):
        description = str(data.get('description') or '').strip()
        readme_text = f'# {name}\n' + (f'\n{description}\n' if description else '')
    repo_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        init_repo(
            str(repo_path),
            author_name=author_name,
            author_email=user.email or f'{user.get_username()}@localhost',
            readme_text=readme_text,
        )
    except Exception:
        shutil.rmtree(repo_path, ignore_errors=True)
        raise
    return repo_path
