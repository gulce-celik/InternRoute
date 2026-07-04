#!/usr/bin/env python3
"""
Cursor postToolUse hook: run targeted tests after backend/frontend source edits.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"
VENV_PYTHON = BACKEND / ".venv" / "Scripts" / "python.exe"
PYTHON = str(VENV_PYTHON if VENV_PYTHON.exists() else sys.executable)

BACKEND_PATTERN = re.compile(r"(^|[\\/])backend[\\/](app|tests)[\\/]", re.I)
FRONTEND_PATTERN = re.compile(r"(^|[\\/])frontend[\\/]src[\\/]", re.I)
SKIP_FRONTEND = re.compile(r"\.(css|test\.tsx?)$", re.I)


def extract_paths(payload: dict) -> list[str]:
    paths: list[str] = []
    tool_input = payload.get("tool_input") or payload.get("input") or {}

    for key in ("path", "file_path", "target_notebook"):
        value = tool_input.get(key) or payload.get(key)
        if isinstance(value, str):
            paths.append(value.replace("\\", "/"))

    for key in ("old_string", "new_string"):
        # StrReplace only — path is the anchor
        pass

    return paths


def run_backend_tests() -> tuple[int, str]:
    result = subprocess.run(
        [PYTHON, "-m", "pytest", "tests", "-q", "--tb=line"],
        cwd=BACKEND,
        capture_output=True,
        text=True,
        check=False,
    )
    output = (result.stdout or "") + (result.stderr or "")
    return result.returncode, output.strip()


def run_frontend_tests() -> tuple[int, str]:
    script = ROOT / "scripts" / "run-frontend-tests.py"
    if not script.exists():
        return 0, "Frontend tests skipped (runner script missing)."

    result = subprocess.run(
        [sys.executable, str(script)],
        capture_output=True,
        text=True,
        check=False,
    )
    output = (result.stdout or "") + (result.stderr or "")
    return result.returncode, output.strip()


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        print("{}")
        return

    paths = extract_paths(payload)
    if not paths:
        print("{}")
        return

    normalized = " ".join(paths)
    run_backend = bool(BACKEND_PATTERN.search(normalized))
    run_frontend = any(
        FRONTEND_PATTERN.search(path) and not SKIP_FRONTEND.search(path) for path in paths
    )

    if not run_backend and not run_frontend:
        print("{}")
        return

    messages: list[str] = []
    failed = False

    if run_backend:
        code, output = run_backend_tests()
        if code != 0:
            failed = True
            messages.append(f"Backend tests FAILED:\n{output[-4000:]}")
        else:
            messages.append("Backend tests passed.")

    if run_frontend:
        code, output = run_frontend_tests()
        if code != 0:
            failed = True
            messages.append(f"Frontend tests FAILED:\n{output[-4000:]}")
        else:
            messages.append("Frontend tests passed.")

    if failed:
        print(json.dumps({"additional_context": "\n\n".join(messages)}))
    else:
        print("{}")


if __name__ == "__main__":
    main()
