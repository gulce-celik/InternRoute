#!/usr/bin/env python3
"""Run backend and frontend test suites."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def run_backend() -> int:
    script = ROOT / "scripts" / "run-backend-tests.py"
    return subprocess.run([sys.executable, str(script)], check=False).returncode


def run_frontend() -> int:
    script = ROOT / "scripts" / "run-frontend-tests.py"
    return subprocess.run([sys.executable, str(script)], check=False).returncode


def main() -> int:
    backend_code = run_backend()
    frontend_code = run_frontend()

    if backend_code != 0:
        return backend_code
    return frontend_code


if __name__ == "__main__":
    raise SystemExit(main())
