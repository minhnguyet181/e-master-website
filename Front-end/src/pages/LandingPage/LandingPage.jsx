import React, { useState } from 'react';
import '../LandingPage/LandingPage.css';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
// reuse the homepage hero image for the landing banner
import heroImage from '../../images copy/homepage3.png';

// Note: In a real app with routing, you would use <Link> from react-router-dom
// For this self-contained example, we'll use <a> tags.

// --- ICONS (ALL CONSOLIDATED HERE) ---
const ChevronUpIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" /></svg> );
const StarIcon = ({ className, filled = true }) => ( <svg className={`${className} ${filled ? 'star-icon-filled' : 'star-icon-empty'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.007z" clipRule="evenodd" /></svg> );
const SparkIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" ><path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 0 1 .75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 0 1 9.75 22.5a.75.75 0 0 1-.75-.75v-7.19c0-.478.362-.875.834-.944.472-.07.923.182 1.15.587a.75.75 0 0 0 1.298-.75Z" clipRule="evenodd" /></svg> );
const PersonalizedLearningIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg> );
const IeltsToeflPrepIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg> );
const AiSupportIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 21.75l-.648-1.188a2.25 2.25 0 01-1.423-1.423L13.25 18.5l1.188-.648a2.25 2.25 0 011.423 1.423l.648 1.188z" /></svg> );
const FlexibleScheduleIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> );
const LearningCommunityIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962c.513-.96 1.487-1.573 2.591-1.573V12m-1.518-1.445L18.75 5.25m-1.518-1.445a2.25 2.25 0 013.036 3.036L18.75 5.25" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 18v.75a3.375 3.375 0 01-3.375 3.375H8.25a3.375 3.375 0 01-3.375-3.375v-1.5c0-.969.786-1.75 1.75-1.75h1.5a1.75 1.75 0 011.75 1.75v.75" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 13.5v.75a3.375 3.375 0 003.375 3.375H13.5" /></svg> );
const ProgressTrackingIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 1.5m1-1.5l1 1.5m0 0l-1 1.5m1-1.5l1 1.5M9 16.5l-1-1.5" /></svg> );
const ListeningIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" /></svg> );
const ReadingIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg> );
const SpeakingIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" /></svg> );
const WritingIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg> );
const ChevronDownCircleIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m9 12.75 3 3m0 0 3-3m-3 3v-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg> );
const FacebookIcon = ({ className }) => ( <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12Z" clipRule="evenodd" /></svg> );
const InstagramIcon = ({ className }) => ( <svg className={`${className} social-icon-instagram`} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 0 1 1.772 1.153 4.902 4.902 0 0 1 1.153 1.772c.247.636.416 1.363.465 2.427.048 1.024.06 1.378.06 3.808s-.012 2.784-.06 3.808c-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 0 1-1.153 1.772 4.902 4.902 0 0 1-1.772 1.153c-.636.247-1.363.416-2.427.465-1.024.048-1.378.06-3.808.06s-2.784-.012-3.808-.06c-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 0 1-1.772-1.153 4.902 4.902 0 0 1-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.048-1.024-.06-1.378-.06-3.808s.012-2.784.06-3.808c.049-1.064.218-1.791.465-2.427a4.902 4.902 0 0 1 1.153-1.772A4.902 4.902 0 0 1 6.08 2.525c.636-.247 1.363-.416 2.427-.465C9.53 2.013 9.884 2 12.315 2Z" clipRule="evenodd" /><path fillRule="evenodd" d="M12 6.857a5.143 5.143 0 1 0 0 10.286 5.143 5.143 0 0 0 0-10.286ZM6.857 12a5.143 5.143 0 1 1 10.286 0 5.143 5.143 0 0 1-10.286 0Z" clipRule="evenodd" /><path d="M16.804 6.116a1.286 1.286 0 1 1-2.572 0 1.286 1.286 0 0 1 2.572 0Z" /></svg> );
const YoutubeIcon = ({ className }) => ( <svg className={`${className} social-icon-youtube`} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.78 22 12 22 12s0 3.22-.42 4.814c-.23.861-.907 1.538-1.768 1.768C18.22 19 12 19 12 19s-6.22 0-7.812-.42c-.861-.23-1.538-.907-1.768-1.768C2.002 15.22 2 12 2 12s0-3.22.42-4.814c.23-.861.907-1.538 1.768-1.768C5.78 5 12 5 12 5s6.22 0 7.812.418ZM15.19 12 10 8.814v6.372L15.19 12Z" clipRule="evenodd" /></svg> );
const ChatbotIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.026 3.348 3.97v6.02c0 1.943-1.37 3.678-3.348 3.97a48.901 48.901 0 0 1-3.476.383.39.39 0 0 0-.297.15l-2.11 2.637a.39.39 0 0 1-.595 0l-2.11-2.637a.39.39 0 0 0-.297-.15 48.9 48.9 0 0 1-3.476-.384c-1.978-.29-3.348-2.026-3.348-3.97V6.74c0-1.944 1.37-3.68 3.348-3.97ZM6.75 8.25a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H7.5Z" clipRule="evenodd" /></svg> );


// --- FEATURES ---
const FeatureCard = ({ icon, title, description }) => (
  <div className="feature-card">
    <div className="feature-icon-wrapper">{icon}</div>
    <div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-description">{description}</p>
    </div>
  </div>
);

const Features = () => {
  const features = [
    { icon: <PersonalizedLearningIcon className="feature-icon" />, title: 'Personalized Learning', description: 'Get a customized study plan that adapts to your level, pace, and goals—so you learn smarter, not harder.' },
    { icon: <IeltsToeflPrepIcon className="feature-icon" />, title: 'IELTS/TOEFL Preparation', description: 'Master international exams with structured practice, proven strategies, and expert guidance.' },
    { icon: <AiSupportIcon className="feature-icon" />, title: 'AI-Powered Support', description: 'Instant, personalized assistance from AI tools to help you stay on track and improve faster.' },
    { icon: <FlexibleScheduleIcon className="feature-icon" />, title: 'Flexible Schedule', description: 'Study anytime, anywhere. Your learning fits around your life, not the other way around.' },
    { icon: <LearningCommunityIcon className="feature-icon" />, title: 'Learning Community', description: 'Join a vibrant community of learners to practice, share experiences, and stay motivated together.' },
    { icon: <ProgressTrackingIcon className="feature-icon" />, title: 'Progress Tracking', description: 'Track your progress with detailed reports and receive actionable feedback to keep improving every day.' },
  ];

  return (
    <section className="features">
      <div className="container">
        <div className="features-header">
            <div className="features-title-wrapper">
                <h2>Why Our IELTS/TOEIC Learning Platform Works for You</h2>
            </div>
            <button className="btn btn-outline">Explore All Features</button>
        </div>
        <div className="features-subtext">
            <SparkIcon className="spark-icon" />
            <span>Your path to IELTS/TOEIC success – smarter, faster, and more effective.</span>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => <FeatureCard key={index} {...feature} />)}
        </div>
      </div>
    </section>
  );
};

// --- SKILLS ---
const SkillCard = ({ icon, title, description, keyTopics, cardClass, theme }) => {
    return (
        <div className={`skill-card ${cardClass}`}>
            <div>
                <div className={`skill-icon-background ${theme.bg}`}>
                    <div className="skill-icon-container">
                            {React.cloneElement(icon, { className: `skill-icon ${theme.text}` })}
                    </div>
                </div>
            </div>

            {/* top area: icon/title/description - flexible so topics align across cards */}
            <div className="skill-top">
                <h3>{title}</h3>
                <p className="skill-description">{description}</p>
            </div>

            <div className="skill-topics">
                <p className="skill-topics-title">Key Topics:</p>
                <ul>{keyTopics.map((topic, index) => <li key={index}>{topic}</li>)}</ul>
            </div>
            <button className={`btn-start-learning ${theme.btn}`}>Start learning</button>
        </div>
    );
};

const Skills = () => {
    const themes = {
        listening: { bg: 'bg-blue', text: 'text-blue', btn: 'btn-blue' },
        reading: { bg: 'bg-green', text: 'text-green', btn: 'btn-green' },
        speaking: { bg: 'bg-purple', text: 'text-purple', btn: 'btn-purple' },
        writing: { bg: 'bg-yellow', text: 'text-yellow', btn: 'btn-yellow' },
    };
    const skillsData = [
        { icon: <ListeningIcon />, title: 'Listening', description: 'Master IELTS listening with authentic audio materials and practice tests.', keyTopics: ['Academic Lectures', 'Conversations', 'Monologues', 'Note-taking Skills'], cardClass: 'listening', theme: themes.listening },
        { icon: <ReadingIcon />, title: 'Reading', description: 'Improve reading comprehension and speed with diverse academic texts.', keyTopics: ['Academic Tests', 'Skimming & Scanning', 'Question Types', 'Time Management'], cardClass: 'reading', theme: themes.reading },
        { icon: <SpeakingIcon />, title: 'Speaking', description: 'Build confidence in speaking with interactive practice sessions.', keyTopics: ['Part 1 Interview', 'Part 2 Long Turn', 'Part 3 Discussion', 'Pronunciation'], cardClass: 'speaking', theme: themes.speaking },
        { icon: <WritingIcon />, title: 'Writing', description: 'Learn to write clear, well-structured essays and reports.', keyTopics: ['Task 1 Reports', 'Task 2 Essays', 'Grammar & Vocabulary', 'Band Score Criteria'], cardClass: 'writing', theme: themes.writing },
    ];
    return (
        <section className="skills">
            <div className="container">
                <div className="skills-header">
                    <h2>Master All Four IELTS Skills</h2>
                    <p>Comprehensive courses designed to boost your band score in every section.</p>
                </div>
                <div className="skills-grid">
                    {skillsData.map((skill, index) => <SkillCard key={index} {...skill} />)}
                </div>
            </div>
        </section>
    );
};

// --- LEARNING PATH ---
const LearningPath = () => {
    const [activeLevel, setActiveLevel] = useState('Basic - IELTS 3.5');
    const [activeGoal, setActiveGoal] = useState('IELTS 5.0');
    const levels = ['Basic - IELTS 3.5', 'IELTS 3.5 - 5.0', 'IELTS 5.0 - 6.0', 'IELTS 6.0 - 7.0'];
    const goals = ['IELTS 5.0', 'IELTS 6.0+', 'IELTS 7.0+'];
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
                    </div>
                </div>
            </div>
            <div className="section-connector"><ChevronDownCircleIcon className="connector-icon" /></div>
        </section>
    );
};

// Feedback and FAQ sections removed from landing page by request.

// --- FOOTER ---
const PageFooter = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-logo-column">
                        <div className="logo">
                            <img src="https://emasters.io.vn/images/Logo.png" alt="E-Master Logo" className="logo-img"/>
                            <span className="logo-text">E-Master</span>
                        </div>
                    </div>
                    <div className="footer-links-column">
                        <h3>Home</h3>
                        <ul>
                            <li><a href="#">All the exercises</a></li>
                            <li><a href="#">English pronunciation</a></li>
                            <li><a href="#">Test level</a></li>
                        </ul>
                    </div>
                    <div className="footer-links-column">
                        <h3>Courses</h3>
                        <ul>
                            <li><a href="#">IELTS</a></li>
                            <li><a href="#">TOEIC</a></li>
                        </ul>
                    </div>
                    <div className="footer-links-column">
                        <h3>Student Support</h3>
                        <ul>
                            <li><a href="#">FAQ</a></li>
                        </ul>
                    </div>
                    <div className="footer-links-column">
                        <h3>About E-Master</h3>
                        <ul>
                            <li><a href="#">AI usage policy</a></li>
                            <li><a href="#">Terms and Conditions</a></li>
                            <li><a href="#">Privacy Policy</a></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2025 E-Master.com</p>
                    <div className="footer-socials">
                        <h3>Stay Connected</h3>
                        <a href="#"><FacebookIcon className="social-icon" /></a>
                        <a href="#"><InstagramIcon className="social-icon" /></a>
                        <a href="#"><YoutubeIcon className="social-icon" /></a>
                    </div>
                </div>
            </div>
            <div className="chatbot-container">
                <button className="chatbot-button">
                    <ChatbotIcon className="chatbot-icon" />
                </button>
            </div>
        </footer>
    );
};

// --- LANDINGPAGE COMPONENT ---
const Landingpage = () => {
        return (
            <div className="dashboard-layout">
                <Navbar />
                <div className="dashboard-content">
                    <Sidebar />
                    <main className="dashboard-main landing-page-main">
                        <div className="landing-page-wrapper">

                            {/* Banner / Hero (adapted from Homepage) */}
                            <section className="hero">
                                <div className="container hero-content-container">
                                    <div className="hero-content">
                                        <div className="hero-text">
                                            <h1>Comprehensive IELTS/TOEIC Study & Practice Roadmap</h1>
                                            <p>Master English step by step with a clear roadmap tailored for IELTS & TOEIC success. Boost your skills with proven strategies and practice materials designed to help you achieve your goals.</p>
                                            <div className="hero-actions">
                                                <button className="btn btn-start">Start Now</button>
                                            </div>
                                        </div>
                                        <div className="hero-image-container">
                                            <img src={heroImage} alt="Students" className="hero-image" />
                                        </div>
                                    </div>
                                </div>
                                <div className="hero-wave">
                                    <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                        <path d="M0 50C240 20 480 20 720 50C960 80 1200 80 1440 50V100H0V50Z"></path>
                                    </svg>
                                </div>
                            </section>

                            <main className="landing-page-content">
                                <Features />
                                <Skills />
                                <LearningPath />
                                {/* Feedback and FAQ removed as requested */}
                            </main>

                            <PageFooter />
                        </div>
                    </main>
                </div>
            </div>
        );
    };

export default Landingpage;
