const axios = require('axios');

async function testExpenseCreation() {
  try {
    console.log('🧪 Testing Expense Creation After Fix...\n');

    // Step 1: Register a new user
    console.log('1. 👤 Registering new user...');
    const registerResponse = await axios.post('http://localhost:5000/api/auth/register', {
      username: 'testuser2',
      email: 'testuser2@example.com', 
      password: 'Password123!'
    });

    if (!registerResponse.data.success) {
      console.log('❌ Registration failed:', registerResponse.data.error);
      return;
    }

    const token = registerResponse.data.token;
    console.log('✅ User registered successfully');

    // Step 2: Create a group
    console.log('\n2. 🏠 Creating group...');
    const groupResponse = await axios.post('http://localhost:5000/api/groups', {
      name: 'Test Expense Group',
      members: ['testuser2@example.com']
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!groupResponse.data.success) {
      console.log('❌ Group creation failed:', groupResponse.data.error);
      return;
    }

    const groupId = groupResponse.data.data._id;
    console.log('✅ Group created successfully:', groupId);

    // Step 3: Get group details to get member info
    console.log('\n3. 📋 Getting group details...');
    const groupDetails = await axios.get(`http://localhost:5000/api/groups/${groupId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const memberUserId = groupDetails.data.data.group.members[0].userId._id;
    console.log('✅ Group details retrieved, member ID:', memberUserId);

    // Step 4: Create an expense
    console.log('\n4. 💰 Creating expense...');
    const expenseResponse = await axios.post(`http://localhost:5000/api/groups/${groupId}/expenses`, {
      amount: 50.00,
      description: 'Test expense creation',
      paidByEmail: 'testuser2@example.com',
      splitBetween: [memberUserId],
      splitAmounts: [50.00]
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (expenseResponse.data.success) {
      console.log('✅ Expense created successfully!');
      console.log('🎉 "Group is required for expense" issue has been FIXED!');
      console.log('   Expense ID:', expenseResponse.data.data.expense._id);
      console.log('   Amount: $' + expenseResponse.data.data.expense.amount);
    } else {
      console.log('❌ Expense creation failed:', expenseResponse.data.error);
    }

  } catch (error) {
    console.log('❌ Test failed:');
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Error:', error.response.data?.error || error.response.data?.message);
      console.log('   Details:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('   Network Error:', error.message);
    }
  }
}

testExpenseCreation();