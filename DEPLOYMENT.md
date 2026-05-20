# Production Deployment Guide

This guide explains how to set up automatic deployment to your OVHCloud VPS using GitHub Actions.

## Prerequisites

- OVHCloud VPS with SSH access
- GitHub repository with the code
- Domain name (optional, can use IP:port for now)

## Setup Steps

### 1. VPS Initial Setup

SSH into your VPS:
```bash
ssh user@your-vps-ip
```

Install Node.js (if not installed):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Install PM2 globally:
```bash
sudo npm install -g pm2
```

Create deployment directory:
```bash
mkdir -p ~/cs2-admin-panel/logs
```

### 2. Generate SSH Key Pair

On your local machine:
```bash
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key
```

Copy the public key to your VPS:
```bash
ssh-copy-id -i ~/.ssh/github_deploy_key.pub user@your-vps-ip
```

### 3. Configure GitHub Secrets

Go to your GitHub repository: Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

- `SSH_PRIVATE_KEY`: Contents of `~/.ssh/github_deploy_key` (private key)
- `SSH_USER`: Your VPS username (e.g., `root` or `ubuntu`)
- `VPS_IP`: Your VPS IP address
- `DEPLOY_PATH`: Deployment path on VPS (e.g., `/home/user/cs2-admin-panel`)

### 4. Update ecosystem.config.js

Edit `ecosystem.config.js` to match your VPS setup:
- Change `cwd` to your actual deployment path
- Update `PORT` if needed
- Update log file paths if needed

### 5. Initial Manual Deployment

SSH into your VPS and run:
```bash
cd ~/cs2-admin-panel
git clone https://github.com/your-username/cs2-admin-panel.git .
npm install --prefix apps/api
pm2 start ecosystem.config.js
pm2 save
pm2 startup | sudo bash
```

### 6. Test GitHub Actions

Push changes to the `main` branch. GitHub Actions will automatically:
- Build the React frontend
- Deploy to your VPS
- Restart the API with PM2

Monitor the deployment in GitHub Actions tab.

## Accessing Your Application

- **API**: `http://your-vps-ip:5000`
- **Frontend**: Serve static files from `dist/apps/web` using nginx or a simple server

## Serving React Frontend

### Option 1: Using nginx (Recommended)

Install nginx:
```bash
sudo apt-get install nginx
```

Create nginx config:
```bash
sudo nano /etc/nginx/sites-available/cs2-admin-panel
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend static files
    location / {
        root /home/user/cs2-admin-panel/apps/web;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/cs2-admin-panel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 2: Simple Node.js Server

Install serve globally:
```bash
sudo npm install -g serve
```

Start serving:
```bash
pm2 start "serve -s /home/user/cs2-admin-panel/apps/web -l 3000" --name frontend
pm2 save
```

## Monitoring

Check PM2 status:
```bash
pm2 status
pm2 logs api-server
pm2 logs frontend
```

## Troubleshooting

### GitHub Actions fails with SSH error
- Verify SSH key is added to VPS authorized_keys
- Check GitHub secrets are correct
- Ensure VPS firewall allows SSH connections

### API not starting
- Check logs: `pm2 logs api-server`
- Verify Node.js version matches local environment
- Ensure all dependencies are installed

### Frontend not accessible
- Check nginx configuration
- Verify static files are in correct location
- Check nginx logs: `sudo tail -f /var/log/nginx/error.log`

## Security Considerations

- Use a strong SSH key
- Restrict GitHub Actions to specific branches
- Set up a firewall on your VPS
- Use HTTPS with a domain (certbot for Let's Encrypt)
- Rotate secrets regularly
