import React, { useState } from 'react';
import '../styles/MainScreen.css';

export default function MainScreen({ onStartMode }) {
    const [selectedMode, setSelectedMode] = useState('');
    
    const modes = [
        { id: 'assessment', name: 'Assessment Mode', description: 'Measure your natural eye contact patterns' },
        { id: 'prompting', name: 'Prompting Mode', description: 'Visual cues guide your attention' },
        { id: 'prt', name: 'PRT Mode', description: 'Positive reinforcement training' },
        { id: 'research', name: 'Research Mode', description: 'Controlled testing environment' }
    ];

    return (
        <div className="mainscreen-container">
            <h2>Select Training Mode</h2>
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
            {selectedMode && (
                <button 
                    className="start-button" 
                    onClick={() => onStartMode(selectedMode)}
                >
                    Start {modes.find(m => m.id === selectedMode)?.name}
                </button>
            )}
        </div>
    );
}
