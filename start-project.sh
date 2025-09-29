#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================"
echo -e "   KrishiRakshak Project Startup"
echo -e "========================================${NC}"
echo

# Check Node.js
echo -e "[1/6] Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install from https://nodejs.org/${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js found${NC}"

# Check npm packages
echo -e "[2/6] Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ Dependencies ready${NC}"

# Check environment
echo -e "[3/6] Checking environment..."
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Environment configured${NC}"

# Check database
echo -e "[4/6] Setting up database..."
npm run db:push > /dev/null 2>&1
echo -e "${GREEN}✅ Database ready${NC}"

# Check wake word model
echo -e "[5/6] Checking wake word model..."
if [ ! -f "server/wakeword.ppn" ]; then
    echo -e "${YELLOW}⚠️  Wake word model not found (optional)${NC}"
    echo -e "    Download from https://picovoice.ai/custom-wake-word/"
else
    echo -e "${GREEN}✅ Wake word model found${NC}"
fi

# Kill any existing process on port 5000
echo -e "[6/6] Preparing server..."
lsof -ti:5000 | xargs kill -9 > /dev/null 2>&1

echo
echo -e "${BLUE}========================================"
echo -e "   Starting KrishiRakshak Server"
echo -e "========================================${NC}"
echo
echo -e "${GREEN}🌐 Frontend: http://localhost:5000${NC}"
echo -e "${GREEN}🔧 API: http://localhost:5000/api${NC}"
echo -e "${GREEN}🎤 Wake Word: \"Hey KrishiRakshak\"${NC}"
echo
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo

npm run dev