#!/bin/bash

# Reset all user data for testing
# This script clears:
# 1. SQLite database (server/data/sanctuary.db)
# 2. Uploaded files (server/uploads/)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=== Together App Data Reset Script ==="
echo ""

# Confirm before proceeding
read -p "This will DELETE all user data. Are you sure? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Resetting data..."

# 1. Remove SQLite database
DB_PATH="$PROJECT_ROOT/server/data/sanctuary.db"
if [ -f "$DB_PATH" ]; then
    rm "$DB_PATH"
    echo "✓ Removed database: $DB_PATH"
else
    echo "- Database not found (already clean)"
fi

# 2. Clear uploads directory
UPLOADS_PATH="$PROJECT_ROOT/server/uploads"
if [ -d "$UPLOADS_PATH" ]; then
    rm -rf "$UPLOADS_PATH"/*
    echo "✓ Cleared uploads: $UPLOADS_PATH"
else
    echo "- Uploads directory not found"
fi

echo ""
echo "=== Reset Complete ==="
echo ""
echo "Note: Clear browser localStorage to fully reset client state:"
echo "  - Open DevTools (F12)"
echo "  - Go to Application > Local Storage"
echo "  - Delete 'auth_token'"
echo ""
echo "Or run this in browser console:"
echo "  localStorage.removeItem('auth_token'); location.reload();"
echo ""
