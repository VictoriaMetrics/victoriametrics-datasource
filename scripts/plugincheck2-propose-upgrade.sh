#!/usr/bin/env bash
# Opens or refreshes the pull request that bumps the Grafana plugin validator
# to its latest release. Meant for CI: git must be configured to sign commits
# and GH_TOKEN must allow pushing the upgrade branch and managing pull requests.
set -euo pipefail

cd "$(dirname "$0")/.."

branch=plugin-validator-update

pinned_version() {
  sed -n 's/^PLUGINCHECK2_VERSION = //p'
}

make plugincheck2-update
if git diff --quiet Makefile; then
  exit 0
fi
version="$(pinned_version < Makefile)"

# The upgrade branch on origin survives a pull request closed without merging
# and disappears only on merge, so a version it already pins was proposed before.
if git fetch --quiet origin "$branch" 2>/dev/null &&
   [ "$(git show FETCH_HEAD:Makefile | pinned_version)" = "$version" ]; then
  echo "plugincheck2 ${version} was already proposed, nothing to do"
  exit 0
fi

title="Automatic chore(deps): bump Grafana plugin validator to ${version}"
body="Bumps plugincheck2 to ${version}, see https://github.com/grafana/plugin-validator/releases/tag/plugin-validator%2F${version}"

git checkout -b "$branch"
git commit -m "$title" -- Makefile
git push --force origin "$branch"

# An upgrade pull request left open is refreshed instead of duplicated.
open_pr="$(gh pr list --head "$branch" --state open --json number --jq '.[0].number // empty')"
if [ -n "$open_pr" ]; then
  gh pr edit "$open_pr" --title "$title" --body "$body"
else
  gh pr create --head "$branch" --title "$title" --body "$body"
fi
