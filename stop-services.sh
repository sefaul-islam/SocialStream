#!/bin/bash

# Stop all recommendation system services
echo "🛑 Stopping Movie Recommendation System services..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Stop Spring Boot
if [ -f "springboot.pid" ]; then
    SPRINGBOOT_PID=$(cat springboot.pid)
    echo "Stopping Spring Boot (PID: $SPRINGBOOT_PID)..."
    kill $SPRINGBOOT_PID 2>/dev/null
    rm springboot.pid
    echo -e "${GREEN}✅ Spring Boot stopped${NC}"
fi

# Stop FastAPI
if [ -f "recommendation-service/fastapi.pid" ]; then
    FASTAPI_PID=$(cat recommendation-service/fastapi.pid)
    echo "Stopping FastAPI (PID: $FASTAPI_PID)..."
    kill $FASTAPI_PID 2>/dev/null
    rm recommendation-service/fastapi.pid
    echo -e "${GREEN}✅ FastAPI stopped${NC}"
fi

# Kill any remaining uvicorn processes
pkill -f "uvicorn main:app" 2>/dev/null

echo -e "\n${GREEN}All services stopped!${NC}"
