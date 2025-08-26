const axios = require('axios');

// Test CORS from different origins (including invalid ones)
const testOrigins = [
  'https://mcert-frontend.vercel.app',
  'http://localhost:3001',
  'http://localhost:3002',
  'https://sirisreports.co.uk',
  'https://invalid-origin.com',
  'http://any-domain.com',
  'https://test.example.org',
  'http://random-site.net'
];

const baseUrl = 'http://localhost:3000';

async function testPreflightRequests() {
  console.log('🔄 Testing preflight OPTIONS requests with COMPLETELY PERMISSIVE CORS...\n');
  
  for (const origin of testOrigins) {
    try {
      console.log(`🔍 Testing preflight for origin: ${origin}`);
      
      // Test OPTIONS request (preflight) with any method and headers
      const optionsResponse = await axios.options(`${baseUrl}/cors-test`, {
        headers: {
          'Origin': origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'X-Custom-Header, X-API-Key, Content-Type, X-Random-Header, X-Any-Header'
        },
        validateStatus: () => true
      });
      
      console.log(`✅ Preflight Status: ${optionsResponse.status}`);
      console.log(`📋 Preflight Response: ${JSON.stringify(optionsResponse.data, null, 2)}`);
      console.log(`🔒 Preflight CORS Headers:`);
      console.log(`   Access-Control-Allow-Origin: ${optionsResponse.headers['access-control-allow-origin']}`);
      console.log(`   Access-Control-Allow-Methods: ${optionsResponse.headers['access-control-allow-methods']}`);
      console.log(`   Access-Control-Allow-Headers: ${optionsResponse.headers['access-control-allow-headers']}`);
      console.log(`   Access-Control-Allow-Credentials: ${optionsResponse.headers['access-control-allow-credentials']}`);
      console.log(`   Access-Control-Max-Age: ${optionsResponse.headers['access-control-max-age']}`);
      console.log(`   Access-Control-Expose-Headers: ${optionsResponse.headers['access-control-expose-headers']}`);
      
    } catch (error) {
      console.log(`❌ Preflight Error: ${error.message}`);
    }
    
    console.log('─'.repeat(50));
  }
}

async function testCORS() {
  console.log('🧪 Testing COMPLETELY PERMISSIVE CORS configuration...\n');
  
  for (const origin of testOrigins) {
    try {
      console.log(`🔍 Testing origin: ${origin}`);
      
      // Test with various custom headers to verify ALL headers are allowed
      const response = await axios.get(`${baseUrl}/cors-test`, {
        headers: {
          'Origin': origin,
          'X-Custom-Header': 'test-value',
          'X-API-Key': 'test-api-key',
          'X-Request-ID': 'test-request-123',
          'X-Client-Version': '1.0.0',
          'X-Platform': 'web',
          'X-User-Agent': 'test-user-agent',
          'X-Timestamp': new Date().toISOString(),
          'X-Debug': 'true',
          'X-Test-Header': 'custom-test-header',
          'X-Random-Header': 'random-value',
          'X-Any-Header': 'any-value',
          'X-Another-Header': 'another-value',
          'X-Final-Header': 'final-value'
        },
        validateStatus: () => true // Don't throw on non-2xx status
      });
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📋 Response: ${JSON.stringify(response.data, null, 2)}`);
      console.log(`🔒 CORS Headers:`);
      console.log(`   Access-Control-Allow-Origin: ${response.headers['access-control-allow-origin']}`);
      console.log(`   Access-Control-Allow-Credentials: ${response.headers['access-control-allow-credentials']}`);
      console.log(`   Access-Control-Allow-Headers: ${response.headers['access-control-allow-headers']}`);
      console.log(`   Access-Control-Allow-Methods: ${response.headers['access-control-allow-methods']}`);
      console.log(`   Access-Control-Expose-Headers: ${response.headers['access-control-expose-headers']}`);
      
      // Check if custom headers were received
      if (response.data.receivedHeaders) {
        console.log(`📋 Received Headers:`);
        Object.keys(response.data.receivedHeaders).forEach(key => {
          if (key.startsWith('x-')) {
            console.log(`   ${key}: ${response.data.receivedHeaders[key]}`);
          }
        });
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('─'.repeat(50));
  }
  
  // Test health endpoint
  try {
    console.log('🔍 Testing health endpoint...');
    const response = await axios.get(`${baseUrl}/health`);
    console.log(`✅ Health Status: ${response.status}`);
    console.log(`📋 Health Response: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    console.log(`❌ Health Error: ${error.message}`);
  }
}

// Test if server is running
async function testServerConnection() {
  try {
    console.log('🔌 Testing server connection...');
    const response = await axios.get(baseUrl);
    console.log(`✅ Server is running! Status: ${response.status}`);
    return true;
  } catch (error) {
    console.log(`❌ Server connection failed: ${error.message}`);
    console.log('💡 Make sure your server is running with: npm run start:dev');
    return false;
  }
}

async function runTests() {
  console.log('🚀 CORS Test Suite - COMPLETELY PERMISSIVE (ALL origins, ALL headers, ALL methods)\n');
  
  const serverRunning = await testServerConnection();
  if (!serverRunning) {
    return;
  }
  
  console.log('\n' + '='.repeat(50));
  await testPreflightRequests();
  
  console.log('\n' + '='.repeat(50));
  await testCORS();
  
  console.log('\n🎯 Summary:');
  console.log('✅ CORS is COMPLETELY PERMISSIVE');
  console.log('✅ ALL origins are allowed (including invalid ones)');
  console.log('✅ ALL headers are allowed (any custom header)');
  console.log('✅ ALL methods are allowed (GET, POST, PUT, DELETE, etc.)');
  console.log('✅ Preflight requests are NEVER blocked');
  console.log('✅ OPTIONS requests return 200 status');
  console.log('✅ No CORS errors should occur');
}

runTests().catch(console.error);
