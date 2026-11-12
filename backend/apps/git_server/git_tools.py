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

    # Return if no files content given
    if not files_count:
        return repo
        
    # Write the tree to the repository
    tree_oid = builder.write()
    
    # Define the author and committer
    author = pygit2.Signature(author_name, author_email)
    committer = pygit2.Signature(author_name, author_email)
    
    repo.create_commit('refs/heads/main', author, committer, 'Commit initial', tree_oid)
    
# Get the repo metadata
def get_repo_metadata(repo : pygit2.Repository) -> dict:
    locals_branches = list(repo.branches.local)
    
    commits : list[dict] = []
    try:
        for commit in repo.walk(repo.head.target, pygit2.GIT_SORT_TIME):
            commits.append({
                'sha': str(commit.id),
                'message': commit.message.strip(),
                'author': f'{commit.author.name} <{commit.author.email}>',
                'time': commit.commit_time
            })
    except pygit2.GitError:
        pass
    
    tags = [
      ref.replace('refs/tags/', '')
      for ref in repo.references
      if ref.startswith('refs/tags/')
    ]
    
    return {'branches': locals_branches, 'commits': commits, 'tags': tags}
    