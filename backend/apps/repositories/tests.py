import importlib.util
import tempfile
from unittest.mock import patch
from pathlib import Path
from unittest import skipUnless

from django.test import TestCase, override_settings
from rest_framework.test import APITestCase

from apps.users.models import User
from .git_reader import (
	InvalidGitPath,
	list_repository_branches,
	list_repository_commits,
	read_repository_blob,
	read_repository_tree,
	validate_tree_path,
)
from .models import Issue, Repository, RepositorySettings


class RepositoryApiTests(APITestCase):
	def setUp(self):
		self.owner = User.objects.create_user(
			username="owner",
			email="owner@example.test",
			password="Long-Unique-Password-928!",
			expertise_domain=User.Domain.OTHER,
		)
		self.other_user = User.objects.create_user(
			username="visitor",
			email="visitor@example.test",
			password="Another-Unique-Password-482!",
			expertise_domain=User.Domain.OTHER,
		)

	def test_private_repository_is_hidden_from_other_users(self):
		private_repo = Repository.objects.create(
			owner=self.owner,
			name="private-repo",
			access=Repository.Access.PRIVATE,
		)
		RepositorySettings.objects.create(repo=private_repo)

		anonymous_response = self.client.get("/api/repositories/owner/private-repo/")
		self.assertEqual(anonymous_response.status_code, 404)

		self.client.force_authenticate(self.other_user)
		other_user_response = self.client.get("/api/repositories/owner/private-repo/")
		self.assertEqual(other_user_response.status_code, 404)

		self.client.force_authenticate(self.owner)
		owner_response = self.client.get("/api/repositories/owner/private-repo/")
		self.assertEqual(owner_response.status_code, 200)
		self.assertTrue(owner_response.data["isPrivate"])

	def test_repository_search_respects_public_and_owner_visibility(self):
		public_repo = Repository.objects.create(
			owner=self.owner,
			name="search-public-project",
			access=Repository.Access.PUBLIC,
		)
		private_owner_repo = Repository.objects.create(
			owner=self.owner,
			name="search-owner-private-project",
			access=Repository.Access.PRIVATE,
		)
		private_visitor_repo = Repository.objects.create(
			owner=self.other_user,
			name="search-visitor-private-project",
			access=Repository.Access.PRIVATE,
		)

		anonymous_results = self.client.get("/api/repositories/?search=search-").data["results"]
		self.assertEqual({item["id"] for item in anonymous_results}, {str(public_repo.pk)})

		self.client.force_authenticate(self.owner)
		owner_results = self.client.get("/api/repositories/?search=search-").data["results"]
		self.assertEqual(
			{item["id"] for item in owner_results},
			{str(public_repo.pk), str(private_owner_repo.pk)},
		)

		self.client.force_authenticate(self.other_user)
		visitor_results = self.client.get("/api/repositories/?search=search-").data["results"]
		self.assertEqual(
			{item["id"] for item in visitor_results},
			{str(public_repo.pk), str(private_visitor_repo.pk)},
		)

	def test_default_branch_falls_back_when_settings_are_missing(self):
		repository = Repository.objects.create(
			owner=self.owner,
			name="legacy-repo",
			access=Repository.Access.PUBLIC,
		)

		self.assertEqual(repository.default_branch, "main")

	def test_git_paths_cannot_escape_repository_tree(self):
		for path in ("../outside", "/etc/passwd", "src/../../outside", "src\\outside", "bad\0path"):
			with self.subTest(path=path):
				with self.assertRaises(InvalidGitPath):
					validate_tree_path(path)

	@patch("apps.repositories.views.read_repository_tree")
	def test_public_repository_tree_is_available(self, read_tree):
		repository = Repository.objects.create(
			owner=self.owner,
			name="public-repo",
			access=Repository.Access.PUBLIC,
		)
		read_tree.return_value = [{"name": "README.md", "path": "README.md", "type": "file"}]

		response = self.client.get(f"/api/repositories/{repository.pk}/tree/?path=root&branch=main")

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data["results"][0]["path"], "README.md")
		read_tree.assert_called_once_with(repository, path="root", branch="main")

	def test_authenticated_member_can_star_and_watch_idempotently(self):
		repository = Repository.objects.create(
			owner=self.owner,
			name="social-repo",
			access=Repository.Access.PUBLIC,
		)
		self.client.force_authenticate(self.other_user)

		star_url = f"/api/repositories/{repository.pk}/star/"
		watch_url = f"/api/repositories/{repository.pk}/watch/"
		self.assertEqual(self.client.put(star_url).status_code, 200)
		self.assertEqual(self.client.put(star_url).data["starsCount"], 1)
		self.assertEqual(self.client.put(watch_url).status_code, 200)
		self.assertEqual(self.client.put(watch_url).data["watchersCount"], 1)

		detail = self.client.get("/api/repositories/owner/social-repo/")
		self.assertTrue(detail.data["isStarred"])
		self.assertTrue(detail.data["isWatching"])
		self.assertEqual(detail.data["starsCount"], 1)
		self.assertEqual(detail.data["watchersCount"], 1)

		self.assertEqual(self.client.delete(star_url).data["starsCount"], 0)
		self.assertEqual(self.client.delete(watch_url).data["watchersCount"], 0)

	def test_anonymous_member_cannot_star_repository(self):
		repository = Repository.objects.create(
			owner=self.owner,
			name="star-auth-repo",
			access=Repository.Access.PUBLIC,
		)

		response = self.client.put(f"/api/repositories/{repository.pk}/star/")

		self.assertEqual(response.status_code, 401)

	def test_owner_can_update_repository_metadata_but_not_rename_git_storage(self):
		repository = Repository.objects.create(
			owner=self.owner,
			name="metadata-repo",
			access=Repository.Access.PUBLIC,
			description="Initial description",
		)
		self.client.force_authenticate(self.owner)

		response = self.client.patch(
			f"/api/repositories/{repository.pk}/",
			{"description": "Updated description", "isPrivate": True},
			format="json",
		)

		self.assertEqual(response.status_code, 200, response.data)
		self.assertEqual(response.data["description"], "Updated description")
		self.assertTrue(response.data["isPrivate"])
		repository.refresh_from_db()
		self.assertEqual(repository.access, Repository.Access.PRIVATE)

		rename_response = self.client.patch(
			f"/api/repositories/{repository.pk}/",
			{"name": "renamed-repo"},
			format="json",
		)
		self.assertEqual(rename_response.status_code, 400)
		repository.refresh_from_db()
		self.assertEqual(repository.name, "metadata-repo")

	def test_repository_metadata_cannot_be_changed_by_another_user(self):
		repository = Repository.objects.create(
			owner=self.owner,
			name="owner-only-metadata",
			access=Repository.Access.PUBLIC,
		)
		self.client.force_authenticate(self.other_user)

		response = self.client.patch(
			f"/api/repositories/{repository.pk}/",
			{"description": "Unauthorized change"},
			format="json",
		)

		self.assertEqual(response.status_code, 404)
		repository.refresh_from_db()
		self.assertIsNone(repository.description)

	@patch("apps.repositories.views.read_repository_tree")
	def test_private_repository_tree_is_hidden_from_other_users(self, read_tree):
		repository = Repository.objects.create(
			owner=self.owner,
			name="private-tree",
			access=Repository.Access.PRIVATE,
		)
		self.client.force_authenticate(self.other_user)

		response = self.client.get(f"/api/repositories/{repository.pk}/tree/")

		self.assertEqual(response.status_code, 404)
		read_tree.assert_not_called()

	@patch("apps.repositories.views.create_repo_from_data")
	def test_authenticated_user_can_create_a_repository(self, create_git_repository):
		self.client.force_authenticate(self.owner)
		response = self.client.post(
			"/api/repositories/",
			{
				"name": "valid-repo",
				"description": "A test project",
				"isPrivate": False,
				"language": "Python",
				"topics": ["testing", "open-source"],
				"initializeReadme": True,
			},
			format="json",
		)

		self.assertEqual(response.status_code, 201, response.data)
		self.assertEqual(response.data["name"], "valid-repo")
		self.assertEqual(response.data["owner"]["username"], self.owner.username)
		self.assertEqual(response.data["topics"], ["testing", "open-source"])
		self.assertTrue(RepositorySettings.objects.filter(repo__owner=self.owner).exists())
		create_git_repository.assert_called_once()

	@patch("apps.repositories.views.create_repo_from_data")
	def test_repository_name_cannot_escape_storage_path(self, create_git_repository):
		self.client.force_authenticate(self.owner)
		response = self.client.post(
			"/api/repositories/",
			{"name": "../outside", "isPrivate": False},
			format="json",
		)
		self.assertEqual(response.status_code, 400)
		create_git_repository.assert_not_called()

	def test_public_issue_can_be_created_with_authentication(self):
		repository = Repository.objects.create(
			owner=self.owner,
			name="public-repo",
			access=Repository.Access.PUBLIC,
		)
		RepositorySettings.objects.create(repo=repository)
		self.client.force_authenticate(self.other_user)

		response = self.client.post(
			f"/api/repositories/{repository.pk}/issues/",
			{
				"title": "Add a feature",
				"body": "Please add a feature.",
				"labels": [{"name": "enhancement", "color": "#6366f1"}],
			},
			format="json",
		)

		self.assertEqual(response.status_code, 201, response.data)
		self.assertEqual(response.data["number"], 1)
		self.assertEqual(response.data["author"]["username"], self.other_user.username)
		self.assertEqual(Issue.objects.filter(repo=repository).count(), 1)

	def test_anonymous_user_cannot_create_an_issue(self):
		repository = Repository.objects.create(
			owner=self.owner,
			name="public-repo",
			access=Repository.Access.PUBLIC,
		)
		RepositorySettings.objects.create(repo=repository)
		response = self.client.post(
			f"/api/repositories/{repository.pk}/issues/",
			{"title": "Issue", "body": "Details", "labels": []},
			format="json",
		)
		self.assertEqual(response.status_code, 401)


