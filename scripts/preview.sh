#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Codespaces features apply only after a rebuild. Try to install Python
# automatically if this running container has not picked up the feature yet.
if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 is missing. Trying to install it in this Codespace..."
  if command -v sudo >/dev/null 2>&1 && command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update
    sudo apt-get install -y python3
  elif [ "$(id -u)" -eq 0 ] && command -v apt-get >/dev/null 2>&1; then
    apt-get update
    apt-get install -y python3
  else
    echo "Could not install Python automatically."
    echo "In Codespaces, open the Command Palette (Ctrl+Shift+P), run 'Codespaces: Rebuild Container', then rerun this script."
    echo "Alternatively, install Python 3 in the container and retry."
    exit 127
  fi
fi

echo "Starting POOPBOT preview on port 8000."
echo "In Codespaces, open the Ports tab, open port 8000 in the browser, and use its HTTPS URL in Quest Browser."
exec python3 -m http.server 8000 --bind 0.0.0.0
