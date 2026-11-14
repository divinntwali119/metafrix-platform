import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models
from django.utils.text import slugify


def populate_organisation_slugs_and_owners(apps, schema_editor):
    Organisation = apps.get_model("collaborations", "Organisation")
    Membership = apps.get_model("collaborations", "OrganisationMembership")
    database = schema_editor.connection.alias

    for organisation in Organisation.objects.using(database).order_by("pk"):
        base_slug = slugify(organisation.name)[:90] or "organisation"
        candidate = base_slug
        suffix = 2
        while Organisation.objects.using(database).filter(slug=candidate).exclude(pk=organisation.pk).exists():
            candidate = f"{base_slug[:90]}-{suffix}"
            suffix += 1
        Organisation.objects.using(database).filter(pk=organisation.pk).update(slug=candidate)
        Membership.objects.using(database).get_or_create(
            organisation_id=organisation.pk,
            user_id=organisation.created_by_id,
            defaults={"role": "owner"},
        )


class Migration(migrations.Migration):
    dependencies = [
        ("collaborations", "0003_initial"),
        ("repositories", "0002_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(model_name="organisation", name="description", field=models.TextField(blank=True, default="")),
        migrations.AddField(model_name="organisation", name="location", field=models.CharField(blank=True, default="", max_length=160)),
        migrations.AddField(model_name="organisation", name="website", field=models.URLField(blank=True, default="", max_length=2048)),
        migrations.AddField(model_name="organisation", name="slug", field=models.SlugField(blank=True, db_index=False, max_length=100, null=True)),
        migrations.CreateModel(
            name="OrganisationMembership",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("role", models.CharField(choices=[("owner", "Propriétaire"), ("admin", "Administrateur"), ("member", "Membre")], default="member", max_length=10)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("organisation", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="memberships", to="collaborations.organisation")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="organisation_memberships", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["created_at", "pk"],
                "constraints": [models.UniqueConstraint(fields=("organisation", "user"), name="unique_organisation_member")],
            },
        ),
        migrations.CreateModel(
            name="OrganisationRepository",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("added_by", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="organisation_repository_links", to=settings.AUTH_USER_MODEL)),
                ("organisation", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="repository_links", to="collaborations.organisation")),
                ("repository", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="organisation_links", to="repositories.repository")),
            ],
            options={
                "ordering": ["-created_at"],
                "constraints": [models.UniqueConstraint(fields=("organisation", "repository"), name="unique_repository_per_organisation")],
            },
        ),
        migrations.RunPython(populate_organisation_slugs_and_owners, migrations.RunPython.noop),
        migrations.AlterField(model_name="organisation", name="slug", field=models.SlugField(blank=True, max_length=100, unique=True)),
    ]