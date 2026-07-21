#!/usr/bin/env bash
# Builds the editor (gulp) and the content site (Astro), then merges both into
# deploy/ as the complete behaviortrees.com static site:
#
#   /            -> editor app (gulp build output)
#   /learn/      -> content site (Astro output)
#   /robots.txt, /sitemap*.xml
#
# Upload the deploy/ directory to your static host.
#
# Requirements: Node >= 16 for gulp (see "overrides" in package.json),
# Node >= 20 for Astro. If you use nvm, this script picks versions itself.

set -euo pipefail
cd "$(dirname "$0")"

NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

pick_node() {
    # pick_node <min_major> <max_major> — newest installed nvm node within range
    local min="$1" max="$2"
    { ls -1 "$NVM_DIR/versions/node" 2>/dev/null || true; } \
        | sed 's/^v//' | sort -t. -k1,1n -k2,2n -k3,3n \
        | awk -F. -v lo="$min" -v hi="$max" '$1 >= lo && $1 <= hi' | tail -1
}

run_with_node() {
    local min="$1" max="$2"; shift 2
    local version
    version="$(pick_node "$min" "$max")"
    if [ -n "$version" ]; then
        PATH="$NVM_DIR/versions/node/v$version/bin:$PATH" "$@"
    else
        "$@"
    fi
}

# gulp 3 toolchain: works on Node 14-16 (with the graceful-fs override in
# package.json), breaks on Node >= 18 era removals (util.isRegExp etc).
echo "==> Building editor (gulp)"
[ -d node_modules ] || run_with_node 14 16 npm install --ignore-scripts --no-audit --no-fund
[ -d bower_components ] || run_with_node 14 16 npx bower install --config.interactive=false
run_with_node 14 16 ./node_modules/.bin/gulp build

echo "==> Building content site (Astro)"
[ -d site/node_modules ] || (cd site && run_with_node 20 99 npm install --no-audit --no-fund)
(cd site && run_with_node 20 99 npm run build)

echo "==> Assembling deploy/"
rm -rf deploy
mkdir -p deploy
cp -R build/. deploy/
cp -R site/dist/. deploy/
rm -f deploy/package.json deploy/desktop.js

echo "==> Done. Contents of deploy/:"
ls deploy
echo
echo "Upload deploy/ to your static host."
