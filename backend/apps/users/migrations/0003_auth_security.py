from django.conf import settings
from django.db import migrations, models
from django.db.models import Count
from django.db.models.functions import Lower
import django.db.models.deletion


def mark_existing_emails_verified(apps, schema_editor):
    User = apps.get_model("users", "User")
    duplicates = (
        User.objects.values(email_key=Lower("email"))
        .annotate(total=Count("pk"))
        .filter(total__gt=1)
    )
    if duplicates.exists():
        raise RuntimeError(
            "Duplicate user e-mail addresses (case-insensitive) must be resolved before applying users.0003_auth_security."
        )
    User.objects.all().update(is_email_verified=True)


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0002_follow"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="is_email_verified",
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(mark_existing_emails_verified, migrations.RunPython.noop),
        migrations.CreateModel(
            name="ExternalIdentity",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("provider", models.CharField(choices=[("google", "Google"), ("microsoft", "Microsoft")], max_length=20)),
                ("subject", models.CharField(max_length=255)),
                ("email", models.EmailField(max_length=254)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="external_identities", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="EmailVerificationToken",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("email", models.EmailField(max_length=254)),
                ("token_hash", models.CharField(max_length=64, unique=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("expires_at", models.DateTimeField()),
                ("used_at", models.DateTimeField(blank=True, null=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="email_verification_tokens", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "indexes": [models.Index(fields=["user", "used_at"], name="email_verify_user_used_idx")],
            },
        ),
        migrations.AddConstraint(
            model_name="externalidentity",
            constraint=models.UniqueConstraint(fields=("provider", "subject"), name="unique_external_identity_subject"),
        ),
        migrations.AddConstraint(
            model_name="externalidentity",
            constraint=models.UniqueConstraint(fields=("user", "provider"), name="unique_external_identity_provider_per_user"),
        ),
        migrations.AddConstraint(
            model_name="user",
            constraint=models.UniqueConstraint(Lower("email"), name="users_user_email_ci_unique"),
        ),
    ]