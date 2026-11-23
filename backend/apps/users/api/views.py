from django.db.models import Q
from django.http import HttpRequest

from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.services import create_notification
from ..models import Follow, User
from .serializers import (
    CurrentUserSerializer,
    CurrentUserUpdateSerializer,
    DeveloperSerializer,
)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: HttpRequest) -> Response:
        return Response(
            CurrentUserSerializer(
                request.user,
                context={'request': request},
            ).data
        )

    def patch(self, request: HttpRequest) -> Response:
        serializer = CurrentUserUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            CurrentUserSerializer(user, context={'request': request}).data
        )


class DeveloperPagination(PageNumberPagination):
    page_size = 24
    page_size_query_param = 'page_size'
    max_page_size = 60


class DeveloperListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: HttpRequest) -> Response:
        queryset = User.objects.filter(is_active=True).select_related('profile').order_by('username')
        search = request.query_params.get('search', '').strip()
        expertise = request.query_params.get('expertise', '').strip()

        if search:
            search_filter = (
                Q(username__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(profile__bio__icontains=search)
                | Q(profile__location__icontains=search)
                | Q(expertise_domain__icontains=search)
            )
            matching_domains = [
                value
                for value, label in User.Domain.choices
                if search.casefold() in value.casefold()
                or search.casefold() in label.casefold()
            ]
            if matching_domains:
                search_filter |= Q(expertise_domain__in=matching_domains)
            queryset = queryset.filter(search_filter)

        if expertise and expertise.casefold() not in {'toutes', "all"}:
            matching_domains = [
                value
                for value, label in User.Domain.choices
                if expertise.casefold() in {value.casefold(), label.casefold()}
            ]
            expertise_filter = (
                Q(expertise_domain__in=matching_domains)
                if matching_domains
                else Q(expertise_domain__icontains=expertise)
            )
            queryset = queryset.filter(expertise_filter)

        paginator = DeveloperPagination()
        page = paginator.paginate_queryset(queryset.distinct(), request, view=self)
        return paginator.get_paginated_response(
            DeveloperSerializer(
                page,
                many=True,
                context={'request': request},
            ).data
        )


class DeveloperDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: HttpRequest, username: str) -> Response:
        user = (
            User.objects.select_related("profile")
            .filter(username__iexact=username, is_active=True)
            .first()
        )
        if user is None:
            return Response(
                {'detail': "Profil introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(
            DeveloperSerializer(user, context={'request': request}).data
        )


class DeveloperFollowView(APIView):
    permission_classes = [IsAuthenticated]

    def get_target(self, username: HttpRequest) -> Response:
        return User.objects.filter(
            username__iexact=username,
            is_active=True,
        ).first()

    def put(self, request: HttpRequest, username: str) -> Response:
        target = self.get_target(username)
        if target is None:
            return Response(
                {'detail': "Profil introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if target.pk == request.user.pk:
            return Response(
                {'detail': "Vous ne pouvez pas vous suivre vous-même."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        _, created = Follow.objects.get_or_create(
            follower=request.user,
            followed=target,
        )
        if created:
            create_notification(
                recipient=target,
                actor=request.user,
                kind='follow',
                message="a commencé à vous suivre",
                target_url=f"/developers/{request.user.username}",
            )
        return Response(
            {'isFollowed': True, 'followersCount': target.followers.count()}
        )

    def delete(self, request: HttpRequest, username: str) -> Response:
        target = self.get_target(username)
        if target is None:
            return Response(
                {'detail': "Profil introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )
        Follow.objects.filter(follower=request.user, followed=target).delete()
        return Response(
            {'isFollowed': False, 'followersCount': target.followers.count()}
        )