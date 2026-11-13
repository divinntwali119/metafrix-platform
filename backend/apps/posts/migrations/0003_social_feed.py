import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("posts", "0002_initial"),
        ("repositories", "0002_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterModelOptions(name="post", options={"ordering": ["-posted_at", "-pk"]}),
        migrations.AddField(model_name="post", name="code_content", field=models.TextField(blank=True, default="")),
        migrations.AddField(model_name="post", name="code_filename", field=models.CharField(blank=True, default="", max_length=160)),
        migrations.AddField(model_name="post", name="code_language", field=models.CharField(blank=True, default="", max_length=40)),
        migrations.AddField(model_name="post", name="media_url", field=models.URLField(blank=True, default="", max_length=2048)),
        migrations.AddField(
            model_name="post",
            name="repository",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="social_posts", to="repositories.repository"),
        ),
        migrations.AddField(
            model_name="post",
            name="type",
            field=models.CharField(choices=[("text", "Discussion"), ("code", "Code"), ("project", "Projet"), ("tutorial", "Tutoriel"), ("question", "Question"), ("announcement", "Annonce")], default="text", max_length=20),
        ),
        migrations.AlterField(model_name="post", name="title", field=models.CharField(blank=True, default="", max_length=100)),
        migrations.CreateModel(
            name="PostComment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("content", models.CharField(max_length=2000)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("author", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="post_comments", to=settings.AUTH_USER_MODEL)),
                ("post", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="comments", to="posts.post")),
            ],
            options={"ordering": ["created_at", "pk"]},
        ),
        migrations.CreateModel(
            name="PostBookmark",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("post", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="bookmarks", to="posts.post")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="post_bookmarks", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"], "constraints": [models.UniqueConstraint(fields=("post", "user"), name="unique_post_bookmark_per_user")]},
        ),
        migrations.CreateModel(
            name="PostLike",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("post", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="post_likes", to="posts.post")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="post_likes", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"], "constraints": [models.UniqueConstraint(fields=("post", "user"), name="unique_post_like_per_user")]},
        ),
    ]