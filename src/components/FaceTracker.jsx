import React, { useRef, useEffect, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import MorphTargetAvatar from './MorphTargetAvatar';
import EducationEngine from './EducationEngine';
import '../styles/FaceTracker.css';

export default function FaceTracker({ mode }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    
    const [isTracking, setIsTracking] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [eyeContact, setEyeContact] = useState(false);
    
    const [score, setScore] = useState(0);
    const [eyeContactCount, setEyeContactCount] = useState(0);
    const [startTime, setStartTime] = useState(null);
    const [voiceRemindersEnabled, setVoiceRemindersEnabled] = useState(true);

    const modeNames = {
        assessment: 'Assessment Mode',
        prompting: 'Prompting Mode',
        prt: 'PRT Mode',
        research: 'Research Mode'
    };

    const modeDescriptions = {
        assessment: 'Silent baseline measurement',
        prompting: 'Visual cues guide attention',
        prt: 'Positive reinforcement training',
        research: 'Controlled data collection'
    };

    useEffect(() => {
        if (!isTracking) return;

        setStartTime(Date.now());
        let lastEyeContact = false;

        const faceMesh = new FaceMesh({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });

        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        let cameraInstance = null;

        faceMesh.onResults((results) => {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            if (!canvas || !video) return;

            const ctx = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

            let currentFaceDetected = false;
            let currentEyeContact = false;

            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                currentFaceDetected = true;
                const landmarks = results.multiFaceLandmarks[0];
                
                const leftEye = landmarks[33];
                const rightEye = landmarks[263];
                const nose = landmarks[1];
                
                const eyeCenterX = (leftEye.x + rightEye.x) / 2;
                currentEyeContact = Math.abs(eyeCenterX - nose.x) < 0.05;

                if (currentEyeContact && !lastEyeContact) {
                    setEyeContactCount(prev => prev + 1);
                    if (mode === 'prt') {
                        setScore(prev => prev + 10);
                    }
                }
                
                lastEyeContact = currentEyeContact;
                
                let color, size = 8;
                
                if (mode === 'assessment') {
                    color = '#cccccc';
                    size = 4;
                } else if (mode === 'prt') {
                    color = currentEyeContact ? '#FFD700' : '#4A90E2';
                    size = currentEyeContact ? 12 : 8;
                } else {
                    color = currentEyeContact ? '#00ff00' : '#4A90E2';
                }

                [leftEye, rightEye].forEach(landmark => {
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, size, 0, 2 * Math.PI);
                    ctx.fill();
                });
            } else {
                lastEyeContact = false;
            }
            
            setFaceDetected(currentFaceDetected);
            setEyeContact(currentEyeContact);
            
            ctx.restore();
        });

        if (videoRef.current) {
            cameraInstance = new Camera(videoRef.current, {
                onFrame: async () => {
                    await faceMesh.send({ image: videoRef.current });
                },
                width: 640,
                height: 480
            });
            cameraInstance.start();
        }

        return () => {
            if (cameraInstance) {
                cameraInstance.stop();
            }
        };
    }, [isTracking, mode]);

    const getDuration = () => {
        if (!startTime) return 0;
        return Math.floor((Date.now() - startTime) / 1000);
    };

    return (
        <div className="facetracker-container">
            <div className="mode-indicator">
                <span className={`mode-badge ${mode}`}>{modeNames[mode]}</span>
                <p className="mode-description">{modeDescriptions[mode]}</p>
            </div>
            
            <div className="tracking-layout">
                <div className="tracking-section">
                    <h3>Your Camera</h3>
                    <div className="video-container">
                        <video ref={videoRef} style={{ display: 'none' }} />
                        <canvas ref={canvasRef} />
                    </div>
                    
                    <div className="controls">
                        <button 
                            onClick={() => setIsTracking(!isTracking)}
                            className="main-control-button"
                        >
                            {isTracking ? '⏸️ Stop Tracking' : '▶️ Start Tracking'}
                        </button>
                        
                        <div className="status-display">
                            {isTracking ? (
                                faceDetected ? (
                                    eyeContact ? '✓ Eye Contact!' : '○ Face Detected'
                                ) : '✗ No Face Detected'
                            ) : 'Click Start to begin'}
                        </div>

                        {/* Voice Reminders Toggle */}
                        {(mode === 'prompting' || mode === 'prt') && isTracking && (
                            <div className="prompt-toggle">
                                <label>
                                    <input 
                                        type="checkbox"
                                        checked={voiceRemindersEnabled}
                                        onChange={(e) => setVoiceRemindersEnabled(e.target.checked)}
                                    />
                                    <span>Enable Voice Reminders</span>
                                </label>
                                <p className="prompt-info">
                                    {voiceRemindersEnabled ? '🔊 Will remind you to look' : '🔇 Reminders off'}
                                </p>
                            </div>
                        )}

                        {isTracking && mode === 'prt' && (
                            <div className="prt-stats">
                                <div className="stat">
                                    <span className="stat-label">Score</span>
                                    <span className="stat-value">{score}</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Eye Contact</span>
                                    <span className="stat-value">{eyeContactCount}</span>
                                </div>
                            </div>
                        )}

                        {isTracking && (mode === 'assessment' || mode === 'research') && (
                            <div className="session-stats">
                                <p>Eye contact events: {eyeContactCount}</p>
                                <p>Duration: {getDuration()}s</p>
                            </div>
                        )}
                    </div>

                    {/* Education Engine - Pass eye contact state for voice reminders */}
                    {(mode === 'prt' || mode === 'prompting') && isTracking && (
                        <div className="education-section">
                            {mode === 'prt' && <h3>📚 Learning Content</h3>}
                            <EducationEngine 
                                eyeContactScore={score} 
                                mode={mode}
                                hasEyeContact={eyeContact}
                                faceDetected={faceDetected}
                                voiceRemindersEnabled={voiceRemindersEnabled}
                            />
                        </div>
                    )}
                </div>

                <div className="avatar-section">
                    <h3>Training Avatar</h3>
                    <MorphTargetAvatar eyeContact={eyeContact} mode={mode} />
                    {mode === 'assessment' && (
                        <p className="mode-note">📊 Neutral observation mode</p>
                    )}
                    {mode === 'prompting' && (
                        <p className="mode-note">
                            👁️ Visual cues {voiceRemindersEnabled && isTracking ? '+ voice reminders 🔊' : ''}
                        </p>
                    )}
                    {mode === 'prt' && (
                        <p className="mode-note">
                            🎉 Celebration mode {voiceRemindersEnabled && isTracking ? '+ voice reminders 🔊' : ''}
                        </p>
                    )}
                    {mode === 'research' && (
                        <p className="mode-note">🔬 Standardized testing</p>
                    )}
                </div>
            </div>
        </div>
    );
}
