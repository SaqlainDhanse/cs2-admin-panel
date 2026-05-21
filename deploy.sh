#!/bin/bash

# Deployment script for OVHCloud VPS
# Run this on the VPS to set up the environment

set -e

DEPLOY_PATH="/home/user/cs2-admin-panel"
mkdir -p $DEPLOY_PATH/logs

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Install dependencies
cd $DEPLOY_PATH
npm install --prefix apps/api

# Start application with PM2
pm2 start ecosystem.config.js || pm2 restart ecosystem.config.js
pm2 save

# Setup PM2 to start on system boot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

echo "Deployment setup complete!"
echo "Application is running at: http://<VPS_IP>:5000"
