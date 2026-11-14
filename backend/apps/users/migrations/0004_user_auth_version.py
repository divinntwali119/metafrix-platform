from django.db import migrations, models


class Migration(migrations.Migration):

	dependencies = [
		("users", "0003_auth_security"),
	]

	operations = [
		migrations.AddField(
			model_name="user",
			name="auth_version",
			field=models.PositiveIntegerField(default=0),
		),
	]