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
    const [sessionActive, setSessionActive] = useState(false);
    
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
        console.log('🎬 Starting new session');
        setSelectedMode(mode);
        setSelectedSession(session);
        setCurrentScreen('tracker');
        setIsSessionPaused(false);
        setSessionActive(true);
    };

    const handleStop = () => {
        console.log('🛑 Session stopped from App');
        setSessionActive(false);
        setIsSessionPaused(false);
        setSelectedMode('');
        setSelectedSession('');
        setCurrentScreen('welcome');
    };

    const handleBackToWelcome = () => {
        console.log('◀️ Back to welcome (stopping session if active)');
        if (sessionActive) {
            handleStop();
        } else {
            setCurrentScreen('welcome');
        }
    };

    const handleOpenSettings = () => {
        console.log('⚙️ Opening settings - auto-pausing session');
        setWasPausedBeforeSettings(isSessionPaused);
        if (sessionActive && !isSessionPaused) {
            setIsSessionPaused(true);
        }
        setCurrentScreen('settings');
    };

    const handleBackToTracker = () => {
        console.log('◀️ Back to Session - resuming (like Resume button)');
        // ALWAYS resume when going back to session
        setIsSessionPaused(false);
        setCurrentScreen('tracker');
    };

    const handleUpdateSettings = (newSettings) => {
        console.log('⚙️ Settings updated (live)');
        setSettings(newSettings);
    };

    return (
        <div className="App">
            <Header 
                showBackButton={currentScreen !== 'welcome'} 
                onBackClick={currentScreen === 'settings' ? handleBackToTracker : handleBackToWelcome}
                showSettingsButton={currentScreen === 'tracker' && sessionActive}
                onSettingsClick={handleOpenSettings}
            />
            
            {currentScreen === 'welcome' && (
                <WelcomeScreen onStart={handleStart} />
            )}
            
            {sessionActive && (
                <div style={{ display: currentScreen === 'tracker' ? 'block' : 'none' }}>
                    <FaceTracker 
                        mode={selectedMode} 
                        sessionLength={selectedSession}
                        settings={settings}
                        externalPause={isSessionPaused}
                        onStop={handleStop}
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
