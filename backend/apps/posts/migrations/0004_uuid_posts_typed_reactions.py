import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models
from django.db.migrations.operations.base import Operation
from django.db.migrations.state import ModelState
from django.db.migrations.exceptions import IrreversibleError


def prepare_uuid_values(apps, schema_editor):
    Post = apps.get_model("posts", "Post")
    PostComment = apps.get_model("posts", "PostComment")
    PostLike = apps.get_model("posts", "PostLike")
    PostBookmark = apps.get_model("posts", "PostBookmark")
    database = schema_editor.connection.alias

    posts = []
    for post in Post.objects.using(database).all().iterator():
        post.uuid_tmp = uuid.uuid4()
        posts.append(post)
        if len(posts) == 500:
            Post.objects.using(database).bulk_update(posts, ["uuid_tmp"])
            posts.clear()
    if posts:
        Post.objects.using(database).bulk_update(posts, ["uuid_tmp"])

    def update_comment_batch(comments):
        post_ids = dict(
            Post.objects.using(database)
            .filter(pk__in={comment.post_id for comment in comments})
            .values_list("pk", "uuid_tmp")
        )
        for comment in comments:
            post_uuid = post_ids.get(comment.post_id)
            if post_uuid is None:
                raise RuntimeError(
                    f"Cannot migrate PostComment {comment.pk}: "
                    "its post no longer exists."
                )
            comment.post_uuid_id = post_uuid
        PostComment.objects.using(database).bulk_update(
            comments,
            ["uuid_tmp", "post_uuid"],
        )

    comments = []
    for comment in PostComment.objects.using(database).all().iterator():
        comment.uuid_tmp = uuid.uuid4()
        comments.append(comment)
        if len(comments) == 500:
            update_comment_batch(comments)
            comments.clear()
    if comments:
        update_comment_batch(comments)

    for model in (PostLike, PostBookmark):
        reactions = []
        for reaction in model.objects.using(database).all().iterator():
            reaction.legacy_post_id = reaction.post_id
            reactions.append(reaction)
            if len(reactions) == 500:
                model.objects.using(database).bulk_update(
                    reactions,
                    ["legacy_post_id"],
                )
                reactions.clear()
        if reactions:
            model.objects.using(database).bulk_update(
                reactions,
                ["legacy_post_id"],
            )


def migrate_legacy_reactions(apps, schema_editor):
    Post = apps.get_model("posts", "Post")
    PostLike = apps.get_model("posts", "PostLike")
    PostBookmark = apps.get_model("posts", "PostBookmark")
    PostReaction = apps.get_model("posts", "PostReaction")
    database = schema_editor.connection.alias

    def create_reaction_batch(reactions, reaction_type, model):
        post_ids = dict(
            Post.objects.using(database)
            .filter(legacy_id__in={reaction.legacy_post_id for reaction in reactions})
            .values_list("legacy_id", "id")
        )
        batch = []
        for reaction in reactions:
            post_id = post_ids.get(reaction.legacy_post_id)
            if post_id is None:
                raise RuntimeError(
                    f"Cannot migrate {model.__name__} {reaction.pk}: "
                    "its post no longer exists."
                )
            batch.append(
                PostReaction(
                    post_id=post_id,
                    by_id=reaction.user_id,
                    type=reaction_type,
                    at=reaction.created_at,
                )
            )
        PostReaction.objects.using(database).bulk_create(batch)

    for model, reaction_type in (
        (PostLike, "like"),
        (PostBookmark, "bookmark"),
    ):
        reactions = []
        for reaction in model.objects.using(database).all().iterator():
            reactions.append(reaction)
            if len(reactions) == 500:
                create_reaction_batch(reactions, reaction_type, model)
                reactions.clear()
        if reactions:
            create_reaction_batch(reactions, reaction_type, model)


