module.exports = {
  apps: [
    {
      name: 'api-server',
      script: 'apps/api/main.js',
      cwd: '/home/user/cs2-admin-panel',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/home/user/cs2-admin-panel/logs/api-error.log',
      out_file: '/home/user/cs2-admin-panel/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
