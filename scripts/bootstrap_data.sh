#!/bin/bash

# ========================================
# Depo Data Bootstrap Script
# ========================================
# This script pulls data from DVC/Google Drive remote
# Run this after cloning the repository

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 Depo Data Bootstrap"
echo "======================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if DVC is installed
if ! command -v dvc &> /dev/null; then
    echo -e "${RED}❌ DVC is not installed${NC}"
    echo "Install DVC with: pip install dvc[gdrive]"
    exit 1
fi

echo -e "${GREEN}✓ DVC is installed${NC}"

# Navigate to project root
cd "$PROJECT_ROOT"

# Check if DVC is initialized
if [ ! -d ".dvc" ]; then
    echo -e "${RED}❌ DVC is not initialized in this repository${NC}"
    echo "Run: dvc init"
    exit 1
fi

echo -e "${GREEN}✓ DVC is initialized${NC}"

# Check if remote is configured
if ! dvc remote list | grep -q "storage"; then
    echo -e "${YELLOW}⚠️  No DVC remote configured${NC}"
    echo ""
    echo "To configure Google Drive remote:"
    echo "1. Create a folder in Google Drive"
    echo "2. Get the folder ID from the URL: https://drive.google.com/drive/folders/YOUR_FOLDER_ID"
    echo "3. Run: dvc remote modify storage gdrive://YOUR_FOLDER_ID"
    echo ""
    read -p "Do you want to configure the remote now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your Google Drive folder ID: " FOLDER_ID
        dvc remote modify storage "gdrive://$FOLDER_ID"
        echo -e "${GREEN}✓ Remote configured${NC}"
    else
        echo "Skipping remote configuration. You can do it later with:"
        echo "dvc remote modify storage gdrive://YOUR_FOLDER_ID"
        exit 1
    fi
fi

echo -e "${GREEN}✓ DVC remote is configured${NC}"

# Check if .dvc files exist
if ! ls data/*.dvc 1> /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  No .dvc files found in data/ directory${NC}"
    echo "The dataset hasn't been tracked with DVC yet."
    echo ""
    echo "To track your data:"
    echo "1. Place your dataset in the data/ directory"
    echo "2. Run: dvc add data/your_dataset"
    echo "3. Run: dvc push"
    exit 0
fi

# Pull data from remote
echo ""
echo "📥 Pulling data from Google Drive..."
if dvc pull; then
    echo ""
    echo -e "${GREEN}✅ Data pulled successfully!${NC}"
    echo ""
    echo "Data is now available in the data/ directory"
else
    echo ""
    echo -e "${RED}❌ Failed to pull data${NC}"
    echo ""
    echo "This might be because:"
    echo "1. You haven't authenticated with Google Drive yet"
    echo "2. The remote folder ID is incorrect"
    echo "3. You don't have access to the remote folder"
    echo ""
    echo "To authenticate:"
    echo "- DVC will open a browser window for Google authentication"
    echo "- Follow the prompts to grant access"
    echo ""
    echo "Try running: dvc pull"
    exit 1
fi

# Verify data
echo ""
echo "🔍 Verifying data..."
if [ -d "data" ] && [ "$(ls -A data 2>/dev/null)" ]; then
    echo -e "${GREEN}✓ Data directory contains files${NC}"
    echo ""
    echo "Data summary:"
    du -sh data/* 2>/dev/null || echo "No files to display"
else
    echo -e "${YELLOW}⚠️  data/ directory is empty${NC}"
fi

echo ""
echo -e "${GREEN}✅ Bootstrap complete!${NC}"
