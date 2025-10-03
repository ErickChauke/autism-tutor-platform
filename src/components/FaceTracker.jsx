import React, { useRef, useEffect, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import ReadyPlayerMeAvatar from './ReadyPlayerMeAvatar';
import '../styles/FaceTracker.css';

export default function FaceTracker({ mode }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isTracking, setIsTracking] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [eyeContact, setEyeContact] = useState(false);
    
    // Mode-specific state
    const [score, setScore] = useState(0);
    const [eyeContactCount, setEyeContactCount] = useState(0);
    const [startTime, setStartTime] = useState(null);

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

            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                setFaceDetected(true);
                const landmarks = results.multiFaceLandmarks[0];
                
                const leftEye = landmarks[33];
                const rightEye = landmarks[263];
                const nose = landmarks[1];
                
                const eyeCenterX = (leftEye.x + rightEye.x) / 2;
                const lookingForward = Math.abs(eyeCenterX - nose.x) < 0.05;
                
                setEyeContact(lookingForward);

                // Track new eye contact events
                if (lookingForward && !lastEyeContact) {
                    setEyeContactCount(prev => prev + 1);
                    if (mode === 'prt') {
                        setScore(prev => prev + 10);
                    }
                }
                lastEyeContact = lookingForward;
                
                // Mode-specific landmark colors
                let color, size = 8;
                
                if (mode === 'assessment') {
                    color = '#cccccc';
                    size = 4;
                } else if (mode === 'prt') {
                    color = lookingForward ? '#FFD700' : '#4A90E2';
                    size = lookingForward ? 12 : 8;
                } else {
                    color = lookingForward ? '#00ff00' : '#4A90E2';
                }

                [leftEye, rightEye].forEach(landmark => {
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, size, 0, 2 * Math.PI);
                    ctx.fill();
                });
            } else {
                setFaceDetected(false);
                setEyeContact(false);
                lastEyeContact = false;
            }
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
                        <button onClick={() => setIsTracking(!isTracking)}>
                            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
                        </button>
                        <p className="status">
                            {isTracking ? (faceDetected ? (eyeContact ? '✓ Eye Contact!' : '○ Face Detected') : '✗ No Face') : 'Click to start'}
                        </p>

                        {/* PRT Mode: Show score */}
                        {isTracking && mode === 'prt' && (
                            <div className="prt-stats">
                                <div className="stat">
                                    <span className="stat-label">Score</span>
                                    <span className="stat-value">{score}</span>
                                </div>
                            </div>
                        )}

                        {/* Assessment/Research: Show metrics */}
                        {isTracking && (mode === 'assessment' || mode === 'research') && (
                            <div className="session-stats">
                                <p>Eye contact events: {eyeContactCount}</p>
                                <p>Duration: {getDuration()}s</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="avatar-section">
                    <h3>Training Avatar</h3>
                    <ReadyPlayerMeAvatar 
                        eyeContact={mode === 'assessment' ? false : eyeContact} 
                    />
                    {mode === 'assessment' && (
                        <p className="mode-note">Avatar stays neutral</p>
                    )}
                </div>
            </div>
        </div>
    );
}
