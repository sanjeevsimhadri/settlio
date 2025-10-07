import React, { useState } from 'react';
import { Card } from '../components/ui';
import { PersonalDetailsForm, PasswordChangeForm, ProfilePhotoForm } from '../components/profile';
import { useAuth } from '../contexts/AuthContext';
import './Profile.css';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('personal');

  const sections = [
    { id: 'personal', label: 'Personal Details', icon: '👤' },
    { id: 'security', label: 'Password & Security', icon: '🔒' },
    { id: 'photo', label: 'Profile Photo', icon: '📷' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'personal':
        return <PersonalDetailsForm />;
      case 'security':
        return <PasswordChangeForm />;
      case 'photo':
        return <ProfilePhotoForm />;
      default:
        return <PersonalDetailsForm />;
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <h1 className="profile-title">Profile Settings</h1>
          <p className="profile-subtitle">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="profile-layout">
          {/* Navigation Sidebar */}
          <div className="profile-nav">
            <nav className="profile-nav-list">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`profile-nav-item ${
                    activeSection === section.id ? 'active' : ''
                  }`}
                >
                  <span className="profile-nav-icon">{section.icon}</span>
                  <span className="profile-nav-label">{section.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="profile-content">
            <Card variant="elevated" className="profile-card">
              <div className="profile-card-header">
                <h2 className="profile-section-title">
                  {sections.find(s => s.id === activeSection)?.label}
                </h2>
                <p className="profile-section-subtitle">
                  {activeSection === 'personal' && 'Update your personal information and contact details'}
                  {activeSection === 'security' && 'Change your password and security settings'}
                  {activeSection === 'photo' && 'Upload and manage your profile photo'}
                </p>
              </div>
              
              <div className="profile-card-content">
                {renderContent()}
              </div>
            </Card>
          </div>
        </div>

        {/* User Info Summary (Mobile) */}
        <div className="profile-summary md:hidden">
          <div className="profile-summary-content">
            <div className="profile-summary-avatar">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="profile-summary-info">
              <h3 className="profile-summary-name">{user?.username}</h3>
              <p className="profile-summary-email">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;