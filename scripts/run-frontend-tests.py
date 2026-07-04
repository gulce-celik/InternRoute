#!/usr/bin/env python3
"""Run frontend Vitest suite via npm (ensures correct Node on Windows)."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / "frontend"


def resolve_npm() -> list[str]:
    """Return npm command argv that works in minimal PATH (e.g. Cursor hooks)."""
    if sys.platform == "win32":
        candidates = [
            Path(os.environ.get("ProgramFiles", r"C:\Program Files")) / "nodejs" / "npm.cmd",
            Path(r"C:\Program Files\nodejs\npm.cmd"),
        ]
        for candidate in candidates:
            if candidate.exists():
                return [str(candidate), "test"]
        return ["npm.cmd", "test"]

    return ["npm", "test"]


def main() -> int:
    package_json = FRONTEND / "package.json"
    if not package_json.exists():
        print("Frontend tests skipped: frontend/package.json not found.", file=sys.stderr)
        return 0

    node_modules = FRONTEND / "node_modules"
    if not node_modules.exists():
        print("Frontend tests skipped: run `npm install` in frontend/ first.", file=sys.stderr)
        return 0

    env = os.environ.copy()
    if sys.platform == "win32":
        node_dir = Path(os.environ.get("ProgramFiles", r"C:\Program Files")) / "nodejs"
        if node_dir.exists():
            env["PATH"] = f"{node_dir};{env.get('PATH', '')}"

    result = subprocess.run(
        resolve_npm(),
        cwd=FRONTEND,
        env=env,
        check=False,
    )
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
