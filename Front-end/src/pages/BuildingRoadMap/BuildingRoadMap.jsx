import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './BuildingRoadMap.css';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';

// --- ICONS ---
const BrainIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 01-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 013.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 013.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 01-3.09 3.09zM18.25 12L17 14.25l-1.25-2.25L13.5 11l2.25-1.25L17 7.5l1.25 2.25L20.5 11l-2.25 1.25z" />
    </svg>
);
const ChatBubbleIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.006 3 11.5c0 2.456 1.413 4.634 3.5 6.024.22.162.338.41.338.667v2.333a.75.75 0 001.2.6l2.08-1.56a.75.75 0 01.59-.09A9.01 9.01 0 0012 20.25z" />
    </svg>
);
const TrophyIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9.75 9.75 0 100-13.5h9a9.75 9.75 0 100 13.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 12.75L9 15l-1.5-1.5" />
    </svg>
);
const CheckIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
);
const ChevronDownCircleIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// --- HERO SECTION ---
const Hero = () => (
    <header className="hero-section">
        <div className="container">
            <h1>AI-Powered IELTS Learning Roadmap</h1>
            <p>Achieve your target score with a personalized study plan designed just for you. The expected completion time is 3 months, assuming a study commitment of 6 hours per week.</p>
             <div className="avatar-group">
                <div className="avatars-row">
                    <span className="avatar"></span>
                    <span className="avatar"></span>
                    <span className="avatar"></span>
                </div>
                <div className="avatar-label">500,000+ students have studied IELTS with E-Master</div>
            </div>
        </div>
    </header>
);

// --- OVERVIEW SECTION ---
const Overview = () => (
    <section className="overview-section">
        <div className="container">
            <h2>Roadmap Overview</h2>
            <div className="overview-grid">
                <div className="overview-card">
                    <BrainIcon className="overview-icon" />
                    <h3>AI-Powered Customization</h3>
                    <p>Designed by AI to perfectly match your goals and available study time.</p>
                </div>
                <div className="overview-card">
                    <ChatBubbleIcon className="overview-icon" />
                    <h3>Interactive AI Tutoring</h3>
                    <p>Chat with our AI for detailed feedback, corrections, and answers to your questions.</p>
                </div>
                <div className="overview-card">
                    <TrophyIcon className="overview-icon" />
                    <h3>Guaranteed Score Improvement</h3>
                    <p>We are committed to helping you achieve your target band score.</p>
                </div>
            </div>
        </div>
    </section>
);


// --- LEARNING PATH ---
const LearningPath = () => {
    const navigate = useNavigate();
    const [activeLevel, setActiveLevel] = useState('IELTS 4.0 - 4.5');
    const [activeGoal, setActiveGoal] = useState('IELTS 5.0+');
    const levels = ['Basic - IELTS 3.5', 'IELTS 4.0 - 4.5', 'IELTS 5.0 - 5.5', 'IELTS 6.0 - 6.5'];
    const goals = ['IELTS 5.0+', 'IELTS 6.0+', 'IELTS 6.5 - 7.0+'];
    return (
        <section className="learning-path">
            <div className="container">
                <div className="learning-path-card">
                    <h2>Hello!</h2>
                    <p>Design your own learning path, right here!</p>
                    <div className="learning-path-interactive-area">
                        <div className="learning-path-grid">
                            <div>
                                <h3>My Level</h3>
                                <div className="options-box">
                                    {levels.map(level => (
                                        <button key={level} onClick={() => setActiveLevel(level)} className={`option-btn ${activeLevel === level ? 'active' : ''}`}>{level}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3>My Goal</h3>
                                <div className="options-box">
                                    {goals.map(goal => (
                                        <button key={goal} onClick={() => setActiveGoal(goal)} className={`option-btn ${activeGoal === goal ? 'active' : ''}`}>{goal}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <p className="entrance-test-link">Not sure about your level? <a href="#">Take the entrance test</a></p>
                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <button
                                type="button"
                                className="cta-button"
                                onClick={() => navigate('/user/generate-plan')}
                                style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: '#4C82F7', color: '#fff', cursor: 'pointer' }}
                            >
                                Generate
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="section-connector"><ChevronDownCircleIcon className="connector-icon" /></div>
        </section>
    );
};

// --- ENROLLMENT SECTION ---
const Enrollment = () => (
    <section className="enrollment-section">
        <div className="container">
            <div className="enrollment-card">
                <h3>Learn and practice comprehensively</h3>
                <button className="cta-button">Enroll Now</button>
                <div className="benefits">
                    <h4>PRIVILEGES</h4>
                    <ul className="benefits-list">
                        <li><CheckIcon className="check-icon" /> Possess a deeply integrated, specialized curriculum.</li>
                        <li><CheckIcon className="check-icon" /> Practice Listening & Reading with detailed answer explanations.</li>
                        <li><CheckIcon className="check-icon" /> Get detailed feedback on Speaking & Writing from our 8.0+ AI Tutors.</li>
                        <li><CheckIcon className="check-icon" /> Personalize your study plan in a specialized way.</li>
                        <li><CheckIcon className="check-icon" /> Get 10X the practice time for Speaking & Writing with AI Virtual Tutors.</li>
                        <li><CheckIcon className="check-icon" /> Be guided by Teacher Bee AI throughout every lesson.</li>
                        <li><CheckIcon className="check-icon" /> Access a repository of ideas & model essays standardized by former IELTS examiners.</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>
);


// --- MAIN PAGE COMPONENT ---
const BuildingRoadmap = () => {
    return (
        <div className="dashboard-layout page-wrapper">
            <Navbar />
            <div className="dashboard-content">
                <Sidebar />
                <main className="dashboard-main">
                    <Hero />
                    <Overview />
                    <LearningPath />
                    <Enrollment />
                    <footer className="page-footer">
                        <p>&copy; 2024 E-Master. All rights reserved.</p>
                    </footer>
                </main>
            </div>
        </div>
    );
};

export default BuildingRoadmap;