module.exports = {
  apps: [
    {
      name: 'bot-discord',
      script: './index.js',
      cwd: '/var/www/bot-discord',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 4000,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
