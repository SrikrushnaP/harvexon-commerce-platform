import app from './app';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './database';
import http from 'http';

let server: http.Server;

const startServer = async () => {
  // Connect to database with retry logic
  await connectDatabase();

  // Start Express server
  server = app.listen(config.port, () => {
    console.log(`
    ╔═══════════════════════════════════════════╗
    ║   HCP Backend API Server                  ║
    ║   Environment: ${config.nodeEnv.padEnd(25)}║
    ║   Port: ${String(config.port).padEnd(33)}║
    ║   API: http://localhost:${config.port}/api       ║
    ╚═══════════════════════════════════════════╝
    `);
  });
};

// Graceful shutdown helper
const gracefulShutdown = async (signal: string) => {
  console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);

  // Stop accepting new connections
  if (server) {
    server.close(() => {
      console.log('✅ HTTP server closed');
    });
  }

  // Close database connection
  try {
    await disconnectDatabase();
  } catch (error) {
    console.error('❌ Error during database disconnect:', error);
  }

  process.exit(0);
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  console.error('❌ Unhandled Rejection:', reason);
  // Let the uncaughtException handler deal with it
  throw reason;
});

// Handle uncaught exceptions — log and exit immediately
process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle SIGTERM — graceful shutdown (close server, then DB)
process.on('SIGTERM', () => {
  gracefulShutdown('SIGTERM');
});

// Handle SIGINT — graceful shutdown
process.on('SIGINT', () => {
  gracefulShutdown('SIGINT');
});

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
