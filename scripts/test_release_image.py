import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

SCRIPTS = Path(__file__).resolve().parent


class ReleaseImageTest(unittest.TestCase):
    def run_release(self, mutate=False):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for name in ("dist/server", "dist/client", "public", "scripts", "bin"):
                (root / name).mkdir(parents=True)
            for name in ("dist/server/entry.mjs", "dist/client/index.html", "public/favicon.svg"):
                (root / name).write_text("fixture")
            shutil.copy2(SCRIPTS / "release-artifact.py", root / "scripts/release-artifact.py")
            subprocess.run([sys.executable, str(SCRIPTS / "release-artifact.py"), "create",
                            "--root", str(root), "--revision", "fixture"], check=True, capture_output=True)
            docker = root / "bin/docker"
            docker.write_text('''#!/usr/bin/env python3
import json, os, sys
from pathlib import Path
assert '--target=prebuilt' in sys.argv
assert sys.argv[sys.argv.index('--cache-to')+1] == 'type=inline'
assert '--push' in sys.argv
Path('image-metadata.json').write_text(json.dumps({'containerimage.digest': 'sha256:' + 'a'*64}))
if os.environ.get('MUTATE_ARTIFACT'):
    Path('dist/server/entry.mjs').write_text('concurrent replacement')
print('#1 CACHED')
''')
            docker.chmod(0o755)
            env = {**os.environ, "PATH": str(root / "bin") + os.pathsep + os.environ["PATH"],
                   "GITHUB_OUTPUT": str(root / "output"), "GITHUB_STEP_SUMMARY": str(root / "summary")}
            if mutate:
                env["MUTATE_ARTIFACT"] = "1"
            result = subprocess.run([sys.executable, str(SCRIPTS / "build-release-image.py"),
                "--image", "registry.example/web:fixture", "--cache", "registry.example/web:buildcache",
                "--revision", "fixture"], cwd=root, env=env, capture_output=True, text=True)
            metrics = json.loads((root / "build-metrics.json").read_text())
            output = (root / "output").read_text() if (root / "output").exists() else ""
            return result, metrics, output

    def test_success_emits_only_immutable_image_reference_and_cache_measurement(self):
        result, metrics, output = self.run_release()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(output, "image=registry.example/web@sha256:" + "a" * 64 + "\n")
        self.assertEqual(metrics["cachedSteps"], 1)
        self.assertEqual(metrics["cacheBackend"], "inline")

    def test_concurrent_replacement_blocks_deployment_output(self):
        result, metrics, output = self.run_release(mutate=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertNotEqual(metrics["exitCode"], 0)
        self.assertEqual(output, "")


if __name__ == "__main__":
    unittest.main()
