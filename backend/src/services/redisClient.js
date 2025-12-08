import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    console.log(`Redis retry attempt ${times}, waiting ${delay}ms...`);
    return delay;
  },
  reconnectOnError(err) {
    console.log('Redis reconnect on error:', err.message);
    return true;
  }
});

redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});

redis.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redis.on("ready", () => {
  console.log("✅ Redis ready to accept commands");
});

export default redis;
