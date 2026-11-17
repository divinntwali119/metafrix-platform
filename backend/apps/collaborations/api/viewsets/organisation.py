from typing import Any

from django.db import IntegrityError, transaction
from django.db.models import Count, Q, QuerySet
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.mixins import (
    CreateModelMixin,
    DestroyModelMixin,
    ListModelMixin,
    RetrieveModelMixin,
)
from rest_framework.pagination import PageNumberPagination
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from apps.notifications.services import create_notification
from apps.repositories.models import Repository
from backend.apps.repositories.api.serializers import RepositorySerializer
from apps.users.models import User

from ..serializers.organisation import OrganisationCreateSerializer, OrganisationSerializer, OrganisationUpdateSerializer
from ..permissions.organisation import (
    OrganisationMembershipPermission,
    OrganisationPermission,
    OrganisationRepositoryPermission,
)
from ...models import Organisation, OrganisationMembership, OrganisationRepository

# The organisation pagination class
class OrganisationPagination(PageNumberPagination):
    page_size = 24
    page_size_query_param = 'page_size'
    max_page_size = 60


def get_organisation(slug: str) -> Organisation:
    """
    ### Get a organisation from slug.
    """
    return get_object_or_404(
        Organisation.objects.prefetch_related('memberships__user__profile'),
        slug__iexact=slug,
    )


def membership_for(organisation: Organisation, user : User) -> OrganisationMembership:
    """
    ### Get the organisation member associated to user.
    """
    return organisation.memberships.filter(user=user).first()

# Organisation view set
class OrganisationViewSet(
    ListModelMixin,
    CreateModelMixin,
    RetrieveModelMixin,
    GenericViewSet,
):
    lookup_field = 'slug'
    pagination_class = OrganisationPagination
    permission_classes = [OrganisationPermission]

    def get_queryset(self) -> QuerySet[Organisation]:
        queryset = Organisation.objects.annotate(members_count=Count('memberships', distinct=True))
        
        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(slug__icontains=search)
                | Q(description__icontains=search)
                | Q(location__icontains=search)
            )
            
        if self.request.query_params.get('mine') == 'true':
            queryset = queryset.filter(memberships__user=self.request.user)
            
        if self.request.query_params.get('sort') == 'name':
            queryset = queryset.order_by('name', 'pk')
        else:
            queryset = queryset.order_by('-created_at', '-pk')
            
        return queryset.distinct()

    def get_object(self) -> Organisation:
        organisation = get_organisation(self.kwargs['slug'])
        self.check_object_permissions(self.request, organisation)
        
        return organisation

    def get_serializer_class(self) -> OrganisationSerializer:
        if self.action == 'create':
            return OrganisationCreateSerializer
        
        if self.action in {'update', 'partial_update'}:
            return OrganisationUpdateSerializer
        
        return OrganisationSerializer

    def get_serializer_context(self) -> dict[str, Any]:
        context = super().get_serializer_context()
        
        if self.action == 'list':
            context['include_details'] = False
            
        return context

    def create(self, request: Request, *args, **kwargs) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            with transaction.atomic():
                organisation = serializer.save()
                OrganisationMembership.objects.create(
                    organisation=organisation,
                    user=request.user,
                    role=OrganisationMembership.Role.OWNER,
                )
        except IntegrityError:
            return Response({"slug": ["Cet identifiant ou ce nom est déjà utilisé."]}, status=status.HTTP_409_CONFLICT)
        
        return Response(
            OrganisationSerializer(
                organisation,
                context=self.get_serializer_context(),
            ).data,
            status=status.HTTP_201_CREATED,
        )

    def partial_update(self, request: Request, *args, **kwargs) -> Response:
        organisation = self.get_object()
        serializer = self.get_serializer(organisation, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(
            OrganisationSerializer(
                organisation,
                context=self.get_serializer_context(),
            ).data
        )


class OrganisationMembershipViewSet(
    CreateModelMixin,
    DestroyModelMixin,
    GenericViewSet,
):
    permission_classes = [OrganisationMembershipPermission]

    def create(self, request: Request, *args, **kwargs) -> Response:
        organisation = get_organisation(kwargs['slug'])
        _, created = OrganisationMembership.objects.get_or_create(
            organisation=organisation,
            user=request.user,
            defaults={'role': OrganisationMembership.Role.MEMBER},
        )
        
        if created:
            managers = organisation.memberships.select_related('user').filter(
                role__in=[OrganisationMembership.Role.OWNER, OrganisationMembership.Role.ADMIN]
            )
            
            for membership in managers:
                create_notification(
                    recipient=membership.user,
                    actor=request.user,
                    kind='collab_invite',
                    message=f"a rejoint l’organisation {organisation.name}",
                    target_url=f'/organizations/{organisation.slug}',
                )
                
        return Response(
            {"isMember": True, "created": created},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def destroy(self, request: Request, *args, **kwargs) -> Response:
        organisation = get_organisation(kwargs['slug'])
        user_id = kwargs.get('user_id')
        
        if user_id is not None:
            target = get_object_or_404(
                OrganisationMembership,
                organisation=organisation,
                user_id=user_id,
            )
            
            target.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        membership = membership_for(organisation, request.user)
        if membership is None:
            return Response(status=status.HTTP_204_NO_CONTENT)
        
        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def partial_update(self, request: Request, *args, **kwargs) -> Response:
        organisation = get_organisation(kwargs['slug'])
        
        target = get_object_or_404(
            OrganisationMembership,
            organisation=organisation,
            user_id=kwargs['user_id'],
        )
        
        role = request.data.get('role')
        if role not in {OrganisationMembership.Role.ADMIN, OrganisationMembership.Role.MEMBER}:
            return Response({"role": ["Rôle invalide."]}, status=status.HTTP_400_BAD_REQUEST)
        
        target.role = role
        target.save(update_fields=['role'])
        
        return Response({"userId": target.user_id, "role": target.role})


class OrganisationRepositoryViewSet(
    ListModelMixin,
    CreateModelMixin,
    DestroyModelMixin,
    GenericViewSet,
):
    serializer_class = RepositorySerializer
    pagination_class = None
    permission_classes = [OrganisationRepositoryPermission]

    def get_queryset(self) -> QuerySet[Repository]:
        organisation = get_organisation(self.kwargs['slug'])
        
        return Repository.objects.filter(
            organisation_links__organisation=organisation,
            access=Repository.Access.PUBLIC,
        ).select_related('owner', 'owner__profile', 'settings').distinct()

    def create(self, request: Request, *args, **kwargs) -> Response:
        organisation = get_organisation(kwargs['slug'])
        repository = get_object_or_404(
            Repository,
            pk=request.data.get('repositoryId'),
            owner=request.user,
            access=Repository.Access.PUBLIC,
        )
        _, created = OrganisationRepository.objects.get_or_create(
            organisation=organisation,
            repository=repository,
            defaults={'added_by': request.user},
        )
        return Response({"repositoryId": repository.pk, "created": created}, status=201 if created else 200)

    def destroy(self, request: Request, *args, **kwargs) -> Response:
        repository_id = kwargs.get('repository_id')
        if repository_id is None:
            return Response({"detail": "Identifiant de dépôt requis."}, status=400)
        
        organisation = get_organisation(kwargs['slug'])
        link = get_object_or_404(
            OrganisationRepository,
            organisation=organisation,
            repository_id=repository_id,
        )
        link.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)