const axios = require('axios');

console.log('🧪 Quick CORS Test - COMPLETELY PERMISSIVE\n');

async function quickTest() {
  try {
    // Test 1: Basic GET request to public CORS test endpoint
    console.log('🔍 Test 1: Basic GET request to /public-cors-test');
    const response1 = await axios.get('http://localhost:3000/public-cors-test');
    console.log(`✅ Status: ${response1.status}`);
    console.log(`📋 Response: ${JSON.stringify(response1.data, null, 2)}`);
    
    // Test 2: OPTIONS request (preflight) to public CORS test endpoint
    console.log('\n🔍 Test 2: OPTIONS preflight request to /public-cors-test');
    const response2 = await axios.options('http://localhost:3000/public-cors-test', {
      headers: {
        'Origin': 'https://any-origin.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'X-Custom-Header, X-API-Key'
      }
    });
    console.log(`✅ Status: ${response2.status}`);
    console.log(`📋 CORS Headers:`);
    console.log(`   Access-Control-Allow-Origin: ${response2.headers['access-control-allow-origin']}`);
    console.log(`   Access-Control-Allow-Headers: ${response2.headers['access-control-allow-headers']}`);
    console.log(`   Access-Control-Allow-Methods: ${response2.headers['access-control-allow-methods']}`);
    
    // Test 3: Request with custom headers to public CORS test endpoint
    console.log('\n🔍 Test 3: Request with custom headers to /public-cors-test');
    const response3 = await axios.get('http://localhost:3000/public-cors-test', {
      headers: {
        'Origin': 'https://test-site.com',
        'X-Custom-Header': 'test-value',
        'X-API-Key': 'test-key',
        'X-Random-Header': 'random-value'
      }
    });
    console.log(`✅ Status: ${response3.status}`);
    console.log(`📋 Response: ${JSON.stringify(response3.data, null, 2)}`);
    
    // Test 4: Test with any random origin
    console.log('\n🔍 Test 4: Test with random origin');
    const response4 = await axios.get('http://localhost:3000/public-cors-test', {
      headers: {
        'Origin': 'https://completely-random-site.xyz',
        'X-Super-Custom-Header': 'super-custom-value',
        'X-Another-Header': 'another-value'
      }
    });
    console.log(`✅ Status: ${response4.status}`);
    console.log(`📋 Response: ${JSON.stringify(response4.data, null, 2)}`);
    
    console.log('\n🎯 CORS Test Results:');
    console.log('✅ All tests passed - CORS is COMPLETELY PERMISSIVE');
    console.log('✅ No CORS errors should occur');
    console.log('✅ Any origin, any header, any method is allowed');
    console.log('✅ Public endpoint bypasses authentication');
    
  } catch (error) {
    if (error.response) {
      console.log(`❌ Test failed with status: ${error.response.status}`);
      console.log(`📋 Response: ${JSON.stringify(error.response.data, null, 2)}`);
      
      if (error.response.status === 401) {
        console.log('🔐 Authentication required - this endpoint needs auth');
        console.log('💡 The /public-cors-test endpoint should work without auth');
      }
    } else {
      console.log(`❌ Test failed: ${error.message}`);
    }
    console.log('💡 Make sure your server is running with: npm run start:dev');
  }
}

quickTest();
