from django.db import migrations, models
from django.utils.text import slugify


def populate_team_slugs(apps, schema_editor):
    Team = apps.get_model("collaborations", "Team")
    database = schema_editor.connection.alias
    used_slugs = set(
        Team.objects.using(database)
        .exclude(slug__isnull=True)
        .exclude(slug="")
        .values_list("slug", flat=True)
    )

    teams = Team.objects.using(database).select_related("organisation").order_by("pk")
    for team in teams.iterator():
        if team.slug:
            continue

        organisation_slug = team.organisation.slug if team.organisation_id else ""
        base_slug = slugify(f"{organisation_slug}-{team.name}")[:100] or "team"
        candidate = base_slug
        suffix = 2
        while candidate in used_slugs:
            suffix_text = f"-{suffix}"
            candidate = f"{base_slug[:100 - len(suffix_text)]}{suffix_text}"
            suffix += 1

        Team.objects.using(database).filter(pk=team.pk).update(slug=candidate)
        used_slugs.add(candidate)


class Migration(migrations.Migration):
    dependencies = [
        ("collaborations", "0005_uuid_primary_keys"),
    ]

    operations = [
        # Rename rather than drop/re-add so existing image paths are retained.
        migrations.RenameField(
            model_name="team",
            old_name="images_profile",
            new_name="image_profile",
        ),
        migrations.AddField(
            model_name="team",
            name="slug",
            field=models.SlugField(blank=True, max_length=100, null=True),
        ),
        migrations.RunPython(populate_team_slugs, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="team",
            name="slug",
            field=models.SlugField(blank=True, max_length=100, unique=True),
        ),
        # These retired models may still have rows in another installation.
        # Remove them from Django's state without dropping their database tables.
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.DeleteModel(name="Comment"),
                migrations.DeleteModel(name="Invitation"),
            ],
        ),
    ]