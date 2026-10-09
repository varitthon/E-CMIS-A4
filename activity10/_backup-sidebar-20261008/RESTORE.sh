#!/usr/bin/env bash
# Roll back the sidebar rebuild: restores every page + shared asset to the 2026-10-08 pre-rebuild state.
set -e
cd "$(dirname "$0")/.."
cp _backup-sidebar-20261008/*.html .
cp _backup-sidebar-20261008/assets/* assets/
rm -f assets/ecmis-sidebar.js assets/ecmis-sidebar.css
echo "Restored pre-rebuild sidebar."
