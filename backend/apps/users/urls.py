from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
	CurrentUserView,
	DeveloperDetailView,
	DeveloperFollowView,
	DeveloperListView,
	LoginView,
	LogoutView,
	OAuthExchangeView,
	PasswordChangeView,
	PasswordResetConfirmView,
	PasswordResetRequestView,
	RegisterView,
	ResendVerificationEmailView,
	VerifyEmailView,
)

app_name = 'users'
urlpatterns = [
	path("auth/login/", LoginView.as_view(), name="auth-login"),
	path("auth/register/", RegisterView.as_view(), name="auth-register"),
	path("auth/oauth/exchange/", OAuthExchangeView.as_view(), name="auth-oauth-exchange"),
	path("auth/email/verify/", VerifyEmailView.as_view(), name="auth-email-verify"),
	path("auth/email/resend-verification/", ResendVerificationEmailView.as_view(), name="auth-email-resend-verification"),
	path("auth/password/reset/", PasswordResetRequestView.as_view(), name="auth-password-reset"),
	path("auth/password/reset/confirm/", PasswordResetConfirmView.as_view(), name="auth-password-reset-confirm"),
	path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
	path("auth/token/refresh/", TokenRefreshView.as_view(), name="auth-token-refresh"),
	path("auth/password/change/", PasswordChangeView.as_view(), name="auth-password-change"),
	path("users/me/", CurrentUserView.as_view(), name="current-user"),
	path("developers/", DeveloperListView.as_view(), name="developer-list"),
	path("developers/<str:username>/", DeveloperDetailView.as_view(), name="developer-detail"),
	path("developers/<str:username>/follow/", DeveloperFollowView.as_view(), name="developer-follow"),
]