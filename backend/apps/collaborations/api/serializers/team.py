from typing import Any

from rest_framework import serializers

from apps.users.models import User
from apps.users.serializers import UserSerializer
from apps.repositories.models import Repository
from apps.repositories.serializers import RepositorySerializer
from ...models import (
    Attachment,
    Board,
    Member,
    Note,
    Task,
    Team,
    ToDoList,
)
from ...models import Organisation
from .related import OrganisationSummarySerializer


class NestedSerializerMixin:
    def serialize_nested(
        self,
        instance: Any,
        serializer_class: type[serializers.BaseSerializer],
        *,
        many: bool = False,
        requires_details: bool = False,
    ) -> Any:
        if instance is None:
            return None
        if requires_details and not self.context.get('include_details', False):
            return []
        return serializer_class(
            instance,
            many=many,
            context=self.context,
        ).data


# Attachment seriallizer
class AttachmentSerializer(NestedSerializerMixin, serializers.ModelSerializer):
    boardId = serializers.PrimaryKeyRelatedField(source='board', queryset=Board.objects.all(), write_only=True)
    uploadedById = serializers.PrimaryKeyRelatedField(source='uploaded_by', queryset=Member.objects.all(), write_only=True)
    uploadedBy = serializers.SerializerMethodField()
    uploadedAt = serializers.DateTimeField(source='uploaded_at', read_only=True)

    class Meta:
        model = Attachment
        fields = ['id', 'file', 'boardId', 'uploadedById', 'uploadedBy', 'uploadedAt']
        read_only_fields = ['id', 'uploadedAt']

    def get_uploadedBy(self, attachment: Attachment) -> dict[str, Any]:
        return self.serialize_nested(attachment.uploaded_by.user, UserSerializer)


