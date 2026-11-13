from django.db.models import BooleanField, Count, Exists, OuterRef, Q, Value
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.services import create_notification
from apps.repositories.models import Repository
from .models import Post, PostBookmark, PostComment, PostLike
from .serializers import PostCommentCreateSerializer, PostCommentSerializer, PostCreateSerializer, PostSerializer

class FeedPagination(PageNumberPagination):
	page_size = 20
	page_size_query_param = "page_size"
	max_page_size = 50

def visible_posts(request):
	queryset = Post.objects.select_related(
		"posted_by", "posted_by__profile", "repository", "repository__owner"
	).annotate(
		likes_count=Count("post_likes", distinct=True),
		comments_count=Count("comments", distinct=True),
	)
	if request.user.is_authenticated:
		queryset = queryset.annotate(
			viewer_is_liked=Exists(PostLike.objects.filter(post_id=OuterRef("pk"), user=request.user)),
			viewer_is_bookmarked=Exists(PostBookmark.objects.filter(post_id=OuterRef("pk"), user=request.user)),
		)
		queryset = queryset.filter(
			Q(repository__isnull=True)
			| Q(repository__access=Repository.Access.PUBLIC)
			| Q(posted_by=request.user)
		)
	else:
		queryset = queryset.annotate(
			viewer_is_liked=Value(False, output_field=BooleanField()),
			viewer_is_bookmarked=Value(False, output_field=BooleanField()),
		).filter(Q(repository__isnull=True) | Q(repository__access=Repository.Access.PUBLIC))
	return queryset.order_by("-posted_at", "-pk")

def get_visible_post(request, post_id):
	post = visible_posts(request).filter(pk=post_id).first()
	if post is None:
		raise Http404
	return post

class PostListCreateView(APIView):
	def get_permissions(self):
		return [AllowAny()] if self.request.method == "GET" else [IsAuthenticated()]

	def get(self, request):
		queryset = visible_posts(request)
		author = request.query_params.get("author", "").strip()
		post_type = request.query_params.get("type", "").strip()
		if author:
			queryset = queryset.filter(posted_by__username__iexact=author)
		if post_type:
			queryset = queryset.filter(type=post_type)
		search = request.query_params.get("search", "").strip()[:100]
		if search:
			queryset = queryset.filter(
				Q(title__icontains=search)
				| Q(description__icontains=search)
				| Q(code_content__icontains=search)
				| Q(code_language__icontains=search)
				| Q(posted_by__username__icontains=search)
			)
		if request.query_params.get("following") == "true":
			if not request.user.is_authenticated:
				return Response({"detail": "Authentification requise."}, status=status.HTTP_401_UNAUTHORIZED)
			queryset = queryset.filter(
				Q(posted_by=request.user)
				| Q(posted_by__follower_links__follower=request.user)
			).distinct()
		if request.query_params.get("bookmarked") == "true":
			if not request.user.is_authenticated:
				return Response({"detail": "Authentification requise."}, status=status.HTTP_401_UNAUTHORIZED)
			queryset = queryset.filter(bookmarks__user=request.user)
		paginator = FeedPagination()
		page = paginator.paginate_queryset(queryset, request, view=self)
		return paginator.get_paginated_response(PostSerializer(page, many=True, context={"request": request}).data)

	def post(self, request):
		serializer = PostCreateSerializer(data=request.data, context={"request": request})
		serializer.is_valid(raise_exception=True)
		post = serializer.save()
		post = visible_posts(request).get(pk=post.pk)
		return Response(PostSerializer(post, context={"request": request}).data, status=status.HTTP_201_CREATED)

class PostDetailView(APIView):
	permission_classes = [IsAuthenticated]

	def delete(self, request, post_id):
		post = get_object_or_404(Post, pk=post_id, posted_by=request.user)
		post.delete()
		return Response(status=status.HTTP_204_NO_CONTENT)

class PostCommentsView(APIView):
	def get_permissions(self):
		return [AllowAny()] if self.request.method == "GET" else [IsAuthenticated()]

	def get(self, request, post_id):
		post = get_visible_post(request, post_id)
		comments = post.comments.select_related("author", "author__profile")[:100]
		return Response(PostCommentSerializer(comments, many=True, context={"request": request}).data)

	def post(self, request, post_id):
		post = get_visible_post(request, post_id)
		serializer = PostCommentCreateSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		comment = PostComment.objects.create(
			post=post,
			author=request.user,
			content=serializer.validated_data["content"],
		)
		create_notification(
			recipient=post.posted_by,
			actor=request.user,
			kind="comment",
			message="a commenté votre publication",
			target_url=f"/feed#{post.pk}",
		)
		return Response(
			PostCommentSerializer(comment, context={"request": request}).data,
			status=status.HTTP_201_CREATED,
		)

class PostLikeView(APIView):
	permission_classes = [IsAuthenticated]

	def put(self, request, post_id):
		post = get_visible_post(request, post_id)
		_, created = PostLike.objects.get_or_create(post=post, user=request.user)
		if created:
			create_notification(
				recipient=post.posted_by,
				actor=request.user,
				kind="reaction",
				message="a aimé votre publication",
				target_url=f"/feed#{post.pk}",
			)
		return Response({"isLiked": True, "likesCount": post.post_likes.count()})

	def delete(self, request, post_id):
		post = get_visible_post(request, post_id)
		post.post_likes.filter(user=request.user).delete()
		return Response({"isLiked": False, "likesCount": post.post_likes.count()})

class PostBookmarkView(APIView):
	permission_classes = [IsAuthenticated]

	def put(self, request, post_id):
		post = get_visible_post(request, post_id)
		PostBookmark.objects.get_or_create(post=post, user=request.user)
		return Response({"isBookmarked": True})

	def delete(self, request, post_id):
		post = get_visible_post(request, post_id)
		post.bookmarks.filter(user=request.user).delete()
		return Response({"isBookmarked": False})
