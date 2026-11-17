from rest_framework.test import APITestCase

from apps.repositories.models import Repository
from apps.users.models import User
from .api.serializers.team import BoardSerializer
from .models import Board, Organisation, OrganisationMembership, OrganisationRepository, Team


class OrganisationApiTests(APITestCase):
	def setUp(self):
		self.owner = User.objects.create_user(username="owner", email="owner@example.test", password="test-password")
		self.member = User.objects.create_user(username="member", email="member@example.test", password="test-password")
		self.other = User.objects.create_user(username="other", email="other@example.test", password="test-password")

	def create_organisation(self):
		self.client.force_authenticate(self.owner)
		return self.client.post(
			"/api/organizations/",
			{
				"name": "AfriHub Collective",
				"slug": "afrihub-collective",
				"description": "Construire ensemble",
				"website": "https://example.test",
				"location": "Kigali",
			},
			format="json",
		)

	def test_create_organisation_creates_owner_membership(self):
		response = self.create_organisation()
		self.assertEqual(response.status_code, 201, response.data)
		self.assertNotIn("teams", response.data)
		organisation = Organisation.objects.get(slug="afrihub-collective")
		self.assertTrue(OrganisationMembership.objects.filter(
			organisation=organisation, user=self.owner, role=OrganisationMembership.Role.OWNER
		).exists())
		self.assertEqual(response.data["membersCount"], 1)
		self.client.force_authenticate(None)
		public_result = self.client.get("/api/organizations/").data["results"][0]
		self.assertNotIn("teams", public_result)
		self.assertEqual(public_result["members"], [])
		self.assertFalse(public_result["isMember"])
		self.assertIsNone(public_result["viewerRole"])
		self.client.force_authenticate(self.owner)
		self.assertTrue(self.client.get("/api/organizations/").data["results"][0]["isMember"])

	def test_join_leave_and_role_permissions(self):
		created = self.create_organisation()
		members_url = "/api/organizations/afrihub-collective/members/"
		self.client.force_authenticate(self.member)
		self.assertEqual(self.client.post(members_url).status_code, 201)
		self.client.force_authenticate(self.owner)
		role = self.client.patch(f"{members_url}{self.member.pk}/", {"role": "admin"}, format="json")
		self.assertEqual(role.status_code, 200)
		self.client.force_authenticate(self.other)
		self.assertEqual(self.client.patch(f"{members_url}{self.member.pk}/", {"role": "member"}, format="json").status_code, 403)
		self.client.force_authenticate(self.member)
		self.assertEqual(self.client.delete(members_url).status_code, 204)
		self.assertIsNotNone(created.data["id"])

	def test_only_manager_can_attach_owned_public_repository(self):
		self.create_organisation()
		repository = Repository.objects.create(
			name="public-project", owner=self.owner, access=Repository.Access.PUBLIC
		)
		url = "/api/organizations/afrihub-collective/repositories/"
		self.client.force_authenticate(self.member)
		self.client.post("/api/organizations/afrihub-collective/members/")
		self.assertEqual(self.client.post(url, {"repositoryId": repository.pk}, format="json").status_code, 403)
		self.client.force_authenticate(self.owner)
		response = self.client.post(url, {"repositoryId": repository.pk}, format="json")
		self.assertEqual(response.status_code, 201)
		self.assertTrue(OrganisationRepository.objects.filter(repository=repository).exists())

	def test_board_repository_field_uses_repository_primary_key(self):
		repository = Repository.objects.create(
			name="board-project", owner=self.owner, access=Repository.Access.PUBLIC
		)
		serializer = BoardSerializer()

		selected_repository = serializer.fields["repoSlug"].run_validation(str(repository.pk))

		self.assertEqual(selected_repository, repository)

	def test_team_slug_is_unique_and_board_exposes_it_as_team_id(self):
		organisation = Organisation.objects.create(name="Team Workspace", created_by=self.owner)
		team = Team.objects.create(name="Design Team", organisation=organisation, created_by=self.owner)
		duplicate = Team.objects.create(name="Design Team", organisation=organisation, created_by=self.owner)
		board = Board.objects.create(name="Planning", team=team)

		self.assertIsInstance(team.pk, int)
		self.assertNotEqual(team.slug, duplicate.slug)
		self.assertEqual(BoardSerializer(board).data["teamId"], team.slug)
		self.assertIsNone(BoardSerializer(board).data["repo"])
