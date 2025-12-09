import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

// ============================================================================
// REDIS CONNECTION FOR RENDER (UPSTASH WITH TLS)
// ============================================================================
const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  console.error('❌ REDIS_URL not configured in environment variables');
  process.exit(1);
}

console.log('🔧 Initializing Redis connection...');
console.log(`📍 Redis URL: ${REDIS_URL.replace(/:[^:@]+@/, ':****@')}`); // Hide password

// Parse Redis URL to determine if TLS is needed
const useTLS = REDIS_URL.startsWith('rediss://') || REDIS_URL.includes('upstash.io');

const redisConfig = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    console.log(`🔄 Redis retry attempt ${times}, waiting ${delay}ms...`);
    return delay;
  },
  reconnectOnError(err) {
    console.log('🔄 Redis reconnect on error:', err.message);
    return true;
  }
};

// Add TLS configuration if using secure Redis (Upstash/Render)
if (useTLS) {
  redisConfig.tls = {
    rejectUnauthorized: false // Allow self-signed certificates
  };
  console.log('🔒 Redis TLS enabled');
}

const redis = new Redis(REDIS_URL, redisConfig);

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
