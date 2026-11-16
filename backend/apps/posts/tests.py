from rest_framework.test import APITestCase

from apps.notifications.models import Notification
from apps.repositories.models import Repository
from apps.users.models import User
from .models import Post, PostComment, PostReaction


class SocialFeedApiTests(APITestCase):
	def setUp(self):
		self.alice = User.objects.create_user(username="alice", email="alice@example.test", password="test-password")
		self.bob = User.objects.create_user(username="bob", email="bob@example.test", password="test-password")

	def test_authenticated_user_can_create_code_only_post(self):
		self.client.force_authenticate(self.alice)
		response = self.client.post(
			"/api/posts/",
			{"type": "code", "codeSnippet": {"language": "python", "code": "print('hello')"}},
			format="json",
		)
		self.assertEqual(response.status_code, 201, response.data)
		self.assertEqual(response.data["author"]["username"], "alice")
		self.assertEqual(response.data["codeSnippet"]["language"], "python")
		self.assertEqual(Post.objects.get().code_content, "print('hello')")

	def test_public_feed_hides_private_repository_posts_from_other_viewers(self):
		private_repository = Repository.objects.create(
			name="private-project",
			owner=self.alice,
			access=Repository.Access.PRIVATE,
		)
		post = Post.objects.create(
			posted_by=self.alice,
			description="Confidential",
			repository=private_repository,
			type=Post.Type.PROJECT,
		)
		self.assertEqual(self.client.get("/api/posts/").data["count"], 0)
		self.client.force_authenticate(self.bob)
		self.assertEqual(self.client.get("/api/posts/").data["count"], 0)
		self.client.force_authenticate(self.alice)
		response = self.client.get("/api/posts/")
		self.assertEqual(response.data["count"], 1)
		self.assertEqual(response.data["results"][0]["id"], str(post.pk))

	def test_global_search_matches_post_text_and_code_without_exposing_private_posts(self):
		public_post = Post.objects.create(
			posted_by=self.alice,
			description="A public discussion",
			code_content="unique-search-token",
			code_language="python",
		)
		private_repository = Repository.objects.create(
			name="private-search-project",
			owner=self.alice,
			access=Repository.Access.PRIVATE,
		)
		Post.objects.create(
			posted_by=self.alice,
			description="hidden-search-token",
			repository=private_repository,
			type=Post.Type.PROJECT,
		)

		response = self.client.get("/api/posts/?search=unique-search-token")
		self.assertEqual(response.data["count"], 1)
		self.assertEqual(response.data["results"][0]["id"], str(public_post.pk))
		self.assertEqual(self.client.get("/api/posts/?search=hidden-search-token").data["count"], 0)
		self.client.force_authenticate(self.alice)
		self.assertEqual(self.client.get("/api/posts/?search=hidden-search-token").data["count"], 1)

	def test_like_comment_and_bookmark_are_persisted_and_private_to_account_actions(self):
		post = Post.objects.create(posted_by=self.alice, description="Une publication")
		self.client.force_authenticate(self.bob)
		base = f"/api/posts/{post.pk}/"
		liked = self.client.put(f"{base}like/")
		self.assertTrue(liked.data["isLiked"])
		self.assertEqual(
			PostReaction.objects.filter(
				post=post,
				by=self.bob,
				type=PostReaction.Type.LIKE,
			).count(),
			1,
		)
		commented = self.client.post(f"{base}comments/", {"content": "Bravo"}, format="json")
		self.assertEqual(commented.status_code, 201)
		self.assertEqual(PostComment.objects.filter(post=post).count(), 1)
		self.client.put(f"{base}bookmark/")
		self.assertTrue(
			PostReaction.objects.filter(
				post=post,
				by=self.bob,
				type=PostReaction.Type.BOOKMARK,
			).exists()
		)
		self.assertEqual(Notification.objects.filter(recipient=self.alice).count(), 2)

		self.client.force_authenticate(self.alice)
		self.assertEqual(self.client.delete(base).status_code, 204)
