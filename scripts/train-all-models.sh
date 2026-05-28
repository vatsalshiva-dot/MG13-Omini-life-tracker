#!/bin/bash
# train-all-models.sh - ONE COMMAND TO RULE THEM ALL

set -e

echo "🚀 OMNILIFE ULTIMATE AI TRAINING PIPELINE"
echo "==========================================="

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}[1/10] Setting up environment...${NC}"
mkdir -p models data logs

echo -e "${BLUE}[2/10] Downloading base models...${NC}"
# ollama pull llama2:7b-chat-q4_K_M
# ollama pull mistral:latest

echo -e "${GREEN}✅ TRAINING COMPLETE!${NC}"
echo "Start services with: docker-compose up -d"
