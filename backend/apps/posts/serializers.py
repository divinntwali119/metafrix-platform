from rest_framework import serializers
from .models import Event, Post, PostComment, Reel
from apps.repositories.models import Repository
from apps.users.serializers import UserSerializer

class EventSerializer(serializers.ModelSerializer):
  startDate = serializers.DateField(source="start_date", format="%Y-%m-%d", input_formats=["%Y-%m-%d"])
  endDate = serializers.DateField(source="end_date", format="%Y-%m-%d", input_formats=["%Y-%m-%d"])

  class Meta:
    model = Event
    fields = ["name", "description", "image", "organisator", "startDate", "endDate"]
    read_only_fields = ["organisator"]

class PostSerializer(serializers.ModelSerializer):
  id = serializers.CharField(read_only=True)
  author = UserSerializer(source="posted_by", read_only=True)
  content = serializers.CharField(source="description", read_only=True)
  codeSnippet = serializers.SerializerMethodField()
  repositoryRef = serializers.SerializerMethodField()
  mediaUrls = serializers.SerializerMethodField()
  likesCount = serializers.SerializerMethodField()
  commentsCount = serializers.SerializerMethodField()
  sharesCount = serializers.SerializerMethodField()
  isLiked = serializers.SerializerMethodField()
  isBookmarked = serializers.SerializerMethodField()
  createdAt = serializers.DateTimeField(source="posted_at", read_only=True)

  class Meta:
    model = Post
    fields = [
      "id", "author", "content", "type", "codeSnippet", "repositoryRef", "mediaUrls",
      "likesCount", "isLiked", "commentsCount", "sharesCount", "isBookmarked", "createdAt",
    ]

  def get_codeSnippet(self, post: Post):
    if not post.code_content:
      return None
    return {
      "language": post.code_language or "text",
      "code": post.code_content,
      "filename": post.code_filename or None,
    }

  def get_repositoryRef(self, post: Post):
    repository = post.repository
    if repository is None:
      return None
    request = self.context.get("request")
    if repository.access != Repository.Access.PUBLIC and (
      request is None or not request.user.is_authenticated or request.user.pk != repository.owner_id
    ):
      return None
    return {
      "id": str(repository.pk),
      "name": repository.name,
      "ownerUsername": repository.owner.username,
      "description": repository.description or "",
      "starsCount": getattr(repository, "stars_count", repository.stars.count()),
      "language": repository.language,
    }

  def get_mediaUrls(self, post: Post):
    return [post.media_url] if post.media_url else []

  def get_likesCount(self, post: Post) -> int:
    return getattr(post, "likes_count", None) if hasattr(post, "likes_count") else post.post_likes.count()

  def get_commentsCount(self, post: Post) -> int:
    return getattr(post, "comments_count", None) if hasattr(post, "comments_count") else post.comments.count()

  def get_sharesCount(self, post: Post) -> int:
    return 0

  def get_isLiked(self, post: Post) -> bool:
    request = self.context.get("request")
    if not request or not request.user.is_authenticated:
      return False
    return post.viewer_is_liked if hasattr(post, "viewer_is_liked") else post.post_likes.filter(user=request.user).exists()

  def get_isBookmarked(self, post: Post) -> bool:
    request = self.context.get("request")
    if not request or not request.user.is_authenticated:
      return False
    return post.viewer_is_bookmarked if hasattr(post, "viewer_is_bookmarked") else post.bookmarks.filter(user=request.user).exists()

class PostCreateSerializer(serializers.Serializer):
  content = serializers.CharField(max_length=10000, required=False, allow_blank=True, trim_whitespace=True)
  type = serializers.ChoiceField(choices=Post.Type.choices, default=Post.Type.TEXT)
  codeSnippet = serializers.DictField(required=False)
  repositoryId = serializers.PrimaryKeyRelatedField(
    source="repository",
    queryset=Repository.objects.filter(access=Repository.Access.PUBLIC),
    required=False,
    allow_null=True,
  )
  mediaUrl = serializers.URLField(max_length=2048, required=False, allow_blank=True)

  def validate(self, attrs):
    snippet = attrs.get("codeSnippet")
    if snippet is not None:
      language = snippet.get("language", "text")
      code = snippet.get("code", "")
      filename = snippet.get("filename", "")
      if not isinstance(language, str) or len(language) > 40:
        raise serializers.ValidationError({"codeSnippet": ["Langage invalide."]})
      if not isinstance(code, str) or not code.strip() or len(code) > 20000:
        raise serializers.ValidationError({"codeSnippet": ["Le code doit contenir 1 à 20 000 caractères."]})
      if not isinstance(filename, str) or len(filename) > 160:
        raise serializers.ValidationError({"codeSnippet": ["Nom de fichier invalide."]})
      attrs["code_language"] = language
      attrs["code_content"] = code
      attrs["code_filename"] = filename
      if attrs.get("type") == Post.Type.TEXT:
        attrs["type"] = Post.Type.CODE
    if not attrs.get("content", "").strip() and not snippet and not attrs.get("mediaUrl", "").strip():
      raise serializers.ValidationError({"content": ["Ajoutez du texte, un extrait de code ou un média."]})
    if attrs.get("type") == Post.Type.PROJECT and not attrs.get("repository"):
      raise serializers.ValidationError({"repositoryId": ["Sélectionnez un dépôt public à partager."]})
    return attrs

  def create(self, validated_data):
    return Post.objects.create(
      posted_by=self.context["request"].user,
      title="",
      description=validated_data.get("content", ""),
      type=validated_data["type"],
      repository=validated_data.get("repository"),
      media_url=validated_data.get("mediaUrl", ""),
      code_language=validated_data.get("code_language", ""),
      code_content=validated_data.get("code_content", ""),
      code_filename=validated_data.get("code_filename", ""),
    )

class PostCommentSerializer(serializers.ModelSerializer):
  id = serializers.CharField(read_only=True)
  postId = serializers.CharField(source="post_id", read_only=True)
  author = UserSerializer(read_only=True)
  likesCount = serializers.SerializerMethodField()
  isLiked = serializers.SerializerMethodField()
  createdAt = serializers.DateTimeField(source="created_at", read_only=True)

  class Meta:
    model = PostComment
    fields = ["id", "postId", "author", "content", "likesCount", "isLiked", "createdAt"]
    read_only_fields = fields

  def get_likesCount(self, comment):
    return 0

  def get_isLiked(self, comment):
    return False

class PostCommentCreateSerializer(serializers.Serializer):
  content = serializers.CharField(max_length=2000, trim_whitespace=True)

# Reel serializer
class ReelSerializer(serializers.ModelSerializer):
  author = UserSerializer(source="posted_by", read_only=True)
  videoUrl = serializers.FileField(source='processed_video')
  rawVideo = serializers.FileField(write_only=True, source='raw_video')
  createdAt = serializers.DateTimeField(source='created_at', format='%Y-%m-%d %H:%M')

  class Meta:
    model = Reel
    fields = [ 'id', 'author', 'caption', 'videoUrl', 'thumbnail', 'status', 'createdAt', 'rawVideo']
    read_only_fields = ['author', 'thumbnail', 'status', 'createdAt', 'videoUrl']