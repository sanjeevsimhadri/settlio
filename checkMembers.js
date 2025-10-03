const axios = require('axios');

async function checkGroupMembers() {
  try {
    // Login
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'newtest@example.com',
      password: 'Password123!'
    });

    const token = loginResponse.data.token;
    console.log('✅ Logged in');

    // Get existing groups
    const groupsResponse = await axios.get('http://localhost:5000/api/groups', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('📋 Existing groups:', groupsResponse.data.data.length);
    
    if (groupsResponse.data.data.length > 0) {
      const group = groupsResponse.data.data[0];
      console.log('🏠 Group name:', group.name);
      console.log('👥 Members:', group.members.map(m => ({
        email: m.email,
        hasUserId: !!m.userId,
        status: m.status
      })));
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }
}

checkGroupMembers();