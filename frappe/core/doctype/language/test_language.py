# Copyright (c) 2015, Frappe Technologies and Contributors
# License: MIT. See LICENSE
import csv
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

import frappe
from frappe.core.doctype.language.language import sync_languages
from frappe.tests import IntegrationTestCase


class TestLanguage(IntegrationTestCase):
	def test_sync_languages_imports_locale_defaults(self):
		language_code = "fa-test"
		frappe.db.delete("Language", {"language_code": language_code})
		self.addCleanup(frappe.db.delete, "Language", {"language_code": language_code})

		with TemporaryDirectory() as temp_dir:
			languages_file = Path(temp_dir) / "languages.csv"
			with languages_file.open("w", encoding="utf-8", newline="") as file:
				writer = csv.DictWriter(
					file,
					fieldnames=["language_code", "language_name", "enabled", "first_day_of_the_week"],
				)
				writer.writeheader()
				writer.writerow(
					{
						"language_code": language_code,
						"language_name": "Persian Test",
						"enabled": 1,
						"first_day_of_the_week": "Saturday",
					}
				)

			with patch.object(frappe, "get_app_path", return_value=str(languages_file)):
				sync_languages()

		self.assertEqual(frappe.db.get_value("Language", language_code, "first_day_of_the_week"), "Saturday")

	def test_sync_languages_preserves_existing_locale_defaults(self):
		language_code = "fa-test"
		frappe.db.delete("Language", {"language_code": language_code})
		self.addCleanup(frappe.db.delete, "Language", {"language_code": language_code})

		language = frappe.new_doc("Language")
		language.update(
			{
				"language_code": language_code,
				"language_name": "Persian Test",
				"enabled": 1,
				"first_day_of_the_week": "Monday",
			}
		)
		language.insert()

		with TemporaryDirectory() as temp_dir:
			languages_file = Path(temp_dir) / "languages.csv"
			with languages_file.open("w", encoding="utf-8", newline="") as file:
				writer = csv.DictWriter(
					file,
					fieldnames=["language_code", "language_name", "enabled", "first_day_of_the_week"],
				)
				writer.writeheader()
				writer.writerow(
					{
						"language_code": language_code,
						"language_name": "Persian Test",
						"enabled": 1,
						"first_day_of_the_week": "Saturday",
					}
				)

			with patch.object(frappe, "get_app_path", return_value=str(languages_file)):
				sync_languages()

		self.assertEqual(frappe.db.get_value("Language", language_code, "first_day_of_the_week"), "Monday")
