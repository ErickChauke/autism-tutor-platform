import React from 'react';
import '../styles/Header.css';

export default function Header({ onBackClick, showBackButton }) {
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
            </div>
        </header>
    );
}
