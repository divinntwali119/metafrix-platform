import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("posts", "0004_uuid_posts_typed_reactions"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Keep the legacy table in the database; it may contain likes from
        # installations that have not migrated to typed reactions yet.
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[migrations.DeleteModel(name="Like")],
        ),
        migrations.CreateModel(
            name="ReelComment",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("content", models.CharField(max_length=2000)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "author",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reel_comments",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "reel",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="comment",
                        to="posts.reel",
                    ),
                ),
            ],
            options={"ordering": ["created_at"]},
        ),
        migrations.CreateModel(
            name="ReelReaction",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "type",
                    models.CharField(
                        choices=[
                            ("like", "J'aime"),
                            ("watched", "Vu"),
                            ("saved", "Enregitre"),
                            ("shared", "Partage"),
                            ("reshared", "Repartage"),
                        ],
                        max_length=20,
                    ),
                ),
                ("at", models.DateTimeField(auto_now_add=True)),
                (
                    "by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        related_name="likes",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "reel",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reaction",
                        to="posts.reel",
                    ),
                ),
            ],
            options={
                "verbose_name": "Reaction",
                "verbose_name_plural": "Reactions",
                "ordering": ["-at"],
                "constraints": [
                    models.UniqueConstraint(
                        fields=("reel", "by", "type"),
                        name="type_react_per_user",
                    ),
                ],
            },
        ),
    ]