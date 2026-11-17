import shutil
from typing import Callable, Any

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.db.models import BooleanField, Count, Exists, OuterRef, Q, Value
from django.http import Http404
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Issue, PullRequest, Repository, RepositorySettings, Star, Watcher
from .serializers import (
	IssueSerializer,
	PullRequestSerializer,
	RepositoryMetadataSerializer,
	RepositorySerializer,
)
from ..services import create_repo_from_data
from apps.git_server.git_reader import (
	GitBinaryFile,
	GitBlobTooLarge,
	GitObjectNotFound,
	GitStorageUnavailable,
	GitTreeTooLarge,
	InvalidGitPath,
	list_repository_branches,
	list_repository_commits,
	read_repository_blob,
	read_repository_tree,
)
from apps.users.api.serializers import UserSerializer


def get_visible_repository(request, repository_id: int) -> Repository:
	repository = Repository.objects.select_related("owner", "settings").filter(pk=repository_id).first()
	if repository is None:
		raise Http404
	if repository.access != Repository.Access.PUBLIC and (
		not request.user.is_authenticated or repository.owner_id != request.user.pk
	):
		raise Http404
	return repository


def annotate_repository_stats(queryset, request):
	queryset = queryset.annotate(
		stars_count=Count("stars", distinct=True),
		forks_count=Count("forks", distinct=True),
		watchers_count=Count("watchers", distinct=True),
		issues_count=Count("issues", distinct=True),
		pulls_count=Count("pull_requests", distinct=True),
	)
	if request.user.is_authenticated:
		return queryset.annotate(
			viewer_is_starred=Exists(
				Star.objects.filter(repo_id=OuterRef("pk"), starred_by_id=request.user.pk)
			),
			viewer_is_watching=Exists(
				Watcher.objects.filter(repo_id=OuterRef("pk"), watched_by_id=request.user.pk)
			),
		)
	return queryset.annotate(
		viewer_is_starred=Value(False, output_field=BooleanField()),
		viewer_is_watching=Value(False, output_field=BooleanField()),
	)


def git_read_response(operation: Callable[[], Any]) -> Response:
	try:
		return Response(operation())
	except InvalidGitPath as error:
		return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
	except GitObjectNotFound as error:
		return Response({"detail": str(error)}, status=status.HTTP_404_NOT_FOUND)
	except GitBlobTooLarge as error:
		return Response({"detail": str(error)}, status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)
	except GitTreeTooLarge as error:
		return Response({"detail": str(error)}, status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)
	except GitBinaryFile as error:
		return Response({"detail": str(error)}, status=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE)
	except GitStorageUnavailable:
		return Response(
			{"detail": "Le stockage Git est temporairement indisponible."},
			status=status.HTTP_503_SERVICE_UNAVAILABLE,
		)


class RepositoryGitReadView(APIView):
	permission_classes = [AllowAny]

	def get_repository(self, request, repository_id: int) -> Repository:
		return get_visible_repository(request, repository_id)


class RepositoryBranchesView(RepositoryGitReadView):
	def get(self, request, repository_id: int):
		repository = self.get_repository(request, repository_id)
		return git_read_response(lambda: {"results": list_repository_branches(repository)})


class RepositoryTreeView(RepositoryGitReadView):
	def get(self, request, repository_id: int):
		repository = self.get_repository(request, repository_id)
		path = request.query_params.get("path", "")
		branch = request.query_params.get("branch")
		return git_read_response(
			lambda: {"results": read_repository_tree(repository, path=path, branch=branch)}
		)


class RepositoryBlobView(RepositoryGitReadView):
	def get(self, request, repository_id: int):
		repository = self.get_repository(request, repository_id)
		path = request.query_params.get("path", "")
		branch = request.query_params.get("branch")
		return git_read_response(lambda: read_repository_blob(repository, path=path, branch=branch))


def git_commit_author(commit: dict, request) -> dict:
	User = get_user_model()
	author_email = commit.get("authorEmail", "")
	if author_email:
		user = User.objects.filter(email__iexact=author_email).select_related("profile").first()
		if user is not None:
			return UserSerializer(user, context={"request": request}).data

	date = commit["date"]
	return {
		"id": f"git-{commit['id'][:12]}",
		"username": "git-contributor",
		"name": commit.get("authorName") or "Contributeur",
		"avatar": "/avatar-placeholder.svg",
		"bio": "",
		"skills": [],
		"technologies": [],
		"followersCount": 0,
		"followingCount": 0,
		"repositoriesCount": 0,
		"contributionsCount": 0,
		"createdAt": date,
	}


