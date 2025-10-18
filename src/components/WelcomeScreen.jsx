import React, { useState } from 'react';
import '../styles/WelcomeScreen.css';

export default function WelcomeScreen({ onStart }) {
    const [selectedMode, setSelectedMode] = useState('prt');
    const [selectedSession, setSelectedSession] = useState('standard');

    const modes = [
        { 
            id: 'assessment', 
            name: 'Assessment Mode', 
            description: 'Measure your natural eye contact patterns' 
        },
        { 
            id: 'prompting', 
            name: 'Prompting Mode', 
            description: 'Visual cues guide your attention' 
        },
        { 
            id: 'prt', 
            name: 'PRT Mode', 
            description: 'Positive reinforcement training' 
        },
        { 
            id: 'research', 
            name: 'Research Mode', 
            description: 'Controlled testing environment' 
        }
    ];

    const sessions = [
        {
            id: 'quick',
            name: 'Quick Session',
            duration: '2 min',
            description: 'A short 2-minute learning session',
            topics: '2 topics'
        },
        {
            id: 'standard',
            name: 'Standard Session',
            duration: '5 min',
            description: 'A balanced 5-minute learning session',
            topics: '4 topics'
        },
        {
            id: 'extended',
            name: 'Extended Session',
            duration: '10 min',
            description: 'A comprehensive 10-minute learning session',
            topics: '6 topics'
        }
    ];

    const handleStart = () => {
        onStart(selectedMode, selectedSession);
    };

    const getModeName = (id) => modes.find(m => m.id === id)?.name;
    const getSessionName = (id) => sessions.find(s => s.id === id)?.name;

    return (
        <div className="welcome-screen">
            <div className="welcome-content">
                <h1 className="welcome-title">Welcome to Autism Tutor Platform</h1>
                <p className="welcome-subtitle">
                    Choose your training mode and session length, then start your learning journey
                </p>

                {/* Step 1: Choose Training Mode */}
                <div className="selection-section">
                    <h2 className="section-title">Step 1: Choose Training Mode</h2>
                    <div className="modes-grid">
                        {modes.map(mode => (
                            <button
                                key={mode.id}
                                className={`mode-card ${selectedMode === mode.id ? 'selected' : ''}`}
                                onClick={() => setSelectedMode(mode.id)}
                            >
                                <h3>{mode.name}</h3>
                                <p>{mode.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Step 2: Choose Session Length */}
                <div className="selection-section">
                    <h2 className="section-title">Step 2: Choose Session Length</h2>
                    <div className="sessions-grid">
                        {sessions.map(session => (
                            <button
                                key={session.id}
                                className={`session-card ${selectedSession === session.id ? 'selected' : ''}`}
                                onClick={() => setSelectedSession(session.id)}
                            >
                                <span className="session-badge">{session.duration}</span>
                                <h3>{session.name}</h3>
                                <p>{session.description}</p>
                                <span className="session-topics">{session.topics}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Start Button */}
                <div className="start-section">
                    <button className="start-learning-button" onClick={handleStart}>
                        Start Learning Session
                    </button>
                    <p className="start-info">
                        Starting <span className="highlight">{getModeName(selectedMode)}</span> with{' '}
                        <span className="highlight">{getSessionName(selectedSession)}</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
