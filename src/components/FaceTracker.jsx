import React, { useRef, useEffect, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import MorphTargetAvatar from './MorphTargetAvatar';
import EducationEngine from './EducationEngine';
import PromptingVisuals from './PromptingVisuals';
import { lipSyncController } from '../utils/lip-sync-controller';
import '../styles/FaceTracker.css';

const EYE_CONTACT_DEBOUNCE = 1500;

export default function FaceTracker({ 
    mode, 
    sessionLength = 'standard', 
    settings,
    externalPause = false,
    onStop
}) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const cameraInstanceRef = useRef(null);
    
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

    const cleanupCamera = () => {
        if (cameraInstanceRef.current) {
            console.log('📹 Stopping camera instance...');
            try {
                cameraInstanceRef.current.stop();
                cameraInstanceRef.current = null;
                console.log('✅ Camera stopped successfully');
            } catch (error) {
                console.error('❌ Error stopping camera:', error);
            }
        }
    };

    const cleanupEverything = () => {
        console.log('🧹 Cleaning up everything...');
        
        if (eyeContactDebounceTimer.current) {
            clearTimeout(eyeContactDebounceTimer.current);
            eyeContactDebounceTimer.current = null;
        }
        
        cleanupCamera();
        
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        
        lipSyncController.stop();
    };

    // Handle external pause from settings
    useEffect(() => {
        if (externalPause !== isPaused) {
            console.log(`⚙️ External pause change: ${externalPause}`);
            setIsPaused(externalPause);
        }
    }, [externalPause]);

    // CRITICAL: Handle enableTracking setting changes
    useEffect(() => {
        if (isTracking && !settings.enableTracking) {
            console.log('⚠️ Tracking disabled via settings - cleaning up camera');
            cleanupCamera();
        } else if (isTracking && settings.enableTracking && !cameraInstanceRef.current) {
            console.log('✅ Tracking re-enabled via settings - restarting camera');
            // Camera will restart via main tracking effect
        }
    }, [settings.enableTracking, isTracking]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            console.log('🧹 FaceTracker unmounting');
            cleanupEverything();
        };
    }, []);

    const handleStop = () => {
        console.log('🛑 Stop button clicked');
        
        cleanupEverything();
        
        setSessionKey(prev => prev + 1);
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
        
        if (onStop) {
            console.log('📢 Notifying App to return to welcome');
            onStop();
        }
    };

    const handlePause = () => {
        console.log('⏸️ Pause button clicked');
        setIsPaused(true);
    };

    const handleResume = () => {
        console.log('▶️ Resume button clicked');
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

    // Main tracking effect - only depends on isTracking and enableTracking
    useEffect(() => {
        if (!isTracking || !settings.enableTracking) {
            return;
        }

        console.log('▶️ Starting face tracking...');
        setStartTime(Date.now());

        const faceMesh = new FaceMesh({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });

        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        faceMesh.onResults((results) => {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            
            if (!canvas || !video) {
                return;
            }

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
                
                let color, size = 8;
                
                if (mode === 'assessment') {
                    color = '#cccccc';
                    size = 4;
                } else if (mode === 'prt') {
                    color = currentEyeContact ? '#FFD700' : '#4A90E2';
                    size = currentEyeContact ? 12 : 8;
                } else if (mode === 'prompting') {
                    color = currentEyeContact ? '#00ff00' : '#ff0000';
                    size = currentEyeContact ? 10 : 8;
                } else {
                    color = currentEyeContact ? '#00ff00' : '#4A90E2';
                }

                [leftEye, rightEye].forEach(landmark => {
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, size, 0, 2 * Math.PI);
                    ctx.fill();
                });
            }
            
            setFaceDetected(currentFaceDetected);
            setEyeContact(currentEyeContact);
            
            ctx.restore();
        });

        if (videoRef.current) {
            const camera = new Camera(videoRef.current, {
                onFrame: async () => {
                    if (videoRef.current) {
                        await faceMesh.send({ image: videoRef.current });
                    }
                },
                width: 640,
                height: 480
            });
            
            cameraInstanceRef.current = camera;
            camera.start();
            console.log('✅ Camera started');
        }

        return () => {
            console.log('🧹 Tracking effect cleanup');
            cleanupCamera();
        };
    }, [isTracking, settings.enableTracking, mode]);

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
                    {/* CRITICAL: Camera display - always keep elements in DOM */}
                    {/* Just toggle visibility, not mounting/unmounting */}
                    <div style={{ display: settings.showCamera ? 'block' : 'none' }}>
                        <h3>Camera</h3>
                        <div className="video-container">
                            <video ref={videoRef} style={{ display: 'none' }} />
                            <canvas ref={canvasRef} />
                        </div>
                    </div>

                    {/* Hidden elements when camera display is off */}
                    {!settings.showCamera && (
                        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                            <video ref={videoRef} style={{ display: 'none' }} />
                            <canvas ref={canvasRef} width="640" height="480" />
                        </div>
                    )}

                    {/* Info message when tracking is disabled */}
                    {isTracking && !settings.enableTracking && (
                        <div style={{
                            background: '#fff3cd',
                            border: '2px solid #ff9800',
                            padding: '16px',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            textAlign: 'center'
                        }}>
                            <p style={{ margin: 0, fontWeight: 'bold', color: '#856404' }}>
                                ⚠️ Face Tracking Disabled
                            </p>
                            <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', color: '#856404' }}>
                                Enable "Face Tracking" in Settings to use detection features
                            </p>
                        </div>
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
                        <div className="avatar-wrapper">
                            <MorphTargetAvatar eyeContact={eyeContact} mode={mode} />
                            
                            {mode === 'prompting' && isTracking && !isPaused && (
                                <PromptingVisuals 
                                    hasEyeContact={eyeContact}
                                    faceDetected={faceDetected}
                                    isActive={true}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
