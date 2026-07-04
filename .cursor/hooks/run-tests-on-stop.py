#!/usr/bin/env python3
"""Cursor stop hook: quick test reminder when suites fail."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "run-all-tests.py"


def main() -> None:
    if not SCRIPT.exists():
        print("{}")
        return

    result = subprocess.run(
        [sys.executable, str(SCRIPT)],
        capture_output=True,
        text=True,
        check=False,
    )

    if result.returncode == 0:
        print("{}")
        return

    output = ((result.stdout or "") + (result.stderr or "")).strip()
    message = (
        "InternRoute test suite did not pass at session end. "
        "Fix failing tests before committing.\n\n"
        f"{output[-3000:]}"
    )
    print(json.dumps({"followup_message": message}))


if __name__ == "__main__":
    main()
