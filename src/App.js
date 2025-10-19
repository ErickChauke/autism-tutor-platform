import React, { useState } from 'react';
import Header from './components/Header';
import WelcomeScreen from './components/WelcomeScreen';
import FaceTracker from './components/FaceTracker';
import SettingsScreen from './components/SettingsScreen';
import './styles/autism-friendly.css';
import './App.css';

function App() {
    const [currentScreen, setCurrentScreen] = useState('welcome');
    const [selectedMode, setSelectedMode] = useState('');
    const [selectedSession, setSelectedSession] = useState('');
    
    // Settings state with defaults
    const [settings, setSettings] = useState({
        showCamera: true,
        enableTracking: true,
        showAvatar: true,
        autoPlayTopics: true,  // ✅ AUTO-PLAY ON BY DEFAULT
        showSnippetProgress: false,
        showTopicButtons: false,
        showStats: false,
        voiceReminders: true
    });

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

    const handleOpenSettings = () => {
        setCurrentScreen('settings');
    };

    const handleBackToTracker = () => {
        setCurrentScreen('tracker');
    };

    const handleUpdateSettings = (newSettings) => {
        setSettings(newSettings);
    };

    return (
        <div className="App">
            <Header 
                showBackButton={currentScreen !== 'welcome'} 
                onBackClick={currentScreen === 'settings' ? handleBackToTracker : handleBackToWelcome}
                showSettingsButton={currentScreen === 'tracker'}
                onSettingsClick={handleOpenSettings}
            />
            
            {currentScreen === 'welcome' && (
                <WelcomeScreen onStart={handleStart} />
            )}
            
            {currentScreen === 'tracker' && (
                <FaceTracker 
                    mode={selectedMode} 
                    sessionLength={selectedSession}
                    onBack={handleBackToWelcome}
                    settings={settings}
                />
            )}

            {currentScreen === 'settings' && (
                <SettingsScreen
                    settings={settings}
                    onUpdateSettings={handleUpdateSettings}
                    onBack={handleBackToTracker}
                />
            )}
        </div>
    );
}

export default App;
