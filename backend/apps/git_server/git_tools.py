from typing import Any
import pygit2

def rename_master_to_main(repo : pygit2.Repository) -> None:
    if 'master' in repo.branches:
        master_ref = repo.lookup_reference('refs/heads/master')
        master_ref.rename('refs/heads/main', force=True)
        repo.set_head('refs/heads/main')

# Init a repo 
def init_repo(repo_path : str, author_name : str, author_email : str, readme_text : str | None = None, license_text : str | None = None, gitignore : str | None = None) -> pygit2.Repository:
    repo = pygit2.init_repository(repo_path, bare=True)
    rename_master_to_main(repo)
    
    # Create the builder
    builder = repo.TreeBuilder()
    
    files_count = 0
    
    # Create blobs for README, LICENSE, and .gitignore if provided
    if readme_text:
        readme_blob = repo.create_blob(readme_text.encode('utf-8'))
        builder.insert('README.md', readme_blob, pygit2.GIT_FILEMODE_BLOB)
        files_count += 1
    if license_text:
        license_blob = repo.create_blob(license_text.encode('utf-8'))
        builder.insert('LICENSE', license_blob, pygit2.GIT_FILEMODE_BLOB)
        files_count += 1
    if gitignore:
        gitignore_blob = repo.create_blob(gitignore.encode('utf-8'))
        builder.insert('.gitignore', gitignore_blob, pygit2.GIT_FILEMODE_BLOB)
        files_count += 1

    # Keep an unborn main branch when the repository has no initial files.
    if not files_count:
        repo.set_head('refs/heads/main')
        return repo
        
    # Write the tree to the repository
    tree_oid = builder.write()
    
    # Define the author and committer
    author = pygit2.Signature(author_name, author_email)
    committer = pygit2.Signature(author_name, author_email)
    
    repo.create_commit('refs/heads/main', author, committer, 'Commit initial', tree_oid, [])
    return repo
    
# Get the repo metadata
def get_repo_metadata(
    repo: pygit2.Repository,
    commit: pygit2.Commit | None = None,
    limit: int | None = None,
) -> dict:
    locals_branches = list(repo.branches.local)
    
    commits : list[dict] = []
    try:
        target = commit.id if commit is not None else repo.head.target
        for item in repo.walk(target, pygit2.GIT_SORT_TIME):
            commits.append({
                'sha': str(item.id),
                'message': (item.message or '').strip(),
                'author': f'{item.author.name} <{item.author.email}>',
                'author_name': item.author.name,
                'author_email': item.author.email,
                'time': item.commit_time
            })
            if limit is not None and len(commits) >= limit:
                break
    except pygit2.GitError:
        pass
    
    tags = [
      ref.replace('refs/tags/', '')
      for ref in repo.references
      if ref.startswith('refs/tags/')
    ]
    
    return {'branches': locals_branches, 'commits': commits, 'tags': tags}
    
    
def get_pull_request_diff(repo_path: str, target_branch: str, source_branch: str) -> dict[str, Any]:
    repo = pygit2.Repository(repo_path)
    
    # Get branches ref
    target_ref = repo.lookup_reference(f'refs/heads/{target_branch}').peel()
    source_ref = repo.lookup_reference(f'refs/heads/{source_branch}').peel()
    
    # Generate diff
    diff = repo.diff(target_ref, source_ref)
    
    # Store stats
    summary = {
        "files_changed": diff.stats.files_changed,
        "insertions": diff.stats.insertions,
        "deletions": diff.stats.deletions,
        "files_details": []
    }
    
    # Store file details
    for delta in diff.deltas:
        status_map = {
            pygit2.GIT_DELTA_ADDED: 'ADDED',
            pygit2.GIT_DELTA_MODIFIED: 'MODIFIED',
            pygit2.GIT_DELTA_DELETED: 'DELETED',
            pygit2.GIT_DELTA_RENAMED: 'RENAMED',   
        }
        
        file_status = status_map.get(delta.status, "UNKNOWN")
        file_path = delta.new_file.path if file_status != 'DELETED' else delta.old_file.path
        
        summary["files_details"].append({
            "path": file_path,
            "status": file_status,
            "old_path": delta.old_file.path if file_status == "RENAMED" else None
        })
    
    # Brow and store the modification details 
    for patch in diff:
        summary['patches'] = []
        patch_hunk: dict[str, list[str]] = {}
        for hunk in patch.hunks:
            hunk_lines: list[str] = []
            for line in hunk.lines:
                hunk_lines.append(f'  {line.orgin} {line.content.strip()}')

            patch_hunk[hunk] = hunk_lines
            
        summary['patches'].append(patch_hunk)
        
    return summary