from django.db.models import QuerySet
from rest_framework.viewsets import ModelViewSet

from ...models import Attachment, Board, Note, Task, Team, ToDoList
from ..permissions.team import (
    BoardChildPermission,
    BoardPermission,
    TaskPermission,
    TeamPermission,
)
from ..serializers.team import (
    AttachmentSerializer,
    BoardSerializer,
    NoteSerializer,
    TaskSerializer,
    TeamSerializer,
    ToDoListSerializer,
)


class OrganisationScopedViewSet(ModelViewSet):
    def get_queryset(self) -> QuerySet:
        user = self.request.user
        if not user.is_authenticated:
            return self.queryset.none()
        return self.queryset.filter(
            organisation__memberships__user=user
        ).distinct()


class TeamViewSet(OrganisationScopedViewSet):
    queryset = Team.objects.select_related("organisation", "created_by").prefetch_related(
        "members__user__profile",
        "spaces",
    )
    serializer_class = TeamSerializer
    permission_classes = [TeamPermission]
    lookup_field = "slug"


class BoardViewSet(ModelViewSet):
    queryset = Board.objects.select_related(
        "team__organisation",
        "repo",
    ).prefetch_related(
        "notes",
        "files__uploaded_by__user",
        "todo_lists__assigned_to__user",
    )
    serializer_class = BoardSerializer
    permission_classes = [BoardPermission]

    def get_queryset(self) -> QuerySet[Board]:
        if not self.request.user.is_authenticated:
            return self.queryset.none()
        return self.queryset.filter(
            team__organisation__memberships__user=self.request.user
        ).distinct()


class BoardChildViewSet(ModelViewSet):
    def get_queryset(self) -> QuerySet:
        if not self.request.user.is_authenticated:
            return self.queryset.none()
        return self.queryset.filter(
            board__team__organisation__memberships__user=self.request.user
        ).distinct()


class NoteViewSet(BoardChildViewSet):
    queryset = Note.objects.select_related(
        "board__team__organisation",
        "author__user__profile",
    )
    serializer_class = NoteSerializer
    permission_classes = [BoardChildPermission]


class AttachmentViewSet(BoardChildViewSet):
    queryset = Attachment.objects.select_related(
        "board__team__organisation",
        "uploaded_by__user__profile",
    )
    serializer_class = AttachmentSerializer
    permission_classes = [BoardChildPermission]


class ToDoListViewSet(BoardChildViewSet):
    queryset = ToDoList.objects.select_related(
        "board__team__organisation",
        "assigned_to__user__profile",
    ).prefetch_related("subtasks")
    serializer_class = ToDoListSerializer
    permission_classes = [BoardChildPermission]


class TaskViewSet(ModelViewSet):
    queryset = Task.objects.select_related("todo_list__board__team__organisation")
    serializer_class = TaskSerializer
    permission_classes = [TaskPermission]

    def get_queryset(self) -> QuerySet[Task]:
        if not self.request.user.is_authenticated:
            return self.queryset.none()
        return self.queryset.filter(
            todo_list__board__team__organisation__memberships__user=self.request.user
        ).distinct()
