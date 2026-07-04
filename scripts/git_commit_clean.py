#!/usr/bin/env python3
"""Create a git commit without Co-authored-by trailers (plain gulce-celik attribution)."""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GIT = r"C:\Program Files\Git\cmd\git.exe"

AUTHOR = {
    "GIT_AUTHOR_NAME": "gulce-celik",
    "GIT_AUTHOR_EMAIL": "gulcecelik.contact@gmail.com",
    "GIT_COMMITTER_NAME": "gulce-celik",
    "GIT_COMMITTER_EMAIL": "gulcecelik.contact@gmail.com",
}


def run(*args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    env = os.environ.copy()
    env.update(AUTHOR)
    return subprocess.run(
        [GIT, *args],
        cwd=ROOT,
        env=env,
        text=True,
        capture_output=True,
        check=check,
    )


def main() -> int:
    if len(sys.argv) < 2:
        print('Usage: python scripts/git_commit_clean.py "commit message"', file=sys.stderr)
        print('       python scripts/git_commit_clean.py --rewrite-head "commit message"', file=sys.stderr)
        return 1

    rewrite = sys.argv[1] == "--rewrite-head"
    message = sys.argv[2 if rewrite else 1]

    if rewrite:
        parent = run("rev-parse", "HEAD^").stdout.strip()
        tree = run("rev-parse", "HEAD^{tree}").stdout.strip()
    else:
        parent = run("rev-parse", "HEAD").stdout.strip()
        tree = run("write-tree").stdout.strip()
    new_sha = run("commit-tree", tree, "-p", parent, "-m", message).stdout.strip()

    if not new_sha or len(new_sha) != 40:
        print(new_sha or "commit-tree failed", file=sys.stderr)
        return 1

    run("reset", "--hard", new_sha)
    print(new_sha)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
