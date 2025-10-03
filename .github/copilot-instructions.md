# Settlio Project - Copilot Instructions

This is a Node.js expense sharing application with email-based group invitations.

## Project Status

- [x] **Project Requirements Clarified** - Node.js backend with Express, MongoDB/Mongoose, JWT authentication
- [x] **Project Scaffolded** - Complete Node.js/Express project structure created with full authentication system
- [x] **Project Customized** - Full authentication system with JWT, User model, Group model with email invitations, validation, and security features implemented
- [x] **Extensions Installed** - No additional extensions needed for this Node.js project
- [x] **Project Compiled** - Dependencies installed successfully with no errors
- [x] **Tasks Created** - Development server running on port 5000 with nodemon for auto-reload
- [x] **Project Launched** - Server launched and running successfully with MongoDB connection
- [x] **Documentation Complete** - README.md and copilot-instructions.md files created and updated

## Key Features Implemented

### Email-Based Group System
- Groups support adding members by email address
- Unregistered users receive "invited" status with pending invitations
- User registration automatically syncs with pending group invitations
- Member objects contain: email, userId (optional), status, invitedAt, joinedAt

### API Endpoints
- Authentication: register, login, profile management with invitation sync
- Groups: CRUD operations, member management, pending invitation statistics
- Users: search functionality
- Background utilities for invitation synchronization

### Technical Stack
- **Backend**: Node.js, Express.js, MongoDB Atlas, Mongoose ODM
- **Authentication**: JWT with bcrypt password hashing  
- **Validation**: Joi schemas for request validation
- **Security**: Helmet, CORS, rate limiting, input sanitization
- **Development**: Nodemon for auto-reload, comprehensive error handling

## Current Project Structure
```
settlio/
├── src/
│   ├── config/database.js - MongoDB connection
│   ├── controllers/ - Authentication, Groups, Users, Expenses, Debts
│   ├── middleware/ - JWT auth, error handling
│   ├── models/ - User, Group with member management
│   ├── routes/ - API route definitions
│   └── utils/ - Validation, error handling, group synchronization
├── .env - Environment configuration
└── server.js - Application entry point
```

## Development Server
- Running on port 5000 with nodemon
- MongoDB Atlas connection established
- All API endpoints functional and tested