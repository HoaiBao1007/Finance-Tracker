#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="${1:-$(pwd)}"
SOURCE_DIR="$ROOT_DIR/frontend"
OUTPUT_DIR="${2:-$ROOT_DIR/.deploy/frontend-railway}"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "Frontend source directory not found: $SOURCE_DIR" >&2
  exit 1
fi

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

copy_item() {
  local relative_path="$1"

  if [ ! -e "$SOURCE_DIR/$relative_path" ]; then
    return
  fi

  mkdir -p "$(dirname "$OUTPUT_DIR/$relative_path")"
  cp -R "$SOURCE_DIR/$relative_path" "$OUTPUT_DIR/$relative_path"
  echo "Copied $relative_path"
}

FILES_TO_COPY=(
  ".dockerignore"
  ".gitignore"
  "Dockerfile"
  "next-env.d.ts"
  "next.config.mjs"
  "package-lock.json"
  "package.json"
  "postcss.config.mjs"
  "railway.json"
  "tailwind.config.ts"
  "tsconfig.json"
  "src"
  "public"
)

for relative_path in "${FILES_TO_COPY[@]}"; do
  copy_item "$relative_path"
done

echo "Frontend Railway bundle ready at $OUTPUT_DIR"