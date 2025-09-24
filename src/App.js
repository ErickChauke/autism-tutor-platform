import React, { useState } from 'react';
import Header from './components/Header';
import MainScreen from './components/MainScreen';
import FaceTracker from './components/FaceTracker';
import './styles/autism-friendly.css';
import './App.css';

function App() {
    const [currentScreen, setCurrentScreen] = useState('main');
    const [selectedMode, setSelectedMode] = useState('');

    const handleStartMode = (mode) => {
        setSelectedMode(mode);
        setCurrentScreen('tracker');
    };

    const handleBackToMain = () => {
        setCurrentScreen('main');
        setSelectedMode('');
    };

    return (
        <div className="App">
            <Header 
                showBackButton={currentScreen !== 'main'} 
                onBackClick={handleBackToMain}
            />
            
            {currentScreen === 'main' && (
                <MainScreen onStartMode={handleStartMode} />
            )}
            
            {currentScreen === 'tracker' && (
                <FaceTracker mode={selectedMode} onBack={handleBackToMain} />
            )}
        </div>
    );
}

export default App;
