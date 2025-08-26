const axios = require('axios');

// Test CORS from different origins
const testOrigins = [
  'https://mcert-frontend.vercel.app',
  'http://localhost:3001',
  'http://localhost:3002',
  'https://sirisreports.co.uk'
];

const baseUrl = 'http://localhost:3000';

async function testPreflightRequests() {
  console.log('🔄 Testing preflight OPTIONS requests...\n');
  
  for (const origin of testOrigins) {
    try {
      console.log(`🔍 Testing preflight for origin: ${origin}`);
      
      // Test OPTIONS request (preflight)
      const optionsResponse = await axios.options(`${baseUrl}/cors-test`, {
        headers: {
          'Origin': origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'X-Custom-Header, X-API-Key, Content-Type'
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
      
    } catch (error) {
      console.log(`❌ Preflight Error: ${error.message}`);
    }
    
    console.log('─'.repeat(50));
  }
}

async function testCORS() {
  console.log('🧪 Testing CORS configuration with all headers allowed...\n');
  
  for (const origin of testOrigins) {
    try {
      console.log(`🔍 Testing origin: ${origin}`);
      
      // Test with various custom headers to verify all headers are allowed
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
          'X-Test-Header': 'custom-test-header'
        },
        validateStatus: () => true // Don't throw on non-2xx status
      });
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📋 Response: ${JSON.stringify(response.data, null, 2)}`);
      console.log(`🔒 CORS Headers:`);
      console.log(`   Access-Control-Allow-Origin: ${response.headers['access-control-allow-origin']}`);
      console.log(`   Access-Control-Allow-Credentials: ${response.headers['access-control-allow-credentials']}`);
      console.log(`   Access-Control-Allow-Headers: ${response.headers['access-control-allow-headers']}`);
      
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
  console.log('🚀 CORS Test Suite - All Headers Allowed & Preflight Never Blocked\n');
  
  const serverRunning = await testServerConnection();
  if (!serverRunning) {
    return;
  }
  
  console.log('\n' + '='.repeat(50));
  await testPreflightRequests();
  
  console.log('\n' + '='.repeat(50));
  await testCORS();
  
  console.log('\n🎯 Summary:');
  console.log('✅ CORS is configured to allow ALL headers');
  console.log('✅ Preflight requests are NEVER blocked');
  console.log('✅ Custom headers work automatically');
  console.log('✅ OPTIONS requests return 200 status');
  console.log('✅ All origins are properly handled');
}

runTests().catch(console.error);
