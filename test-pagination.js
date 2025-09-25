const axios = require('axios');

async function testPagination() {
  const baseURL = 'http://localhost:3000';
  
  try {
    console.log('🧪 Testing form pagination...');
    
    // Test 1: Basic pagination
    console.log('\n1. Testing basic pagination (page=1, limit=5)');
    const response1 = await axios.get(`${baseURL}/forms?page=1&limit=5`);
    console.log('Status:', response1.status);
    console.log('Data length:', response1.data.data?.length || 'No data array');
    console.log('Pagination info:', response1.data.pagination);
    
    // Test 2: Pagination with sorting
    console.log('\n2. Testing pagination with sorting (createdAt desc)');
    const response2 = await axios.get(`${baseURL}/forms?page=1&limit=3&sortBy=createdAt&sortOrder=desc`);
    console.log('Status:', response2.status);
    console.log('Data length:', response2.data.data?.length || 'No data array');
    console.log('Pagination info:', response2.data.pagination);
    
    // Test 3: Direct paginated endpoint
    console.log('\n3. Testing direct /forms/paginated endpoint');
    const response3 = await axios.get(`${baseURL}/forms/paginated?page=1&limit=2`);
    console.log('Status:', response3.status);
    console.log('Data length:', response3.data.data?.length || 'No data array');
    console.log('Pagination info:', response3.data.pagination);
    
    // Test 4: Non-paginated endpoint (should return all)
    console.log('\n4. Testing non-paginated endpoint');
    const response4 = await axios.get(`${baseURL}/forms`);
    console.log('Status:', response4.status);
    console.log('Data type:', Array.isArray(response4.data) ? 'Array' : typeof response4.data);
    console.log('Data length:', Array.isArray(response4.data) ? response4.data.length : 'Not an array');
    
  } catch (error) {
    console.error('❌ Error testing pagination:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testPagination();
