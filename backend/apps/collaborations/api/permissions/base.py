from rest_framework.request import Request
from rest_framework.permissions import BasePermission
from rest_framework.views import APIView

from ...models import (
    Attachment,
    Board,
    Note,
    Organisation,
    OrganisationMembership,
    Task,
    Team,
    ToDoList,
)


class OrganisationMemberPermission(BasePermission):
    reference_field: str

    def get_create_organisation(self, _request: Request, _view: APIView) -> Organisation | None:
        raise NotImplementedError

    def get_instance_organisation(self, instance: object) -> Organisation | None:
        if isinstance(instance, Organisation):
            return instance
        if isinstance(instance, Team):
            return instance.organisation
        if isinstance(instance, Board):
            return instance.team.organisation
        if isinstance(instance, (Attachment, Note, ToDoList)):
            return instance.board.team.organisation
        if isinstance(instance, Task):
            return instance.todo_list.board.team.organisation
        return None

    def is_member(self, organisation: Organisation | None, user: object) -> bool:
        return bool(
            organisation
            and OrganisationMembership.objects.filter(
                organisation=organisation,
                user=user,
            ).exists()
        )

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not request.user.is_authenticated:
            return False
        if view.action not in {"create", "update", "partial_update"}:
            return True
        if view.action != "create" and self.reference_field not in request.data:
            return True

        organisation = self.get_create_organisation(request, view)
        return organisation is not None and self.is_member(organisation, request.user)

    def has_object_permission(
        self,
        request: Request,
        _view: APIView,
        instance: object,
    ) -> bool:
        return self.is_member(self.get_instance_organisation(instance), request.user)
