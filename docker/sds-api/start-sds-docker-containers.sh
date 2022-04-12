#!/bin/bash

LIGHT_GREEN='\033[1;32m'
NC='\033[0m'
echo -e "${LIGHT_GREEN}Stopping running containers${NC}"
docker-compose stop;

echo -e "${LIGHT_GREEN}Build and starting containers${NC}"
docker-compose up -d --build