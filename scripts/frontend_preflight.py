#!/usr/bin/env python3
"""Run the shared local/CI checks and require their exact Git tree before push."""
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import time

PLAN = 'scripts/frontend-checks.json'


def git(root, *args):
    return subprocess.check_output(['git', *args], cwd=root).decode().strip()


def validate_plan(root, plan):
    output = Path(plan.get('evidenceDirectory', '.preflight/evidence'))
    if output.is_absolute() or '..' in output.parts:
        raise ValueError('Evidence must stay inside the repository')
    files = set(plan.get('lintFiles', []) + plan.get('requiredFiles', []))
    for check in plan.get('checks', []):
        command = check.get('command', [])
        if not command or not all(isinstance(part, str) for part in command):
            raise ValueError('Each check needs an argument array')
        files.update(part for part in command if part.startswith('scripts/') and '*' not in part)
    for name in files:
        path = Path(name)
        if path.is_absolute() or '..' in path.parts or not (root / path).is_file():
            raise ValueError(f'Required file missing or outside repository: {name}')


def receipt_path(root, revision):
    common = Path(git(root, 'rev-parse', '--git-common-dir'))
    if not common.is_absolute():
        common = root / common
    tree = git(root, 'rev-parse', f'{revision}^{{tree}}')
    return common.resolve() / 'frontend-preflight' / f'{tree}.json'


def require_clean(root):
    if git(root, 'status', '--porcelain', '--untracked-files=all'):
        raise ValueError('Commit source changes before preflight; the working tree must be clean')


def verify_receipt(root, revision):
    require_clean(root)
    commit = git(root, 'rev-parse', f'{revision}^{{commit}}')
    if commit != git(root, 'rev-parse', 'HEAD'):
        raise ValueError('Check out the commit being pushed and run preflight there')
    path = receipt_path(root, commit)
    if not path.is_file():
        raise ValueError('No passing preflight for this source. Run: python3 scripts/frontend_preflight.py run')
    receipt = json.loads(path.read_text())
    if receipt.get('schema') != 1 or receipt.get('conclusion') != 'success' or receipt.get('tree') != git(root, 'rev-parse', 'HEAD^{tree}'):
        raise ValueError('Invalid preflight receipt; rerun the local checks')
    return receipt


def execute_checks(root, checks, env, logs):
    results = []
    logs.mkdir(parents=True, exist_ok=True)
    for index, check in enumerate(checks):
        label = check['name']
        command = check['command']
        if command[0] == 'pnpm':
            command = ['corepack', 'pnpm@10.23.0', *command[1:]]
        print(f'[{index + 1}/{len(checks)}] {label}', flush=True)
        log = logs / f'{index + 1:02d}.log'
        started = time.monotonic()
        with log.open('w') as stream:
            try:
                process = subprocess.Popen(command, cwd=root, env=env, stdout=stream, stderr=subprocess.STDOUT,
                                           start_new_session=True)
                result = process.wait(timeout=check.get('timeoutSeconds', 900))
            except subprocess.TimeoutExpired:
                os.killpg(process.pid, signal.SIGTERM)
                try:
                    process.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    os.killpg(process.pid, signal.SIGKILL)
                    process.wait()
                result = 124
        results.append({'name': label, 'command': command, 'exitCode': result,
                        'seconds': round(time.monotonic() - started, 2), 'log': str(log)})
        if result:
            print('\n'.join(log.read_text(errors='replace').splitlines()[-45:]), file=sys.stderr)
            raise ValueError(f'{label} failed ({result}). Fix the cause before pushing. Log: {log}')
    return results


