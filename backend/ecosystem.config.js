module.exports = {
  apps: [{
    name: 'blackbow-api',
    script: './src/index.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 3450,
      HOST: '127.0.0.1'
    },
    error_file: '/var/log/desaas/blackbow-error.log',
    out_file: '/var/log/desaas/blackbow-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '500M',
    restart_delay: 4000,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
