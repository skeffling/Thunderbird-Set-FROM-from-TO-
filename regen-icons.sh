#!/usr/bin/env bash
# Regenerate the PNG icons from the source icon.svg.
# icon.svg is a dev-only source file and is NOT shipped in the XPI (see build.sh).
set -euo pipefail
cd "$(dirname "$0")"

for size in 48 64 128; do
  magick -background none -density 384 icon.svg -resize "${size}x${size}" "icon-${size}.png"
  echo "wrote icon-${size}.png"
done
