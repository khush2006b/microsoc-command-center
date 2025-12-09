#!/usr/bin/env node
// AI Remediation Engine - Configuration Validator
// Validates environment setup before using AI features

import dotenv from 'dotenv';
import axios from 'axios';
import Redis from 'ioredis';
import mongoose from 'mongoose';

dotenv.config();

// Configuration checks

const checks = [];

function addCheck(name, status, message, details = null) {
  checks.push({ name, status, message, details });
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${name}: ${message}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

async function validateEnvironment() {
  console.log('\n📋 CHECKING ENVIRONMENT VARIABLES...\n');

  // LLM Provider
  const provider = process.env.LLM_PROVIDER || 'gemini';
  addCheck(
    'LLM Provider',
    'pass',
    `Using ${provider.toUpperCase()}`,
    `Set in .env: LLM_PROVIDER=${provider}`
  );

  // API Keys
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (provider === 'gemini') {
    if (geminiKey) {
      addCheck(
        'Gemini API Key',
        'pass',
        'Configured',
        `Key length: ${geminiKey.length} characters`
      );
    } else {
      addCheck(
        'Gemini API Key',
        'fail',
        'Missing',
        'Add GEMINI_API_KEY to your .env file'
      );
    }
  } else if (provider === 'openai') {
    if (openaiKey) {
      addCheck('OpenAI API Key', 'pass', 'Configured');
    } else {
      addCheck('OpenAI API Key', 'fail', 'Missing', 'Add OPENAI_API_KEY to your .env file');
    }
  } else if (provider === 'groq') {
    if (groqKey) {
      addCheck('Groq API Key', 'pass', 'Configured');
    } else {
      addCheck('Groq API Key', 'fail', 'Missing', 'Add GROQ_API_KEY to your .env file');
    }
  }

  // Redis URL
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  addCheck(
    'Redis URL',
    'pass',
    'Configured',
    redisUrl
  );

  // MongoDB URI
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/microsoc';
  addCheck(
    'MongoDB URI',
    'pass',
    'Configured',
    mongoUri.replace(/\/\/.*@/, '//***:***@') // Hide credentials
  );
}

async function validateRedis() {
  console.log('\n📡 CHECKING REDIS CONNECTION...\n');

  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 2,
    retryStrategy: () => null, // Don't retry in validation
    lazyConnect: true
  });

  try {
    await redis.connect();
    await redis.ping();
    addCheck('Redis Connection', 'pass', 'Connected successfully');

    // Test write/read
    await redis.set('test:validation', 'ok', 'EX', 10);
    const value = await redis.get('test:validation');
    if (value === 'ok') {
      addCheck('Redis Operations', 'pass', 'Write/Read working');
    } else {
      addCheck('Redis Operations', 'warn', 'Unexpected response');
    }

    await redis.del('test:validation');
    await redis.quit();
  } catch (error) {
    addCheck(
      'Redis Connection',
      'fail',
      'Connection failed',
      `Error: ${error.message}\nMake sure Redis is running: redis-server`
    );
  }
}

async function validateMongoDB() {
  console.log('\n📊 CHECKING MONGODB CONNECTION...\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/microsoc';

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    addCheck('MongoDB Connection', 'pass', 'Connected successfully');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    addCheck(
      'MongoDB Collections',
      'pass',
      `Found ${collections.length} collections`,
      collections.map(c => c.name).join(', ') || 'None yet'
    );

    await mongoose.disconnect();
  } catch (error) {
    addCheck(
      'MongoDB Connection',
      'fail',
      'Connection failed',
      `Error: ${error.message}\nMake sure MongoDB is running: mongod`
    );
  }
}

async function validateLLMAPI() {
  console.log('\n🤖 CHECKING LLM API ACCESS...\n');

  const provider = process.env.LLM_PROVIDER || 'gemini';

  if (provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      addCheck('Gemini API', 'fail', 'API key not configured');
      return;
    }

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [{
            parts: [{ text: 'Hello, respond with "OK"' }]
          }]
        },
        { timeout: 10000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        addCheck(
          'Gemini API',
          'pass',
          'API responding correctly',
          `Response: ${text.substring(0, 50)}...`
        );
      } else {
        addCheck('Gemini API', 'warn', 'Unexpected response format');
      }
    } catch (error) {
      if (error.response?.status === 400) {
        addCheck(
          'Gemini API',
          'fail',
          'Invalid API key',
          'Check your GEMINI_API_KEY in .env file'
        );
      } else if (error.response?.status === 429) {
        addCheck('Gemini API', 'warn', 'Rate limit reached', 'Try again later');
      } else {
        addCheck(
          'Gemini API',
          'fail',
          'Request failed',
          error.response?.data?.error?.message || error.message
        );
      }
    }
  } else if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      addCheck('OpenAI API', 'fail', 'API key not configured');
      return;
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5
        },
        {
          headers: { 'Authorization': `Bearer ${apiKey}` },
          timeout: 10000
        }
      );

      if (response.data?.choices?.[0]?.message) {
        addCheck('OpenAI API', 'pass', 'API responding correctly');
      } else {
        addCheck('OpenAI API', 'warn', 'Unexpected response format');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        addCheck('OpenAI API', 'fail', 'Invalid API key');
      } else {
        addCheck('OpenAI API', 'fail', 'Request failed', error.message);
      }
    }
  } else if (provider === 'ollama') {
    const endpoint = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434/api/generate';
    
    try {
      // Just check if Ollama server is running
      const healthCheck = await axios.get('http://localhost:11434/', { timeout: 5000 });
      addCheck('Ollama Server', 'pass', 'Server is running');
    } catch (error) {
      addCheck(
        'Ollama Server',
        'fail',
        'Server not accessible',
        'Make sure Ollama is running: ollama serve'
      );
    }
  }
}

// Main execution
async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║          AI REMEDIATION ENGINE - CONFIGURATION VALIDATOR                   ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');

  try {
    await validateEnvironment();
    await validateRedis();
    await validateMongoDB();
    await validateLLMAPI();

    // Summary
    console.log('\n' + '═'.repeat(80));
    console.log('📊 VALIDATION SUMMARY');
    console.log('═'.repeat(80));

    const passed = checks.filter(c => c.status === 'pass').length;
    const failed = checks.filter(c => c.status === 'fail').length;
    const warnings = checks.filter(c => c.status === 'warn').length;

    console.log(`Total Checks: ${checks.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️ Warnings: ${warnings}`);
    console.log('');

    if (failed === 0) {
      console.log('🎉 ALL CRITICAL CHECKS PASSED!');
      console.log('✅ Your AI Remediation Engine is ready to use.');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Start your backend: npm run dev');
      console.log('  2. Start your frontend: npm run dev');
      console.log('  3. Navigate to an incident and click "REMEDIATION" tab');
      console.log('  4. Or run test suite: node backend/src/tests/testAIRemediation.js');
    } else {
      console.log('⚠️ SOME CHECKS FAILED');
      console.log('Please fix the issues above before using the AI Remediation Engine.');
      console.log('');
      console.log('Common fixes:');
      console.log('  • Start Redis: redis-server');
      console.log('  • Start MongoDB: mongod');
      console.log('  • Add API key to .env: GEMINI_API_KEY=your_key_here');
    }

    console.log('═'.repeat(80) + '\n');

    process.exit(failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    process.exit(1);
  }
}

// Run validation
main();
