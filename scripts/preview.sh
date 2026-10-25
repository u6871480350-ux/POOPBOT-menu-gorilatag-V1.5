#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo "Starting POOPBOT preview on port 8000."
echo "In Codespaces, open the Ports tab, open port 8000 in the browser, and use its HTTPS URL in Quest Browser."
exec python3 -m http.server 8000 --bind 0.0.0.0
