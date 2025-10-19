import React from 'react';
import '../styles/EyeGlowEffect.css';

export default function EyeGlowEffect({ isActive = false }) {
    if (!isActive) {
        return null;
    }

    console.log('👁️✨ Rendering Eye Glow Effect!');

    return (
        <div className="eye-glow-container">
            {/* Left Eye Glow */}
            <div className="eye-glow eye-glow-left">
                <div className="glow-ring glow-ring-1"></div>
                <div className="glow-ring glow-ring-2"></div>
                <div className="glow-ring glow-ring-3"></div>
                <div className="eye-sparkle sparkle-1"></div>
                <div className="eye-sparkle sparkle-2"></div>
            </div>

            {/* Right Eye Glow */}
            <div className="eye-glow eye-glow-right">
                <div className="glow-ring glow-ring-1"></div>
                <div className="glow-ring glow-ring-2"></div>
                <div className="glow-ring glow-ring-3"></div>
                <div className="eye-sparkle sparkle-1"></div>
                <div className="eye-sparkle sparkle-2"></div>
            </div>

            {/* Center connecting beam */}
            <div className="eye-beam"></div>
        </div>
    );
}
