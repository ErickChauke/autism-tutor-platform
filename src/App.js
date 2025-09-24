import React, { useState } from 'react';
import Header from './components/Header';
import MainScreen from './components/MainScreen';
import FaceTracker from './components/FaceTracker';
import './styles/autism-friendly.css';
import './App.css';

function App() {
    const [currentScreen, setCurrentScreen] = useState('main');

    return (
        <div className="App">
            <Header />
            {currentScreen === 'main' && <MainScreen onStartTracking={() => setCurrentScreen('tracker')} />}
            {currentScreen === 'tracker' && <FaceTracker />}
        </div>
    );
}

export default App;
