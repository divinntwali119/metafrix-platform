from rest_framework.request import Request
from rest_framework.views import APIView

from ...models import Board, Organisation, Team, ToDoList
from .base import OrganisationMemberPermission


class TeamPermission(OrganisationMemberPermission):
    reference_field = "organisationSlug"

    def get_create_organisation(self, request: Request, _view: APIView) -> Organisation | None:
        slug = request.data.get("organisationSlug")
        if not isinstance(slug, str) or not slug:
            return None
        return Organisation.objects.filter(slug__iexact=slug).first()


class BoardPermission(OrganisationMemberPermission):
    reference_field = "teamSlug"

    def get_create_organisation(self, request: Request, _view: APIView) -> Organisation | None:
        slug = request.data.get("teamSlug")
        if not isinstance(slug, str) or not slug:
            return None
        team = Team.objects.select_related("organisation").filter(slug__iexact=slug).first()
        return team.organisation if team else None


class BoardChildPermission(OrganisationMemberPermission):
    reference_field = "boardId"

    def get_create_organisation(self, request: Request, _view: APIView) -> Organisation | None:
        board_id = request.data.get("boardId")
        try:
            board = Board.objects.select_related("team__organisation").filter(pk=board_id).first()
        except (TypeError, ValueError):
            return None
        return board.team.organisation if board else None


class TaskPermission(OrganisationMemberPermission):
    reference_field = "todoListId"

    def get_create_organisation(self, request: Request, _view: APIView) -> Organisation | None:
        todo_list_id = request.data.get("todoListId")
        try:
            todo_list = ToDoList.objects.select_related("board__team__organisation").filter(
                pk=todo_list_id
            ).first()
        except (TypeError, ValueError):
            return None
        return todo_list.board.team.organisation if todo_list else None
