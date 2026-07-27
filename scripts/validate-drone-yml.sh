#!/usr/bin/env bash

set -euo pipefail

drone_yml="${DRONE_YML:-.drone.yml}"

node scripts/validate-drone-config.mjs "$drone_yml"

if [[ "${DRONE_SKIP_LINT:-0}" == "1" ]]; then
  exit 0
fi

if ! command -v drone >/dev/null 2>&1; then
  echo "ERROR: drone CLI is required for Drone schema validation" >&2
  exit 1
fi

drone lint "$drone_yml"
