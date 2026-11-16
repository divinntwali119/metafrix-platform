import hashlib
import logging
import secrets

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.db import IntegrityError, transaction
from django.db.models import F, Q
from django.utils import timezone
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

from apps.auth.emails import send_password_reset_email, send_verification_email
from apps.auth.models import EmailVerificationToken, ExternalIdentity
from backend.apps.auth.serializers import (
    EmailAddressSerializer,
    EmailVerificationSerializer,
    LoginSerializer,
    OAuthExchangeSerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmSerializer,
    RegistrationSerializer,
)
from apps.users.api.serializers import UserSerializer

User = get_user_model()
logger = logging.getLogger(__name__)


def _token_response(user, request, response_status=status.HTTP_200_OK):
	refresh = RefreshToken.for_user(user)
	refresh["auth_version"] = user.auth_version
	return Response(
		{
			"access": str(refresh.access_token),
			"refresh": str(refresh),
			"user": UserSerializer(
				user,
				context={"request": request, "include_email": True},
			).data,
		},
		status=response_status,
	)


def _blacklist_user_refresh_tokens(user):
	for token in OutstandingToken.objects.filter(user=user).iterator():
		BlacklistedToken.objects.get_or_create(token=token)


def _create_oauth_username(email):
	from django.utils.text import slugify

	base = slugify(email.partition("@")[0])[:40] or "developer"
	for _ in range(10):
		username = f"{base}-{secrets.token_hex(4)}"
		if not User.objects.filter(username__iexact=username).exists():
			return username
	return f"developer-{secrets.token_hex(12)}"


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
		if not user or not user.check_password(serializer.validated_data["password"]):
			return Response(
				{"detail": "Identifiants invalides."},
				status=status.HTTP_400_BAD_REQUEST,
			)
		if not user.is_email_verified and not user.is_superuser:
			return Response(
				{"detail": "Confirmez votre adresse e-mail avant de vous connecter."},
				status=status.HTTP_403_FORBIDDEN,
			)
		if not user.is_active:
			return Response(
				{"detail": "Identifiants invalides."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		return _token_response(user, request)


class RegisterView(APIView):
	permission_classes = [AllowAny]
	throttle_classes = [ScopedRateThrottle]
	throttle_scope = "register"

	def post(self, request):
		serializer = RegistrationSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		try:
			with transaction.atomic():
				user = serializer.save()
		except IntegrityError:
			return Response(
				{"detail": "Cette adresse e-mail ou ce nom d’utilisateur est déjà utilisé."},
				status=status.HTTP_400_BAD_REQUEST,
			)
		email_sent = send_verification_email(user)
		return Response(
			{
				"verification_required": True,
				"email_sent": email_sent,
				"detail": "Consultez votre boîte de réception pour confirmer votre adresse e-mail.",
			},
			status=status.HTTP_201_CREATED,
		)


class VerifyEmailView(APIView):
	permission_classes = [AllowAny]
	throttle_classes = [ScopedRateThrottle]
	throttle_scope = "email_verification"

	def post(self, request):
		serializer = EmailVerificationSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		token_hash = hashlib.sha256(serializer.validated_data["token"].encode("utf-8")).hexdigest()
		now = timezone.now()
		verification = EmailVerificationToken.objects.select_related("user").filter(
			token_hash=token_hash,
			used_at__isnull=True,
			expires_at__gt=now,
		).first()
		if verification is None or verification.email.casefold() != verification.user.email.casefold():
			return Response(
				{"detail": "Ce lien de confirmation est invalide ou a expiré."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		with transaction.atomic():
			locked_token = EmailVerificationToken.objects.select_for_update().filter(
				pk=verification.pk,
				used_at__isnull=True,
				expires_at__gt=now,
			).first()
			if locked_token is None:
				return Response(
					{"detail": "Ce lien de confirmation est invalide ou a expiré."},
					status=status.HTTP_400_BAD_REQUEST,
				)
			locked_token.used_at = now
			locked_token.save(update_fields=["used_at"])
			user = locked_token.user
			user.is_email_verified = True
			user.is_active = True
			user.save(update_fields=["is_email_verified", "is_active"])
			EmailVerificationToken.objects.filter(
				user=user,
				used_at__isnull=True,
			).exclude(pk=locked_token.pk).update(used_at=now)

		return Response({"detail": "Adresse e-mail confirmée. Vous pouvez vous connecter."})


class ResendVerificationEmailView(APIView):
	permission_classes = [AllowAny]
	throttle_classes = [ScopedRateThrottle]
	throttle_scope = "email_verification"

	def post(self, request):
		serializer = EmailAddressSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		user = User.objects.filter(email__iexact=serializer.validated_data["email"]).first()
		if user and not user.is_active and not user.is_email_verified:
			send_verification_email(user)
		return Response(
			{
				"detail": "Si cette adresse correspond à un compte en attente, un nouveau lien vient d’être envoyé."
			}
		)


class PasswordResetRequestView(APIView):
	permission_classes = [AllowAny]
	throttle_classes = [ScopedRateThrottle]
	throttle_scope = "password_reset"

	def post(self, request):
		serializer = EmailAddressSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		user = User.objects.filter(
			email__iexact=serializer.validated_data["email"],
			is_active=True,
			is_email_verified=True,
		).first()
		if user:
			send_password_reset_email(user)
		return Response(
			{
				"detail": "Si un compte confirmé correspond à cette adresse, un lien de réinitialisation vient d’être envoyé."
			}
		)


class PasswordResetConfirmView(APIView):
	permission_classes = [AllowAny]
	throttle_classes = [ScopedRateThrottle]
	throttle_scope = "password_reset"

	def post(self, request):
		uid = request.data.get("uid")
		token = request.data.get("token")
		if not isinstance(uid, str) or not isinstance(token, str):
			return Response({"detail": "Lien de réinitialisation invalide."}, status=status.HTTP_400_BAD_REQUEST)
		try:
			user_id = force_str(urlsafe_base64_decode(uid))
			user = User.objects.get(pk=user_id, is_active=True, is_email_verified=True)
		except (TypeError, ValueError, OverflowError, User.DoesNotExist):
			return Response({"detail": "Lien de réinitialisation invalide ou expiré."}, status=status.HTTP_400_BAD_REQUEST)
		if not default_token_generator.check_token(user, token):
			return Response({"detail": "Lien de réinitialisation invalide ou expiré."}, status=status.HTTP_400_BAD_REQUEST)

		serializer = PasswordResetConfirmSerializer(
			data=request.data,
			context={"user": user},
		)
		serializer.is_valid(raise_exception=True)
		user.set_password(serializer.validated_data["new_password"])
		User.objects.filter(pk=user.pk).update(
			password=user.password,
			auth_version=F("auth_version") + 1,
		)
		_blacklist_user_refresh_tokens(user)
		return Response({"detail": "Mot de passe modifié. Reconnectez-vous avec votre nouveau mot de passe."})


class OAuthExchangeView(APIView):
	permission_classes = [AllowAny]
	authentication_classes = []
	throttle_classes = [ScopedRateThrottle]
	throttle_scope = "oauth_exchange"

	def post(self, request):
		configured_secret = settings.AUTH_EXCHANGE_SECRET
		provided_secret = request.headers.get("X-Auth-Exchange-Key", "")
		if not configured_secret:
			return Response({"detail": "L’échange OAuth n’est pas configuré."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
		if not secrets.compare_digest(provided_secret, configured_secret):
			return Response({"detail": "Échange OAuth non autorisé."}, status=status.HTTP_403_FORBIDDEN)

		serializer = OAuthExchangeSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		data = serializer.validated_data
		try:
			with transaction.atomic():
				identity = ExternalIdentity.objects.select_related("user").filter(
					provider=data["provider"],
					subject=data["subject"],
				).first()
				if identity:
					user = identity.user
					if (
						data["email_verified"]
						and not user.is_email_verified
						and user.email.casefold() == data["email"].casefold()
					):
						user.is_email_verified = True
						user.is_active = True
						user.save(update_fields=["is_email_verified", "is_active"])
					if not user.is_active:
						return Response({"detail": "Ce compte est désactivé."}, status=status.HTTP_403_FORBIDDEN)
					if not user.is_email_verified:
						send_verification_email(user)
						return Response(
							{"verification_required": True, "detail": "Confirmez votre adresse e-mail pour activer le compte."},
							status=status.HTTP_202_ACCEPTED,
						)
					return _token_response(user, request)

				existing_user = User.objects.filter(email__iexact=data["email"]).first()
				if existing_user:
					if data["email_verified"] and not existing_user.is_email_verified and not existing_user.is_active:
						existing_user.is_email_verified = True
						existing_user.is_active = True
						existing_user.save(update_fields=["is_email_verified", "is_active"])
						ExternalIdentity.objects.create(
							user=existing_user,
							provider=data["provider"],
							subject=data["subject"],
							email=data["email"],
						)
						return _token_response(existing_user, request)
					return Response(
						{
							"code": "account_exists",
							"detail": "Un compte utilise déjà cette adresse. Connectez-vous par e-mail pour continuer.",
						},
						status=status.HTTP_409_CONFLICT,
					)

				name = data["name"].strip() or data["email"].partition("@")[0]
				name_parts = name.split(maxsplit=1)
				verified = data["email_verified"]
				user = User.objects.create_user(
					username=_create_oauth_username(data["email"]),
					email=data["email"],
					password=None,
					first_name=name_parts[0][:150],
					last_name=name_parts[1][:150] if len(name_parts) > 1 else "",
					expertise_domain=User.Domain.OTHER,
					is_active=verified,
					is_email_verified=verified,
				)
				ExternalIdentity.objects.create(
					user=user,
					provider=data["provider"],
					subject=data["subject"],
					email=data["email"],
				)
				if not verified:
					send_verification_email(user)
					return Response(
						{"verification_required": True, "detail": "Confirmez votre adresse e-mail pour activer le compte."},
						status=status.HTTP_202_ACCEPTED,
					)
				return _token_response(user, request, status.HTTP_201_CREATED)
		except IntegrityError:
			return Response(
				{"code": "account_exists", "detail": "Un compte utilise déjà cette identité ou cette adresse."},
				status=status.HTTP_409_CONFLICT,
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
		User.objects.filter(pk=request.user.pk).update(
			password=request.user.password,
			auth_version=F("auth_version") + 1,
		)
		_blacklist_user_refresh_tokens(request.user)
		return Response({"detail": "Mot de passe modifié. Reconnectez-vous sur vos autres appareils."})
