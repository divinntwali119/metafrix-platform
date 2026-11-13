import json
from io import BytesIO
from unittest.mock import patch

from django.test import SimpleTestCase

from apps.repositories.services import create_formatted_license, create_gitignore_from_template


class CreateFormattedLicenseTests(SimpleTestCase):
    @patch('apps.repositories.services.urlopen')
    def test_fetches_github_template_and_replaces_placeholders(self, mock_urlopen):
        mock_urlopen.return_value = BytesIO(
            json.dumps({'body': 'Copyright [year] [fullname]'}).encode('utf-8')
        )

        license_text = create_formatted_license('mit', 'Ada Lovelace', year=2026)

        self.assertEqual(license_text, 'Copyright 2026 Ada Lovelace')
        request = mock_urlopen.call_args.args[0]
        self.assertEqual(request.full_url, 'https://api.github.com/licenses/mit')
        mock_urlopen.assert_called_once_with(request, timeout=10)

    @patch('apps.repositories.services.urlopen')
    def test_returns_none_without_template(self, mock_urlopen):
        self.assertIsNone(create_formatted_license(None, 'Ada Lovelace'))
        mock_urlopen.assert_not_called()

    @patch('apps.repositories.services.urlopen')
    def test_rejects_response_without_license_body(self, mock_urlopen):
        mock_urlopen.return_value = BytesIO(json.dumps({'name': 'MIT'}).encode('utf-8'))

        with self.assertRaises(ValueError):
            create_formatted_license('mit', 'Ada Lovelace')


class CreateGitignoreFromTemplateTests(SimpleTestCase):
    @patch('apps.repositories.services.urlopen')
    def test_fetches_github_template(self, mock_urlopen):
        gitignore_text = 'venv/\n__pycache__/\n'
        mock_urlopen.return_value = BytesIO(gitignore_text.encode('utf-8'))

        result = create_gitignore_from_template('Python')

        self.assertEqual(result, gitignore_text)
        request = mock_urlopen.call_args.args[0]
        self.assertEqual(
            request.full_url,
            'https://api.github.com/gitignore/templates/Python',
        )
        self.assertEqual(request.get_header('Accept'), 'application/vnd.github.raw')
        mock_urlopen.assert_called_once_with(request, timeout=10)

    @patch('apps.repositories.services.urlopen')
    def test_returns_none_without_template(self, mock_urlopen):
        self.assertIsNone(create_gitignore_from_template(None))
        mock_urlopen.assert_not_called()

    @patch('apps.repositories.services.urlopen')
    def test_rejects_empty_template(self, mock_urlopen):
        mock_urlopen.return_value = BytesIO(b'')

        with self.assertRaises(ValueError):
            create_gitignore_from_template('Python')
