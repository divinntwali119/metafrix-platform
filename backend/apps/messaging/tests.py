from rest_framework.test import APITestCase

from apps.notifications.models import Notification
from apps.users.models import User
from .models import Conversation, ConversationParticipant


class MessagingApiTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username="alice", email="alice@example.test", password="test-password")
        self.bob = User.objects.create_user(username="bob", email="bob@example.test", password="test-password")
        self.eve = User.objects.create_user(username="eve", email="eve@example.test", password="test-password")

    def test_direct_conversation_is_idempotent_and_messages_require_membership(self):
        self.client.force_authenticate(self.alice)
        first = self.client.post("/api/conversations/direct/", {"username": "bob"}, format="json")
        second = self.client.post("/api/conversations/direct/", {"username": "bob"}, format="json")
        self.assertEqual(first.status_code, 200)
        self.assertEqual(first.data["id"], second.data["id"])
        self.assertEqual(Conversation.objects.count(), 1)

        url = f"/api/conversations/{first.data['id']}/messages/"
        posted = self.client.post(url, {"content": "Bonjour"}, format="json")
        self.assertEqual(posted.status_code, 201)
        self.assertEqual(posted.data["sender"]["username"], "alice")
        self.assertEqual(Notification.objects.filter(recipient=self.bob, actor=self.alice).count(), 1)

        alice_conversations = self.client.get("/api/conversations/")
        self.assertEqual(alice_conversations.status_code, 200)
        self.assertEqual(alice_conversations.data[0]["lastMessage"]["content"], "Bonjour")
        self.assertEqual(alice_conversations.data[0]["unreadCount"], 0)
        self.client.force_authenticate(self.bob)
        bob_conversations = self.client.get("/api/conversations/")
        self.assertEqual(bob_conversations.status_code, 200)
        self.assertEqual(bob_conversations.data[0]["lastMessage"]["content"], "Bonjour")
        self.assertEqual(bob_conversations.data[0]["unreadCount"], 1)

        self.client.force_authenticate(self.eve)
        self.assertEqual(self.client.get(url).status_code, 404)
        self.assertEqual(self.client.post(url, {"content": "intrusion"}, format="json").status_code, 404)

    def test_message_list_marks_only_current_participant_read(self):
        conversation = Conversation.objects.create(
            kind=Conversation.Kind.DIRECT,
            direct_key="alice:bob",
            created_by=self.alice,
        )
        ConversationParticipant.objects.create(conversation=conversation, user=self.alice)
        ConversationParticipant.objects.create(conversation=conversation, user=self.bob)
        self.client.force_authenticate(self.alice)
        url = f"/api/conversations/{conversation.pk}/messages/"
        self.client.post(url, {"content": "Bonjour"}, format="json")
        self.client.force_authenticate(self.bob)
        self.assertEqual(self.client.get(url).status_code, 200)
        self.assertIsNotNone(conversation.participant_links.get(user=self.bob).last_read_at)