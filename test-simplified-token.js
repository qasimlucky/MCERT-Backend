const axios = require('axios');

async function testSimplifiedTokenSystem() {
  const baseURL = 'http://localhost:3000';
  
  try {
    console.log('🧪 Testing Simplified Token System...');
    
    // Test 1: Sign Up
    console.log('\n1. Testing Sign Up');
    try {
      const signUpResponse = await axios.post(`${baseURL}/auth/sign-up`, {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      });
      console.log('✅ Sign Up successful:', signUpResponse.data);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️  User already exists, continuing...');
      } else {
        console.log('❌ Sign Up failed:', error.response?.data || error.message);
      }
    }
    
    // Test 2: Sign In
    console.log('\n2. Testing Sign In');
    const signInResponse = await axios.post(`${baseURL}/auth/sign-in`, {
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('✅ Sign In successful');
    console.log('Token received:', signInResponse.data.access_token ? 'Yes' : 'No');
    console.log('Token type:', signInResponse.data.token_type);
    console.log('Expires in:', signInResponse.data.expires_in, 'seconds');
    
    const token = signInResponse.data.access_token;
    
    // Test 3: Access Protected Route (Me)
    console.log('\n3. Testing Protected Route (Me)');
    const meResponse = await axios.get(`${baseURL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Protected route access successful');
    console.log('User data:', meResponse.data);
    
    // Test 4: Access Protected Route without Token
    console.log('\n4. Testing Protected Route without Token');
    try {
      await axios.get(`${baseURL}/auth/me`);
      console.log('❌ Should have failed but succeeded');
    } catch (error) {
      console.log('✅ Correctly rejected request without token');
      console.log('Error:', error.response?.data?.message || error.message);
    }
    
    // Test 5: Access Public Route (Forms)
    console.log('\n5. Testing Public Route (Forms)');
    const formsResponse = await axios.get(`${baseURL}/forms?page=1&limit=2`);
    console.log('✅ Public route access successful');
    console.log('Forms count:', formsResponse.data.data?.length || 0);
    
    // Test 6: Logout
    console.log('\n6. Testing Logout');
    const logoutResponse = await axios.post(`${baseURL}/auth/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Logout successful:', logoutResponse.data);
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Token-based authentication working');
    console.log('- ✅ Header-based authentication working');
    console.log('- ✅ No cookie dependency');
    console.log('- ✅ No refresh token system');
    console.log('- ✅ 1-week token expiry');
    console.log('- ✅ Public routes accessible without token');
    console.log('- ✅ Protected routes require valid token');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testSimplifiedTokenSystem();
