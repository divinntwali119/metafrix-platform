from rest_framework.test import APITestCase

from apps.notifications.models import Notification
from .models import User
from .models import Follow


class AuthenticationApiTests(APITestCase):
	def test_registration_returns_tokens_and_safe_user_data(self):
		response = self.client.post(
			"/api/auth/register/",
			{
				"name": "Amina Developer",
				"username": "amina_dev",
				"email": "amina@example.test",
				"password": "Long-Unique-Password-928!",
			},
			format="json",
		)

		self.assertEqual(response.status_code, 201)
		self.assertIn("access", response.data)
		self.assertIn("refresh", response.data)
		self.assertEqual(response.data["user"]["username"], "amina_dev")
		self.assertNotIn("password", response.data["user"])
		self.assertTrue(User.objects.get(username="amina_dev").check_password("Long-Unique-Password-928!"))

	def test_duplicate_email_is_rejected(self):
		User.objects.create_user(
			username="existing_user",
			email="existing@example.test",
			password="Long-Unique-Password-928!",
			expertise_domain=User.Domain.OTHER,
		)
		response = self.client.post(
			"/api/auth/register/",
			{
				"name": "Amina Developer",
				"username": "another_user",
				"email": "EXISTING@example.test",
				"password": "Another-Unique-Password-482!",
			},
			format="json",
		)
		self.assertEqual(response.status_code, 400)
		self.assertIn("email", response.data)

	def test_login_and_current_user_require_valid_credentials(self):
		user = User.objects.create_user(
			username="amina_dev",
			email="amina@example.test",
			password="Long-Unique-Password-928!",
			first_name="Amina",
			last_name="Developer",
			expertise_domain=User.Domain.OTHER,
		)

		bad_login = self.client.post(
			"/api/auth/login/",
			{"email": user.email, "password": "wrong-password"},
			format="json",
		)
		self.assertEqual(bad_login.status_code, 400)

		login = self.client.post(
			"/api/auth/login/",
			{"email": user.email, "password": "Long-Unique-Password-928!"},
			format="json",
		)
		self.assertEqual(login.status_code, 200)
		self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
		current_user = self.client.get("/api/users/me/")
		self.assertEqual(current_user.status_code, 200)
		self.assertEqual(current_user.data["email"], user.email)
		self.assertEqual(current_user.data["name"], "Amina Developer")

	def test_current_user_rejects_anonymous_requests(self):
		response = self.client.get("/api/users/me/")
		self.assertEqual(response.status_code, 401)

	def test_authenticated_user_can_update_persisted_profile_fields(self):
		user = User.objects.create_user(
			username="profile_owner",
			email="profile@example.test",
			password="Long-Unique-Password-928!",
			expertise_domain=User.Domain.OTHER,
		)
		self.client.force_authenticate(user)

		response = self.client.patch(
			"/api/users/me/",
			{
				"name": "Amina Developer",
				"bio": "Développeuse backend",
				"location": "Kigali",
				"website": "https://example.test",
			},
			format="json",
		)

		self.assertEqual(response.status_code, 200, response.data)
		self.assertEqual(response.data["name"], "Amina Developer")
		self.assertEqual(response.data["bio"], "Développeuse backend")
		self.assertEqual(response.data["location"], "Kigali")
		self.assertEqual(response.data["website"], "https://example.test")
		user.refresh_from_db()
		self.assertEqual(user.profile.bio, "Développeuse backend")

	def test_profile_update_rejects_unverified_email_changes(self):
		user = User.objects.create_user(
			username="profile_email_owner",
			email="profile-email@example.test",
			password="Long-Unique-Password-928!",
			expertise_domain=User.Domain.OTHER,
		)
		self.client.force_authenticate(user)

		response = self.client.patch(
			"/api/users/me/",
			{"email": "new-address@example.test"},
			format="json",
		)

		self.assertEqual(response.status_code, 400)
		user.refresh_from_db()
		self.assertEqual(user.email, "profile-email@example.test")


class DeveloperDirectoryApiTests(APITestCase):
	def setUp(self):
		self.alice = User.objects.create_user(
			username="alice",
			email="alice@example.test",
			password="test-password",
			first_name="Alice",
			expertise_domain=User.Domain.WEB_BACKEND,
		)
		self.bob = User.objects.create_user(
			username="bob",
			email="bob@example.test",
			password="test-password",
		)

	def test_public_directory_search_does_not_expose_email(self):
		response = self.client.get("/api/developers/?search=Alice")
		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data["count"], 1)
		profile = response.data["results"][0]
		self.assertEqual(profile["username"], "alice")
		self.assertEqual(profile["skills"], [self.alice.get_expertise_domain_display()])
		self.assertNotIn("email", profile)

	def test_follow_is_authenticated_idempotent_and_notifies_once(self):
		self.assertEqual(self.client.put("/api/developers/alice/follow/").status_code, 401)
		self.client.force_authenticate(self.bob)
		first = self.client.put("/api/developers/alice/follow/")
		second = self.client.put("/api/developers/alice/follow/")
		self.assertEqual(first.status_code, 200)
		self.assertTrue(second.data["isFollowed"])
		self.assertEqual(Follow.objects.filter(follower=self.bob, followed=self.alice).count(), 1)
		self.assertEqual(Notification.objects.filter(recipient=self.alice, kind="follow").count(), 1)

		unfollowed = self.client.delete("/api/developers/alice/follow/")
		self.assertFalse(unfollowed.data["isFollowed"])
		self.assertFalse(Follow.objects.filter(follower=self.bob, followed=self.alice).exists())

	def test_cannot_follow_self(self):
		self.client.force_authenticate(self.alice)
		self.assertEqual(self.client.put("/api/developers/alice/follow/").status_code, 400)
