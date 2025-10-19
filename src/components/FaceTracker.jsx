import React, { useRef, useEffect, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import MorphTargetAvatar from './MorphTargetAvatar';
import EducationEngine from './EducationEngine';
import { lipSyncController } from '../utils/lip-sync-controller';
import '../styles/FaceTracker.css';

const EYE_CONTACT_DEBOUNCE = 1500;

export default function FaceTracker({ mode, sessionLength = 'standard', settings }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    
    const [isTracking, setIsTracking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [eyeContact, setEyeContact] = useState(false);
    
    const [score, setScore] = useState(0);
    const [eyeContactCount, setEyeContactCount] = useState(0);
    const [startTime, setStartTime] = useState(null);
    const [sessionKey, setSessionKey] = useState(0);

    const eyeContactStartTime = useRef(null);
    const eyeContactDebounceTimer = useRef(null);
    const lastEyeContactValue = useRef(false);
    const scoreAwarded = useRef(false);

    const modeNames = {
        assessment: 'Assessment Mode',
        prompting: 'Prompting Mode',
        prt: 'PRT Mode',
        research: 'Research Mode'
    };

    const modeDescriptions = {
        assessment: 'Baseline measurement',
        prompting: 'Visual guidance',
        prt: 'Reinforcement training',
        research: 'Data collection'
    };

    const handleStop = () => {
        console.log('🛑 IMMEDIATE STOP - Cancelling everything...');
        
        if (eyeContactDebounceTimer.current) {
            clearTimeout(eyeContactDebounceTimer.current);
            eyeContactDebounceTimer.current = null;
        }
        
        setSessionKey(prev => prev + 1);
        
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            console.log('✅ Speech cancelled');
        }
        
        lipSyncController.stop();
        console.log('✅ Lip sync stopped');
        
        setIsTracking(false);
        setIsPaused(false);
        setFaceDetected(false);
        setEyeContact(false);
        setScore(0);
        setEyeContactCount(0);
        setStartTime(null);
        
        eyeContactStartTime.current = null;
        scoreAwarded.current = false;
        lastEyeContactValue.current = false;
        
        console.log('✅ Session completely stopped');
    };

    const handlePause = () => {
        console.log('⏸️ PAUSE - Pausing session...');
        setIsPaused(true);
    };

    const handleResume = () => {
        console.log('▶️ RESUME - Resuming session...');
        setIsPaused(false);
    };

    useEffect(() => {
        if (!isTracking || mode !== 'prt') return;

        if (eyeContact !== lastEyeContactValue.current) {
            if (eyeContactDebounceTimer.current) {
                clearTimeout(eyeContactDebounceTimer.current);
                eyeContactDebounceTimer.current = null;
            }

            if (eyeContact) {
                eyeContactStartTime.current = Date.now();
                scoreAwarded.current = false;
                
                eyeContactDebounceTimer.current = setTimeout(() => {
                    if (eyeContact && !scoreAwarded.current) {
                        setScore(prev => prev + 10);
                        setEyeContactCount(prev => prev + 1);
                        scoreAwarded.current = true;
                        console.log('✅ Score +10 (sustained eye contact)');
                    }
                }, EYE_CONTACT_DEBOUNCE);
            } else {
                eyeContactStartTime.current = null;
                scoreAwarded.current = false;
            }
        }

        lastEyeContactValue.current = eyeContact;

        return () => {
            if (eyeContactDebounceTimer.current) {
                clearTimeout(eyeContactDebounceTimer.current);
            }
        };
    }, [eyeContact, isTracking, mode]);

    useEffect(() => {
        if (!isTracking || !settings.enableTracking) {
            console.log('⏸️ Tracking disabled or not started');
            return;
        }

        console.log('▶️ Starting face tracking...');
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
    }, [isTracking, mode, settings.enableTracking]);

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
                    {settings.showCamera && (
                        <>
                            <h3>Camera</h3>
                            <div className="video-container">
                                <video ref={videoRef} style={{ display: 'none' }} />
                                <canvas ref={canvasRef} />
                            </div>
                        </>
                    )}
                    
                    <div className="controls">
                        {!isTracking ? (
                            <button 
                                onClick={() => setIsTracking(true)}
                                className="main-control-button start-button"
                            >
                                Start
                            </button>
                        ) : (
                            <>
                                <div className="control-buttons-row">
                                    {!isPaused ? (
                                        <button 
                                            onClick={handlePause}
                                            className="control-button pause-button"
                                        >
                                            Pause
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleResume}
                                            className="control-button resume-button"
                                        >
                                            Resume
                                        </button>
                                    )}
                                    <button 
                                        onClick={handleStop}
                                        className="control-button stop-button"
                                    >
                                        Stop
                                    </button>
                                </div>
                            </>
                        )}
                        
                        <div className="status-display">
                            {isPaused ? '⏸️ Paused' : 
                                isTracking ? (
                                    settings.enableTracking ? (
                                        faceDetected ? (
                                            eyeContact ? '✓ Eye Contact' : '○ Face Detected'
                                        ) : '✗ No Face'
                                    ) : '⏸️ Tracking Disabled'
                                ) : 'Ready'
                            }
                        </div>

                        {isTracking && mode === 'prt' && settings.showStats && (
                            <div className="prt-stats">
                                <div className="stat">
                                    <span className="stat-label">Score</span>
                                    <span className="stat-value">{score}</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Count</span>
                                    <span className="stat-value">{eyeContactCount}</span>
                                </div>
                            </div>
                        )}

                        {isTracking && (mode === 'assessment' || mode === 'research') && settings.showStats && (
                            <div className="session-stats">
                                <p>Events: {eyeContactCount}</p>
                                <p>Duration: {getDuration()}s</p>
                            </div>
                        )}
                    </div>

                    {(mode === 'prt' || mode === 'prompting') && isTracking && (
                        <div className="education-section">
                            <EducationEngine 
                                key={sessionKey}
                                eyeContactScore={score} 
                                mode={mode}
                                hasEyeContact={eyeContact}
                                faceDetected={faceDetected}
                                voiceRemindersEnabled={settings.voiceReminders}
                                sessionLength={sessionLength}
                                settings={settings}
                                isPaused={isPaused}
                            />
                        </div>
                    )}
                </div>

                {settings.showAvatar && (
                    <div className="avatar-section">
                        <h3>Avatar</h3>
                        <MorphTargetAvatar eyeContact={eyeContact} mode={mode} />
                    </div>
                )}
            </div>
        </div>
    );
}
