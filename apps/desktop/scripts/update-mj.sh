#!/bin/bash
# Build Superset MJ and update the installed app: quit it, swap the bundle in
# /Applications, relaunch. Terminals and agent sessions live in the pty-daemon,
# so they survive the restart like an auto-update.
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
open "$DEST"
echo "Updated $DEST$([ -d "$OLD" ] && echo " (previous: $OLD)")"
