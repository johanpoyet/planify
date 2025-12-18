module.exports = {
  apps: [
    {
      name: 'planify',
      script: 'npm',
      args: 'start',
      cwd: '/home/johan/apps/planify',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};