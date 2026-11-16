from typing import Any, TypedDict

from rest_framework import serializers

from apps.repositories.models import Repository
from apps.users.api.serializers import UserSerializer
from ..models import Event, Post, PostComment, PostReaction, Reel, ReelComment


# Code snippet data
class CodeSnippetData(TypedDict):
    language: str
    code: str
    filename: str


# Type post create data
class PostCreateData(TypedDict, total=False):
    content: str
    type: Post.Type
    codeSnippet: CodeSnippetData
    repository: Repository | None
    mediaUrl: str
    code_language: str
    code_content: str
    code_filename: str


# Evenet serializer
class EventSerializer(serializers.ModelSerializer):
    startDate = serializers.DateField(
        source='start_date',
        format='%Y-%m-%d',
        input_formats=['%Y-%m-%d'],
        required=False,
        allow_null=True,
    )
    endDate = serializers.DateField(
        source='end_date',
        format='%Y-%m-%d',
        input_formats=['%Y-%m-%d'],
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Event
        fields = ['name', 'description', 'image', 'organisator', 'startDate', 'endDate']
        read_only_fields = ['organisator']



# Code sinppet serializer
class CodeSnippetSerializer(serializers.Serializer):
    language = serializers.CharField(max_length=40, required=False, default='text')
    code = serializers.CharField(max_length=20000, trim_whitespace=True)
    filename = serializers.CharField(max_length=160, required=False, allow_blank=True, default='')

    def validate_code(self, value: str) -> str:
        if not value:
            raise serializers.ValidationError('Le code doit contenir 1 à 20 000 caractères.')
        return value


# Post create serializers
class PostCreateSerializer(serializers.Serializer):
    content = serializers.CharField(
        max_length=10000,
        required=False,
        allow_blank=True,
        trim_whitespace=True,
    )
    type = serializers.ChoiceField(choices=Post.Type.choices, default=Post.Type.TEXT)
    codeSnippet = CodeSnippetSerializer(required=False)
    repositoryId = serializers.PrimaryKeyRelatedField(
        source='repository',
        queryset=Repository.objects.filter(access=Repository.Access.PUBLIC),
        required=False,
        allow_null=True,
    )
    mediaUrl = serializers.URLField(max_length=2048, required=False, allow_blank=True)

    def validate(self, attrs: PostCreateData) -> PostCreateData:
        snippet = attrs.get('codeSnippet')
        if snippet is not None:
            attrs['code_language'] = snippet['language']
            attrs['code_content'] = snippet['code']
            attrs['code_filename'] = snippet['filename']
            if attrs.get('type') == Post.Type.TEXT:
                attrs['type'] = Post.Type.CODE
        if (
            not attrs.get('content', '').strip()
            and not snippet
            and not attrs.get('mediaUrl', '').strip()
        ):
            raise serializers.ValidationError(
                {'content': ["Ajoutez du texte, un extrait de code ou un média."]}
            )
        if attrs.get('type') == Post.Type.PROJECT and not attrs.get('repository'):
            raise serializers.ValidationError(
                {'repositoryId': ['Sélectionnez un dépôt public à partager.']}
            )
        return attrs

    def create(self, validated_data: PostCreateData) -> Post:
        return Post.objects.create(
            posted_by=self.context['request'].user,
            title='',
            description=validated_data.get('content', ''),
            type=validated_data['type'],
            repository=validated_data.get('repository'),
            media_url=validated_data.get('mediaUrl', ''),
            code_language=validated_data.get('code_language', ''),
            code_content=validated_data.get('code_content', ''),
            code_filename=validated_data.get('code_filename', ''),
        )


# Shared comment serializer
class BaseCommentSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    author = UserSerializer(read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    content = serializers.CharField(max_length=2000, trim_whitespace=True)

    class Meta:
        fields = ['id', 'author', 'content', 'createdAt']
        read_only_fields = ['id', 'author', 'createdAt']


class PostCommentSerializer(BaseCommentSerializer):
    postId = serializers.CharField(source='post_id', read_only=True)

    class Meta(BaseCommentSerializer.Meta):
        model = PostComment
        fields = ['id', 'postId', 'author', 'content', 'createdAt']
        read_only_fields = fields


class ReelCommentSerializer(BaseCommentSerializer):
    reelId = serializers.CharField(source='reel_id', read_only=True)

    class Meta(BaseCommentSerializer.Meta):
        model = ReelComment
        fields = ['id', 'reelId', 'author', 'content', 'createdAt']
        read_only_fields = fields


class PostCommentCreateSerializer(serializers.Serializer):
    content = serializers.CharField(max_length=2000, trim_whitespace=True)


# Post serializer
class PostSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    author = UserSerializer(source='posted_by', read_only=True)
    content = serializers.CharField(source='description', read_only=True)
    codeSnippet = serializers.SerializerMethodField()
    repositoryRef = serializers.SerializerMethodField()
    mediaUrls = serializers.SerializerMethodField()
    likesCount = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()
    sharesCount = serializers.SerializerMethodField()
    isLiked = serializers.SerializerMethodField()
    isBookmarked = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source='posted_at', read_only=True)

    class Meta:
        model = Post
        fields = [
            'id',
            'author',
            'content',
            'type',
            'codeSnippet',
            'repositoryRef',
            'mediaUrls',
            'likesCount',
            'isLiked',
            'comments',
            'sharesCount',
            'isBookmarked',
            'createdAt',
        ]

    def get_codeSnippet(self, post: Post) -> dict[str, str] | None:
        if not post.code_content:
            return None
        return {
            'language': post.code_language or 'text',
            'code': post.code_content,
            'filename': post.code_filename or None,
        }

    def get_repositoryRef(self, post: Post) -> dict[str, object] | None:
        repository = post.repository
        if repository is None:
            return None
        request = self.context.get('request')
        if repository.access != Repository.Access.PUBLIC and (
            request is None
            or not request.user.is_authenticated
            or request.user.pk != repository.owner_id
        ):
            return None
        return {
            'id': str(repository.pk),
            'name': repository.name,
            'ownerUsername': repository.owner.username,
            'description': repository.description or '',
            'starsCount': getattr(repository, 'stars_count', repository.stars.count()),
            'language': repository.language,
        }

    def get_mediaUrls(self, post: Post) -> list[str]:
        return [post.media_url] if post.media_url else []

    def get_likesCount(self, post: Post) -> int:
        return post.reactions.filter(type=PostReaction.Type.LIKE).count()

    def get_comments(self, post: Post) -> list[dict[str, Any]]:
        return PostCommentSerializer(
            post.comments.all(),
            many=True,
            context=self.context,
        ).data

    def get_sharesCount(self, post: Post) -> int:
        return post.reactions.filter(type=PostReaction.Type.SHARED).count()

    def get_isLiked(self, post: Post) -> bool:
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return post.reactions.filter(by=request.user, type=PostReaction.Type.LIKE).exists()

    def get_isBookmarked(self, post: Post) -> bool:
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return post.reactions.filter(by=request.user, type=PostReaction.Type.BOOKMARK).exists()


# Reel serializer
class ReelSerializer(serializers.ModelSerializer):
    author = UserSerializer(source='posted_by', read_only=True)
    videoUrl = serializers.FileField(source='processed_video', read_only=True, allow_null=True)
    rawVideo = serializers.FileField(write_only=True, source='raw_video')
    comments = ReelCommentSerializer(source='comment', many=True, read_only=True)

    class Meta:
        model = Reel
        fields = [
            'id',
            'author',
            'caption',
            'videoUrl',
            'thumbnail',
            'status',
            'comments',
            'rawVideo',
        ]
        read_only_fields = ['author', 'thumbnail', 'status', 'videoUrl', 'comments']
