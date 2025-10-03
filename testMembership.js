const axios = require('axios');

// Test membership functionality after user registration
const testUserMembership = async () => {
  const baseURL = 'http://localhost:5000/api';
  
  try {
    console.log('🔐 Testing user registration and group membership...\n');
    
    // Step 1: Register a new user
    console.log('1. Registering new user...');
    const registerResponse = await axios.post(`${baseURL}/auth/register`, {
      username: 'testuser2',
      email: 'testuser2@example.com',
      password: 'Test123!'
    });
    
    if (registerResponse.data.success) {
      console.log('✅ User registered successfully');
      const token = registerResponse.data.token;
      const headers = { Authorization: `Bearer ${token}` };
      
      // Step 2: Create a group
      console.log('\n2. Creating a group...');
      const groupResponse = await axios.post(`${baseURL}/groups`, {
        name: 'Test Membership Group',
        members: []
      }, { headers });
      
      if (groupResponse.data.success) {
        console.log('✅ Group created successfully');
        const groupId = groupResponse.data.data._id;
        
        // Step 3: Test accessing the group (this should work now)
        console.log('\n3. Testing group access...');
        const accessResponse = await axios.get(`${baseURL}/groups/${groupId}`, { headers });
        
        if (accessResponse.data.success) {
          console.log('✅ Group access successful - membership fix working!');
        } else {
          console.log('❌ Group access failed');
        }
        
        // Step 4: Test creating an expense (this was the original issue)
        console.log('\n4. Testing expense creation...');
        const expenseResponse = await axios.post(`${baseURL}/expenses`, {
          groupId: groupId,
          description: 'Test Expense',
          amount: 25.50,
          currency: 'USD',
          paidByEmail: 'testuser2@example.com',
          splitAmong: [{ email: 'testuser2@example.com' }],
          date: new Date().toISOString()
        }, { headers });
        
        if (expenseResponse.data.success) {
          console.log('✅ Expense creation successful - fix working completely!');
        } else {
          console.log('❌ Expense creation failed:', expenseResponse.data.error);
        }
        
      } else {
        console.log('❌ Group creation failed');
      }
    } else {
      console.log('❌ User registration failed');
    }
  } catch (error) {
    console.log('❌ Test failed:', error.response?.data?.error || error.message);
  }
};

testUserMembership();