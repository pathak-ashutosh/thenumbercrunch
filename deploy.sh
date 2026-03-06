#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# The Number Crunch — Hugo Deployment Script (Self-hosted VPS)
# ─────────────────────────────────────────────────────────────────────────────
# Run this on your VPS after uploading the project.
# Prerequisites: Hugo, Nginx (or Caddy), Git (optional)
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SITE_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$SITE_DIR/public"
# Edit this to your nginx webroot:
NGINX_ROOT="/var/www/thenumbercrunch.com/html"

echo "==> Building site with Hugo..."
hugo --minify --gc -s "$SITE_DIR"

echo "==> Deploying to $NGINX_ROOT..."
mkdir -p "$NGINX_ROOT"
rsync -av --delete "$BUILD_DIR/" "$NGINX_ROOT/"

echo "==> Done! Site deployed."
