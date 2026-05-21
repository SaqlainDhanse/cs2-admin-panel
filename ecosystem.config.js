const path = require('path');
const dotenv = require(path.join(__dirname, 'apps/api/node_modules/dotenv'));

const envVars = dotenv.parse(
  require('fs').readFileSync(path.join(__dirname, 'apps/api/.env'))
);

module.exports = {
  apps: [
    {
      name: 'api-server',
      script: 'main.js',
      cwd: '/home/user/cs2-admin-panel/apps/api',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        ...envVars
      },
      error_file: '/home/user/cs2-admin-panel/logs/api-error.log',
      out_file: '/home/user/cs2-admin-panel/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
