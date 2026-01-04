#!/bin/bash

# Bulk Import Helper Script for Tracers Organization
# This script helps you import processor data from CSV files

export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/isohub"
AGENCY_ID=1  # Tracers organization

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Bulk Data Import Helper - Tracers Organization        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Function to import a single file
import_file() {
    local file=$1
    local processor=$2
    local month=$3
    
    if [ ! -f "$file" ]; then
        echo "❌ File not found: $file"
        return 1
    fi
    
    echo "📊 Importing: $processor - $month"
    echo "   File: $file"
    
    npx tsx server/scripts/importProcessorData.ts "$file" "$processor" "$month" $AGENCY_ID
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully imported $processor - $month"
        echo ""
        return 0
    else
        echo "❌ Failed to import $processor - $month"
        echo ""
        return 1
    fi
}

# Check if arguments provided
if [ $# -eq 0 ]; then
    echo "Usage Options:"
    echo ""
    echo "1. Single file import:"
    echo "   ./bulk-import-helper.sh <csv-file> <processor-name> <month>"
    echo "   Example: ./bulk-import-helper.sh ./data/trx-jan.csv \"TRX\" \"2025-01\""
    echo ""
    echo "2. Batch import from directory:"
    echo "   ./bulk-import-helper.sh --batch <directory>"
    echo "   Example: ./bulk-import-helper.sh --batch ./data-imports"
    echo ""
    echo "3. Interactive mode:"
    echo "   ./bulk-import-helper.sh --interactive"
    echo ""
    exit 1
fi

# Handle different modes
if [ "$1" = "--batch" ]; then
    # Batch import mode
    DIR=$2
    if [ ! -d "$DIR" ]; then
        echo "❌ Directory not found: $DIR"
        exit 1
    fi
    
    echo "🔍 Scanning directory: $DIR"
    echo ""
    
    # Find all CSV files
    find "$DIR" -name "*.csv" -type f | while read file; do
        filename=$(basename "$file")
        
        # Try to extract processor and month from filename
        # Expected format: processor-month-year.csv or processor-monthname-year.csv
        echo "Found: $filename"
        echo "Please enter processor name (or 'skip' to skip this file):"
        read processor
        
        if [ "$processor" = "skip" ]; then
            echo "⏭️  Skipping $filename"
            echo ""
            continue
        fi
        
        echo "Please enter month (YYYY-MM format):"
        read month
        
        import_file "$file" "$processor" "$month"
    done
    
elif [ "$1" = "--interactive" ]; then
    # Interactive mode
    while true; do
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Enter CSV file path (or 'quit' to exit):"
        read file
        
        if [ "$file" = "quit" ]; then
            echo "👋 Goodbye!"
            exit 0
        fi
        
        if [ ! -f "$file" ]; then
            echo "❌ File not found: $file"
            continue
        fi
        
        echo "Enter processor name:"
        read processor
        
        echo "Enter month (YYYY-MM format):"
        read month
        
        import_file "$file" "$processor" "$month"
        
        echo "Continue with another file? (y/n)"
        read continue
        
        if [ "$continue" != "y" ]; then
            echo "👋 Import session complete!"
            exit 0
        fi
    done
    
else
    # Single file import mode
    FILE=$1
    PROCESSOR=$2
    MONTH=$3
    
    if [ -z "$FILE" ] || [ -z "$PROCESSOR" ] || [ -z "$MONTH" ]; then
        echo "❌ Missing required arguments"
        echo "Usage: ./bulk-import-helper.sh <csv-file> <processor-name> <month>"
        exit 1
    fi
    
    import_file "$FILE" "$PROCESSOR" "$MONTH"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Import process complete!"
echo ""
echo "To verify your imports, run:"
echo "  npx tsx -e \"..."  # verification script
echo ""
