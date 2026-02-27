#!/bin/bash
while IFS= read -r line; do
  [[ -z "$line" || "$line" =~ ^# ]] && continue
  filepath=$(echo "$line" | awk '{print $1}')
  url=$(echo "$line" | awk '{print $2}')
  mkdir -p "$(dirname "$filepath")"
  curl -L "$url" -o "$filepath"
done < manifest-assets.txt
