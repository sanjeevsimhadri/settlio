import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
        
        <nav className="header-nav">
          <Link to="/dashboard" className="nav-link">
            Dashboard
          </Link>
          <Link to="/groups" className="nav-link">
            Groups
          </Link>
          <Link to="/expenses" className="nav-link">
            Expenses
          </Link>
        </nav>

        <div className="header-right">
          <div className="user-menu">
            <span className="user-name">Hello, {user?.username}</span>
            <div className="user-dropdown">
              <button className="dropdown-button">
                {user?.username?.charAt(0).toUpperCase()}
              </button>
              <div className="dropdown-content">
                <Link to="/profile" className="dropdown-link">
                  Profile
                </Link>
                <Link to="/settings" className="dropdown-link">
                  Settings
                </Link>
                <button onClick={handleLogout} className="dropdown-link logout">
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