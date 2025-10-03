import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Header from './components/Header';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginForm />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterForm />
                  </PublicRoute>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Placeholder routes for future implementation */}
              <Route
                path="/groups"
                element={
                  <ProtectedRoute>
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                      <h2>Groups</h2>
                      <p>Groups management coming soon...</p>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/expenses"
                element={
                  <ProtectedRoute>
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                      <h2>Expenses</h2>
                      <p>Expense management coming soon...</p>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                      <h2>Profile</h2>
                      <p>Profile management coming soon...</p>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                      <h2>Settings</h2>
                      <p>Settings coming soon...</p>
                    </div>
                  </ProtectedRoute>
                }
              />

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* 404 Route */}
              <Route
                path="*"
                element={
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <h2>Page Not Found</h2>
                    <p>The page you're looking for doesn't exist.</p>
                  </div>
                }
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
