# Settlio Backend

A robust expense sharing application backend built with Node.js, Express.js, MongoDB, and JWT authentication.

## Features

- **RESTful API** with Express.js
- **MongoDB integration** with Mongoose ODM
- **JWT-based authentication** with bcrypt password hashing
- **Email-based group invitations** for unregistered users
- **Group management** with member status tracking
- **Expense sharing** and debt calculation
- **User registration synchronization** with pending invitations
- **Input validation** with Joi
- **Security middleware** (Helmet, CORS, Rate Limiting)
- **Error handling** with custom error classes
- **Environment configuration** with dotenv
- **Modular architecture** with separated concerns

## Project Structure

```
settlio/
├── src/
│   ├── config/
│   │   └── database.js          # Database connection
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic with invitation sync
│   │   ├── groupController.js   # Group management and member operations
│   │   ├── userController.js    # User search and profile management
│   │   ├── expenseController.js # Expense creation and management
│   │   └── debtController.js    # Debt calculations and settlements
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   └── errorHandler.js      # Global error handling
│   ├── models/
│   │   ├── User.js              # User model with Mongoose
│   │   └── Group.js             # Group model with member management
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── groups.js            # Group management routes
│   │   └── users.js             # User search routes
│   └── utils/
│       ├── asyncHandler.js      # Async error handling wrapper
│       ├── errorResponse.js     # Custom error response class
│       ├── validation.js        # Input validation schemas
│       └── groupSync.js         # Group invitation synchronization utilities
├── .env                         # Environment variables
├── .gitignore                   # Git ignore rules
├── package.json                 # Project dependencies and scripts
└── server.js                    # Application entry point
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/settlio
   JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
   JWT_EXPIRE=30d
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. Make sure MongoDB is installed and running on your system

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## API Endpoints

All protected routes require `Authorization: Bearer <token>` header.

### Authentication

#### Register User
- **POST** `/api/auth/register`
- **Body:**
  ```json
  {
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }
  ```
- **Note:** Automatically syncs with any pending group invitations for this email

#### Login User
- **POST** `/api/auth/login`
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "SecurePass123!"
  }
  ```

#### Get Current User Profile
- **GET** `/api/auth/me`
- **Headers:** `Authorization: Bearer <token>`

#### Update User Profile
- **PUT** `/api/auth/me`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "username": "newusername",
    "email": "newemail@example.com"
  }
  ```

### Groups

#### Create Group
- **POST** `/api/groups`
- **Body:**
  ```json
  {
    "name": "Weekend Trip",
    "members": ["alice@example.com", "bob@example.com", "unregistered@example.com"]
  }
  ```
- **Note:** Supports adding unregistered users by email

#### Get User's Groups
- **GET** `/api/groups`
- **Response:** Array of groups where user is a member or admin

#### Get Group Details
- **GET** `/api/groups/:groupId`
- **Response:** Group details with member information and expense summary

#### Add Group Member
- **POST** `/api/groups/:groupId/members`
- **Body:**
  ```json
  {
    "memberEmail": "newmember@example.com"
  }
  ```
- **Note:** Creates invitation for unregistered users

#### Remove Group Member
- **DELETE** `/api/groups/:groupId/members/:userId`
- **Access:** Group admin only

#### Get Pending Invitation Statistics
- **GET** `/api/groups/stats/pending-invitations`
- **Response:** Statistics about pending email invitations

### Users

#### Search Users
- **GET** `/api/users/search?query=searchterm`
- **Response:** Array of users matching the search query

### Health Check
- **GET** `/api/health`

## Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Joi schema validation
- **Security Headers**: Helmet.js for security headers
- **CORS**: Cross-Origin Resource Sharing configured

## Email-Based Group Invitations

The system supports inviting users by email, even if they haven't registered yet:

### Member Object Structure
```javascript
{
  email: "user@example.com",
  userId: ObjectId,        // null for unregistered users
  status: "invited",       // "invited" or "active"
  invitedAt: Date,        // when invitation was created
  joinedAt: Date          // when user joined (null for pending)
}
```

### Invitation Flow
1. **Group Creation/Member Addition**: Add members by email address
2. **Invitation Status**: Unregistered users get status "invited" with null userId
3. **User Registration**: When user registers with invited email:
   - System automatically finds pending invitations
   - Updates userId and changes status to "active"
   - Sets joinedAt timestamp

### Background Synchronization
- `syncUserWithGroupInvitations(email, userId)` - Sync single user
- `batchSyncGroupInvitations(users)` - Bulk sync multiple users
- `getPendingInvitationStats()` - Get statistics about pending invitations

## Password Requirements

- Minimum 6 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number
- At least one special character (!@#$%^&*)

## Error Handling

The application includes comprehensive error handling:
- Custom error response class
- MongoDB validation errors
- JWT token errors
- Async error handling
- Global error middleware

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | development |
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/settlio |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRE` | JWT expiration time | 30d |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |

## Development

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (Jest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.