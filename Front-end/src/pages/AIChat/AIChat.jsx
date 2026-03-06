import React, { useState } from 'react';
import Navbar from '../../components/Navbar'; 
import Sidebar from '../../components/Sidebar';
import api from '../../api/api';
import '../AIChat/AIChat.css';

// --- SVG Icons ---

const BrainIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v0A2.5 2.5 0 0 1 9.5 7v0A2.5 2.5 0 0 1 7 4.5v0A2.5 2.5 0 0 1 9.5 2z" />
        <path d="M14.5 2A2.5 2.5 0 0 1 17 4.5v0A2.5 2.5 0 0 1 14.5 7v0A2.5 2.5 0 0 1 12 4.5v0A2.5 2.5 0 0 1 14.5 2z" />
        <path d="M12 12a2.5 2.5 0 0 0 2.5 2.5v0A2.5 2.5 0 0 0 12 17v0A2.5 2.5 0 0 0 9.5 14.5v0A2.5 2.5 0 0 0 12 12z" />
        <path d="M4.5 12A2.5 2.5 0 0 1 7 14.5v0a2.5 2.5 0 0 1-2.5 2.5v0A2.5 2.5 0 0 1 2 14.5v0A2.5 2.5 0 0 1 4.5 12z" />
        <path d="M19.5 12a2.5 2.5 0 0 1 2.5 2.5v0a2.5 2.5 0 0 1-2.5 2.5v0a2.5 2.5 0 0 1-2.5-2.5v0a2.5 2.5 0 0 1 2.5-2.5z" />
        <path d="M12 22a2.5 2.5 0 0 0-2.5-2.5v0A2.5 2.5 0 0 0 12 17v0a2.5 2.5 0 0 0 2.5 2.5v0A2.5 2.5 0 0 0 12 22z" />
        <path d="M4.5 9.5A2.5 2.5 0 0 0 7 7v0a2.5 2.5 0 0 0-2.5-2.5v0A2.5 2.5 0 0 0 2 7v0a2.5 2.5 0 0 0 2.5 2.5z" />
        <path d="M19.5 9.5a2.5 2.5 0 0 0 2.5-2.5v0a2.5 2.5 0 0 0-2.5-2.5v0a2.5 2.5 0 0 0-2.5 2.5v0a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
);
const SparklesIcon = () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 0L11.7556 6.0595L17.5 7.1459L12.8778 11.219L14.4333 17L10 13.595L5.56667 17L7.12222 11.219L2.5 7.1459L8.24444 6.0595L10 0Z" fill="#75A5E4" /><path d="M17.5 14L18.1278 16.0198L20 16.4298L18.5556 17.7398L19.0889 19.5L17.5 18.5298L15.9111 19.5L16.4444 17.7398L15 16.4298L16.8722 16.0198L17.5 14Z" fill="#75A5E4" /></svg>;
const ChevronDownIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6L8 10L12 6" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const EmojiIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>;