def run(root, base=None):
    require_clean(root)
    plan = json.loads((root / PLAN).read_text())
    validate_plan(root, plan)
    configured_base = git(root, 'rev-parse', f'{plan["baseRevision"]}^{{commit}}')
    base = git(root, 'rev-parse', f'{base}^{{commit}}') if base else configured_base
    if base != configured_base:
        raise ValueError('Update baseRevision in frontend-checks.json so local and CI lint the same changes')
    tree = git(root, 'rev-parse', 'HEAD^{tree}')
    receipt = receipt_path(root, 'HEAD')
    receipt.unlink(missing_ok=True)
    node = subprocess.check_output(['node', '--version'], text=True).strip()
    if not node.startswith('v20.'):
        raise ValueError(f'Use Node.js 20, matching CI (current: {node})')
    changed = git(root, 'diff', '--name-only', '--diff-filter=ACMR', base, 'HEAD').splitlines()
    lint = sorted(set(plan['lintFiles']) | {name for name in changed if name.endswith(('.js', '.jsx', '.mjs', '.ts', '.tsx', '.astro'))})
    validate_plan(root, {'lintFiles': lint})
    checks = [
        {'name': 'Frozen dependencies (pnpm 10.23.0)', 'command': ['pnpm', 'install', '--frozen-lockfile']},
        {'name': 'ESLint (CI targets and changed source)', 'command': ['pnpm', 'exec', 'eslint', *lint]},
        *plan['checks'],
    ]
    env = {**os.environ, 'CI': 'true', 'FORCE_COLOR': '1', 'ASTRO_TELEMETRY_DISABLED': '1'}
    logs = root / '.preflight' / tree
    results = execute_checks(root, checks, env, logs)
    require_clean(root)
    if git(root, 'rev-parse', 'HEAD^{tree}') != tree:
        raise ValueError('Source changed during preflight; rerun the checks')
    data = {'schema': 1, 'conclusion': 'success', 'commit': git(root, 'rev-parse', 'HEAD'), 'tree': tree,
            'base': base, 'node': node, 'completedAtUTC': datetime.now(timezone.utc).isoformat(), 'checks': results}
    receipt.parent.mkdir(parents=True, exist_ok=True)
    receipt.write_text(json.dumps(data, indent=2) + '\n')
    print(f'Preflight passed for tree {tree}. Receipt: {receipt}', flush=True)


def hook(root):
    zero = '0' * 40
    for line in sys.stdin:
        local_ref, local_sha, remote_ref, remote_sha = line.split()
        if local_sha != zero:
            verify_receipt(root, local_sha)
            print(f'Preflight verified: {local_ref} -> {remote_ref}')


def install_hook(root):
    previous = git(root, 'config', '--get', 'core.hooksPath') if subprocess.run(
        ['git', 'config', '--get', 'core.hooksPath'], cwd=root, stdout=subprocess.DEVNULL).returncode == 0 else ''
    hooks = root / '.githooks'
    if previous and Path(previous).resolve() != hooks.resolve():
        raise ValueError(f'Existing hooksPath must be preserved and integrated: {previous}')
    default_hook = Path(git(root, 'rev-parse', '--git-path', 'hooks/pre-push'))
    if not default_hook.is_absolute():
        default_hook = root / default_hook
    if not previous and default_hook.exists():
        raise ValueError(f'Existing pre-push hook must be preserved and integrated: {default_hook}')
    subprocess.run(['git', 'config', 'core.hooksPath', str(hooks.resolve())], cwd=root, check=True)
    print(f'Installed pre-push verification for this repository and its worktrees: {hooks}')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['run', 'verify', 'hook', 'install-hook'])
    parser.add_argument('--root', type=Path, default=Path.cwd())
    parser.add_argument('--base')
    parser.add_argument('--revision', default='HEAD')
    args = parser.parse_args()
    root = args.root.resolve()
    try:
        if args.action == 'run':
            run(root, args.base)
        elif args.action == 'verify':
            verify_receipt(root, args.revision)
            print('Preflight receipt matches the source being pushed')
        elif args.action == 'hook':
            hook(root)
        else:
            install_hook(root)
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        print(f'Preflight blocked: {error}', file=sys.stderr)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
