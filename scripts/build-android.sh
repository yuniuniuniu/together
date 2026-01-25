#!/bin/bash

# Android APK Build Script
# Usage: ./scripts/build-android.sh [debug|release]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get build type (default: debug)
BUILD_TYPE=${1:-debug}

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CLIENT_DIR="$PROJECT_ROOT/client"
ANDROID_DIR="$CLIENT_DIR/android"

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}  Together - Android APK Build  ${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "Build type: ${YELLOW}$BUILD_TYPE${NC}"
echo ""

# Check if client directory exists
if [ ! -d "$CLIENT_DIR" ]; then
    echo -e "${RED}Error: client directory not found${NC}"
    exit 1
fi

cd "$CLIENT_DIR"

# Step 1: Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Step 2: Build web assets
echo -e "${YELLOW}Building web assets...${NC}"
npm run build

# Step 3: Sync with Capacitor
echo -e "${YELLOW}Syncing with Capacitor...${NC}"
npx cap sync android

# Step 4: Build APK
cd "$ANDROID_DIR"

if [ "$BUILD_TYPE" = "release" ]; then
    echo -e "${YELLOW}Building release APK...${NC}"
    ./gradlew assembleRelease
    APK_PATH="$ANDROID_DIR/app/build/outputs/apk/release/app-release-unsigned.apk"
    
    if [ -f "$APK_PATH" ]; then
        echo ""
        echo -e "${GREEN}Release APK built successfully!${NC}"
        echo -e "Location: ${YELLOW}$APK_PATH${NC}"
        echo ""
        echo -e "${YELLOW}Note: Release APK needs to be signed before distribution.${NC}"
    fi
else
    echo -e "${YELLOW}Building debug APK...${NC}"
    ./gradlew assembleDebug
    APK_PATH="$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
    
    if [ -f "$APK_PATH" ]; then
        echo ""
        echo -e "${GREEN}Debug APK built successfully!${NC}"
        echo -e "Location: ${YELLOW}$APK_PATH${NC}"
        
        # Copy to project root for easy access
        cp "$APK_PATH" "$PROJECT_ROOT/together-debug.apk"
        echo -e "Copied to: ${YELLOW}$PROJECT_ROOT/together-debug.apk${NC}"
    fi
fi

echo ""
echo -e "${GREEN}Build complete!${NC}"
