import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const NODE_ENV = process.env.NODE_ENV || 'development';

let redisClient;

try {
  // Parse Redis URL to determine if TLS is needed
  const isTLS = REDIS_URL.startsWith('rediss://');
  
  if (isTLS) {
    // Production Redis with TLS (Upstash, Render Redis, etc.)
    console.log('🔐 Connecting to Redis with TLS...');
    redisClient = new Redis(REDIS_URL, {
      tls: {
        rejectUnauthorized: false // Required for some hosted Redis providers
      },
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        console.error('❌ Redis reconnect on error:', err.message);
        return true;
      }
    });
  } else {
    // Local Redis or non-TLS connection
    console.log('🔓 Connecting to Redis without TLS...');
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });
  }

  redisClient.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });

  redisClient.on('ready', () => {
    console.log('✅ Redis ready to accept commands');
  });

  redisClient.on('error', (err) => {
    console.error('❌ Redis connection error:', err.message);
    if (NODE_ENV === 'production') {
      console.error('⚠️  Check your REDIS_URL environment variable');
      console.error('⚠️  Ensure TLS is enabled for production Redis (rediss://)');
    }
  });

  redisClient.on('close', () => {
    console.warn('⚠️  Redis connection closed');
  });

  redisClient.on('reconnecting', () => {
    console.log('🔄 Reconnecting to Redis...');
  });

} catch (error) {
  console.error('❌ Failed to initialize Redis client:', error);
  if (NODE_ENV === 'production') {
    process.exit(1); // Exit in production if Redis fails
  }
}

// Test connection
async function testConnection() {
  try {
    await redisClient.ping();
    console.log('✅ Redis PING successful');
  } catch (error) {
    console.error('❌ Redis PING failed:', error.message);
  }
}

// Test on startup
testConnection();

export default redisClient;
