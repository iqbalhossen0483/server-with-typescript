import Queue from 'bull';
import Redis from 'ioredis';
import config from '../../config/config';

type JobData = {
  packageId: string;
  userId: string;
};

// Redis connection options
const redisOptions = {
  host: config.radis.host,
  port: config.radis.port,
  password: config.radis.password,
};

// Initialize Redis connection
export const redis = new Redis(redisOptions);

// Initialize Bull Queue with Redis configuration
export const queue = new Queue('package-expiration', {
  redis: redisOptions,
});

export const addQueue = async (jobData: JobData, expiredTime = 0) => {
  try {
    // Validate job data
    if (!jobData || typeof jobData !== 'object') {
      throw new Error('Job data must be a valid object.');
    }

    // Add the job to the queue
    const job = await queue.add(jobData, {
      delay: expiredTime, // Delay before the job is processed
      attempts: 3, // Number of retry attempts if the job fails
      backoff: { type: 'fixed', delay: 5000 }, // Retry every 5 seconds
      removeOnComplete: true, // Automatically remove job when completed
      removeOnFail: false, // Keep the job in the queue if it fails
    });

    console.log(`Job added to queue: ${job.id}`);
    return job;
  } catch (error) {
    console.error('Error adding job to queue:', error);
    throw error;
  }
};
