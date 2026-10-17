# Copyright (c) 2026, Frappe Technologies Pvt. Ltd. and Contributors
# License: MIT. See LICENSE
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

import frappe
from frappe.middlewares import StaticDataMiddleware
from frappe.tests import UnitTestCase


class TestStaticDataMiddleware(UnitTestCase):
	def test_serves_files_from_symlinked_site_hostname(self):
		with TemporaryDirectory() as tmp_dir:
			sites_path = Path(tmp_dir)
			site_files = sites_path / "test_site" / "public" / "files"
			site_files.mkdir(parents=True)
			(site_files / "sample.txt").write_text("ok")
			(sites_path / "test-site").symlink_to("test_site")

			middleware = StaticDataMiddleware(lambda *_: None, [])
			middleware.environ = {"HTTP_HOST": "test-site:8000"}
			middleware._opener = lambda path: Path(path).open("rb")

			with patch("frappe.app._site", None):
				filename, file = middleware.get_directory_loader(sites_path)("sample.txt")
				try:
					self.assertEqual(filename, "sample.txt")
					self.assertEqual(file.read(), b"ok")
				finally:
					file.close()

				self.assertEqual(
					middleware.get_directory_loader(sites_path)("../../../../outside.txt"), (None, None)
				)
