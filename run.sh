#!/usr/bin/env bash

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPTS_DIR="$ROOT_DIR/scripts"

PLATFORM=""
ACTION=""
DO_CLEAN=false

show_help() {
cat <<EOF
Usage: ./run [platform] [action]

Platforms:
  -i    iOS
  -a    Android
  -w    Web

Actions:
  -d     Develop
  -x     Deploy
  -c     Clean (only clean)
  -cd    Clean + Develop
  -cx    Clean + Deploy

Special:
  mock    Run mock server

Defaults:
  ./run        ⇒ web develop
  platform     ⇒ web
  action       ⇒ develop
  clean        ⇒ off by default

Examples:
  ./run -c         # web clean
  ./run -i         # ios develop
  ./run -i -c      # ios clean
  ./run -i -cd     # ios clean + develop
  ./run -w -x      # web deploy
  ./run mock       # run mock server
EOF
}

# -----------------------------
# SPECIAL CASE: mock
# -----------------------------
if [[ "$1" == "mock" ]]; then
  echo "🟦 Starting Mock Server..."
  node "$ROOT_DIR/mock-server/mock-server.js"
  exit 0
fi

# -----------------------------
# PARSE ARGS
# -----------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    # platform
    -i) PLATFORM="ios" ;;
    -a) PLATFORM="android" ;;
    -w) PLATFORM="web" ;;

    # actions
    -d) ACTION="develop" ;;
    -x) ACTION="deploy" ;;
    -c)
      ACTION="clean"
      DO_CLEAN=true
      ;;

    -cd)
      ACTION="develop"
      DO_CLEAN=true
      ;;
    -cx)
      ACTION="deploy"
      DO_CLEAN=true
      ;;

    -h|--help) show_help; exit 0 ;;
    *)
      EXTRA_ARGS+=("$1")
      ;;
  esac
  shift
done

# -----------------------------
# DEFAULTS
# -----------------------------
[[ -z "$PLATFORM" ]] && PLATFORM="web"
[[ -z "$ACTION" ]] && ACTION="develop"

# -----------------------------
# EXECUTE CLEAN
# -----------------------------
if [[ "$DO_CLEAN" == true ]]; then
  CLEAN_SCRIPT="$SCRIPTS_DIR/$PLATFORM/clean-install.sh"
  echo "🧹 Cleaning ($PLATFORM)..."
  chmod +x "$CLEAN_SCRIPT"
  "$CLEAN_SCRIPT"
fi

# -----------------------------
# CLEAN-ONLY MODE
# -----------------------------
if [[ "$ACTION" == "clean" ]]; then
  exit 0
fi

# -----------------------------
# ACTION SCRIPT
# -----------------------------
case "$ACTION" in
  develop)
    ACTION_SCRIPT="$SCRIPTS_DIR/$PLATFORM/develop.sh"
    ;;
  deploy)
    ACTION_SCRIPT="$SCRIPTS_DIR/$PLATFORM/deploy-standalone.sh"
    ;;
  *)
    echo "❌ Unknown action: $ACTION"
    exit 1
    ;;
esac

echo "🚀 Running: $ACTION_SCRIPT"
chmod +x "$ACTION_SCRIPT"
"$ACTION_SCRIPT" "${EXTRA_ARGS[@]}"