const AIChat = () => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'ai',
            text: "Hello! Welcome to your personalized IELTS practice session. I'm here to help you master the skills needed to ace your exam. Let's get started! What's on your mind today? ✨"
        }
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState('');

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;

        const userMessage = {
            id: messages.length + 1,
            sender: 'user',
            name: 'User',
            avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
            text: newMessage
        };

        setMessages([...messages, userMessage]);
        setNewMessage('');
        setIsTyping(true);
        setError('');

        try {
            const response = await api.ai.chat(newMessage);
            
            const assistantReply = response.data.payload?.text || response.data.text || response.data;
            
            const aiResponse = {
                id: messages.length + 2,
                sender: 'ai',
                text: typeof assistantReply === 'string' ? assistantReply : 'I received your message but encountered an issue processing it.'
            };
            
            setIsTyping(false);
            setMessages(prevMessages => [...prevMessages, aiResponse]);
        } catch (err) {
            setIsTyping(false);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to get response from AI Coach';
            setError(errorMessage);
            console.error('Chat error:', err);
            
            // Add error message to chat
            const errorResponse = {
                id: messages.length + 2,
                sender: 'ai',
                text: `Sorry, I encountered an error: ${errorMessage}. Please try again.`
            };
            setMessages(prevMessages => [...prevMessages, errorResponse]);
        }
    };

    return (
        <div className="dashboard-layout">
            <Navbar />
            <div className="dashboard-content">
                <Sidebar />
                <main className="dashboard-main">
                    <div className="ai-chat-page">
                        <div className="chat-main-content">
                {/* Filter Panel */}
                <aside className="filter-panel">
                    <h2>Focus Your Practice</h2>
                    <div className="filter-intro">
                        <img src="https://i.imgur.com/TIGeT05.png" alt="Illustration of a person looking through a magnifying glass" />
                        <p>Tell your AI Coach what you want to work on to start a personalized practice session!</p>
                    </div>
                    <form className="filter-form">
                        <div className="form-group">
                            <label htmlFor="module">IELTS Module:</label>
                            <div className="select-wrapper">
                                <select id="module" defaultValue="">
                                    <option value="" disabled>Ex: Speaking</option>
                                    <option value="speaking">Speaking</option>
                                    <option value="writing">Writing</option>
                                    <option value="reading">Reading</option>
                                    <option value="listening">Listening</option>
                                </select>
                                <ChevronDownIcon />
                            </div>
                        </div>
                         <div className="form-group">
                            <label htmlFor="skill">Specific Skill:</label>
                             <div className="select-wrapper">
                                <select id="skill" defaultValue="">
                                    <option value="" disabled>Ex: Part 2 Cue Card</option>
                                    <option value="part1">Speaking Part 1</option>
                                    <option value="part2">Speaking Part 2</option>
                                    <option value="task1">Writing Task 1</option>
                                    <option value="task2">Writing Task 2</option>
                                </select>
                                <ChevronDownIcon />
                            </div>
                        </div>
                         <div className="form-group">
                            <label htmlFor="topic">Topic Focus:</label>
                             <div className="select-wrapper">
                                <select id="topic" defaultValue="">
                                    <option value="" disabled>Ex: Technology</option>
                                    <option value="technology">Technology</option>
                                    <option value="environment">Environment</option>
                                    <option value="travel">Travel & Tourism</option>
                                </select>
                                 <ChevronDownIcon />
                            </div>
                        </div>
                         <div className="form-group">
                            <label htmlFor="language_skill">Language Skill</label>
                             <div className="select-wrapper">
                                <select id="language_skill" defaultValue="">
                                    <option value="" disabled>Ex: Fluency & Coherence</option>
                                    <option value="fluency">Fluency & Coherence</option>
                                    <option value="vocab">Lexical Resource</option>
                                    <option value="grammar">Grammatical Range</option>
                                    <option value="pronunciation">Pronunciation</option>
                                </select>
                                 <ChevronDownIcon />
                            </div>
                        </div>
                        <button type="button" className="start-ai-btn">
                            Start Session <SparklesIcon />
                        </button>
                    </form>
                </aside>
                
                {/* Chat Container */}
                <div className="chat-container">
                    <div className="chat-header">
                        <div className="chat-info">
                             <div className="ai-avatar-header">
                                <BrainIcon />
                            </div>
                            <div>
                                <h3>AI Coach</h3>
                                <p className="online-status">Online</p>
                            </div>
                        </div>
                        <div className="chat-actions">
                            <button className="icon-btn"><TrashIcon /></button>
                            <button className="icon-btn"><SearchIcon /></button>
                        </div>
                    </div>

                    {error && (
                        <div style={{ padding: '1rem', backgroundColor: '#ffebee', color: '#d32f2f', borderRadius: '4px', margin: '1rem' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="message-area">
                        {messages.map(msg => (
                            <div key={msg.id} className={`message ${msg.sender === 'user' ? 'user-message' : 'ai-message'}`}>
                                {msg.sender === 'ai' ? (
                                    <div className="ai-message-content">
                                        <div className="ai-avatar-chat">
                                            <BrainIcon />
                                        </div>
                                        <div className="message-bubble ai-bubble">
                                            <p>{msg.text}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="user-message-content">
                                        <div className="message-bubble user-bubble">
                                            <p>{msg.text}</p>
                                        </div>
                                        <div className="user-info">
                                            <span>{msg.name}</span>
                                            <img src={msg.avatar} alt={msg.name} className="user-avatar" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                         {isTyping && (
                            <div className="message ai-message">
                                <div className="ai-message-content">
                                    <div className="ai-avatar-chat"><BrainIcon /></div>
                                    <div className="message-bubble ai-bubble typing-indicator">
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                            </div>
                         )}
                    </div>

                    <form className="chat-input-form" onSubmit={handleSendMessage}>
                       <div className="input-wrapper">
                            <button type="button" className="icon-btn"><EmojiIcon /></button>
                            <button type="button" className="icon-btn"><MicIcon /></button>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Ask your coach anything..."
                                disabled={isTyping}
                            />
                            <button type="submit" className="icon-btn send-btn" disabled={isTyping}><SendIcon /></button>
                       </div>
                    </form>
                </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AIChat;
