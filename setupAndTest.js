const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function setupTestUser() {
  try {
    console.log('🚀 Setting up test user...\n');

    // Try to register a test user first
    console.log('1. Registering test user...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!'
    });

    if (registerResponse.data.success) {
      console.log('✅ Test user registered successfully');
      return await testUserLogin();
    }

  } catch (error) {
    if (error.response && error.response.status === 400 && error.response.data.error.includes('already exists')) {
      console.log('ℹ️  Test user already exists, trying login...');
      return await testUserLogin();
    } else {
      console.log('❌ Registration failed:', error.response?.data?.error || error.message);
      return false;
    }
  }
}

async function testUserLogin() {
  try {
    console.log('\n2. Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'Password123!'
    });

    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      return await testGroupAccess(loginResponse.data.token);
    }
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testGroupAccess(token) {
  try {
    console.log('\n3. Creating a test group...');
    const groupResponse = await axios.post(`${BASE_URL}/groups`, {
      name: 'Test Group',
      members: ['test@example.com']
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (groupResponse.data.success) {
      const groupId = groupResponse.data.data._id;
      console.log(`✅ Group created: ${groupId}`);
      
      console.log('\n4. Testing group details access...');
      const detailsResponse = await axios.get(`${BASE_URL}/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (detailsResponse.data.success) {
        console.log('✅ Group details retrieved successfully!');
        console.log('🎉 The "Error fetching group" issue has been FIXED!');
        return true;
      } else {
        console.log('❌ Group details failed:', detailsResponse.data);
      }
    } else {
      console.log('❌ Group creation failed:', groupResponse.data);
    }
  } catch (error) {
    console.log('❌ Group access error:');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`);
    } else {
      console.log(`   Network: ${error.message}`);
    }
  }
  return false;
}

setupTestUser();