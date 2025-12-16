module.exports = {
  apps: [{
    name: 'blackbow-api',
    script: 'src/index.js',
    cwd: '/home/newadmin/projects/blackbow-associates/backend',
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    max_restarts: 10,
    restart_delay: 5000,
    env: {
      NODE_ENV: 'production'
    }
  }]
};
