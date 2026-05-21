# Complete Step-by-Step Deployment Guide

Follow these exact steps in order to set up automatic deployment to your OVHCloud VPS.

## STEP 1: Verify Deployment Files Exist

On your local machine, verify these files exist in your project:
- `.github/workflows/deploy.yml`
- `ecosystem.config.js`
- `deploy.sh`

If they don't exist, the deployment pipeline files have already been created for you.

## STEP 2: Push Deployment Files to GitHub

On your local machine:
```bash
git add .github/workflows/deploy.yml ecosystem.config.js deploy.sh DEPLOYMENT.md
git commit -m "Add deployment pipeline"
git push origin main
```

## STEP 3: VPS Initial Setup

SSH into your VPS:
```bash
ssh your-username@your-vps-ip
```

Install Node.js:
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

## STEP 4: Generate SSH Keys on VPS

Still on your VPS, generate SSH key pair:
```bash
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key
```

When prompted, press Enter for all questions (no passphrase).

Add public key to authorized_keys:
```bash
cat ~/.ssh/github_deploy_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## STEP 5: Copy Private Key for GitHub

Display the private key:
```bash
cat ~/.ssh/github_deploy_key
```

Copy the ENTIRE output including:
```
-----BEGIN RSA PRIVATE KEY-----
[all the key content]
-----END RSA PRIVATE KEY-----
```

## STEP 6: Configure GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**

Add these 4 secrets one by one:

**Secret 1: SSH_PRIVATE_KEY**
- Name: `SSH_PRIVATE_KEY`
- Value: Paste the private key you copied in Step 5
- Click **Add secret**

**Secret 2: SSH_USER**
- Name: `SSH_USER`
- Value: Your VPS username (e.g., `root`, `ubuntu`, or your username)
- Click **Add secret**

**Secret 3: VPS_IP**
- Name: `VPS_IP`
- Value: Your VPS IP address (e.g., `123.45.67.89`)
- Click **Add secret**

**Secret 4: DEPLOY_PATH**
- Name: `DEPLOY_PATH`
- Value: `/home/your-username/cs2-admin-panel` (replace your-username with your actual VPS username)
- Click **Add secret**

## STEP 7: Update ecosystem.config.js

On your local machine, edit `ecosystem.config.js` and change the `cwd` value:
```javascript
cwd: '/home/your-username/cs2-admin-panel'
```

Replace `your-username` with your actual VPS username.

Then commit and push:
```bash
git add ecosystem.config.js
git commit -m "Update deployment path"
git push origin main
```

## STEP 8: Initial Manual Deployment on VPS

SSH into your VPS:
```bash
ssh your-username@your-vps-ip
```

Clone the repository:
```bash
cd ~/cs2-admin-panel
git clone https://github.com/your-username/cs2-admin-panel.git .
```

Replace `your-username` with your GitHub username.

Install API dependencies:
```bash
npm install --prefix apps/api
```

Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup | sudo bash
```

When you see the PM2 startup command, copy and run the sudo command it outputs.

## STEP 9: Test GitHub Actions

Go to your GitHub repository → **Actions** tab

You should see a workflow running. Click on it to watch the progress.

If it succeeds, your deployment is working!

## STEP 10: Verify Deployment

SSH into your VPS and check PM2 status:
```bash
pm2 status
```

You should see `api-server` as `online`.

Test your API:
```bash
curl http://localhost:5000
```

Or from your local machine:
```bash
curl http://your-vps-ip:5000
```

## Troubleshooting

**GitHub Actions fails with SSH error:**
- Verify secrets are added correctly (Step 6)
- Check VPS IP and username are correct
- Verify public key is in authorized_keys: `cat ~/.ssh/authorized_keys`

**API not starting:**
- Check logs: `pm2 logs api-server`
- Verify Node.js is installed: `node --version`
- Check dependencies installed: `ls ~/cs2-admin-panel/apps/api/node_modules`

**Workflow not triggering:**
- Verify workflow file is in `.github/workflows/deploy.yml`
- Check you're pushing to `main` branch
- Verify branch name matches workflow configuration

## Next Steps (Optional)

To serve the React frontend, choose one option:

**Option A: nginx (Recommended)**
```bash
sudo apt-get install nginx
```
Then configure nginx to serve the built React files.

**Option B: Simple Node.js Server**
```bash
sudo npm install -g serve
pm2 start "serve -s ~/cs2-admin-panel/apps/web -l 3000" --name frontend
pm2 save
```
