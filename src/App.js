import React, { useState } from 'react';
import Header from './components/Header';
import WelcomeScreen from './components/WelcomeScreen';
import FaceTracker from './components/FaceTracker';
import './styles/autism-friendly.css';
import './App.css';

function App() {
    const [currentScreen, setCurrentScreen] = useState('welcome');
    const [selectedMode, setSelectedMode] = useState('');
    const [selectedSession, setSelectedSession] = useState('');

    const handleStart = (mode, session) => {
        setSelectedMode(mode);
        setSelectedSession(session);
        setCurrentScreen('tracker');
    };

    const handleBackToWelcome = () => {
        setCurrentScreen('welcome');
        setSelectedMode('');
        setSelectedSession('');
    };

    return (
        <div className="App">
            <Header 
                showBackButton={currentScreen !== 'welcome'} 
                onBackClick={handleBackToWelcome}
            />
            
            {currentScreen === 'welcome' && (
                <WelcomeScreen onStart={handleStart} />
            )}
            
            {currentScreen === 'tracker' && (
                <FaceTracker 
                    mode={selectedMode} 
                    sessionLength={selectedSession}
                    onBack={handleBackToWelcome} 
                />
            )}
        </div>
    );
}

export default App;
