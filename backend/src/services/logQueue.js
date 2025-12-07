import { Queue } from "bullmq";
import redis from "./redisClient.js";

export const LOG_QUEUE_NAME = process.env.LOG_QUEUE_NAME || "logQueue";

export const logQueue = new Queue(LOG_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
    },
    removeOnFail: {
      age: 24 * 3600, // Keep failed jobs for 24 hours
    },
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000, // Start with 2 seconds
    },
  },
});

// Emit events for monitoring
logQueue.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

logQueue.on("failed", (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

logQueue.on("waiting", (jobId) => {
  console.log(`⏳ Job ${jobId} waiting in queue`);
});

export default logQueue;
