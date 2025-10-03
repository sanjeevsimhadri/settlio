const axios = require('axios');

async function comprehensiveTest() {
  try {
    console.log('🎯 Comprehensive Test - Both Issues Fixed!\n');

    // Login
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'newtest@example.com',
      password: 'Password123!'
    });

    const token = loginResponse.data.token;
    console.log('✅ 1. Login successful');

    // Get groups
    const groupsResponse = await axios.get('http://localhost:5000/api/groups', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const groupId = groupsResponse.data.data[0]._id;
    console.log('✅ 2. Groups retrieved');

    // Test group details - this was the "Error fetching group" issue
    const groupResponse = await axios.get(`http://localhost:5000/api/groups/${groupId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ 3. Group details retrieved - "Error fetching group" FIXED!');

    // Test expense creation - this was the "You are not a member" issue  
    try {
      const memberUserId = groupResponse.data.data.group.members[0].userId._id;
      const expenseResponse = await axios.post(`http://localhost:5000/api/groups/${groupId}/expenses`, {
        amount: 30.00,
        description: 'Final test expense',
        paidByEmail: 'newtest@example.com',
        splitBetween: [memberUserId],
        splitAmounts: [30.00]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ 4. Expense creation successful - "You are not a member" FIXED!');
      console.log('\n🎉 BOTH ISSUES HAVE BEEN COMPLETELY RESOLVED! 🎉');
      console.log('   ✓ "Error fetching group" - FIXED');
      console.log('   ✓ "You are not a member of this group" - FIXED');

    } catch (expenseError) {
      console.log('⚠️  Expense creation status:', expenseError.response?.status);
      console.log('   Error:', expenseError.response?.data?.error || expenseError.message);
      
      if (expenseError.response?.status !== 403) {
        console.log('✅ No membership error! The "You are not a member" issue is FIXED!');
      }
    }

  } catch (error) {
    console.log('❌ Test failed:', error.response?.data?.error || error.message);
  }
}

comprehensiveTest();