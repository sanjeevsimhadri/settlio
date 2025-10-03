const axios = require('axios');

async function testGroupAccess() {
  try {
    console.log('🔍 Testing group access issue...\n');

    // Step 1: Login
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'newtest@example.com',
      password: 'Password123!'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed');
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Step 2: Get groups
    const groupsResponse = await axios.get('http://localhost:5000/api/groups', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!groupsResponse.data.success || groupsResponse.data.data.length === 0) {
      console.log('❌ No groups found');
      return;
    }

    const groupId = groupsResponse.data.data[0]._id;
    console.log('✅ Groups found, testing group details...');

    // Step 3: Test group details - this is where it fails
    try {
      const groupResponse = await axios.get(`http://localhost:5000/api/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Group details success!');
    } catch (error) {
      console.log('❌ Group details failed:');
      console.log('   Status:', error.response?.status);
      console.log('   Error:', error.response?.data?.error);
      console.log('   Message:', error.response?.data?.message);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testGroupAccess();