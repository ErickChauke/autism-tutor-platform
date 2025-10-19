import React from 'react';
import '../styles/SettingsScreen.css';

export default function SettingsScreen({ settings, onUpdateSettings, onBack }) {
    const handleToggle = (key) => {
        onUpdateSettings({
            ...settings,
            [key]: !settings[key]
        });
    };

    const settingsConfig = [
        {
            key: 'showCamera',
            label: 'Show Camera Feed',
            description: 'Display the camera video canvas on screen',
            icon: ''
        },
        {
            key: 'enableTracking',
            label: 'Enable Face Tracking',
            description: 'Run MediaPipe face detection and eye contact analysis',
            icon: ''
        },
        {
            key: 'showAvatar',
            label: 'Show Avatar',
            description: 'Display the 3D avatar that responds to eye contact',
            icon: ''
        },
        {
            key: 'showSnippetProgress',
            label: 'Show Snippet Progress',
            description: 'Display detailed progress through educational snippets',
            icon: ''
        },
        {
            key: 'showTopicButtons',
            label: 'Show Topic Buttons',
            description: 'Display buttons to select educational topics',
            icon: ''
        },
        {
            key: 'showStats',
            label: 'Show Statistics',
            description: 'Display score, count, and session statistics',
            icon: ''
        },
        {
            key: 'voiceReminders',
            label: 'Voice Reminders',
            description: 'Enable voice prompts and encouragement',
            icon: ''
        }
    ];

    return (
        <div className="settings-screen">
            <div className="settings-content">
                <h1 className="settings-title">Settings</h1>
                <p className="settings-subtitle">Customize your learning experience</p>

                <div className="settings-info-box">
                    <h3>Camera vs Tracking</h3>
                    <p><strong>Show Camera Feed:</strong> Controls whether you see the video on screen</p>
                    <p><strong>Enable Face Tracking:</strong> Controls whether face detection is running</p>
                    <p className="example">Example: Camera OFF + Tracking ON = Audio-only mode with detection still working</p>
                </div>

                <div className="settings-list">
                    {settingsConfig.map(setting => (
                        <div key={setting.key} className="setting-item">
                            <div className="setting-info">
                                <h3>{setting.label}</h3>
                                <p>{setting.description}</p>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={settings[setting.key]}
                                    onChange={() => handleToggle(setting.key)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    ))}
                </div>

                <div className="settings-actions">
                    <button className="back-to-session-button" onClick={onBack}>
                        Back to Session
                    </button>
                </div>

                <div className="settings-note">
                    <p>Note: You can change these settings anytime during your session.</p>
                </div>
            </div>
        </div>
    );
}
