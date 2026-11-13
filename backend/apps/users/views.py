from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db.models import Q
from rest_framework import serializers, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.notifications.services import create_notification
from .models import Follow
from .serializers import CurrentUserUpdateSerializer, RegistrationSerializer, UserSerializer

User = get_user_model()


class LoginSerializer(serializers.Serializer):
	email = serializers.CharField(max_length=254)
	password = serializers.CharField(write_only=True, trim_whitespace=False)


class PasswordChangeSerializer(serializers.Serializer):
	current_password = serializers.CharField(write_only=True, trim_whitespace=False)
	new_password = serializers.CharField(min_length=10, max_length=128, write_only=True, trim_whitespace=False)

	def validate_new_password(self, value: str) -> str:
		validate_password(value, user=self.context["request"].user)
		return value


class LoginView(APIView):
	permission_classes = [AllowAny]
	throttle_classes = [ScopedRateThrottle]
	throttle_scope = "login"

	def post(self, request):
		serializer = LoginSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		identifier = serializer.validated_data["email"].strip()
		user = User.objects.filter(
			Q(email__iexact=identifier) | Q(username__iexact=identifier)
		).first()
		if not user or not user.check_password(serializer.validated_data["password"]) or not user.is_active:
			return Response(
				{"detail": "Identifiants invalides."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		refresh = RefreshToken.for_user(user)
		return Response(
			{
				"access": str(refresh.access_token),
				"refresh": str(refresh),
				"user": UserSerializer(
					user,
					context={"request": request, "include_email": True},
				).data,
			}
		)


class RegisterView(APIView):
	permission_classes = [AllowAny]
	throttle_classes = [ScopedRateThrottle]
	throttle_scope = "register"

	def post(self, request):
		serializer = RegistrationSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		user = serializer.save()
		refresh = RefreshToken.for_user(user)
		return Response(
			{
				"access": str(refresh.access_token),
				"refresh": str(refresh),
				"user": UserSerializer(
					user,
					context={"request": request, "include_email": True},
				).data,
			},
			status=status.HTTP_201_CREATED,
		)


class LogoutView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		token_value = request.data.get("refresh")
		if not token_value:
			return Response({"detail": "Jeton de renouvellement requis."}, status=status.HTTP_400_BAD_REQUEST)
		try:
			token = RefreshToken(token_value)
			if str(token.get("user_id")) != str(request.user.pk):
				return Response({"detail": "Jeton invalide."}, status=status.HTTP_400_BAD_REQUEST)
			token.blacklist()
		except TokenError:
			pass
		return Response(status=status.HTTP_204_NO_CONTENT)


class CurrentUserView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		return Response(UserSerializer(request.user, context={"request": request}).data)

	def patch(self, request):
		serializer = CurrentUserUpdateSerializer(
			request.user,
			data=request.data,
			partial=True,
		)
		serializer.is_valid(raise_exception=True)
		user = serializer.save()
		return Response(UserSerializer(user, context={"request": request}).data)


class DeveloperPagination(PageNumberPagination):
	page_size = 24
	page_size_query_param = "page_size"
	max_page_size = 60


class DeveloperListView(APIView):
	permission_classes = [AllowAny]

	def get(self, request):
		queryset = User.objects.filter(is_active=True).select_related("profile").order_by("username")
		search = request.query_params.get("search", "").strip()
		expertise = request.query_params.get("expertise", "").strip()
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
				if search.casefold() in value.casefold() or search.casefold() in label.casefold()
			]
			if matching_domains:
				search_filter |= Q(expertise_domain__in=matching_domains)
			queryset = queryset.filter(search_filter)
		if expertise and expertise.lower() not in {"toutes", "all"}:
			matching_domains = [
				value
				for value, label in User.Domain.choices
				if expertise.casefold() in {value.casefold(), label.casefold()}
			]
			queryset = queryset.filter(
				Q(expertise_domain__in=matching_domains)
				if matching_domains
				else Q(expertise_domain__icontains=expertise)
			)
		paginator = DeveloperPagination()
		page = paginator.paginate_queryset(queryset.distinct(), request, view=self)
		return paginator.get_paginated_response(
			UserSerializer(page, many=True, context={"request": request}).data
		)


class DeveloperDetailView(APIView):
	permission_classes = [AllowAny]

	def get(self, request, username):
		user = User.objects.select_related("profile").filter(username__iexact=username, is_active=True).first()
		if user is None:
			return Response({"detail": "Profil introuvable."}, status=status.HTTP_404_NOT_FOUND)
		return Response(UserSerializer(user, context={"request": request}).data)


class DeveloperFollowView(APIView):
	permission_classes = [IsAuthenticated]

	def get_target(self, username):
		user = User.objects.filter(username__iexact=username, is_active=True).first()
		if user is None:
			return None
		return user

	def put(self, request, username):
		target = self.get_target(username)
		if target is None:
			return Response({"detail": "Profil introuvable."}, status=status.HTTP_404_NOT_FOUND)
		if target.pk == request.user.pk:
			return Response({"detail": "Vous ne pouvez pas vous suivre vous-même."}, status=status.HTTP_400_BAD_REQUEST)
		_, created = Follow.objects.get_or_create(follower=request.user, followed=target)
		if created:
			create_notification(
				recipient=target,
				actor=request.user,
				kind="follow",
				message="a commencé à vous suivre",
				target_url=f"/developers/{request.user.username}",
			)
		return Response({"isFollowed": True, "followersCount": target.follower_links.count()})

	def delete(self, request, username):
		target = self.get_target(username)
		if target is None:
			return Response({"detail": "Profil introuvable."}, status=status.HTTP_404_NOT_FOUND)
		Follow.objects.filter(follower=request.user, followed=target).delete()
		return Response({"isFollowed": False, "followersCount": target.follower_links.count()})


class PasswordChangeView(APIView):
	permission_classes = [IsAuthenticated]
	throttle_classes = [ScopedRateThrottle]
	throttle_scope = "password_change"

	def post(self, request):
		serializer = PasswordChangeSerializer(data=request.data, context={"request": request})
		serializer.is_valid(raise_exception=True)
		if not request.user.check_password(serializer.validated_data["current_password"]):
			return Response({"current_password": ["Mot de passe actuel incorrect."]}, status=status.HTTP_400_BAD_REQUEST)
		request.user.set_password(serializer.validated_data["new_password"])
		request.user.save(update_fields=["password"])
		return Response({"detail": "Mot de passe modifié. Reconnectez-vous sur vos autres appareils."})
