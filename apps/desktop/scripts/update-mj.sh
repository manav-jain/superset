#!/bin/bash
# Build Superset MJ and update the installed app: quit it, swap the bundle in
# /Applications, relaunch, then hand the running terminals to a pty-daemon from
# the new build. Shells and agent sessions keep running throughout.
#   bun run update:mj              build, then install
#   bun run update:mj --no-build   install the last build
#   bun run package:mj             build only
set -euo pipefail
cd "$(dirname "$0")/.."
APP_NAME="Superset MJ"
OUT="release-next"
BUILD="$OUT/mac-arm64/$APP_NAME.app"
DEST="/Applications/$APP_NAME.app"
LOG="$HOME/.superset-mj/update-mj.log"

if [ "${1:-}" != "--no-build" ] && [ "${1:-}" != "--install" ]; then
  # Rebuilding a bundle under a running process changes its code signature:
  # macOS then re-prompts for every privacy grant. Never build into a bundle
  # that something still runs from (release/ is where ad-hoc test runs live).
  if pgrep -f "$PWD/$OUT/" >/dev/null; then
    echo "a process still runs from $OUT/; quit it before building" >&2
    exit 1
  fi
  SUPERSET_WORKSPACE_NAME=mj DESKTOP_NOTIFICATIONS_PORT=51761 bun run compile:app
  bun run package -- --config electron-builder.mj.ts --publish never \
    -c.directories.output="$OUT"
fi
[ "${1:-}" = "--build-only" ] && exit 0
[ -d "$BUILD" ] || { echo "no build at $BUILD" >&2; exit 1; }

# The install and the terminal handoff must finish even when the caller dies
# (a closed terminal, a tool timeout): skipping the handoff leaves every
# session on the old build's daemon. Run them detached.
if [ "${1:-}" != "--install" ]; then
  nohup "$0" --install </dev/null >"$LOG" 2>&1 &
  echo "Installing in the background (pid $!). Follow it with: tail -f $LOG"
  exit 0
fi

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
# Key on the daemon manifest: the host's own manifest.json does not exist until
# the relaunched app has started its host, so globbing for it races the launch.
HANDED_OFF=0
for daemon_manifest in "$HOME/.superset-mj/host"/*/pty-daemon-manifest.json; do
  [ -f "$daemon_manifest" ] || continue
  manifest="$(dirname "$daemon_manifest")/manifest.json"
  for _ in $(seq 1 120); do
    [ -f "$manifest" ] && [ "$(jq -r '.startedAt // 0' "$manifest" 2>/dev/null || echo 0)" -ge "$LAUNCHED_AT" ] \
      && curl -s -o /dev/null "$(jq -r .endpoint "$manifest")" && break
    sleep 1
  done
  ENDPOINT=$(jq -r .endpoint "$manifest")
  AUTH="Authorization: Bearer $(jq -r .authToken "$manifest")"
  RESULT=$(curl -s -X POST -H "$AUTH" -H "Content-Type: application/json" -d '{}' \
    "$ENDPOINT/trpc/terminal.daemon.update" | jq -c '.result.data.json // .error.json.message')
  echo "Terminal daemon handoff ($(basename "$(dirname "$manifest")")): $RESULT"
  HANDED_OFF=1
done
[ "$HANDED_OFF" = 1 ] || echo "No terminal daemon to hand off"
