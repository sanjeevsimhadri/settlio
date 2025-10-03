# Debt Simplification Algorithm

## 🧮 Algorithm Overview

The debt simplification function calculates net balances between users in a group and minimizes the number of transactions needed to settle all debts using a **greedy algorithm**.

## 📊 How It Works

### Step 1: Calculate Net Balances
For each user, calculate: `Total Paid - Total Owed = Net Balance`

```javascript
// Example: 3 users, multiple expenses
User A: Paid $150, Owes $50  → Net: +$100 (is owed money)
User B: Paid $80,  Owes $120 → Net: -$40  (owes money) 
User C: Paid $20,  Owes $80  → Net: -$60  (owes money)
```

### Step 2: Separate Creditors and Debtors
- **Creditors**: Users with positive balance (owed money)
- **Debtors**: Users with negative balance (owe money)

### Step 3: Apply Greedy Algorithm
Match largest creditor with largest debtor, settle minimum amount, repeat.

## 🚀 API Endpoints

### 1. Get Simplified Debts
**GET** `/api/groups/:groupId/debts/simplified`

```json
{
  "success": true,
  "data": {
    "groupId": "group_id",
    "netBalances": [
      {
        "user": {
          "id": "user_a",
          "username": "alice", 
          "email": "alice@example.com"
        },
        "balance": 100.00,
        "formattedBalance": "$100.00",
        "status": "owed"
      },
      {
        "user": {
          "id": "user_b", 
          "username": "bob",
          "email": "bob@example.com"
        },
        "balance": -40.00,
        "formattedBalance": "$40.00", 
        "status": "owes"
      },
      {
        "user": {
          "id": "user_c",
          "username": "charlie",
          "email": "charlie@example.com" 
        },
        "balance": -60.00,
        "formattedBalance": "$60.00",
        "status": "owes"
      }
    ],
    "simplifiedTransactions": [
      {
        "from": {
          "id": "user_c",
          "username": "charlie",
          "email": "charlie@example.com"
        },
        "to": {
          "id": "user_a", 
          "username": "alice",
          "email": "alice@example.com"
        },
        "amount": 60.00,
        "formattedAmount": "$60.00",
        "description": "Settlement payment from charlie to alice"
      },
      {
        "from": {
          "id": "user_b",
          "username": "bob", 
          "email": "bob@example.com"
        },
        "to": {
          "id": "user_a",
          "username": "alice",
          "email": "alice@example.com"
        },
        "amount": 40.00,
        "formattedAmount": "$40.00", 
        "description": "Settlement payment from bob to alice"
      }
    ],
    "summary": {
      "totalExpenses": 5,
      "totalAmount": 250.00,
      "totalOwed": 100.00,
      "totalCredit": 100.00,
      "transactionCount": 2,
      "isBalanced": true,
      "formattedTotalAmount": "$250.00",
      "formattedTotalOwed": "$100.00"
    },
    "calculatedAt": "2023-10-01T18:30:00.000Z"
  }
}
```

### 2. Get Settlement Suggestions
**GET** `/api/groups/:groupId/debts/suggestions`

```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "from": { "username": "charlie" },
        "to": { "username": "alice" },
        "amount": 60.00,
        "formattedAmount": "$60.00"
      },
      {
        "from": { "username": "bob" },
        "to": { "username": "alice" }, 
        "amount": 40.00,
        "formattedAmount": "$40.00"
      }
    ],
    "optimization": {
      "originalPossibleTransactions": 6,
      "optimizedTransactions": 2,
      "transactionsSaved": 4,
      "efficiencyImprovement": "66.7%"
    },
    "tips": [
      "💡 You can settle all debts with just 2 transaction(s).",
      "💰 There's only one person who is owed money, making settlement simple.",
      "🔢 Largest settlement: $60.00 from charlie to alice.",
      "✅ All expenses are properly balanced."
    ]
  }
}
```

### 3. Calculate What-If Scenarios  
**POST** `/api/groups/:groupId/debts/what-if`

```json
// Request Body
{
  "settlements": [
    {
      "fromUserId": "user_c",
      "toUserId": "user_a", 
      "amount": 30.00
    }
  ]
}

// Response
{
  "success": true,
  "data": {
    "currentBalances": [...],
    "projectedBalances": [
      {
        "user": { "username": "alice" },
        "balance": 70.00  // Was 100, received 30
      },
      {
        "user": { "username": "charlie" },
        "balance": -30.00  // Was -60, paid 30
      }
    ],
    "settlements": [...],
    "remainingDebts": 2
  }
}
```

### 4. Get User Balance
**GET** `/api/groups/:groupId/debts/user/:userId`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_a",
      "username": "alice",
      "email": "alice@example.com"
    },
    "balance": 100.00,
    "status": "owed",
    "formattedBalance": "$100.00",
    "transactions": [
      {
        "from": { "username": "charlie" },
        "to": { "username": "alice" },
        "amount": 60.00
      },
      {
        "from": { "username": "bob" },
        "to": { "username": "alice" },
        "amount": 40.00
      }
    ],
    "summary": {
      "owesTotal": 0,
      "owedTotal": 100.00,
      "transactionCount": 2
    }
  }
}
```

## 🔧 Algorithm Benefits

### ✅ **Transaction Minimization**
- **Before**: Each debtor pays each creditor directly (N×M transactions)
- **After**: Optimal pairing reduces to minimum transactions

### 🎯 **Example Optimization**
```
Original (Without Algorithm):
- Bob pays Alice $40
- Bob pays David $0  
- Charlie pays Alice $60
- Charlie pays David $0
Total: 4 transactions (including $0 ones)

Optimized (With Algorithm):
- Charlie pays Alice $60
- Bob pays Alice $40  
Total: 2 transactions

Savings: 50% fewer transactions
```

### 📈 **Complex Scenario**
```
5 users, multiple cross-debts:
- Without optimization: Up to 25 possible transactions
- With optimization: Reduced to 3-4 actual transactions
- Efficiency improvement: 80%+
```

## 🛠 Algorithm Features

### **Precision Handling**
- Floating-point tolerance (0.01) for currency calculations
- Proper rounding to avoid precision errors
- Balance validation ensures mathematical correctness

### **Scalability** 
- Greedy algorithm: O(n log n) complexity
- Handles groups of any size efficiently
- Sorting optimization for best results

### **Flexibility**
- Include/exclude settled expenses
- What-if scenario modeling
- Multiple algorithm options (greedy, advanced)

### **Error Prevention**
- Balance validation ensures sum = 0
- User membership verification  
- Transaction amount validation

## 💡 Usage Tips

1. **Regular Settlement**: Use simplified transactions for periodic settlements
2. **What-If Planning**: Test different payment scenarios before committing  
3. **Balance Tracking**: Monitor individual user balances over time
4. **Optimization**: Larger groups benefit more from transaction reduction

The algorithm ensures optimal debt settlement with minimum transactions while maintaining mathematical accuracy and user-friendly formatting.