from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).with_name("release-artifact.py")


class ReleaseArtifactTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        for path in ("dist/server/entry.mjs", "dist/client/ko/index.html", "public/favicon.svg"):
            file = self.root / path
            file.parent.mkdir(parents=True, exist_ok=True)
            file.write_text("fixture " + path)
        self.run_script("create")

    def run_script(self, action, revision="fixture", success=True):
        result = subprocess.run([sys.executable, str(SCRIPT), action, "--root", str(self.root),
                                 "--revision", revision], capture_output=True, text=True)
        self.assertEqual(result.returncode == 0, success, result.stderr)

    def test_same_artifact_and_revision_are_accepted(self):
        self.run_script("verify")
        result = subprocess.run(["node", str(SCRIPT.with_name("verify-release-artifact.mjs")), str(self.root)],
                                capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_changed_server_or_static_file_is_rejected(self):
        for path in ("dist/server/entry.mjs", "dist/client/ko/index.html", "public/favicon.svg"):
            with self.subTest(path=path):
                file = self.root / path
                original = file.read_text()
                file.write_text("changed")
                self.run_script("verify", success=False)
                result = subprocess.run(["node", str(SCRIPT.with_name("verify-release-artifact.mjs")), str(self.root)],
                                        capture_output=True)
                self.assertNotEqual(result.returncode, 0)
                file.write_text(original)

    def test_extra_asset_and_wrong_revision_are_rejected(self):
        self.run_script("verify", revision="another-commit", success=False)
        (self.root / "dist/client/stale.js").write_text("stale")
        self.run_script("verify", success=False)

    def test_incomplete_server_artifact_is_rejected(self):
        (self.root / "dist/server/entry.mjs").unlink()
        self.run_script("create", success=False)


if __name__ == "__main__":
    unittest.main()
