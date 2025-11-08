#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Function to check a service
check_service() {
    local service=$1
    local url=$2
    echo -n "Checking $service... "
    if curl -s -f "$url" > /dev/null; then
        echo -e "${GREEN}OK${NC}"
        return 0
    else
        echo -e "${RED}FAILED${NC}"
        return 1
    fi
}

# Check all services
check_service "Frontend" "http://localhost:80" && \
check_service "Backend" "http://localhost:8080/healthz" && \
check_service "Frontend Dev" "http://localhost:3000" && \
echo -e "\n${GREEN}All services are healthy!${NC}" || \
echo -e "\n${RED}Some services are not responding!${NC}"