class RepositoryCommitsView(RepositoryGitReadView):
	def get(self, request, repository_id: int):
		repository = self.get_repository(request, repository_id)
		branch = request.query_params.get("branch")
		try:
			limit = int(request.query_params.get("limit", "100"))
		except ValueError:
			return Response({"detail": "La limite doit être un nombre entier."}, status=status.HTTP_400_BAD_REQUEST)

		def get_commits():
			commits = list_repository_commits(repository, branch=branch, limit=limit)
			return {
				"results": [
					{
						"id": commit["id"],
						"repositoryId": str(repository.pk),
						"shortSha": commit["id"][:7],
						"message": commit["message"],
						"author": git_commit_author(commit, request),
						"date": commit["date"],
					}
					for commit in commits
				]
			}

		return git_read_response(get_commits)


class RepositoryStarView(APIView):
	permission_classes = [IsAuthenticated]

	def put(self, request, repository_id: int):
		repository = get_visible_repository(request, repository_id)
		Star.objects.get_or_create(repo=repository, starred_by=request.user)
		return Response({"isStarred": True, "starsCount": repository.stars.count()})

	def delete(self, request, repository_id: int):
		repository = get_visible_repository(request, repository_id)
		repository.stars.filter(starred_by=request.user).delete()
		return Response({"isStarred": False, "starsCount": repository.stars.count()})


class RepositoryWatchView(APIView):
	permission_classes = [IsAuthenticated]

	def put(self, request, repository_id: int):
		repository = get_visible_repository(request, repository_id)
		Watcher.objects.get_or_create(repo=repository, watched_by=request.user)
		return Response({"isWatching": True, "watchersCount": repository.watchers.count()})

	def delete(self, request, repository_id: int):
		repository = get_visible_repository(request, repository_id)
		repository.watchers.filter(watched_by=request.user).delete()
		return Response({"isWatching": False, "watchersCount": repository.watchers.count()})


