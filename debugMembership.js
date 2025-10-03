const axios = require('axios');

// Test specific API calls step by step
const debugMembership = async () => {
  const baseURL = 'http://localhost:5000/api';
  
  try {
    // Use the existing testuser from our previous test
    console.log('🔐 Testing with existing user login...\n');
    
    // Step 1: Login with existing user
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'test@example.com',
      password: 'Test123!'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      const token = loginResponse.data.token;
      const headers = { Authorization: `Bearer ${token}` };
      
      // Step 2: Get user's groups
      console.log('\n2. Getting user groups...');
      const groupsResponse = await axios.get(`${baseURL}/groups`, { headers });
      
      if (groupsResponse.data.success && groupsResponse.data.data.length > 0) {
        console.log('✅ Found groups:', groupsResponse.data.data.length);
        
        const groupId = groupsResponse.data.data[0]._id;
        console.log('   Group ID:', groupId);
        
        // Step 3: Test accessing the specific group
        console.log('\n3. Testing group access...');
        try {
          const accessResponse = await axios.get(`${baseURL}/groups/${groupId}`, { headers });
          console.log('✅ Group access successful');
          console.log('   Group name:', accessResponse.data.data.group.name);
        } catch (error) {
          console.log('❌ Group access failed:');
          console.log('   Status:', error.response?.status);
          console.log('   Error:', error.response?.data?.error || error.message);
        }
        
      } else {
        console.log('❌ No groups found or error getting groups');
      }
    } else {
      console.log('❌ Login failed');
    }
  } catch (error) {
    console.log('❌ Test failed:');
    console.log('   Status:', error.response?.status);
    console.log('   Error:', error.response?.data?.error || error.message);
  }
};

debugMembership();