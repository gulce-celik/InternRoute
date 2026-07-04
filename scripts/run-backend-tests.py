#!/usr/bin/env python3
"""Run backend pytest suite from any working directory."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
VENV_PYTHON = BACKEND / ".venv" / "Scripts" / "python.exe"
PYTHON = VENV_PYTHON if VENV_PYTHON.exists() else sys.executable


def main() -> int:
    cmd = [str(PYTHON), "-m", "pytest", "tests", "-q", "--tb=short", *sys.argv[1:]]
    result = subprocess.run(cmd, cwd=BACKEND, check=False)
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
