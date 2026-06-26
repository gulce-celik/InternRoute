#!/bin/bash
# Commit without Co-authored-by trailer (use from Git Bash)
set -e
cd "$(dirname "$0")/.."
export GIT_AUTHOR_NAME="gulce-celik"
export GIT_AUTHOR_EMAIL="gulcecelik.contact@gmail.com"
export GIT_COMMITTER_NAME="gulce-celik"
export GIT_COMMITTER_EMAIL="gulcecelik.contact@gmail.com"
MSG="${1:?Usage: git-commit-clean.sh \"commit message\"}"
PARENT=$(git rev-parse HEAD)
TREE=$(git write-tree)
NEW=$(git commit-tree "$TREE" -p "$PARENT" -m "$MSG")
git reset --hard "$NEW"
