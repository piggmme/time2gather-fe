import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
import sys

SPEC = importlib.util.spec_from_file_location('preflight', Path(__file__).with_name('frontend_preflight.py'))
gate = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(gate)


class PreflightTest(unittest.TestCase):
    def repository(self, root):
        subprocess.run(['git', 'init', '-q', str(root)], check=True)
        (root / 'source.txt').write_text('tested source')
        self.commit(root)

    def commit(self, root):
        subprocess.run(['git', 'add', '.'], cwd=root, check=True)
        subprocess.run(['git', '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'fixture'], cwd=root, check=True)

    def receipt(self, root):
        path = gate.receipt_path(root, 'HEAD')
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps({'schema': 1, 'conclusion': 'success', 'tree': gate.git(root, 'rev-parse', 'HEAD^{tree}')}))

    def test_missing_test_file_is_rejected_before_any_command(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaisesRegex(ValueError, 'missing'):
                gate.validate_plan(Path(directory), {'lintFiles': ['scripts/missing.mjs'], 'checks': []})

    def test_parent_relative_artifact_output_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaisesRegex(ValueError, 'inside'):
                gate.validate_plan(Path(directory), {'lintFiles': [], 'checks': [], 'evidenceDirectory': '../ci-picker'})

    def test_missing_receipt_blocks_push(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.repository(root)
            with self.assertRaisesRegex(ValueError, 'preflight'):
                gate.verify_receipt(root, 'HEAD')

    def test_new_commit_invalidates_previous_success(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.repository(root)
            self.receipt(root)
            self.assertEqual(gate.verify_receipt(root, 'HEAD')['conclusion'], 'success')
            (root / 'source.txt').write_text('untested source')
            with self.assertRaisesRegex(ValueError, 'clean'):
                gate.verify_receipt(root, 'HEAD')
            self.commit(root)
            with self.assertRaisesRegex(ValueError, 'preflight'):
                gate.verify_receipt(root, 'HEAD')

    def test_failed_check_stops_before_the_next_command(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            checks = [
                {'name': 'failure', 'command': [sys.executable, '-c', 'raise SystemExit(2)']},
                {'name': 'must not run', 'command': [sys.executable, '-c', "open('unexpected','w').close()"]},
            ]
            with self.assertRaisesRegex(ValueError, 'failure failed'):
                gate.execute_checks(root, checks, os.environ.copy(), root / 'logs')
            self.assertFalse((root / 'unexpected').exists())

    def test_real_git_push_is_blocked_without_receipt_and_allowed_after_checks(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / 'repo'
            remote = Path(directory) / 'remote.git'
            self.repository(root)
            subprocess.run(['git', 'init', '--bare', '-q', str(remote)], check=True)
            subprocess.run(['git', 'remote', 'add', 'origin', str(remote)], cwd=root, check=True)
            hook = root / '.git/hooks/pre-push'
            hook.write_text(f'#!/bin/sh\nexec "{sys.executable}" "{Path(gate.__file__)}" hook --root "{root}"\n')
            hook.chmod(0o755)
            command = ['git', 'push', 'origin', 'HEAD:refs/heads/test']
            blocked = subprocess.run(command, cwd=root, capture_output=True, text=True)
            self.assertNotEqual(blocked.returncode, 0)
            self.assertIn('No passing preflight', blocked.stderr)
            self.receipt(root)
            accepted = subprocess.run(command, cwd=root, capture_output=True, text=True)
            self.assertEqual(accepted.returncode, 0, accepted.stderr)
            (root / 'source.txt').write_text('changed after checks')
            self.commit(root)
            self.assertNotEqual(subprocess.run(command, cwd=root, capture_output=True).returncode, 0)


if __name__ == '__main__':
    unittest.main()
