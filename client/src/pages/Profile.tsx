import React, { useState } from 'react';
import { Card } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { PersonalDetailsForm, PasswordChangeForm, ProfilePhotoForm } from '../components/profile';
import './Profile.css';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'personal' | 'password' | 'photo'>('personal');

  const sections = [
    {
      id: 'personal' as const,
      title: 'Personal Details',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      description: 'Manage your name, email, and contact information'
    },
    {
      id: 'password' as const,
      title: 'Password & Security',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      description: 'Update your password and security settings'
    },
    {
      id: 'photo' as const,
      title: 'Profile Photo',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      description: 'Upload and manage your profile photo'
    }
  ];

  const handleSectionSave = () => {
    // Could add toast notification here if needed
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'personal':
        return <PersonalDetailsForm onSave={handleSectionSave} />;
      case 'password':
        return <PasswordChangeForm onSave={handleSectionSave} />;
      case 'photo':
        return <ProfilePhotoForm onSave={handleSectionSave} />;
      default:
        return <PersonalDetailsForm onSave={handleSectionSave} />;
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-page__container">
        {/* Page Header */}
        <div className="profile-page__header">
          <div className="profile-page__header-content">
            <h1 className="profile-page__title">Profile Settings</h1>
            <p className="profile-page__subtitle">
              Manage your account information and preferences
            </p>
          </div>
          
          <div className="profile-page__user-info">
            <div className="profile-page__user-details">
              <h2 className="profile-page__user-name">{user?.username}</h2>
              <p className="profile-page__user-email">{user?.email}</p>
              <p className="profile-page__member-since">
                Member since {new Date(user?.createdAt || '').toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long'
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="profile-page__content">
          {/* Navigation Sidebar */}
          <div className="profile-page__sidebar">
            <nav className="profile-page__nav">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`profile-page__nav-item ${
                    activeSection === section.id ? 'profile-page__nav-item--active' : ''
                  }`}
                >
                  <div className="profile-page__nav-icon">
                    {section.icon}
                  </div>
                  <div className="profile-page__nav-content">
                    <span className="profile-page__nav-title">{section.title}</span>
                    <span className="profile-page__nav-description">{section.description}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="profile-page__main">
            <Card variant="elevated" padding="large">
              <div className="profile-page__section">
                <div className="profile-page__section-header">
                  <div className="profile-page__section-header-content">
                    <div className="profile-page__section-icon">
                      {sections.find(s => s.id === activeSection)?.icon}
                    </div>
                    <div className="profile-page__section-text">
                      <h2 className="profile-page__section-title">
                        {sections.find(s => s.id === activeSection)?.title}
                      </h2>
                      <p className="profile-page__section-description">
                        {sections.find(s => s.id === activeSection)?.description}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="profile-page__section-content">
                  {renderActiveSection()}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;