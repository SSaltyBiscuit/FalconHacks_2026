#!/usr/bin/env bash
set -euo pipefail

APP_NAME="falconhacks"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$APP_DIR"

echo "==> Deploying $APP_NAME in $APP_DIR"

if [[ -d .git ]]; then
  echo "==> Pulling latest code"
  git pull --ff-only
fi

echo "==> Installing dependencies"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

echo "==> Building frontend"
npm run build

echo "==> Starting or reloading PM2 app"
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --only "$APP_NAME" --update-env
else
  pm2 start ecosystem.config.cjs --only "$APP_NAME" --env production
fi

pm2 save

echo "==> Health check"
if curl -fsS "http://127.0.0.1:3000/api/health" >/dev/null; then
  echo "==> App is healthy on :3000"
else
  echo "!! Health check failed on :3000"
  pm2 logs "$APP_NAME" --lines 80
  exit 1
fi

echo "==> Testing and reloading nginx"
sudo nginx -t
sudo systemctl reload nginx

echo "==> Deploy complete"
