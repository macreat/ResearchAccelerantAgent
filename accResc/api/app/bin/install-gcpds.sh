#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="/usr/local/bin/gcpds"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo ${SCRIPT_DIR}/install-gcpds.sh" >&2
  exit 1
fi

chmod +x "${SCRIPT_DIR}/gcpds"
ln -sf "${SCRIPT_DIR}/gcpds" "${TARGET}"
echo "Installed ${TARGET}"
echo "Run: gcpds agent start"
