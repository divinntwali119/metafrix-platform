from django.db import IntegrityError, transaction
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.services import create_notification
from apps.repositories.models import Repository
from apps.repositories.serializers import RepositorySerializer
from .api_serializers import OrganisationCreateSerializer, OrganisationSerializer, OrganisationUpdateSerializer
from .models import Organisation, OrganisationMembership, OrganisationRepository


class OrganisationPagination(PageNumberPagination):
    page_size = 24
    page_size_query_param = "page_size"
    max_page_size = 60


def get_organisation(slug):
    return get_object_or_404(
        Organisation.objects.prefetch_related("memberships__user__profile"),
        slug__iexact=slug,
    )


def membership_for(organisation, user):
    return organisation.memberships.filter(user=user).first()


def can_manage(organisation, user):
    membership = membership_for(organisation, user)
    return membership is not None and membership.role in {
        OrganisationMembership.Role.OWNER,
        OrganisationMembership.Role.ADMIN,
    }


class OrganisationListCreateView(APIView):
    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [IsAuthenticated()]

    def get(self, request):
        queryset = Organisation.objects.annotate(members_count=Count("memberships", distinct=True))
        search = request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(slug__icontains=search)
                | Q(description__icontains=search)
                | Q(location__icontains=search)
            )
        if request.query_params.get("mine") == "true":
            if not request.user.is_authenticated:
                return Response({"detail": "Authentification requise."}, status=status.HTTP_401_UNAUTHORIZED)
            queryset = queryset.filter(memberships__user=request.user)
        if request.query_params.get("sort") == "name":
            queryset = queryset.order_by("name", "pk")
        else:
            queryset = queryset.order_by("-created_at", "-pk")
        paginator = OrganisationPagination()
        page = paginator.paginate_queryset(queryset.distinct(), request, view=self)
        return paginator.get_paginated_response(
            OrganisationSerializer(
                page,
                many=True,
                context={"request": request, "include_details": False},
            ).data
        )

    def post(self, request):
        serializer = OrganisationCreateSerializer(data=request.data, context={"request": request})
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
            OrganisationSerializer(organisation, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class OrganisationDetailView(APIView):
    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [IsAuthenticated()]

    def get(self, request, slug):
        organisation = get_organisation(slug)
        return Response(OrganisationSerializer(organisation, context={"request": request}).data)

    def patch(self, request, slug):
        organisation = get_organisation(slug)
        if not can_manage(organisation, request.user):
            return Response({"detail": "Vous n’avez pas le rôle requis."}, status=status.HTTP_403_FORBIDDEN)
        serializer = OrganisationUpdateSerializer(organisation, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        organisation = serializer.save()
        return Response(OrganisationSerializer(organisation, context={"request": request}).data)


class OrganisationMemberView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        organisation = get_organisation(slug)
        _, created = OrganisationMembership.objects.get_or_create(
            organisation=organisation,
            user=request.user,
            defaults={"role": OrganisationMembership.Role.MEMBER},
        )
        if created:
            managers = organisation.memberships.select_related("user").filter(
                role__in=[OrganisationMembership.Role.OWNER, OrganisationMembership.Role.ADMIN]
            )
            for membership in managers:
                create_notification(
                    recipient=membership.user,
                    actor=request.user,
                    kind="collab_invite",
                    message=f"a rejoint l’organisation {organisation.name}",
                    target_url=f"/organizations/{organisation.slug}",
                )
        return Response(
            {"isMember": True, "created": created},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request, slug):
        organisation = get_organisation(slug)
        membership = membership_for(organisation, request.user)
        if membership is None:
            return Response(status=status.HTTP_204_NO_CONTENT)
        if membership.role == OrganisationMembership.Role.OWNER:
            return Response(
                {"detail": "Le propriétaire doit transférer son rôle avant de quitter l’organisation."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class OrganisationMemberDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_actor_membership(self, organisation, user):
        membership = membership_for(organisation, user)
        if membership is None or membership.role not in {
            OrganisationMembership.Role.OWNER,
            OrganisationMembership.Role.ADMIN,
        }:
            return None
        return membership

    def patch(self, request, slug, user_id):
        organisation = get_organisation(slug)
        actor_membership = self.get_actor_membership(organisation, request.user)
        if actor_membership is None:
            return Response({"detail": "Vous n’avez pas le rôle requis."}, status=status.HTTP_403_FORBIDDEN)
        target = get_object_or_404(OrganisationMembership, organisation=organisation, user_id=user_id)
        role = request.data.get("role")
        if role not in {OrganisationMembership.Role.ADMIN, OrganisationMembership.Role.MEMBER}:
            return Response({"role": ["Rôle invalide."]}, status=status.HTTP_400_BAD_REQUEST)
        if target.role == OrganisationMembership.Role.OWNER:
            return Response({"detail": "Le rôle du propriétaire ne peut pas être modifié ici."}, status=400)
        if role == OrganisationMembership.Role.ADMIN and actor_membership.role != OrganisationMembership.Role.OWNER:
            return Response({"detail": "Seul le propriétaire peut nommer un administrateur."}, status=403)
        target.role = role
        target.save(update_fields=["role"])
        return Response({"userId": target.user_id, "role": target.role})

    def delete(self, request, slug, user_id):
        organisation = get_organisation(slug)
        actor_membership = self.get_actor_membership(organisation, request.user)
        if actor_membership is None:
            return Response({"detail": "Vous n’avez pas le rôle requis."}, status=status.HTTP_403_FORBIDDEN)
        target = get_object_or_404(OrganisationMembership, organisation=organisation, user_id=user_id)
        if target.role == OrganisationMembership.Role.OWNER:
            return Response({"detail": "Le propriétaire ne peut pas être retiré de l’organisation."}, status=400)
        if target.role == OrganisationMembership.Role.ADMIN and actor_membership.role != OrganisationMembership.Role.OWNER:
            return Response({"detail": "Seul le propriétaire peut retirer un administrateur."}, status=403)
        target.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class OrganisationRepositoryView(APIView):
    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [IsAuthenticated()]

    def get(self, request, slug):
        organisation = get_organisation(slug)
        repositories = Repository.objects.filter(
            organisation_links__organisation=organisation,
            access=Repository.Access.PUBLIC,
        ).select_related("owner", "owner__profile", "settings").distinct()
        return Response(RepositorySerializer(repositories, many=True, context={"request": request}).data)

    def post(self, request, slug):
        organisation = get_organisation(slug)
        if not can_manage(organisation, request.user):
            return Response({"detail": "Seuls les administrateurs peuvent associer un dépôt."}, status=403)
        repository = get_object_or_404(
            Repository,
            pk=request.data.get("repositoryId"),
            owner=request.user,
            access=Repository.Access.PUBLIC,
        )
        _, created = OrganisationRepository.objects.get_or_create(
            organisation=organisation,
            repository=repository,
            defaults={"added_by": request.user},
        )
        return Response({"repositoryId": repository.pk, "created": created}, status=201 if created else 200)

    def delete(self, request, slug, repository_id=None):
        if repository_id is None:
            return Response({"detail": "Identifiant de dépôt requis."}, status=400)
        organisation = get_organisation(slug)
        if not can_manage(organisation, request.user):
            return Response({"detail": "Seuls les administrateurs peuvent retirer un dépôt."}, status=403)
        link = get_object_or_404(
            OrganisationRepository,
            organisation=organisation,
            repository_id=repository_id,
        )
        link.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)