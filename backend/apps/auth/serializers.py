from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.validators import UnicodeUsernameValidator
from rest_framework import serializers

from apps.auth.models import ExternalIdentity
from apps.users.models import User
from apps.users.services import register_user


class LoginSerializer(serializers.Serializer):
    email = serializers.CharField(max_length=254)
    password = serializers.CharField(write_only=True, trim_whitespace=False)


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(min_length=10, max_length=128, write_only=True, trim_whitespace=False)

    def validate_new_password(self, value: str) -> str:
        validate_password(value, user=self.context["request"].user)
        return value


class RegistrationSerializer(serializers.Serializer):
    name = serializers.CharField(min_length=2, max_length=150, trim_whitespace=True)
    username = serializers.CharField(
        min_length=3,
        max_length=150,
        validators=[UnicodeUsernameValidator()],
    )
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(min_length=10, max_length=128, write_only=True)

    def validate_email(self, value: str) -> str:
        normalized_email = value.strip().lower()
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError("Cette adresse e-mail est déjà utilisée.")
        return normalized_email

    def validate_username(self, value: str) -> str:
        normalized_username = value.strip()
        if User.objects.filter(username__iexact=normalized_username).exists():
            raise serializers.ValidationError("Ce nom d’utilisateur est déjà utilisé.")
        return normalized_username

    def validate_password(self, value: str) -> str:
        attrs = self.initial_data
        name_parts = str(attrs.get("name", "")).strip().split(maxsplit=1)
        user = User(
            username=str(attrs.get("username", "")),
            email=str(attrs.get("email", "")),
            first_name=name_parts[0] if name_parts else "",
            last_name=name_parts[1] if len(name_parts) > 1 else "",
        )
        validate_password(value, user=user)
        return value

    def create(self, validated_data: dict) -> User:
        return register_user(validated_data)


class OAuthExchangeSerializer(serializers.Serializer):
    provider = serializers.ChoiceField(choices=ExternalIdentity.Provider.choices)
    subject = serializers.CharField(max_length=255, trim_whitespace=True)
    email = serializers.EmailField(max_length=254)
    email_verified = serializers.BooleanField()
    name = serializers.CharField(max_length=150, required=False, allow_blank=True, trim_whitespace=True)

    def validate_email(self, value: str) -> str:
        return value.strip().lower()


class EmailAddressSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)

    def validate_email(self, value: str) -> str:
        return value.strip().lower()


class EmailVerificationSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=128, trim_whitespace=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField(max_length=64)
    token = serializers.CharField(max_length=128, trim_whitespace=True)
    new_password = serializers.CharField(min_length=10, max_length=128, write_only=True, trim_whitespace=False)

    def validate_new_password(self, value: str) -> str:
        validate_password(value, user=self.context.get("user"))
        return value
