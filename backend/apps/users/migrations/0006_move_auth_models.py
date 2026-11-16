from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("authentication", "0001_move_auth_models"),
        ("users", "0005_username_case_insensitive_unique"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.DeleteModel(name="EmailVerificationToken"),
                migrations.DeleteModel(name="ExternalIdentity"),
            ],
        ),
    ]
