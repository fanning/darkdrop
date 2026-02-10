module.exports = {
  apps: [
    {
      name: 'darkdrop-api',
      script: './api/index.js',
      cwd: '/home/fanning/darkdrop',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        GLIBC_TUNABLES: 'glibc.cpu.hwcaps=-AVX512F',
        UV_THREADPOOL_SIZE: '2',
        TOKIO_WORKER_THREADS: '2',
        RAYON_NUM_THREADS: '2',
        NODE_ENV: 'production',
        PORT: 3001,
        STORAGE_ROOT: '/var/darkdrop',
      },
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
    },
  ],
};
