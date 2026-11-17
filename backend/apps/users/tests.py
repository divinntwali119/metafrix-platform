import hashlib
import re
from datetime import timedelta
from urllib.parse import parse_qs, urlparse

from django.core import mail
from django.core.cache import cache
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.auth.models import EmailVerificationToken, ExternalIdentity
from apps.notifications.models import Notification
from .models import ContactEmail, Follow, Settings, User


class AuthenticationApiTests(APITestCase):
	def setUp(self):
		cache.clear()

	def create_verified_user(self, **overrides):
		fields = {
			"username": "verified_user",
			"email": "verified@example.test",
			"password": "Long-Unique-Password-928!",
			"is_active": True,
			"is_email_verified": True,
			"expertise_domain": User.Domain.OTHER,
		}
		fields.update(overrides)
		return User.objects.create_user(**fields)

	@override_settings(
		EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
		APP_BASE_URL="https://metafrix.example.test",
	)
	def test_registration_requires_email_verification_before_login(self):
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
		self.assertEqual(response.data["verification_required"], True)
		self.assertTrue(response.data["email_sent"])
		self.assertNotIn("access", response.data)
		self.assertNotIn("refresh", response.data)
		self.assertNotIn("user", response.data)
		user = User.objects.get(username="amina_dev")
		self.assertFalse(user.is_active)
		self.assertFalse(user.is_email_verified)
		self.assertTrue(user.check_password("Long-Unique-Password-928!"))
		self.assertEqual(len(mail.outbox), 1)

		verification_url = re.search(r"https://metafrix\.example\.test/verify-email\?token=\S+", mail.outbox[0].body).group(0)
		token = parse_qs(urlparse(verification_url).query)["token"][0]
		verified = self.client.post("/api/auth/email/verify/", {"token": token}, format="json")
		self.assertEqual(verified.status_code, 200)
		user.refresh_from_db()
		self.assertTrue(user.is_active)
		self.assertTrue(user.is_email_verified)

		login = self.client.post(
			"/api/auth/login/",
			{"email": "AMINA@example.test", "password": "Long-Unique-Password-928!"},
			format="json",
		)
		self.assertEqual(login.status_code, 200)
		self.assertEqual(login.data["user"]["username"], "amina_dev")
		self.assertNotIn("password", login.data["user"])

		reused = self.client.post("/api/auth/email/verify/", {"token": token}, format="json")
		self.assertEqual(reused.status_code, 400)

	@override_settings(
		EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
		APP_BASE_URL="https://metafrix.example.test",
	)
	def test_registration_creates_profile_settings_and_primary_email(self):
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
		user = User.objects.get(username="amina_dev")
		primary_email = user.profile.emails.get(type=ContactEmail.Type.PRIMARY)
		self.assertEqual(primary_email.email, user.email)
		self.assertEqual(user.setting.default_notif_email, primary_email)
		self.assertEqual(user.setting.security_alerts_notif, user.email)
		self.assertEqual(user.setting.watching_repos, Settings.NotifyMeOn.METAFRIX)

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

	def test_duplicate_username_is_rejected_case_insensitively(self):
		User.objects.create_user(
			username="Existing_User",
			email="existing-username@example.test",
			password="Long-Unique-Password-928!",
			expertise_domain=User.Domain.OTHER,
		)
		response = self.client.post(
			"/api/auth/register/",
			{
				"name": "Amina Developer",
				"username": "existing_user",
				"email": "another-user@example.test",
				"password": "Another-Unique-Password-482!",
			},
			format="json",
		)
		self.assertEqual(response.status_code, 400)
		self.assertIn("username", response.data)

	def test_login_rejects_unverified_account_with_resend_guidance(self):
		user = User.objects.create_user(
			username="pending_user",
			email="pending@example.test",
			password="Long-Unique-Password-928!",
			expertise_domain=User.Domain.OTHER,
			is_active=False,
			is_email_verified=False,
		)
		response = self.client.post(
			"/api/auth/login/",
			{"email": user.email, "password": "Long-Unique-Password-928!"},
			format="json",
		)
		self.assertEqual(response.status_code, 403)
		self.assertIn("Confirmez votre adresse e-mail", response.data["detail"])

	def test_login_and_current_user_require_valid_credentials(self):
		user = self.create_verified_user(
			username="amina_dev",
			email="amina@example.test",
			first_name="Amina",
			last_name="Developer",
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
		self.assertTrue(current_user.data["emailVerified"])

	@override_settings(
		EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
		APP_BASE_URL="https://metafrix.example.test",
	)
	def test_expired_email_verification_token_is_rejected(self):
		user = User.objects.create_user(
			username="expired_user",
			email="expired@example.test",
			password="Long-Unique-Password-928!",
			expertise_domain=User.Domain.OTHER,
			is_active=False,
			is_email_verified=False,
		)
		raw_token = "an-expired-one-time-token"
		EmailVerificationToken.objects.create(
			user=user,
			email=user.email,
			token_hash=hashlib.sha256(raw_token.encode()).hexdigest(),
			expires_at=timezone.now() - timedelta(seconds=1),
		)
		response = self.client.post("/api/auth/email/verify/", {"token": raw_token}, format="json")
		self.assertEqual(response.status_code, 400)
		user.refresh_from_db()
		self.assertFalse(user.is_active)
		self.assertFalse(user.is_email_verified)

	@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
	def test_resend_verification_has_generic_response(self):
		User.objects.create_user(
			username="pending_user",
			email="pending@example.test",
			password="Long-Unique-Password-928!",
			expertise_domain=User.Domain.OTHER,
			is_active=False,
			is_email_verified=False,
		)
		pending = self.client.post("/api/auth/email/resend-verification/", {"email": "pending@example.test"}, format="json")
		unknown = self.client.post("/api/auth/email/resend-verification/", {"email": "unknown@example.test"}, format="json")
		self.assertEqual(pending.status_code, 200)
		self.assertEqual(pending.data, unknown.data)
		self.assertEqual(len(mail.outbox), 1)

	@override_settings(
		EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
		APP_BASE_URL="https://metafrix.example.test",
	)
	def test_password_reset_is_generic_and_revokes_refresh_tokens(self):
		user = self.create_verified_user()
		session = self.client.post(
			"/api/auth/login/",
			{"email": user.email, "password": "Long-Unique-Password-928!"},
			format="json",
		)
		self.assertEqual(session.status_code, 200)
		refresh_token = session.data["refresh"]
		access_token = session.data["access"]
		known = self.client.post("/api/auth/password/reset/", {"email": user.email}, format="json")
		unknown = self.client.post("/api/auth/password/reset/", {"email": "missing@example.test"}, format="json")
		self.assertEqual(known.status_code, 200)
		self.assertEqual(known.data, unknown.data)
		self.assertEqual(len(mail.outbox), 1)

		reset_url = re.search(r"https://metafrix\.example\.test/reset-password\?\S+", mail.outbox[0].body).group(0)
		query = parse_qs(urlparse(reset_url).query)
		reset = self.client.post(
			"/api/auth/password/reset/confirm/",
			{
				"uid": query["uid"][0],
				"token": query["token"][0],
				"new_password": "New-Unique-Password-572!",
			},
			format="json",
		)
		self.assertEqual(reset.status_code, 200, reset.data)
		self.assertEqual(
			self.client.post("/api/auth/token/refresh/", {"refresh": refresh_token}, format="json").status_code,
			401,
		)
		self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
		self.assertEqual(self.client.get("/api/users/me/").status_code, 401)
		self.client.credentials()
		self.assertEqual(
			self.client.post("/api/auth/login/", {"email": user.email, "password": "Long-Unique-Password-928!"}, format="json").status_code,
			400,
		)
		self.assertEqual(
			self.client.post("/api/auth/login/", {"email": user.email, "password": "New-Unique-Password-572!"}, format="json").status_code,
			200,
		)

	def test_password_change_blacklists_existing_refresh_tokens(self):
		user = self.create_verified_user()
		session = self.client.post(
			"/api/auth/login/",
			{"email": user.email, "password": "Long-Unique-Password-928!"},
			format="json",
		)
		self.assertEqual(session.status_code, 200)
		refresh_token = session.data["refresh"]
		self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {session.data['access']}")
		response = self.client.post(
			"/api/auth/password/change/",
			{
				"current_password": "Long-Unique-Password-928!",
				"new_password": "Changed-Unique-Password-573!",
			},
			format="json",
		)
		self.assertEqual(response.status_code, 200, response.data)
		self.assertEqual(
			self.client.post("/api/auth/token/refresh/", {"refresh": refresh_token}, format="json").status_code,
			401,
		)
		self.assertEqual(self.client.get("/api/users/me/").status_code, 401)

	@override_settings(AUTH_EXCHANGE_SECRET="a-long-test-only-oauth-exchange-secret-0123456789")
	def test_oauth_exchange_creates_verified_account_and_rejects_duplicate_email(self):
		payload = {
			"provider": "google",
			"subject": "google-subject-123",
			"email": "oauth@example.test",
			"email_verified": True,
			"name": "OAuth Developer",
		}
		unauthorized = self.client.post("/api/auth/oauth/exchange/", payload, format="json")
		self.assertEqual(unauthorized.status_code, 403)
		created = self.client.post(
			"/api/auth/oauth/exchange/",
			payload,
			format="json",
			HTTP_X_AUTH_EXCHANGE_KEY="a-long-test-only-oauth-exchange-secret-0123456789",
		)
		self.assertEqual(created.status_code, 201, created.data)
		self.assertIn("access", created.data)
		user = User.objects.get(email="oauth@example.test")
		self.assertTrue(user.is_active)
		self.assertTrue(user.is_email_verified)
		self.assertEqual(ExternalIdentity.objects.filter(user=user, provider="google").count(), 1)

		duplicate = self.client.post(
			"/api/auth/oauth/exchange/",
			{**payload, "subject": "another-subject"},
			format="json",
			HTTP_X_AUTH_EXCHANGE_KEY="a-long-test-only-oauth-exchange-secret-0123456789",
		)
		self.assertEqual(duplicate.status_code, 409)
		self.assertEqual(User.objects.filter(email__iexact="oauth@example.test").count(), 1)

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
