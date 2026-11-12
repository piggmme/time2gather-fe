#!/bin/sh
set -eu

# Retain the installed Noto versions and fontconfig rules, while avoiding the
# thousands of unused font variants loaded on the first Pango text render.
# The share card contains application copy and formatted dates, never user text.
# Coverage: Latin/Cyrillic, Arabic/Urdu, Devanagari, Bengali, Telugu, Thai and CJK.
# Math is also an existing fontconfig fallback used by the Arabic/Urdu cards.
font_dir=/usr/share/fonts/noto
share_font_dir=$(mktemp -d)
trap 'rm -rf "$share_font_dir"' EXIT
for family in NotoSans NotoSansArabic NotoNaskhArabic NotoSansDevanagari NotoSansBengali NotoSansTelugu NotoSansThai NotoSansCJK; do
  for weight in Regular Bold; do
    cp "$font_dir/$family-$weight".* "$share_font_dir/"
  done
done
cp "$font_dir/NotoSansMath-Regular.ttf" "$font_dir/NotoColorEmoji.ttf" "$share_font_dir/"
# These paths belong to the image being built, not a mounted application volume.
rm -rf "$font_dir"
mkdir -p "$font_dir"
cp "$share_font_dir/"* "$font_dir/"
rm -f /var/cache/fontconfig/*cache-*
fc-cache -f
