module.exports = {
  apps: [
    {
      name: 'blackbow-reporting',
      script: 'server.js',
      cwd: '/home/newadmin/projects/blackbow-associates/reporting-frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        HOST: '127.0.0.1'
      },
      kill_timeout: 5000,
      max_restarts: 10,
      restart_delay: 5000,
      watch: false,
      autorestart: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      error_file: '/var/log/desaas/blackbow-reporting-error.log',
      out_file: '/var/log/desaas/blackbow-reporting-out.log'
    }
  ]
};
