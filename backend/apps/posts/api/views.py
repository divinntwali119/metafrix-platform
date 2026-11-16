from uuid import UUID

from django.db.models import BooleanField, Count, Exists, OuterRef, Q, Value, QuerySet
from django.http import Http404, HttpRequest
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.services import create_notification
from apps.repositories.models import Repository
from ..models import Event, Post, PostComment, PostReaction, Reel, ReelComment
from .permissions import (
    IsAuthenticatedForWrite,
    IsEventOrganisator,
    IsPostOwner,
    IsReelOwner,
)
from .serializers import (
    EventSerializer,
    PostCommentCreateSerializer,
    PostCommentSerializer,
    PostCreateSerializer,
    PostSerializer,
    ReelCommentSerializer,
    ReelSerializer,
)


class FeedPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 50


def visible_posts(request: HttpRequest) -> QuerySet:
    queryset = Post.objects.select_related(
        'posted_by',
        'posted_by__profile',
        'repository',
        'repository__owner',
    ).annotate(
        likes_count=Count(
            'reactions',
            filter=Q(reactions__type=PostReaction.Type.LIKE),
            distinct=True,
        ),
        comments_count=Count('comments', distinct=True),
    )
    if request.user.is_authenticated:
        queryset = queryset.annotate(
            viewer_is_liked=Exists(
                PostReaction.objects.filter(
                    post_id=OuterRef('pk'),
                    by=request.user,
                    type=PostReaction.Type.LIKE,
                )
            ),
            viewer_is_bookmarked=Exists(
                PostReaction.objects.filter(
                    post_id=OuterRef('pk'),
                    by=request.user,
                    type=PostReaction.Type.BOOKMARK,
                )
            ),
        ).filter(
            Q(repository__isnull=True)
            | Q(repository__access=Repository.Access.PUBLIC)
            | Q(posted_by=request.user)
        )
    else:
        queryset = queryset.annotate(
            viewer_is_liked=Value(False, output_field=BooleanField()),
            viewer_is_bookmarked=Value(False, output_field=BooleanField()),
        ).filter(
            Q(repository__isnull=True)
            | Q(repository__access=Repository.Access.PUBLIC)
        )
    return queryset.order_by('-posted_at', '-pk')


def get_visible_post(request, post_id: str) -> Post:
    post = visible_posts(request).filter(pk=post_id).first()
    if post is None:
        raise Http404
    return post


