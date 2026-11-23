from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
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

app_name = "authentication"
urlpatterns = [
    path("login/", LoginView.as_view(), name="auth-login"),
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("oauth/exchange/", OAuthExchangeView.as_view(), name="auth-oauth-exchange"),
    path("email/verify/", VerifyEmailView.as_view(), name="auth-email-verify"),
    path("email/resend-verification/", ResendVerificationEmailView.as_view(), name="auth-email-resend-verification"),
    path("password/reset/", PasswordResetRequestView.as_view(), name="auth-password-reset"),
    path("password/reset/confirm/", PasswordResetConfirmView.as_view(), name="auth-password-reset-confirm"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="auth-token-refresh"),
    path("password/change/", PasswordChangeView.as_view(), name="auth-password-change"),
]
