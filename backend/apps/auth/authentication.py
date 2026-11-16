from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication


class VersionedJWTAuthentication(JWTAuthentication):
    """Reject access tokens issued before the user's credential version changed."""

    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        token_version = validated_token.get("auth_version", 0)
        if type(token_version) is not int or token_version != user.auth_version:
            raise AuthenticationFailed("Cette session a été révoquée. Reconnectez-vous.")
        return user
