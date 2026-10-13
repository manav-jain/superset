#!/bin/bash
# Build Superset MJ and update the installed app: quit it, swap the bundle in
# /Applications, relaunch, then hand the running terminals to a pty-daemon from
# the new build. Shells and agent sessions keep running throughout.
#   bun run update:mj              build, then install
#   bun run update:mj --no-build   install the last build
set -euo pipefail
cd "$(dirname "$0")/.."
APP_NAME="Superset MJ"
BUILD="release-next/mac-arm64/$APP_NAME.app"
DEST="/Applications/$APP_NAME.app"

if [ "${1:-}" != "--no-build" ]; then
  # Never into release/: an app launched from there would have its bundle
  # deleted under it.
  SUPERSET_WORKSPACE_NAME=mj DESKTOP_NOTIFICATIONS_PORT=51761 bun run compile:app
  CSC_IDENTITY_AUTO_DISCOVERY=false bun run package -- --config electron-builder.mj.ts \
    --publish never -c.directories.output=release-next
fi
[ -d "$BUILD" ] || { echo "no build at $BUILD" >&2; exit 1; }

# This script may run in one of the app's own terminals: the pty-daemon keeps
# it alive across the quit, but the hangup must not stop it.
trap '' HUP

if [ "$(osascript -e "application \"$APP_NAME\" is running")" = true ]; then
  echo "Quitting $APP_NAME (confirm the quit dialog if it asks)…"
  osascript -e "tell application \"$APP_NAME\" to quit" >/dev/null 2>&1 || true
  for _ in $(seq 1 300); do
    [ "$(osascript -e "application \"$APP_NAME\" is running")" = true ] || break
    sleep 1
  done
  [ "$(osascript -e "application \"$APP_NAME\" is running")" = true ] && {
    echo "$APP_NAME is still running; nothing was replaced" >&2; exit 1; }
fi

STAGED="$DEST.new"
OLD="${TMPDIR:-/tmp}/$APP_NAME.previous.$(date +%Y%m%d-%H%M%S).app"
ditto "$BUILD" "$STAGED"
xattr -dr com.apple.quarantine "$STAGED" 2>/dev/null || true
[ -d "$DEST" ] && mv "$DEST" "$OLD"
mv "$STAGED" "$DEST"
LAUNCHED_AT=$(($(date +%s) * 1000))
open "$DEST"
echo "Updated $DEST$([ -d "$OLD" ] && echo " (previous: $OLD)")"

# Move the running terminals onto the new build. The pty-daemon outlives the
# app; asked to update, it hands its live PTYs to a successor started from its
# own path, which now holds the new bundle, so shells and agents keep running.
for manifest in "$HOME/.superset-mj/host"/*/manifest.json; do
  [ -f "$manifest" ] || continue
  for _ in $(seq 1 60); do
    [ "$(jq -r '.startedAt // 0' "$manifest")" -ge "$LAUNCHED_AT" ] && break
    sleep 1
  done
  ENDPOINT=$(jq -r .endpoint "$manifest")
  AUTH="Authorization: Bearer $(jq -r .authToken "$manifest")"
  RESULT=$(curl -s -X POST -H "$AUTH" -H "Content-Type: application/json" -d '{}' \
    "$ENDPOINT/trpc/terminal.daemon.update" | jq -c '.result.data.json // .error.json.message')
  echo "Terminal daemon handoff ($(basename "$(dirname "$manifest")")): $RESULT"
done
