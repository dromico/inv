#!/bin/bash
# Build verification script

# Clean up node_modules and package-lock.json to ensure a fresh start
echo "Cleaning up existing node_modules..."
rm -rf node_modules
rm -f package-lock.json

# Install dependencies with --legacy-peer-deps
echo "Installing dependencies with --legacy-peer-deps..."
npm install --legacy-peer-deps

# Run the build
echo "Running build..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
  echo "Build successful! You can now deploy to Vercel."
  exit 0
else
  echo "Build failed. Please check the error messages above."
  exit 1
fi
