#!/bin/bash
# Exit immediately if a command exits with a non-zero status.
set -e

echo "--- PRE-BUILD ---"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Installing pnpm..."
npm install -g pnpm@8
echo "PNPM version: $(pnpm -v)"

echo "--- BUILD ---"
echo "Installing dependencies..."
pnpm install --frozen-lockfile

echo "Listing package.json scripts:"
cat package.json | grep -A 15 '"scripts"'

echo "Building application..."
NODE_ENV=production pnpm run build

echo "--- POST-BUILD ---"
echo "Build completed successfully"