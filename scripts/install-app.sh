#!/usr/bin/env bash
# Build Incrust.app and install it into /Applications.
#
# Usage:  ./scripts/install-app.sh        (or: npm run install:app)
#
# Uses electron-builder's --dir target (no DMG), which is much faster than a
# full `npm run dist`, then copies the signed .app bundle into /Applications
# (falls back to ~/Applications if /Applications isn't writable).
set -euo pipefail

cd "$(dirname "$0")/.."

APP_NAME="Incrust"

# 1. Dependencies (first run / after a clean).
if [ ! -d node_modules ]; then
  echo "▸ Installing npm dependencies…"
  npm install
fi

# 2. Build the .app bundle (afterPack.js re-signs it ad-hoc so it launches).
echo "▸ Building ${APP_NAME}.app…"
npx electron-builder --mac --dir

# 3. Locate the freshly built bundle (dist/mac-arm64 on Apple Silicon, dist/mac on Intel).
APP_PATH=$(ls -dt dist/mac*/"${APP_NAME}.app" 2>/dev/null | head -1)
if [ -z "${APP_PATH}" ]; then
  echo "✗ Build output not found (expected dist/mac*/${APP_NAME}.app)" >&2
  exit 1
fi

# 4. Pick the destination.
DEST_DIR="/Applications"
if [ ! -w "${DEST_DIR}" ]; then
  DEST_DIR="${HOME}/Applications"
  mkdir -p "${DEST_DIR}"
  echo "▸ /Applications not writable — installing to ${DEST_DIR} instead."
fi
DEST="${DEST_DIR}/${APP_NAME}.app"

# 5. Quit a running copy so the bundle can be replaced safely (best effort).
osascript -e "quit app \"${APP_NAME}\"" >/dev/null 2>&1 || true

# 6. Install (ditto preserves signatures, resource forks and permissions).
echo "▸ Installing to ${DEST}…"
rm -rf "${DEST}"
ditto "${APP_PATH}" "${DEST}"

echo "✓ ${APP_NAME} installed: ${DEST}"
echo "  Launch it from Spotlight or:  open \"${DEST}\""
