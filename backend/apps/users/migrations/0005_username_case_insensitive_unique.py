from django.db import migrations, models
from django.db.models import Count
from django.db.models.functions import Lower


def reject_case_insensitive_username_duplicates(apps, schema_editor):
	User = apps.get_model("users", "User")
	duplicates = (
		User.objects.values(username_key=Lower("username"))
		.annotate(total=Count("pk"))
		.filter(total__gt=1)
	)
	if duplicates.exists():
		raise RuntimeError(
			"Duplicate usernames (case-insensitive) must be resolved before applying users.0005_username_case_insensitive_unique."
		)


class Migration(migrations.Migration):

	dependencies = [
		("users", "0004_user_auth_version"),
	]

	operations = [
		migrations.RunPython(
			reject_case_insensitive_username_duplicates,
			migrations.RunPython.noop,
		),
		migrations.AddConstraint(
			model_name="user",
			constraint=models.UniqueConstraint(Lower("username"), name="users_user_username_ci_unique"),
		),
	]