@skipUnless(importlib.util.find_spec("pygit2"), "pygit2 is required for Git integration tests")
class GitReaderIntegrationTests(TestCase):
	def setUp(self):
		self.storage = tempfile.TemporaryDirectory()
		self.settings_override = override_settings(GIT_REPOSITORY_ROOT=self.storage.name)
		self.settings_override.enable()
		self.owner = User.objects.create_user(
			username="git-owner",
			email="git-owner@example.test",
			password="Long-Unique-Password-928!",
			expertise_domain=User.Domain.OTHER,
		)
		self.repository = Repository.objects.create(
			owner=self.owner,
			name="reader-repo",
			access=Repository.Access.PUBLIC,
		)
		self.repo_path = Path(self.storage.name) / str(self.owner.pk) / self.repository.name
		from apps.git_server.git_tools import init_repo

		init_repo(
			str(self.repo_path),
			author_name="Git Owner",
			author_email=self.owner.email,
			readme_text="# Reader test\n",
		)

	def tearDown(self):
		self.settings_override.disable()
		self.storage.cleanup()
		super().tearDown()

	def test_reads_branch_tree_blob_and_commit(self):
		self.assertEqual(list_repository_branches(self.repository), ["main"])
		self.assertEqual(
			read_repository_tree(self.repository),
			[{"name": "README.md", "path": "README.md", "type": "file", "size": 14}],
		)
		self.assertEqual(
			read_repository_blob(self.repository, "README.md")["content"],
			"# Reader test\n",
		)
		commits = list_repository_commits(self.repository)
		self.assertEqual(len(commits), 1)
		self.assertEqual(commits[0]["authorEmail"], self.owner.email)

	def test_git_read_endpoints_return_repository_content(self):
		branches = self.client.get(f"/api/repositories/{self.repository.pk}/branches/")
		tree = self.client.get(f"/api/repositories/{self.repository.pk}/tree/?path=root")
		blob = self.client.get(f"/api/repositories/{self.repository.pk}/blob/?path=README.md")
		commits = self.client.get(f"/api/repositories/{self.repository.pk}/commits/")

		self.assertEqual(branches.status_code, 200)
		self.assertEqual(branches.data["results"], ["main"])
		self.assertEqual(tree.status_code, 200)
		self.assertEqual(tree.data["results"][0]["path"], "README.md")
		self.assertEqual(blob.status_code, 200)
		self.assertEqual(blob.data["content"], "# Reader test\n")
		self.assertEqual(commits.status_code, 200)
		self.assertEqual(commits.data["results"][0]["message"], "Commit initial")

	def test_empty_repository_has_unborn_default_branch(self):
		from apps.git_server.git_tools import init_repo

		empty_repository = Repository.objects.create(
			owner=self.owner,
			name="empty-repo",
			access=Repository.Access.PUBLIC,
		)
		init_repo(
			str(Path(self.storage.name) / str(self.owner.pk) / empty_repository.name),
			author_name="Git Owner",
			author_email=self.owner.email,
		)

		self.assertEqual(list_repository_branches(empty_repository), [])
		self.assertEqual(read_repository_tree(empty_repository), [])
		self.assertEqual(list_repository_commits(empty_repository), [])

	def test_reader_rejects_parent_directory_in_blob_path(self):
		with self.assertRaises(InvalidGitPath):
			read_repository_blob(self.repository, "../README.md")
