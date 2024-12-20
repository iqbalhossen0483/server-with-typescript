import mongoose from 'mongoose';
import app from './app';
import config from './config/config';
import { queue, redis } from './modules/utils/queue';

let server: any;
mongoose.connect(config.mongoose.url).then(() => {
  console.info('Connected to MongoDB');
  server = app.listen(config.port, () => {
    console.info(`Listening to port ${config.port}`);
  });
});

//redis and bull queue configaration;
// Process Jobs
queue.process(async (job) => {
  const { packageId, userId } = job.data;
  console.log(`Processing expiration for package ${packageId}, user ${userId}`);
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      console.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error: string) => {
  console.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', async () => {
  console.info('SIGTERM received, The server is sutting down...');
  await queue.close();
  redis.disconnect();
  if (server) {
    server.close();
  }
});
