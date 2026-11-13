from django.urls import path

from .api_views import (
	OrganisationDetailView,
	OrganisationListCreateView,
	OrganisationMemberDetailView,
	OrganisationMemberView,
	OrganisationRepositoryView,
)

app_name = 'collaborations'
urlpatterns = [
	path("organizations/", OrganisationListCreateView.as_view(), name="organisation-list"),
	path("organizations/<slug:slug>/", OrganisationDetailView.as_view(), name="organisation-detail"),
	path("organizations/<slug:slug>/members/", OrganisationMemberView.as_view(), name="organisation-members"),
	path("organizations/<slug:slug>/members/<int:user_id>/", OrganisationMemberDetailView.as_view(), name="organisation-member-detail"),
	path("organizations/<slug:slug>/repositories/", OrganisationRepositoryView.as_view(), name="organisation-repositories"),
	path("organizations/<slug:slug>/repositories/<int:repository_id>/", OrganisationRepositoryView.as_view(), name="organisation-repository-detail"),
]