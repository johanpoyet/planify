module.exports = {
  apps: [{
    name: 'planify',
    script: 'npm',
    args: 'start',
    cwd: '/home/johan/apps/planify',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}