class RepositoryListCreateView(APIView):
	class Pagination(PageNumberPagination):
		page_size = 20
		page_size_query_param = "page_size"
		max_page_size = 100

	pagination_class = Pagination

	def get_permissions(self):
		return [AllowAny()] if self.request.method == "GET" else [IsAuthenticated()]

	def get(self, request):
		repositories = Repository.objects.select_related("owner", "owner__profile", "settings").filter(
				Q(access=Repository.Access.PUBLIC)
				| Q(owner=request.user if request.user.is_authenticated else None)
			).order_by("-updated_at", "-created_at", "-pk")
		owner = request.query_params.get("owner", "").strip()
		if owner:
			repositories = repositories.filter(owner__username__iexact=owner)
		search = request.query_params.get("search", "").strip()[:100]
		if search:
			repositories = repositories.filter(
				Q(name__icontains=search)
				| Q(owner__username__icontains=search)
				| Q(description__icontains=search)
				| Q(language__icontains=search)
			)
		queryset = annotate_repository_stats(repositories, request)
		paginator = self.pagination_class()
		page = paginator.paginate_queryset(queryset, request, view=self)
		serializer = RepositorySerializer(page, many=True, context={"request": request})
		return paginator.get_paginated_response(serializer.data)

	def post(self, request):
		serializer = RepositorySerializer(data=request.data, context={"request": request})
		serializer.is_valid(raise_exception=True)
		repository_path = None
		try:
			with transaction.atomic():
				repository = serializer.save(owner=request.user)
				repository_path = create_repo_from_data(
					request.user,
					serializer.validated_data | {"name": repository.name},
				)
				RepositorySettings.objects.create(repo=repository)
		except FileExistsError:
			return Response({"name": ["Un dépôt Git portant ce nom existe déjà."]}, status=status.HTTP_409_CONFLICT)
		except ValueError as error:
			return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
		except IntegrityError:
			if repository_path:
				shutil.rmtree(repository_path, ignore_errors=True)
			return Response({"name": ["Vous possédez déjà un dépôt portant ce nom."]}, status=status.HTTP_409_CONFLICT)
		except OSError:
			if repository_path:
				shutil.rmtree(repository_path, ignore_errors=True)
			return Response({"detail": "Le stockage Git est indisponible."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
		except RuntimeError:
			if repository_path:
				shutil.rmtree(repository_path, ignore_errors=True)
			return Response({"detail": "Le moteur Git est indisponible."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

		repository = annotate_repository_stats(
			Repository.objects.select_related("owner", "owner__profile", "settings").filter(pk=repository.pk),
			request,
		).first()
		return Response(
			RepositorySerializer(repository, context={"request": request}).data,
			status=status.HTTP_201_CREATED,
		)


class RepositoryDetailView(APIView):
	permission_classes = [AllowAny]

	def get(self, request, owner: str, name: str):
		repository = Repository.objects.select_related("owner", "owner__profile", "settings").filter(
			owner__username__iexact=owner,
			name__iexact=name,
		).first()
		if repository is None:
			raise Http404
		if repository.access != Repository.Access.PUBLIC and (
			not request.user.is_authenticated or repository.owner_id != request.user.pk
		):
			raise Http404
		repository = annotate_repository_stats(
			Repository.objects.select_related("owner", "owner__profile", "settings").filter(pk=repository.pk),
			request,
		).first()
		return Response(RepositorySerializer(repository, context={"request": request}).data)


class RepositoryMetadataView(APIView):
	permission_classes = [IsAuthenticated]

	def patch(self, request, repository_id: int):
		repository = Repository.objects.filter(pk=repository_id, owner=request.user).first()
		if repository is None:
			raise Http404

		serializer = RepositoryMetadataSerializer(repository, data=request.data, partial=True)
		serializer.is_valid(raise_exception=True)
		serializer.save()
		updated_repository = annotate_repository_stats(
			Repository.objects.select_related("owner", "owner__profile", "settings").filter(
				pk=repository.pk
			),
			request,
		).first()
		return Response(RepositorySerializer(updated_repository, context={"request": request}).data)


class IssueListCreateView(APIView):
	pagination_class = PageNumberPagination

	def get_permissions(self):
		return [AllowAny()] if self.request.method == "GET" else [IsAuthenticated()]

	def get(self, request, repository_id: int):
		repository = get_visible_repository(request, repository_id)
		queryset = Issue.objects.filter(repo=repository).select_related("submitted_by").order_by("-submitted_at")
		paginator = self.pagination_class()
		page = paginator.paginate_queryset(queryset, request, view=self)
		return paginator.get_paginated_response(
			IssueSerializer(page, many=True, context={"request": request}).data
		)

	def post(self, request, repository_id: int):
		repository = get_visible_repository(request, repository_id)
		repository_settings = getattr(repository, "settings", None)
		if repository_settings and not repository_settings.issues_enabled:
			return Response({"detail": "Les issues sont désactivées pour ce dépôt."}, status=status.HTTP_403_FORBIDDEN)
		serializer = IssueSerializer(data=request.data, context={"request": request})
		serializer.is_valid(raise_exception=True)
		issue = serializer.save(repo=repository, submitted_by=request.user)
		return Response(
			IssueSerializer(issue, context={"request": request}).data,
			status=status.HTTP_201_CREATED,
		)


class PullRequestListCreateView(APIView):
	pagination_class = PageNumberPagination

	def get_permissions(self):
		return [AllowAny()] if self.request.method == "GET" else [IsAuthenticated()]

	def get(self, request, repository_id: int):
		repository = get_visible_repository(request, repository_id)
		queryset = PullRequest.objects.filter(repo=repository).select_related("submitted_by").order_by("-submitted_at")
		paginator = self.pagination_class()
		page = paginator.paginate_queryset(queryset, request, view=self)
		return paginator.get_paginated_response(
			PullRequestSerializer(page, many=True, context={"request": request}).data
		)

	def post(self, request, repository_id: int):
		repository = get_visible_repository(request, repository_id)
		repository_settings = getattr(repository, "settings", None)
		if repository_settings and not repository_settings.pull_requests_enabled:
			return Response({"detail": "Les pull requests sont désactivées pour ce dépôt."}, status=status.HTTP_403_FORBIDDEN)
		serializer = PullRequestSerializer(data=request.data, context={"request": request})
		serializer.is_valid(raise_exception=True)
		pull_request = serializer.save(repo=repository, submitted_by=request.user)
		return Response(
			PullRequestSerializer(pull_request, context={"request": request}).data,
			status=status.HTTP_201_CREATED,
		)
