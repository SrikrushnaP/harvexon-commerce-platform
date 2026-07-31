import mongoose from 'mongoose';
import { config } from '../config';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

export const connectDatabase = async (): Promise<void> => {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      await mongoose.connect(config.db.uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log('✅ MongoDB connected successfully');
      console.log(`   Database: ${mongoose.connection.name}`);
      break;
    } catch (error) {
      retries++;
      console.error(`❌ MongoDB connection attempt ${retries}/${MAX_RETRIES} failed`);
      if (retries === MAX_RETRIES) {
        console.error('❌ All connection attempts failed. Exiting...');
        process.exit(1);
      }
      console.log(`   Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  // Connection event listeners
  mongoose.connection.on('error', (error) => {
    console.error('❌ MongoDB connection error:', error.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
  });
};

// Graceful shutdown
export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed gracefully');
};
