#!/usr/bin/env bash
# Runs every browser test. Start a server first:  python3 -m http.server 8765
set -e
cd "$(dirname "$0")/.."
for t in e2e_sound e2e_trace e2e_flows e2e_layout; do echo "=== $t"; python3 -u tests/$t.py | grep -v '^ok' ; done