class SwapUUIDPrimaryKey(Operation):
    reversible = False

    def __init__(self, model_name, field_mapping):
        self.model_name = model_name
        self.field_mapping = field_mapping

    def deconstruct(self):
        return (
            self.__class__.__name__,
            [self.model_name, self.field_mapping],
            {},
        )

    def state_forwards(self, app_label, state):
        model_name = self.model_name.lower()
        state.rename_field(app_label, model_name, "id", "legacy_id")
        state.alter_field(
            app_label,
            model_name,
            "legacy_id",
            models.BigIntegerField(),
            preserve_default=True,
        )
        state.alter_field(
            app_label,
            model_name,
            "uuid_tmp",
            models.UUIDField(
                default=uuid.uuid4,
                editable=False,
                primary_key=True,
                serialize=False,
            ),
            preserve_default=True,
        )
        state.rename_field(app_label, model_name, "uuid_tmp", "id")

    def database_forwards(self, app_label, schema_editor, from_state, to_state):
        old_model = from_state.apps.get_model(app_label, self.model_name)
        new_model = to_state.apps.get_model(app_label, self.model_name)
        table_name = old_model._meta.db_table
        temporary_table = f"{table_name}_uuid_migration"

        temporary_state = ModelState.from_model(new_model)
        temporary_state.options["db_table"] = temporary_table
        temporary_model = temporary_state.render(to_state.apps.clone())
        schema_editor.create_model(temporary_model)

        target_columns = []
        source_columns = []
        for target_field in new_model._meta.local_concrete_fields:
            source_name = self.field_mapping.get(
                target_field.name,
                target_field.name,
            )
            source_field = old_model._meta.get_field(source_name)
            target_columns.append(schema_editor.quote_name(target_field.column))
            source_columns.append(schema_editor.quote_name(source_field.column))

        with schema_editor.connection.cursor() as cursor:
            cursor.execute(
                f"INSERT INTO {schema_editor.quote_name(temporary_table)} "
                f"({', '.join(target_columns)}) "
                f"SELECT {', '.join(source_columns)} "
                f"FROM {schema_editor.quote_name(table_name)}"
            )
        schema_editor.delete_model(old_model)
        schema_editor.alter_db_table(
            temporary_model,
            temporary_table,
            table_name,
        )

    def database_backwards(self, *args):
        raise IrreversibleError(
            "Post and comment IDs cannot be converted back to their original values."
        )

    def describe(self):
        return f"Convert {self.model_name} primary keys from integers to UUIDs"

    @property
    def migration_name_fragment(self):
        return f"swap_{self.model_name.lower()}_uuid_primary_key"


class Migration(migrations.Migration):
    dependencies = [
        ("posts", "0003_social_feed"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="post",
            name="uuid_tmp",
            field=models.UUIDField(null=True),
        ),
        migrations.AddField(
            model_name="postcomment",
            name="uuid_tmp",
            field=models.UUIDField(null=True),
        ),
        migrations.AddField(
            model_name="postcomment",
            name="post_uuid",
            field=models.ForeignKey(
                db_constraint=False,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="+",
                to="posts.post",
                to_field="uuid_tmp",
            ),
        ),
        migrations.AddField(
            model_name="postlike",
            name="legacy_post_id",
            field=models.BigIntegerField(null=True),
        ),
        migrations.AddField(
            model_name="postbookmark",
            name="legacy_post_id",
            field=models.BigIntegerField(null=True),
        ),
        migrations.RunPython(prepare_uuid_values, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="post",
            name="uuid_tmp",
            field=models.UUIDField(null=True, unique=True),
        ),
        migrations.AlterField(
            model_name="postcomment",
            name="uuid_tmp",
            field=models.UUIDField(null=True, unique=True),
        ),
        migrations.RemoveConstraint(
            model_name="postlike",
            name="unique_post_like_per_user",
        ),
        migrations.RemoveConstraint(
            model_name="postbookmark",
            name="unique_post_bookmark_per_user",
        ),
        migrations.RemoveField(
            model_name="postcomment",
            name="post",
        ),
        migrations.RenameField(
            model_name="postcomment",
            old_name="post_uuid",
            new_name="post",
        ),
        migrations.RemoveField(
            model_name="postlike",
            name="post",
        ),
        migrations.RemoveField(
            model_name="postbookmark",
            name="post",
        ),
        SwapUUIDPrimaryKey(
            "Post",
            {"id": "uuid_tmp", "legacy_id": "id"},
        ),
        SwapUUIDPrimaryKey(
            "PostComment",
            {"id": "uuid_tmp", "legacy_id": "id"},
        ),
        migrations.AlterField(
            model_name="postcomment",
            name="post",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="comments",
                to="posts.post",
            ),
        ),
        migrations.RemoveField(
            model_name="postcomment",
            name="legacy_id",
        ),
        migrations.CreateModel(
            name="PostReaction",
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
                            ("bookmark", "Enregitre"),
                            ("shared", "Partager"),
                        ],
                        max_length=20,
                    ),
                ),
                ("at", models.DateTimeField(auto_now_add=True)),
                (
                    "by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        related_name="reactions",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "post",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reactions",
                        to="posts.post",
                    ),
                ),
            ],
            options={
                "verbose_name": "Reaction",
                "verbose_name_plural": "Reactions",
                "ordering": ["-at"],
                "constraints": [
                    models.UniqueConstraint(
                        fields=("post", "by", "type"),
                        name="unique_post_reaction_per_user",
                    ),
                ],
            },
        ),
        migrations.RunPython(migrate_legacy_reactions, migrations.RunPython.noop),
        migrations.DeleteModel(name="PostLike"),
        migrations.DeleteModel(name="PostBookmark"),
        migrations.RemoveField(
            model_name="post",
            name="legacy_id",
        ),
    ]
