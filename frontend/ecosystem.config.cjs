module.exports = {
  apps: [{
    name: 'blackbow-frontend',
    script: 'node',
    args: 'server.js',
    cwd: '/home/newadmin/projects/blackbow-associates/frontend',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      HOST: '127.0.0.1'
    },
    error_file: '/var/log/desaas/blackbow-frontend-error.log',
    out_file: '/var/log/desaas/blackbow-frontend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '200M',
    restart_delay: 4000,
    autorestart: true
  }]
};
