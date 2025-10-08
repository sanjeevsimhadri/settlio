import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from './ui';
import './Layout.css';

const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/dashboard" className="logo">
            <h1>Settlio</h1>
          </Link>
        </div>
        


        <div className="header-right">
          <div className="user-menu">
            <span className="user-name">Hello, {user?.name || user?.username}</span>
            <div className="user-dropdown">
              <Avatar
                src={user?.profilePhoto ? `http://localhost:5000${user.profilePhoto}` : undefined}
                fallback={user?.name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
                size="medium"
                className="dropdown-button avatar-button header-avatar"
                onClick={() => {}}
                alt={`${user?.name || user?.username} profile`}
              />
              <div className="dropdown-content" role="menu">
                <Link to="/profile" className="dropdown-link" role="menuitem">
                  Profile
                </Link>
                <Link to="/settings" className="dropdown-link" role="menuitem">
                  Settings
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="dropdown-link logout"
                  role="menuitem"
                  aria-label="Sign out of your account"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;