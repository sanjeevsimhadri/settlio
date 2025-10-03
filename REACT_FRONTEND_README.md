# Settlio Frontend - React TypeScript App

A modern React frontend application with authentication, routing, and form validation for the Settlio expense splitting platform.

## 🚀 Features

### **Authentication System**
- **JWT Token Management** - Secure token storage in localStorage
- **Authentication Context** - Global auth state management with React Context  
- **Protected Routes** - Route-level authentication guards
- **Auto Token Refresh** - Automatic token validation and cleanup

### **Form Handling & Validation**
- **React Hook Form** - Performance-optimized form handling
- **Yup Validation** - Schema-based form validation
- **Real-time Validation** - Instant feedback as users type
- **Password Strength Indicator** - Visual password requirements

### **Routing & Navigation**
- **React Router v6** - Modern client-side routing
- **Route Protection** - Authentication-based route access
- **Navigation Guards** - Automatic redirects based on auth state
- **Responsive Navigation** - Mobile-friendly header and menu

## 🛠 Installation & Setup

### **Prerequisites**
- Node.js (v16+)
- Backend server running on port 5000

### **Installation**
```bash
# Install dependencies
npm install

# Start development server  
npm start
```

### **Environment Configuration**
The `.env` file is already configured:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=Settlio
```

## 🔐 Authentication Flow

### **Login Process**
1. User submits login form with email/password
2. Form validation (email format, password requirements)
3. API call to backend `/auth/login` endpoint
4. JWT token stored in localStorage on success
5. User info fetched and stored in React Context
6. Automatic redirect to dashboard

### **Registration Process**  
1. User submits registration form
2. Comprehensive validation (username, email, password strength)
3. API call to backend `/auth/register` endpoint
4. Automatic login after successful registration
5. JWT token and user info stored in context
6. Redirect to dashboard

## 🎨 UI Components

### **Authentication Forms**
- **Responsive Design** with mobile-first approach
- **Loading States** with spinners during API calls
- **Error Handling** with clear, user-friendly messages
- **Accessibility** with proper form labels and ARIA attributes
- **Password Requirements** with real-time validation feedback

### **Dashboard**
- **Quick Stats** showing expense overview
- **Recent Activity** displaying latest transactions  
- **Quick Actions** for common tasks
- **Account Information** with profile details

## 📡 API Integration

The app connects to your Node.js backend with automatic:
- **Token inclusion** in all authenticated requests
- **Error handling** with automatic logout on 401 responses
- **CORS configuration** for development environment

### **Available Endpoints**
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/me` - Update user profile

## 🔒 Form Validation

### **Login Requirements**
- Valid email format
- Password minimum 6 characters

### **Registration Requirements**
- Username: 3-30 alphanumeric characters
- Email: Valid format
- Password: Minimum 6 characters with uppercase, lowercase, number, and special character
- Password confirmation must match

## 🚦 Routing

### **Public Routes** (redirect to dashboard if authenticated)
- `/login` - Login form
- `/register` - Registration form

### **Protected Routes** (require authentication)
- `/dashboard` - Main dashboard (fully implemented)
- `/groups` - Group management (placeholder)
- `/expenses` - Expense tracking (placeholder)
- `/profile` - User profile (placeholder)

## 🚀 Available Scripts

```bash
npm start          # Start development server (http://localhost:3000)
npm build          # Build for production
npm test           # Run test suite
```

## 🔧 Development

The app is configured for seamless development:
- **Hot reload** for instant updates
- **TypeScript** for type safety
- **Proxy setup** to backend API  
- **Modern React patterns** with hooks and context

## 🎯 Next Steps

The authentication system is complete and ready. You can now:

1. **Start the React app**: `npm start`
2. **Test authentication** with the forms
3. **Add group management** features
4. **Implement expense tracking** components
5. **Connect to your backend APIs**

---

**Your React frontend is fully integrated with the Node.js backend! 🎉**

Navigate to `http://localhost:3000` to see the authentication system in action.