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
        NODE_ENV: 'production',
        PORT: 3000,
        STORAGE_ROOT: '/var/darkdrop',
        JWT_SECRET: 'change-this-in-production',
      },
    },
    {
      name: 'darkdrop-mcp',
      script: './mcp-server/index.js',
      cwd: '/home/fanning/darkdrop',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        STORAGE_ROOT: '/var/darkdrop',
      },
      // MCP server runs on stdio, so we can't use PM2 for it
      // This is just a placeholder - use it directly via stdio
      interpreter: 'none',
    },
  ],
};
