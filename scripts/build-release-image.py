#!/usr/bin/env python3
"""Build once from verified dist, collect cache timings, and publish its digest."""
import argparse
import json
import os
import re
from pathlib import Path
import subprocess
import sys
import time


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", required=True)
    parser.add_argument("--cache", required=True)
    parser.add_argument("--revision", required=True)
    args = parser.parse_args()
    if "@" in args.image or ":" not in args.image.rsplit("/", 1)[-1]:
        parser.error("--image must be a versioned image tag")
    if args.cache == args.image:
        parser.error("Cache and release image must have different refs")
    subprocess.run([sys.executable, "scripts/release-artifact.py", "verify", "--revision", args.revision], check=True)
    started = time.monotonic()
    command = ["docker", "buildx", "build", "--platform=linux/amd64", "--target=prebuilt",
               "--tag", args.image, "--tag", args.cache, "--cache-from", f"type=registry,ref={args.cache}",
               "--cache-to", "type=inline",
               "--metadata-file", "image-metadata.json", "--progress=plain", "--push", "."]
    # Includes cache import, image push and cache export in elapsed time.
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    cached = 0
    with Path("image-build.log").open("w") as log:
        for line in process.stdout:
            print(line, end="", flush=True)
            log.write(line)
            if " CACHED" in line:
                cached += 1
    result = process.wait()
    if result == 0:
        # Stop a release if any other process replaced dist during the build.
        result = subprocess.run([sys.executable, "scripts/release-artifact.py", "verify",
                                 "--revision", args.revision]).returncode
    metrics = {"revision": args.revision, "elapsedSeconds": round(time.monotonic() - started, 2),
               "cachedSteps": cached, "cache": args.cache, "cacheBackend": "inline", "exitCode": result}
    if result == 0:
        digest = json.loads(Path("image-metadata.json").read_text())["containerimage.digest"]
        if not re.fullmatch(r"sha256:[a-f0-9]{64}", digest):
            raise ValueError("Build did not return an immutable image digest")
        metrics["image"] = args.image.rsplit(":", 1)[0] + "@" + digest
        if os.environ.get("GITHUB_OUTPUT"):
            with open(os.environ["GITHUB_OUTPUT"], "a") as output:
                output.write(f"image={metrics['image']}\n")
    Path("build-metrics.json").write_text(json.dumps(metrics, indent=2) + "\n")
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a") as summary:
            summary.write(f"Build: {metrics['elapsedSeconds']}s, {cached} cached steps, exit {result}. "
                          "Elapsed time includes cache transfer and image push.\n")
    raise SystemExit(result)


if __name__ == "__main__":
    main()
