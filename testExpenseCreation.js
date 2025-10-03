const axios = require('axios');

async function testExpenseCreation() {
  try {
    console.log('🧪 Testing Expense Creation After Fix...\n');

  try {
    let authToken;
    let groupId;

    // Step 1: Login
    console.log('1. 👤 Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });

    if (loginResponse.data.success) {
      authToken = loginResponse.data.token;
      console.log('✅ Login successful');
    } else {
      throw new Error('Login failed');
    }

    // Step 2: Get user groups
    console.log('\n2. 🏠 Getting user groups...');
    const groupsResponse = await axios.get(`${BASE_URL}/groups`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (groupsResponse.data.success && groupsResponse.data.data.length > 0) {
      groupId = groupsResponse.data.data[0]._id;
      console.log(`✅ Found group: ${groupId}`);
    } else {
      throw new Error('No groups found');
    }

    // Step 3: Get group details
    console.log('\n3. 📋 Getting group details...');
    const groupResponse = await axios.get(`${BASE_URL}/groups/${groupId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (groupResponse.data.success) {
      console.log('✅ Group access successful');
      console.log(`   Group Name: ${groupResponse.data.data.group.name}`);
      console.log(`   Members: ${groupResponse.data.data.group.members.length}`);
    } else {
      throw new Error('Group access failed');
    }

    // Step 4: Try to add an expense
    console.log('\n4. 💰 Adding an expense...');
    const expenseData = {
      amount: 50.00,
      description: 'Test lunch expense',
      splitBetween: [groupResponse.data.data.group.members[0].email] // Use first member's email
    };

    const expenseResponse = await axios.post(`${BASE_URL}/groups/${groupId}/expenses`, expenseData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (expenseResponse.data.success) {
      console.log('✅ Expense created successfully!');
      console.log(`   Expense ID: ${expenseResponse.data.data.expense._id}`);
      console.log(`   Amount: $${expenseResponse.data.data.expense.amount}`);
    } else {
      console.log('❌ Expense creation failed');
      console.log('Response:', expenseResponse.data);
    }

  } catch (error) {
    console.log('❌ Error occurred:');
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data.error || error.response.data.message}`);
      console.log('   Full response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log(`   Network Error: ${error.message}`);
    }
  }
}

// Run the test
testExpenseCreation();