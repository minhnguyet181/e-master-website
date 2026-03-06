import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import Navbar from '../../components/Navbar';
import { updateUserProfile } from '../../services/resourceService';

const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const PencilIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L15.232 5.232z" />
    </svg>
);

const Profile = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState({
        name: 'Alex Doe',
        email: 'alex.doe@example.com',
        avatar: 'https://picsum.photos/seed/user1/200',
        englishLevel: 'Intermediate',
        learningGoals: 'I want to improve my business English communication skills for international meetings and presentations. I also aim to expand my vocabulary related to technology and finance.',
    });
    
    const [isEditing, setIsEditing] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const fileInputRef = useRef(null);
    const [initialProfile, setInitialProfile] = useState(profile);

    const handleAvatarChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
                setProfile(prev => ({ ...prev, avatar: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    // Avatar click - only trigger edit when in editing mode
    const handleAvatarClick = () => {
        if (isEditing && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleAvatarKeyDown = (e) => {
        if (isEditing && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            fileInputRef.current?.click();
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleEditClick = () => {
        setInitialProfile(profile);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setProfile(initialProfile);
        setAvatarPreview(null);
        setIsEditing(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveError('');
        
        try {
            const result = await updateUserProfile(profile);
            if (result.success) {
                console.log('Profile saved:', result.user);
                setInitialProfile(profile);
                setIsEditing(false);
                setAvatarPreview(null);
            } else {
                setSaveError(result.message || 'Failed to save profile');
            }
        } catch (err) {
            setSaveError('Error saving profile. Please try again.');
            console.error('Profile save error:', err);
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <div>
            <Navbar />
            <main className="profile-page-wrapper">
            <div className={"profile-container" + (isEditing ? " editing" : "")}>
            <h1 className="profile-title top">My Profile</h1>

            <form onSubmit={handleSubmit}>
                {saveError && <div className="error-message" style={{color: '#d32f2f', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#ffebee', borderRadius: '4px'}}>{saveError}</div>}
                {/* Inline title shown only when editing (moves into the right column) */}
                <h1 className="profile-title inline">My Profile</h1>
                <div className="avatar-section">
                    <div
                        className="avatar-wrapper"
                        role="button"
                        tabIndex={0}
                        onClick={handleAvatarClick}
                        onKeyDown={handleAvatarKeyDown}
                        aria-label="Open profile"
                    >
                        <img 
                            src={avatarPreview || profile.avatar} 
                            alt="User Avatar"
                            className="avatar-image"
                        />
                        {isEditing && (
                             <div
                                className="avatar-overlay"
                                aria-label="Change avatar"
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            >
                                <CameraIcon />
                            </div>
                        )}
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="file-input" 
                        accept="image/*"
                        onChange={handleAvatarChange}
                        disabled={!isEditing}
                    />
                </div>

                <div className="form-fields">
                    <div>
                        <label htmlFor="name" className="form-label">Full Name</label>
                        {isEditing ? (
                            <input type="text" id="name" name="name" value={profile.name} onChange={handleInputChange} className="form-control" />
                        ) : (
                            <p className="display-text">{profile.name}</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="email" className="form-label">Email Address</label>
                        {isEditing ? (
                            <input type="email" id="email" name="email" value={profile.email} onChange={handleInputChange} className="form-control" />
                        ) : (
                            <p className="display-text">{profile.email}</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="englishLevel" className="form-label">English Level</label>
                        {isEditing ? (
                            <select id="englishLevel" name="englishLevel" value={profile.englishLevel} onChange={handleInputChange} className="form-control">
                                <option>Beginner</option>
                                <option>Intermediate</option>
                                <option>Advanced</option>
                                <option>Fluent</option>
                            </select>
                        ) : (
                            <p className="display-text">{profile.englishLevel}</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="learningGoals" className="form-label">Learning Goals</label>
                        {isEditing ? (
                            <textarea id="learningGoals" name="learningGoals" value={profile.learningGoals} onChange={handleInputChange} rows={4} className="form-control"></textarea>
                        ) : (
                            <p className="display-text display-text-area">{profile.learningGoals}</p>
                        )}
                    </div>
                </div>

                <div className="actions-container">
                    {isEditing ? (
                        <>
                            <button type="button" onClick={handleCancel} className="btn btn-secondary">
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </>
                    ) : (
                        <button type="button" onClick={handleEditClick} className="btn btn-primary" disabled={isSaving}>
                            <PencilIcon />
                            Edit Profile
                        </button>
                    )}
                </div>
            </form>
            </div>
            </main>
        </div>
    );
};

export default Profile;