class PostListCreateView(APIView):
    permission_classes = [IsAuthenticatedForWrite]

    def get(self, request):
        queryset = visible_posts(request)
        author = request.query_params.get('author', '').strip()
        post_type = request.query_params.get('type', '').strip()
        if author:
            queryset = queryset.filter(posted_by__username__iexact=author)
        if post_type:
            queryset = queryset.filter(type=post_type)
        search = request.query_params.get('search', '').strip()[:100]
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(code_content__icontains=search)
                | Q(code_language__icontains=search)
                | Q(posted_by__username__icontains=search)
            )
        if request.query_params.get('following') == 'true':
            if not request.user.is_authenticated:
                return Response(
                    {'detail': "Authentification requise."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            queryset = queryset.filter(
                Q(posted_by=request.user)
                | Q(posted_by__follower_links__follower=request.user)
            ).distinct()
        if request.query_params.get('bookmarked') == 'true':
            if not request.user.is_authenticated:
                return Response(
                    {'detail': 'Authentification requise.'},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            queryset = queryset.filter(
                reactions__by=request.user,
                reactions__type=PostReaction.Type.BOOKMARK,
            )
        paginator = FeedPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        return paginator.get_paginated_response(
            PostSerializer(page, many=True, context={'request': request}).data
        )

    def post(self, request):
        serializer = PostCreateSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        post = serializer.save()
        post = visible_posts(request).get(pk=post.pk)
        return Response(
            PostSerializer(post, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class PostDetailView(APIView):
    permission_classes = [IsAuthenticated, IsPostOwner]

    def delete(self, request, post_id):
        post = get_object_or_404(
            Post.objects.filter(posted_by=request.user),
            pk=post_id,
        )
        self.check_object_permissions(request, post)
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PostCommentsView(APIView):
    permission_classes = [IsAuthenticatedForWrite]

    def get(self, request, post_id):
        post = get_visible_post(request, post_id)
        comments = post.comments.select_related('author', 'author__profile')[:100]
        return Response(
            PostCommentSerializer(
                comments,
                many=True,
                context={'request': request},
            ).data
        )

    def post(self, request, post_id):
        post = get_visible_post(request, post_id)
        serializer = PostCommentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = PostComment.objects.create(
            post=post,
            author=request.user,
            content=serializer.validated_data['content'],
        )
        create_notification(
            recipient=post.posted_by,
            actor=request.user,
            kind='comment',
            message='a commenté votre publication',
            target_url=f'/feed#{post.pk}',
        )
        return Response(
            PostCommentSerializer(
                comment,
                context={'request': request},
            ).data,
            status=status.HTTP_201_CREATED,
        )


class PostLikeView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, post_id):
        post = get_visible_post(request, post_id)
        _, created = PostReaction.objects.get_or_create(
            post=post,
            by=request.user,
            type=PostReaction.Type.LIKE,
        )
        if created:
            create_notification(
                recipient=post.posted_by,
                actor=request.user,
                kind='reaction',
                message='a aimé votre publication',
                target_url=f'/feed#{post.pk}',
            )
        return Response(
            {
                'isLiked': True,
                'likesCount': post.reactions.filter(
                    type=PostReaction.Type.LIKE
                ).count(),
            }
        )

    def delete(self, request, post_id):
        post = get_visible_post(request, post_id)
        post.reactions.filter(
            by=request.user,
            type=PostReaction.Type.LIKE,
        ).delete()
        return Response(
            {
                'isLiked': False,
                'likesCount': post.reactions.filter(
                    type=PostReaction.Type.LIKE
                ).count(),
            }
        )


class PostBookmarkView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, post_id):
        post = get_visible_post(request, post_id)
        PostReaction.objects.get_or_create(
            post=post,
            by=request.user,
            type=PostReaction.Type.BOOKMARK,
        )
        return Response({'isBookmarked': True})

    def delete(self, request, post_id):
        post = get_visible_post(request, post_id)
        post.reactions.filter(
            by=request.user,
            type=PostReaction.Type.BOOKMARK,
        ).delete()
        return Response({'isBookmarked': False})


# Events
class EventListCreateView(APIView):
    permission_classes = [IsAuthenticatedForWrite]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request: Request) -> Response:
        queryset = Event.objects.select_related('organisator').order_by(
            '-start_date', '-pk'
        )
        search = request.query_params.get('search', '').strip()[:100]
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        paginator = FeedPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        return paginator.get_paginated_response(
            EventSerializer(page, many=True, context={'request': request}).data
        )

    def post(self, request: Request) -> Response:
        serializer = EventSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        event = serializer.save(organisator=request.user)
        return Response(
            EventSerializer(event, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class EventDetailView(APIView):
    permission_classes = [IsAuthenticatedForWrite, IsEventOrganisator]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_event(self, request: Request, event_id: UUID) -> Event:
        event = get_object_or_404(
            Event.objects.select_related('organisator'),
            pk=event_id,
        )
        self.check_object_permissions(request, event)
        return event

    def get(self, request: Request, event_id: UUID) -> Response:
        event = self.get_event(request, event_id)
        return Response(EventSerializer(event, context={'request': request}).data)

    def patch(self, request: Request, event_id: UUID) -> Response:
        event = self.get_event(request, event_id)
        serializer = EventSerializer(
            event,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request: Request, event_id: UUID) -> Response:
        event = self.get_event(request, event_id)
        event.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Reels
def visible_reels(request: Request) -> QuerySet:
    queryset = Reel.objects.select_related(
        'posted_by',
        'posted_by__profile',
    ).prefetch_related(
        'comment',
        'comment__author',
        'comment__author__profile',
    )
    is_ready = Q(processed_video__isnull=False) & ~Q(processed_video='')
    if request.user.is_authenticated:
        queryset = queryset.filter(is_ready | Q(posted_by=request.user))
    else:
        queryset = queryset.filter(is_ready)
    return queryset.order_by('-posted_at', '-pk')


def get_visible_reel(request: Request, reel_id: UUID) -> Reel:
    reel = visible_reels(request).filter(pk=reel_id).first()
    if reel is None:
        raise Http404
    return reel


class ReelListCreateView(APIView):
    permission_classes = [IsAuthenticatedForWrite]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request: Request) -> Response:
        queryset = visible_reels(request)
        author = request.query_params.get('author', '').strip()
        if author:
            queryset = queryset.filter(posted_by__username__iexact=author)
        paginator = FeedPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        return paginator.get_paginated_response(
            ReelSerializer(page, many=True, context={'request': request}).data
        )

    def post(self, request: Request) -> Response:
        serializer = ReelSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save(posted_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ReelDetailView(APIView):
    permission_classes = [IsAuthenticatedForWrite, IsReelOwner]

    def get(self, request: Request, reel_id: UUID) -> Response:
        reel = get_visible_reel(request, reel_id)
        return Response(ReelSerializer(reel, context={'request': request}).data)

    def delete(self, request: Request, reel_id: UUID) -> Response:
        reel = get_visible_reel(request, reel_id)
        self.check_object_permissions(request, reel)
        reel.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ReelCommentsView(APIView):
    permission_classes = [IsAuthenticatedForWrite]

    def get(self, request: Request, reel_id: UUID) -> Response:
        reel = get_visible_reel(request, reel_id)
        comments = reel.comment.select_related('author', 'author__profile')[:100]
        return Response(
            ReelCommentSerializer(
                comments,
                many=True,
                context={'request': request},
            ).data
        )

    def post(self, request: Request, reel_id: UUID) -> Response:
        reel = get_visible_reel(request, reel_id)
        serializer = PostCommentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = ReelComment.objects.create(
            reel=reel,
            author=request.user,
            content=serializer.validated_data['content'],
        )
        create_notification(
            recipient=reel.posted_by,
            actor=request.user,
            kind='comment',
            message='a commenté votre reel',
            target_url=f'/reels#{reel.pk}',
        )
        return Response(
            ReelCommentSerializer(comment, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )