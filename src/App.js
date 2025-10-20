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
    const [wasPausedBeforeSettings, setWasPausedBeforeSettings] = useState(false);
    
    const [settings, setSettings] = useState({
        showCamera: true,
        enableTracking: true,
        showAvatar: true,
        autoPlayTopics: true,
        showSnippetProgress: false,
        showTopicButtons: false,
        showStats: false,
        voiceReminders: true
    });

    const [isSessionPaused, setIsSessionPaused] = useState(false);

    const handleStart = (mode, session) => {
        setSelectedMode(mode);
        setSelectedSession(session);
        setCurrentScreen('tracker');
        setIsSessionPaused(false);
    };

    const handleBackToWelcome = () => {
        setCurrentScreen('welcome');
        setSelectedMode('');
        setSelectedSession('');
        setIsSessionPaused(false);
    };

    const handleOpenSettings = () => {
        console.log('⚙️ Opening settings - auto-pausing session');
        setWasPausedBeforeSettings(isSessionPaused);
        setIsSessionPaused(true);
        setCurrentScreen('settings');
    };

    const handleBackToTracker = () => {
        console.log('◀️ Returning to tracker from settings');
        setIsSessionPaused(wasPausedBeforeSettings);
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
            
            {(currentScreen === 'tracker' || currentScreen === 'settings') && selectedMode && (
                <div style={{ display: currentScreen === 'tracker' ? 'block' : 'none' }}>
                    <FaceTracker 
                        mode={selectedMode} 
                        sessionLength={selectedSession}
                        onBack={handleBackToWelcome}
                        settings={settings}
                        externalPause={isSessionPaused}
                    />
                </div>
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
