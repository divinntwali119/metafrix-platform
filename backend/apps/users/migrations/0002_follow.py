import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("users", "0001_initial")]

    operations = [
        migrations.CreateModel(
            name="Follow",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("followed", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="follower_links", to=settings.AUTH_USER_MODEL)),
                ("follower", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="following_links", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-created_at"],
                "constraints": [
                    models.UniqueConstraint(fields=("follower", "followed"), name="unique_user_follow"),
                    models.CheckConstraint(condition=models.Q(("follower", models.F("followed")), _negated=True), name="user_cannot_follow_self"),
                ],
            },
        ),
    ]