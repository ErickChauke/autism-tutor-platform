import React from 'react';
import '../styles/Header.css';

export default function Header({ onBackClick, showBackButton, showSettingsButton, onSettingsClick }) {
    return (
        <header className="header">
            <div className="header-content">
                {showBackButton && (
                    <button className="back-button" onClick={onBackClick}>
                        ← Back
                    </button>
                )}
                <h1>Autism Tutor Platform</h1>
                <p className="subtitle">Eye Contact Training System</p>
                {showSettingsButton && (
                    <button className="settings-button" onClick={onSettingsClick}>
                        ⚙️ Settings
                    </button>
                )}
            </div>
        </header>
    );
}
