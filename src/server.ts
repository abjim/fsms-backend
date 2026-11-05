import { Server } from 'http';
import app from './app';
import config from './app/config';

let server: Server;

async function main() {
  server = app.listen(config.port, () => {
    console.log(`FSMS server is running on port ${config.port}`);
  });
}

if (!process.env.VERCEL) {
  main();
}

process.on('unhandledRejection', (err) => {
  console.log('unhandledRejection detected, shutting down...', err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.log('uncaughtException detected, shutting down...', err);
  process.exit(1);
});

export default app;
