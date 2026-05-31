import app from './app';
import { env } from './config/env';
import { connectDB, disconnectDB } from './config/db';

async function startServer() {
  // 1. Fire database socket linkages
  await connectDB();

  // 2. Open Express listener ports
  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Invoicon Backend API listening successfully in ${env.NODE_ENV} mode`);
    console.log(`🔗 Local Server: http://localhost:${env.PORT}`);
  });

  // 3. Graceful shutdown configurations
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n📡 Received ${signal}. Initiating graceful shutdown...`);
    
    server.close(async () => {
      console.log('📡 Express API server closed');
      await disconnectDB();
      console.log('📡 System shutdown complete. Goodbye.');
      process.exit(0);
    });

    // Force exit after 10 seconds if graceful shutdowns stall
    setTimeout(() => {
      console.error('❌ Forcefully shutting down because graceful handlers timed out.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('❌ Server startup failure:', err);
  process.exit(1);
});
