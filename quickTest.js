const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function quickTest() {
  try {
    console.log('🔍 Quick API Test...\n');

    // Test login
    console.log('1. Login test...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });

    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      
      const token = loginResponse.data.token;
      
      // Test getting groups
      console.log('\n2. Groups test...');
      const groupsResponse = await axios.get(`${BASE_URL}/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (groupsResponse.data.success) {
        console.log(`✅ Groups retrieved: ${groupsResponse.data.data.length}`);
        
        if (groupsResponse.data.data.length > 0) {
          const groupId = groupsResponse.data.data[0]._id;
          
          // Test group details
          console.log('\n3. Group details test...');
          const groupResponse = await axios.get(`${BASE_URL}/groups/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (groupResponse.data.success) {
            console.log('✅ Group details retrieved successfully!');
            console.log('   This means the "Error fetching group" issue is FIXED! 🎉');
          } else {
            console.log('❌ Group details failed:', groupResponse.data);
          }
        }
      } else {
        console.log('❌ Groups failed:', groupsResponse.data);
      }
    } else {
      console.log('❌ Login failed:', loginResponse.data);
    }

  } catch (error) {
    console.log('❌ Error:');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`);
    } else {
      console.log(`   Network: ${error.message}`);
    }
  }
}

quickTest();