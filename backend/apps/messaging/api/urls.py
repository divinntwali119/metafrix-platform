from django.urls import path

from .viewsets import ConversationListCreateView, ConversationMessagesView, DirectConversationView

app_name = "messaging"
urlpatterns = [
    path("conversations/", ConversationListCreateView.as_view(), name="conversation-list"),
    path("conversations/direct/", DirectConversationView.as_view(), name="conversation-direct"),
    path("conversations/<uuid:conversation_id>/messages/", ConversationMessagesView.as_view(), name="conversation-messages"),
]