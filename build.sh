#!/usr/bin/env bash
# Build the distributable XPI for "Set FROM: from TO:".
#
# Uses an explicit allowlist of the files that belong in the add-on, so dev-only
# files (icon.svg source, .claude/, .git/, README.md, this script, etc.) can
# never leak into the package. icon.svg is the SOURCE for the PNG icons and is
# intentionally excluded — regenerate the PNGs with regen-icons.sh if it changes.
set -euo pipefail
cd "$(dirname "$0")"

XPI="set-from-from-to.xpi"

# Files shipped in the add-on. Keep in sync with manifest.json.
FILES=(
  manifest.json
  background.js
  options.html
  options.js
  icon-48.png
  icon-64.png
  icon-128.png
  LICENSE
)

for f in "${FILES[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "error: missing file '$f'" >&2
    exit 1
  fi
done

rm -f "$XPI"
zip -X "$XPI" "${FILES[@]}"

echo ""
echo "Built $XPI:"
unzip -l "$XPI"
