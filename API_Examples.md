# API Testing Examples

## 1. Create a Group
**POST** `/api/groups`
```json
{
  "name": "Weekend Trip",
  "members": ["USER_ID_1", "USER_ID_2", "USER_ID_3"]
}
```

## 2. Create an Expense
**POST** `/api/groups/{groupId}/expenses`

### Example 1: Equal Split
```json
{
  "amount": 120.00,
  "description": "Dinner at Italian Restaurant",
  "paidBy": "USER_ID_1",
  "splitBetween": ["USER_ID_1", "USER_ID_2", "USER_ID_3"],
  "splitAmounts": [40.00, 40.00, 40.00]
}
```

### Example 2: Unequal Split
```json
{
  "amount": 150.50,
  "description": "Hotel accommodation",
  "paidBy": "USER_ID_2", 
  "splitBetween": ["USER_ID_1", "USER_ID_2", "USER_ID_3"],
  "splitAmounts": [50.25, 75.25, 25.00]
}
```

### Example 3: Partial Split (Not all members involved)
```json
{
  "amount": 45.00,
  "description": "Coffee for two",
  "paidBy": "USER_ID_1",
  "splitBetween": ["USER_ID_1", "USER_ID_2"],
  "splitAmounts": [22.50, 22.50]
}
```

## Response Format
```json
{
  "success": true,
  "message": "Expense created successfully",
  "data": {
    "expense": {
      "id": "expense_id",
      "amount": 120.00,
      "formattedAmount": "$120.00",
      "description": "Dinner at Italian Restaurant",
      "paidBy": {
        "_id": "user_id_1",
        "username": "john_doe",
        "email": "john@example.com"
      },
      "splitBetween": [...],
      "splitAmounts": [40.00, 40.00, 40.00],
      "date": "2023-10-01T18:30:00.000Z",
      "settled": false,
      "group": {
        "_id": "group_id",
        "name": "Weekend Trip"
      },
      "balances": {
        "user_id_1": 80.00,   // Paid 120, owes 40 = +80
        "user_id_2": -40.00,  // Owes 40
        "user_id_3": -40.00   // Owes 40
      },
      "createdAt": "2023-10-01T18:30:00.000Z"
    },
    "groupSummary": {
      "groupId": "group_id",
      "totals": {
        "totalAmount": 315.50,
        "expenseCount": 3,
        "settledAmount": 0,
        "unsettledAmount": 315.50,
        "formattedTotal": "$315.50",
        "formattedSettled": "$0.00",
        "formattedUnsettled": "$315.50"
      },
      "balances": [
        {
          "user": {
            "id": "user_id_1",
            "username": "john_doe", 
            "email": "john@example.com"
          },
          "balance": 102.75,
          "totalPaid": 165.00,
          "totalOwed": 62.25,
          "formattedBalance": "$102.75",
          "status": "owed"
        },
        {
          "user": {
            "id": "user_id_2",
            "username": "jane_smith",
            "email": "jane@example.com"
          },
          "balance": -27.25,
          "totalPaid": 150.50,
          "totalOwed": 177.75,
          "formattedBalance": "$27.25", 
          "status": "owes"
        },
        {
          "user": {
            "id": "user_id_3",
            "username": "bob_johnson",
            "email": "bob@example.com"
          },
          "balance": -75.50,
          "totalPaid": 0.00,
          "totalOwed": 75.50,
          "formattedBalance": "$75.50",
          "status": "owes"
        }
      ],
      "settlements": [
        {
          "from": {
            "id": "user_id_3",
            "username": "bob_johnson",
            "email": "bob@example.com"
          },
          "to": {
            "id": "user_id_1", 
            "username": "john_doe",
            "email": "john@example.com"
          },
          "amount": 75.50,
          "formattedAmount": "$75.50"
        },
        {
          "from": {
            "id": "user_id_2",
            "username": "jane_smith",
            "email": "jane@example.com"
          },
          "to": {
            "id": "user_id_1",
            "username": "john_doe", 
            "email": "john@example.com"
          },
          "amount": 27.25,
          "formattedAmount": "$27.25"
        }
      ],
      "recentExpenses": [...], // Last 10 expenses
      "lastUpdated": "2023-10-01T18:30:00.000Z"
    }
  }
}
```

## Validation Rules
- ✅ Amount must be positive number
- ✅ Description required (2-500 chars)
- ✅ PaidBy must be valid user ID and group member
- ✅ SplitBetween must be non-empty array of valid user IDs
- ✅ SplitAmounts must match splitBetween length
- ✅ Sum of splitAmounts must equal total amount
- ✅ No duplicate users in splitBetween
- ✅ All splitBetween users must be group members
- ✅ Current user must be group member to create expense