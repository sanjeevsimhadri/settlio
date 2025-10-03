const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testWithNewUser() {
  try {
    console.log('🔍 Testing with new user credentials...\n');

    // Login with the new user
    console.log('1. Logging in with new user...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'newtest@example.com',
      password: 'Password123!'
    });

    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      const token = loginResponse.data.token;
      
      // Create a group
      console.log('\n2. Creating a test group...');
      const groupResponse = await axios.post(`${BASE_URL}/groups`, {
        name: 'Test Group for Fix Verification',
        members: ['newtest@example.com']
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (groupResponse.data.success) {
        const groupId = groupResponse.data.data._id;
        console.log(`✅ Group created: ${groupId}`);
        
        // Test group details (this was failing with "Error fetching group")
        console.log('\n3. Testing group details access...');
        const detailsResponse = await axios.get(`${BASE_URL}/groups/${groupId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (detailsResponse.data.success) {
          console.log('✅ Group details retrieved successfully!');
          console.log('🎉 The "Error fetching group" issue has been FIXED!');
          console.log(`   Group name: ${detailsResponse.data.data.group.name}`);
          console.log(`   Members: ${detailsResponse.data.data.group.members.length}`);
          console.log('   Member emails:', detailsResponse.data.data.group.members.map(m => m.email));
          
          // Test adding an expense (the original "You are not a member" error)
          console.log('\n4. Testing expense creation...');
          const expenseResponse = await axios.post(`${BASE_URL}/groups/${groupId}/expenses`, {
            amount: 25.50,
            description: 'Test expense to verify membership fix',
            paidByEmail: 'newtest@example.com',
            splitBetween: [detailsResponse.data.data.group.members[0].userId._id],
            splitAmounts: [25.50]
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (expenseResponse.data.success) {
            console.log('✅ Expense creation successful!');
            console.log('🚀 Both issues have been RESOLVED!');
            console.log('   - "Error fetching group" ✓');
            console.log('   - "You are not a member of this group" ✓');
          } else {
            console.log('❌ Expense creation failed:', expenseResponse.data);
          }
        } else {
          console.log('❌ Group details failed:', detailsResponse.data);
        }
      } else {
        console.log('❌ Group creation failed:', groupResponse.data);
      }
    } else {
      console.log('❌ Login failed:', loginResponse.data);
    }

  } catch (error) {
    console.log('❌ Test failed:');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`);
      if (error.response.data?.stack) {
        console.log(`   Stack trace: ${error.response.data.stack.substring(0, 200)}...`);
      }
    } else {
      console.log(`   Network: ${error.message}`);
    }
  }
}

testWithNewUser();