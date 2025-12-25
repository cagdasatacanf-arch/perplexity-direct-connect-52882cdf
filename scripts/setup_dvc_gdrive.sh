#!/bin/bash

# ========================================
# DVC Google Drive Setup Helper
# ========================================

set -e

echo "📦 DVC Google Drive Setup"
echo "========================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}This script will help you configure DVC with Google Drive${NC}"
echo ""

# Step 1: Get folder ID
echo "Step 1: Create a Google Drive folder for your data"
echo "----------------------------------------------------"
echo "1. Go to Google Drive (https://drive.google.com)"
echo "2. Create a new folder (e.g., 'depo-data')"
echo "3. Open the folder"
echo "4. Copy the folder ID from the URL:"
echo "   https://drive.google.com/drive/folders/YOUR_FOLDER_ID_HERE"
echo ""

read -p "Enter your Google Drive folder ID: " FOLDER_ID

if [ -z "$FOLDER_ID" ]; then
    echo -e "${YELLOW}No folder ID provided. Exiting.${NC}"
    exit 1
fi

# Step 2: Configure DVC remote
echo ""
echo "Step 2: Configuring DVC remote..."
dvc remote modify storage "gdrive://$FOLDER_ID"
echo -e "${GREEN}✓ DVC remote configured${NC}"

# Step 3: Update .env file
echo ""
echo "Step 3: Updating .env file..."

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env from .env.example${NC}"
fi

# Update folder ID in .env
if grep -q "DVC_GDRIVE_FOLDER_ID=" .env; then
    sed -i "s|DVC_GDRIVE_FOLDER_ID=.*|DVC_GDRIVE_FOLDER_ID=$FOLDER_ID|" .env
    echo -e "${GREEN}✓ Updated DVC_GDRIVE_FOLDER_ID in .env${NC}"
else
    echo "DVC_GDRIVE_FOLDER_ID=$FOLDER_ID" >> .env
    echo -e "${GREEN}✓ Added DVC_GDRIVE_FOLDER_ID to .env${NC}"
fi

# Step 4: Instructions for tracking data
echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "-----------"
echo "1. Add your data files to the data/ directory"
echo ""
echo "2. Track them with DVC:"
echo "   dvc add data/your_dataset.csv"
echo "   OR"
echo "   dvc add data/  (to track entire directory)"
echo ""
echo "3. Push to Google Drive:"
echo "   dvc push"
echo ""
echo "4. Commit the .dvc files to git:"
echo "   git add data.dvc .gitignore"
echo "   git commit -m 'Add dataset with DVC'"
echo ""
echo "To pull data on another machine:"
echo "   ./scripts/bootstrap_data.sh"
echo ""
