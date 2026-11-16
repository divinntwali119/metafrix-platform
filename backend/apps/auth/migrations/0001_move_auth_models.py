from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("users", "0005_username_case_insensitive_unique"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
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
                    options={
                        "db_table": "users_externalidentity",
                        "constraints": [
                            models.UniqueConstraint(fields=("provider", "subject"), name="unique_external_identity_subject"),
                            models.UniqueConstraint(fields=("user", "provider"), name="unique_external_identity_provider_per_user"),
                        ],
                    },
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
                        "db_table": "users_emailverificationtoken",
                        "indexes": [models.Index(fields=["user", "used_at"], name="email_verify_user_used_idx")],
                    },
                ),
            ],
        ),
    ]
