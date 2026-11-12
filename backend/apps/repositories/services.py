import json
from datetime import date
from typing import Any
from urllib.parse import quote
from urllib.request import Request, urlopen
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


def create_repo_from_data(user: AbstractUser, data: dict[str, Any]) -> None:
    author_name = user.get_full_name()
    license_template = data.get('licenseTemplate')
    gitignore_template = data.get('gitignoreTemplate')

    init_repo(
        f'var/git/repos/{user.username}/{data.get("name")}',
        author_name=author_name,
        author_email=user.email,
        readme_text=data.get('description'),
        license_text=create_formatted_license(license_template, author_name),
        gitignore=create_gitignore_from_template(gitignore_template),
    )
