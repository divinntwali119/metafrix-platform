from django.http import HttpRequest
from django.shortcuts import get_object_or_404

from rest_framework.exceptions import NotAuthenticated, ParseError, PermissionDenied
from rest_framework.permissions import BasePermission
from rest_framework.views import APIView

from apps.users.models import User
from ...models import Organisation, OrganisationMembership


class OrganisationPermissionBase(BasePermission):
    def get_organisation(self, view: APIView) -> Organisation:
        return get_object_or_404(
            Organisation,
            slug__iexact=view.kwargs["slug"],
        )

    def is_manager(self, organisation: Organisation, user: User) -> bool:
        return organisation.memberships.filter(
            user=user,
            role__in=[
                OrganisationMembership.Role.OWNER,
                OrganisationMembership.Role.ADMIN,
            ],
        ).exists()


class OrganisationPermission(OrganisationPermissionBase):
    def has_permission(self, request: HttpRequest, view: APIView) -> bool:
        if view.action in {"list", "retrieve"}:
            if (
                view.action == "list"
                and request.query_params.get("mine") == "true"
                and not request.user.is_authenticated
            ):
                raise NotAuthenticated("Authentification requise.")
            return True
        return request.user.is_authenticated

    def has_object_permission(
        self,
        request: HttpRequest,
        view: APIView,
        organisation: Organisation,
    ) -> bool:
        if view.action == "partial_update" and not self.is_manager(
            organisation, request.user
        ):
            raise PermissionDenied("Vous n’avez pas le rôle requis.")
        return True


class OrganisationMembershipPermission(OrganisationPermissionBase):
    def has_permission(self, request: HttpRequest, view: APIView) -> bool:
        if not request.user.is_authenticated:
            return False

        if view.action == "destroy" and "user_id" not in view.kwargs:
            membership = OrganisationMembership.objects.filter(
                organisation__slug__iexact=view.kwargs["slug"],
                user=request.user,
            ).first()
            if membership and membership.role == OrganisationMembership.Role.OWNER:
                raise ParseError(
                    "Le propriétaire doit transférer son rôle avant de quitter l’organisation."
                )
            return True

        if view.action not in {"partial_update", "destroy"}:
            return True

        organisation = self.get_organisation(view)
        if not self.is_manager(organisation, request.user):
            raise PermissionDenied("Vous n'avez pas le rôle requis.")

        if (
            view.action == "partial_update"
            and request.data.get("role")
            not in {
                OrganisationMembership.Role.ADMIN,
                OrganisationMembership.Role.MEMBER,
            }
        ):
            return True

        target = get_object_or_404(
            OrganisationMembership,
            organisation=organisation,
            user_id=view.kwargs["user_id"],
        )
        if target.role == OrganisationMembership.Role.OWNER:
            detail = (
                "Le propriétaire ne peut pas être retiré de l’organisation."
                if view.action == "destroy"
                else "Le rôle du propriétaire ne peut pas être modifié ici."
            )
            raise ParseError(detail)

        if (
            target.role == OrganisationMembership.Role.ADMIN
            and organisation.memberships.filter(
                user=request.user,
                role=OrganisationMembership.Role.ADMIN,
            ).exists()
            and view.action == "destroy"
        ):
            raise PermissionDenied(
                "Seul le propriétaire peut retirer un administrateur."
            )

        if (
            view.action == "partial_update"
            and request.data.get("role") == OrganisationMembership.Role.ADMIN
            and not organisation.memberships.filter(
                user=request.user,
                role=OrganisationMembership.Role.OWNER,
            ).exists()
        ):
            raise PermissionDenied(
                "Seul le propriétaire peut nommer un administrateur."
            )

        return True


class OrganisationRepositoryPermission(OrganisationPermissionBase):
    def has_permission(self, request: HttpRequest, view: APIView) -> bool:
        if view.action == "list":
            return True
        if not request.user.is_authenticated:
            return False

        organisation = self.get_organisation(view)
        if not self.is_manager(organisation, request.user):
            raise PermissionDenied(
                "Seuls les administrateurs peuvent retirer un dépôt."
                if view.action == "destroy"
                else "Seuls les administrateurs peuvent associer un dépôt."
            )
        return True
