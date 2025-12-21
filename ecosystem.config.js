module.exports = {
  apps: [{
    name: 'planify',
    script: 'npm',
    args: 'start',
    cwd: '/home/johan/apps/planify',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '400M', // Redémarre si > 400MB
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Optimisations mémoire
    node_args: '--max-old-space-size=512'
  }]
}