# Note serializer
class NoteSerializer(NestedSerializerMixin, serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    boardId = serializers.PrimaryKeyRelatedField(source='board', queryset=Board.objects.all(), write_only=True)
    authorId = serializers.PrimaryKeyRelatedField(source='author', queryset=Member.objects.all(), write_only=True, required=False, allow_null=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)

    class Meta:
        model = Note
        fields = [
            'id',
            'title',
            'description',
            'author',
            'boardId',
            'authorId',
            'createdAt',
            'updatedAt',
            'color',
        ]
        read_only_fields = ['id', 'author', 'createdAt', 'updatedAt']

    def get_author(self, note: Note) -> dict[str, Any] | None:
        if note.author is None:
            return None
        return self.serialize_nested(note.author.user, UserSerializer)

# Task serilaizer
class TaskSerializer(serializers.ModelSerializer):
    todoListId = serializers.PrimaryKeyRelatedField(
        source='todo_list',
        queryset=ToDoList.objects.all(),
        write_only=True,
    )
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'description',
            'todoListId',
            'createdAt',
            'updatedAt',
            'completed',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']
        
        
# TodoList serializer
class ToDoListSerializer(NestedSerializerMixin, serializers.ModelSerializer):
    boardId = serializers.PrimaryKeyRelatedField(source='board', queryset=Board.objects.all(), write_only=True)
    assignedTo = serializers.SerializerMethodField()
    assignedToId = serializers.PrimaryKeyRelatedField(
        source='assigned_to',
        queryset=Member.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    tasks = serializers.SerializerMethodField()

    class Meta:
        model = ToDoList
        fields = [
            'id',
            'title',
            'description',
            'assignedTo',
            'assignedToId',
            'createdAt',
            'updatedAt',
            'deadline',
            'completed',
            'boardId',
            'tasks',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']

    def create(self, validated_data: dict) -> ToDoList:
        return ToDoList.objects.create(**validated_data)

    def get_tasks(self, todo_list: ToDoList) -> list[dict[str, Any]]:
        return self.serialize_nested(todo_list.subtasks.all(), TaskSerializer, many=True)
    
    def get_assignedTo(self, todo_list: ToDoList) -> dict[str, Any] | None:
        if todo_list.assigned_to is None:
            return None
        return self.serialize_nested(todo_list.assigned_to.user, UserSerializer)
        
        
# Board serializer
class BoardSerializer(NestedSerializerMixin, serializers.ModelSerializer):
    repoSlug = serializers.SlugRelatedField(source='repo', slug_field='slug', queryset=Repository.objects.all(), write_only=True)
    teamSlug = serializers.SlugRelatedField(source='team', slug_field='slug', queryset=Team.objects.all(), write_only=True)
    teamId = serializers.IntegerField(source='team_id', read_only=True)
    repo = serializers.SerializerMethodField()
    notes = serializers.SerializerMethodField()
    attachments = serializers.SerializerMethodField()
    todoLists = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    
    class Meta:
        model = Board
        fields = [
            'id',
            'repo',
            'repoSlug',
            'name',
            'teamId',
            'teamSlug',
            'createdAt',
            'updatedAt',
            'deadline',
            'notes',
            'attachments',
            'todoLists',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt', 'repo', 'notes', 'attachments', 'todoLists']

    def get_repo(self, board: Board) -> dict[str, Any] | None:
        return self.serialize_nested(board.repo, RepositorySerializer)
    
    def get_notes(self, board: Board) -> list[dict[str, Any]]:
        return self.serialize_nested(
            board.notes.all(),
            NoteSerializer,
            many=True,
            requires_details=True,
        )
        
    def get_attachments(self, board: Board) -> list[dict[str, Any]]:
        return self.serialize_nested(
            board.files.all(),
            AttachmentSerializer,
            many=True,
            requires_details=True,
        )
    
    def get_todoLists(self, board: Board) -> list[dict[str, Any]]:
        return self.serialize_nested(
            board.todo_lists.all(),
            ToDoListSerializer,
            many=True,
            requires_details=True,
        )


# Team serializer
class TeamSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    createdBy = UserSerializer(source='created_by', read_only=True, allow_null=True)
    createdById = serializers.PrimaryKeyRelatedField(
        source='created_by',
        queryset=User.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )
    imageProfile = serializers.ImageField(source='image_profile',allow_null=True,required=False,)
    organisation = serializers.SerializerMethodField()
    organisationSlug = serializers.SlugRelatedField(
        source='organisation',
        slug_field='slug',
        queryset=Organisation.objects.all(),
        write_only=True,
    )
    members = serializers.SerializerMethodField()
    boards = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = [
            'slug',
            'name',
            'createdAt',
            'createdBy',
            'createdById',
            'imageProfile',
            'organisation',
            'organisationSlug',
            'members',
            'boards',
        ]
        read_only_fields = ['slug', 'createdAt', 'createdBy', 'members', 'organisation', 'boards']

    def get_boards(self, team: Team) -> list[dict[str, Any]]:
        if self.context.get('include_details', False):
            return []
        
        request = self.context.get('request')
        if request is None or not request.user.is_authenticated:
            return []
        
        return BoardSerializer(team.spaces.all(), many=True, context=self.context).data
        
    def get_organisation(self, team: Team) -> dict[str, Any] | None:
        if team.organisation is None:
            return None
        return OrganisationSummarySerializer(team.organisation).data
        
    def get_members(self, team: Team) -> list[dict[str, Any]]:
        request = self.context.get('request')
        
        if request is None or not request.user.is_authenticated:
            return []
        
        members = team.members.select_related('user', 'user__profile').all()
        return [
            {
                'user': UserSerializer(link.user, context={'request': request}).data, 
                'role': link.role,
                'tag': link.tag,
                'joinedAt': link.created_at
            }
            for link in members
        ]

    def create(self, validated_data: dict) -> Team:
        request = self.context.get('request')
        if validated_data.get('created_by') is None and request is not None:
            validated_data['created_by'] = request.user
        return Team.objects.create(**validated_data)