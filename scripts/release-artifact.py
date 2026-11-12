#!/usr/bin/env python3
"""Bind the SSR image and Hosting files to one verified Astro build."""
import argparse
import hashlib
import json
from pathlib import Path


def inventory(root):
    files = {}
    for name in ("dist", "public"):
        directory = root / name
        if not directory.is_dir():
            raise ValueError(f"Missing {name} directory")
        for path in sorted(directory.rglob("*")):
            if path.is_symlink():
                raise ValueError(f"Symlink is not a release input: {path}")
            if path.is_file():
                files[path.relative_to(root).as_posix()] = hashlib.sha256(path.read_bytes()).hexdigest()
    if "dist/server/entry.mjs" not in files or not any(p.startswith("dist/client/") for p in files):
        raise ValueError("Incomplete Astro server/client artifact")
    return files


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("create", "verify"))
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--revision", required=True)
    args = parser.parse_args()
    manifest = args.root / "release-manifest.json"
    expected = {"version": 1, "revision": args.revision, "files": inventory(args.root)}
    if args.action == "create":
        manifest.write_text(json.dumps(expected, indent=2) + "\n")
    elif json.loads(manifest.read_text()) != expected:
        raise ValueError("Release artifact differs from the verified build or revision")
    print(f"{args.action}: {len(expected['files'])} release files verified")


if __name__ == "__main__":
    main()
