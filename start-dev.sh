#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting AHRQ Dashboard Development Environment${NC}"
echo "=================================================="

# Function to check if backend is ready
check_backend() {
    curl -s http://localhost:3002/api/health > /dev/null 2>&1
    return $?
}

# Kill any existing processes on ports 3000 and 3002
echo -e "${YELLOW}Checking for existing processes...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true

# Start backend
echo -e "${BLUE}Starting backend server...${NC}"
cd backend && npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
RETRIES=30
while [ $RETRIES -gt 0 ]; do
    if check_backend; then
        echo -e "\n${GREEN}Backend is ready!${NC}"
        break
    fi
    echo -n "."
    sleep 1
    RETRIES=$((RETRIES-1))
done

if [ $RETRIES -eq 0 ]; then
    echo -e "\n${RED}Backend failed to start!${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend
echo -e "${BLUE}Starting frontend...${NC}"
npm run dev &
FRONTEND_PID=$!

sleep 2  # Give frontend a moment to start

echo "=================================================="
echo -e "${GREEN}Development environment is ready!${NC}"
echo -e "Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "Backend:  ${GREEN}http://localhost:3002${NC}"
echo -e "Backend Health: ${GREEN}http://localhost:3002/api/health${NC}"
echo "=================================================="

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down development environment...${NC}"
    kill $FRONTEND_PID 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    exit 0
}

# Set up trap to cleanup on exit
trap cleanup INT TERM

# Wait for processes
wait