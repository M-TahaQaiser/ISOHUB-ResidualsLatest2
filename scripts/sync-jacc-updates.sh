#!/bin/bash
# JACC Update Sync Script
# This script helps identify and sync updates from the JACC repository

JACC_REPO="https://github.com/jerkean2139/jacc_finale_2.git"
TEMP_DIR="/tmp/jacc-sync"

echo "🔄 JACC Update Sync Tool"
echo "========================"

# Clean up any previous temp directory
rm -rf "$TEMP_DIR"

# Clone JACC repo to temp directory
echo "📥 Fetching latest JACC code..."
git clone --depth 1 "$JACC_REPO" "$TEMP_DIR" 2>/dev/null

if [ ! -d "$TEMP_DIR" ]; then
    echo "❌ Failed to clone JACC repository"
    exit 1
fi

echo ""
echo "📋 JACC Files Available for Sync:"
echo "=================================="

# List key JACC files that might need syncing
echo ""
echo "🤖 AI Services:"
ls -la "$TEMP_DIR/server/services/ai/" 2>/dev/null | grep -v "^total" | grep -v "^d"

echo ""
echo "🎨 AI Components:"
ls -la "$TEMP_DIR/client/src/components/ai/" 2>/dev/null | grep -v "^total" | grep -v "^d"

echo ""
echo "📡 AI Routes:"
ls -la "$TEMP_DIR/server/routes/" 2>/dev/null | grep -i "ai\|document\|faq" | grep -v "^total"

echo ""
echo "=================================="
echo "📝 To sync a specific file, run:"
echo "   cp $TEMP_DIR/path/to/file ./path/to/file"
echo ""
echo "🔍 To compare files, run:"
echo "   diff -u ./path/to/file $TEMP_DIR/path/to/file"
echo ""
echo "💡 Temp JACC clone available at: $TEMP_DIR"
echo "   (Will be cleaned up on next run)"
