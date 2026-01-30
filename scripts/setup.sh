#!/bin/bash

# DarkDrop Setup Script
# Run this script to set up DarkDrop from scratch

set -e

echo "================================"
echo "DarkDrop Setup"
echo "================================"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "Error: Do not run this script as root"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Please install Node.js 18+ first"
    exit 1
fi

echo "Node.js version: $(node --version)"
echo ""

# Navigate to darkdrop directory
cd "$(dirname "$0")/.."
DARKDROP_DIR=$(pwd)
echo "DarkDrop directory: $DARKDROP_DIR"
echo ""

# Install dependencies
echo "Installing dependencies..."
npm install
cd api && npm install && cd ..
cd frontend && npm install && cd ..
cd mcp-server && npm install && cd ..
cd database && npm install && cd ..
echo "Dependencies installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env

    # Generate random JWT secret
    JWT_SECRET=$(openssl rand -hex 32)
    sed -i "s/change-this-to-a-secure-random-string/$JWT_SECRET/" .env

    echo ".env file created with random JWT secret"
else
    echo ".env file already exists"
fi
echo ""

# Create storage directory
STORAGE_ROOT="/var/darkdrop"
echo "Setting up storage directory: $STORAGE_ROOT"

if [ ! -d "$STORAGE_ROOT" ]; then
    sudo mkdir -p "$STORAGE_ROOT"
    sudo chown $USER:$USER "$STORAGE_ROOT"
    sudo chmod 755 "$STORAGE_ROOT"
    echo "Storage directory created"
else
    echo "Storage directory already exists"
fi
echo ""

# Initialize database
echo "Initializing database..."
node -e "
const Database = require('./database');
const db = new Database();
db.initialize().then(() => {
    console.log('Database initialized');
    process.exit(0);
}).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
"
echo ""

# Build frontend
echo "Building frontend..."
cd frontend
npm run build
cd ..
echo "Frontend built"
echo ""

echo "================================"
echo "Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Review configuration in .env"
echo ""
echo "2. Create accounts:"
echo "   node scripts/create-account.js custcorp 'CustCorp' custcorp.com"
echo ""
echo "3. Create an agent:"
echo "   node scripts/create-agent.js 'My Agent' custcorp write"
echo ""
echo "4. Development mode:"
echo "   npm run dev"
echo ""
echo "5. Production mode:"
echo "   pm2 start ecosystem.config.js"
echo ""
echo "6. Configure Nginx (see README.md)"
echo ""
