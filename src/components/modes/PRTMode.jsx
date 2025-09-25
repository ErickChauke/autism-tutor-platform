import React, { useRef, useEffect, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import ReadyPlayerMeAvatar from '../ReadyPlayerMeAvatar';
import '../../styles/FaceTracker.css';

export default function PRTMode({ onBack }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isTracking, setIsTracking] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [eyeContact, setEyeContact] = useState(false);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [showCelebration, setShowCelebration] = useState(false);

    useEffect(() => {
        if (!isTracking) return;

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
        let lastEyeContact = false;

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

                // PRT Logic: Reward self-initiated eye contact
                if (lookingForward && !lastEyeContact) {
                    // New eye contact event - reward!
                    setScore(prev => prev + 10);
                    setStreak(prev => prev + 1);
                    triggerCelebration();
                } else if (!lookingForward && lastEyeContact) {
                    // Lost eye contact
                    if (streak > 3) {
                        setStreak(0);
                    }
                }
                
                lastEyeContact = lookingForward;

                // Draw celebratory landmarks
                const color = lookingForward ? '#FFD700' : '#4A90E2';
                const size = lookingForward ? 12 : 8;
                
                [leftEye, rightEye].forEach(landmark => {
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, size, 0, 2 * Math.PI);
                    ctx.fill();
                });

                // Draw celebration effects
                if (showCelebration && lookingForward) {
                    drawCelebration(ctx, canvas);
                }
            } else {
                setFaceDetected(false);
                setEyeContact(false);
                lastEyeContact = false;
            }
            ctx.restore();
        });

        function triggerCelebration() {
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 2000);
        }

        function drawCelebration(ctx, canvas) {
            // Confetti effect
            for (let i = 0; i < 20; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const color = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'][Math.floor(Math.random() * 4)];
                
                ctx.fillStyle = color;
                ctx.fillRect(x, y, 6, 6);
            }

            // Success message
            ctx.font = '48px Arial';
            ctx.fillStyle = '#FFD700';
            ctx.textAlign = 'center';
            ctx.fillText('Great Job!', canvas.width / 2, canvas.height / 2);
        }

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
    }, [isTracking, showCelebration, streak]);

    return (
        <div className="facetracker-container">
            <div className="mode-indicator">
                <span className="mode-badge prt">PRT Mode</span>
                <p className="mode-description">Positive reinforcement for natural eye contact</p>
            </div>
            
            <div className="tracking-layout">
                <div className="tracking-section">
                    <h3>Reward Training</h3>
                    <div className="video-container">
                        <video ref={videoRef} style={{ display: 'none' }} />
                        <canvas ref={canvasRef} />
                    </div>
                    <div className="controls">
                        <button onClick={() => setIsTracking(!isTracking)}>
                            {isTracking ? 'Stop Training' : 'Start Training'}
                        </button>
                        <p className="status">
                            {isTracking ? (faceDetected ? (eyeContact ? '🌟 Excellent!' : '👀 Looking for eye contact') : '✗ Position yourself') : 'Click to begin reward training'}
                        </p>
                        <div className="prt-stats">
                            <div className="stat">
                                <span className="stat-label">Score:</span>
                                <span className="stat-value">{score}</span>
                            </div>
                            <div className="stat">
                                <span className="stat-label">Streak:</span>
                                <span className="stat-value">{streak}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="avatar-section">
                    <h3>Celebrating Avatar</h3>
                    <ReadyPlayerMeAvatar eyeContact={eyeContact} />
                    {showCelebration && (
                        <div className="celebration-message">
                            🎉 Amazing eye contact! 🎉
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
