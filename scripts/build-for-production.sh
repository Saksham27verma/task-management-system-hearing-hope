#!/bin/bash

# Exit on error
set -e

echo "========================================"
echo "Task Management System Production Build"
echo "========================================"

# Install dependencies if needed
echo "Checking for node_modules..."
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
else
  echo "Dependencies already installed"
fi

# Clean tasks from the database
echo -e "\n========================================"
echo "Cleaning tasks from database..."
echo "========================================"
node scripts/clean-tasks.js

# Ensure environment variables are set for production
echo -e "\n========================================"
echo "Checking production environment variables..."
echo "========================================"
if [ -f ".env.production" ]; then
  echo "Production environment file found"
else
  echo "WARNING: No .env.production file found. Using .env.local."
  if [ -f ".env.local" ]; then
    cp .env.local .env.production
    echo "Created .env.production from .env.local"
  else
    echo "ERROR: No .env.local file found. Cannot continue."
    exit 1
  fi
fi

# Build the production version
echo -e "\n========================================"
echo "Building for production..."
echo "========================================"
npm run build

echo -e "\n========================================"
echo "Build completed successfully!"
echo "========================================"
echo "The project is now ready for deployment."
echo "All tasks have been removed from the database." 