#!/bin/bash

# Quick Start Script for Movie Recommendation System
echo "🎬 Starting Movie Recommendation System Setup..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env files exist
echo -e "\n${YELLOW}Step 1: Checking environment files...${NC}"
if [ ! -f "recommendation-service/.env" ]; then
    echo -e "${YELLOW}Creating recommendation-service/.env from example...${NC}"
    cp recommendation-service/.env.example recommendation-service/.env
    echo -e "${RED}⚠️  Please edit recommendation-service/.env with your database credentials${NC}"
    exit 1
fi

# Check if MySQL and Redis are running
echo -e "\n${YELLOW}Step 2: Checking required services...${NC}"
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}MySQL is not installed or not in PATH${NC}"
    exit 1
fi

if ! command -v redis-cli &> /dev/null; then
    echo -e "${YELLOW}Redis CLI not found. Attempting to start Redis...${NC}"
    if command -v redis-server &> /dev/null; then
        redis-server --daemonize yes
    else
        echo -e "${RED}Redis is not installed${NC}"
        exit 1
    fi
fi

# Check if Redis is running
redis-cli ping > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Starting Redis...${NC}"
    redis-server --daemonize yes
    sleep 2
fi

echo -e "${GREEN}✅ MySQL and Redis are ready${NC}"

# Setup FastAPI virtual environment
echo -e "\n${YELLOW}Step 3: Setting up FastAPI microservice...${NC}"
cd recommendation-service
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment and installing dependencies..."
source venv/bin/activate
pip install -q -r requirements.txt
echo -e "${GREEN}✅ FastAPI dependencies installed${NC}"

# Start FastAPI in background
echo -e "\n${YELLOW}Step 4: Starting FastAPI service...${NC}"
nohup uvicorn main:app --host 0.0.0.0 --port 8001 > fastapi.log 2>&1 &
FASTAPI_PID=$!
echo $FASTAPI_PID > fastapi.pid
echo -e "${GREEN}✅ FastAPI started (PID: $FASTAPI_PID)${NC}"
cd ..

# Wait for FastAPI to be ready
echo "Waiting for FastAPI to be ready..."
for i in {1..10}; do
    curl -s http://localhost:8001/health > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ FastAPI is ready${NC}"
        break
    fi
    sleep 2
done

# Build and start Spring Boot
echo -e "\n${YELLOW}Step 5: Starting Spring Boot backend...${NC}"
cd SocialStream
./mvnw spring-boot:run > ../springboot.log 2>&1 &
SPRINGBOOT_PID=$!
echo $SPRINGBOOT_PID > ../springboot.pid
echo -e "${GREEN}✅ Spring Boot started (PID: $SPRINGBOOT_PID)${NC}"
cd ..

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 All services started successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n📍 Service URLs:"
echo -e "   Spring Boot:  http://localhost:8080"
echo -e "   FastAPI:      http://localhost:8001"
echo -e "   FastAPI Docs: http://localhost:8001/docs"
echo -e "\n📋 Logs:"
echo -e "   FastAPI:      tail -f recommendation-service/fastapi.log"
echo -e "   Spring Boot:  tail -f springboot.log"
echo -e "\n🛑 To stop services:"
echo -e "   ./stop-services.sh"
echo -e "\n📖 Full documentation: RECOMMENDATION_SYSTEM_README.md"
