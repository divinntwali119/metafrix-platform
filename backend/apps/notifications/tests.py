from rest_framework.test import APITestCase

from apps.users.models import User
from .models import Notification


class NotificationApiTests(APITestCase):
    def setUp(self):
        self.recipient = User.objects.create_user(
            username="recipient", email="recipient@example.test", password="test-password"
        )
        self.actor = User.objects.create_user(
            username="actor", email="actor@example.test", password="test-password"
        )
        self.notification = Notification.objects.create(
            recipient=self.recipient,
            actor=self.actor,
            kind=Notification.Type.FOLLOW,
            message="vous suit maintenant",
            target_url="/developers/actor",
        )

    def test_notifications_are_private_and_can_be_marked_read(self):
        self.client.force_authenticate(self.actor)
        self.assertEqual(self.client.get("/api/notifications/").data["count"], 0)

        self.client.force_authenticate(self.recipient)
        response = self.client.get("/api/notifications/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["results"][0]["actor"]["username"], "actor")
        self.assertNotIn("email", response.data["results"][0]["actor"])

        marked = self.client.patch(f"/api/notifications/{self.notification.pk}/", {}, format="json")
        self.assertEqual(marked.status_code, 200)
        self.assertTrue(marked.data["isRead"])

    def test_read_all_and_delete_are_limited_to_recipient(self):
        self.client.force_authenticate(self.actor)
        forbidden = self.client.delete(f"/api/notifications/{self.notification.pk}/")
        self.assertEqual(forbidden.status_code, 404)

        self.client.force_authenticate(self.recipient)
        self.assertEqual(self.client.post("/api/notifications/read-all/").data["updated"], 1)
        self.assertEqual(
            self.client.delete(f"/api/notifications/{self.notification.pk}/").status_code,
            204,
        )