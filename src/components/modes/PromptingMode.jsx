import React, { useRef, useEffect, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import ReadyPlayerMeAvatar from '../ReadyPlayerMeAvatar';
import '../../styles/FaceTracker.css';

export default function PromptingMode({ onBack }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isTracking, setIsTracking] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [eyeContact, setEyeContact] = useState(false);
    const [promptIntensity, setPromptIntensity] = useState(100);
    const [showPrompts, setShowPrompts] = useState(false);

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
        let noEyeContactTimer = null;

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

                if (lookingForward) {
                    // Good eye contact - hide prompts
                    setShowPrompts(false);
                    clearTimeout(noEyeContactTimer);
                    
                    // Gradually reduce prompt intensity (fade out)
                    setPromptIntensity(prev => Math.max(prev - 2, 50));
                } else {
                    // No eye contact - show prompts after delay
                    if (noEyeContactTimer) clearTimeout(noEyeContactTimer);
                    noEyeContactTimer = setTimeout(() => {
                        setShowPrompts(true);
                    }, 2000); // 2 second delay before showing prompts
                }

                // Draw eye landmarks with prompting feedback
                const color = lookingForward ? '#00ff00' : '#ff6b6b';
                [leftEye, rightEye].forEach(landmark => {
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 8, 0, 2 * Math.PI);
                    ctx.fill();
                });

                // Draw visual prompts
                if (showPrompts && !lookingForward) {
                    drawPrompts(ctx, canvas, leftEye, rightEye);
                }
            } else {
                setFaceDetected(false);
                setEyeContact(false);
                setShowPrompts(false);
            }
            ctx.restore();
        });

        function drawPrompts(ctx, canvas, leftEye, rightEye) {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const opacity = promptIntensity / 100;

            // Glowing effect around avatar area (center of screen)
            ctx.globalAlpha = opacity * 0.6;
            ctx.strokeStyle = '#4A90E2';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 100, 0, 2 * Math.PI);
            ctx.stroke();

            // Arrows pointing to center
            ctx.globalAlpha = opacity;
            ctx.fillStyle = '#4A90E2';
            
            // Top arrow
            drawArrow(ctx, centerX, centerY - 150, centerX, centerY - 100);
            // Bottom arrow  
            drawArrow(ctx, centerX, centerY + 150, centerX, centerY + 100);
            // Left arrow
            drawArrow(ctx, centerX - 150, centerY, centerX - 100, centerY);
            // Right arrow
            drawArrow(ctx, centerX + 150, centerY, centerX + 100, centerY);

            ctx.globalAlpha = 1;
        }

        function drawArrow(ctx, fromX, fromY, toX, toY) {
            const headlen = 15;
            const angle = Math.atan2(toY - fromY, toX - fromX);

            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);
            ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(toX, toY);
            ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
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
            if (noEyeContactTimer) {
                clearTimeout(noEyeContactTimer);
            }
        };
    }, [isTracking, promptIntensity, showPrompts]);

    return (
        <div className="facetracker-container">
            <div className="mode-indicator">
                <span className="mode-badge prompting">Prompting Mode</span>
                <p className="mode-description">Visual cues will guide your attention</p>
            </div>
            
            <div className="tracking-layout">
                <div className="tracking-section">
                    <h3>Guided Training</h3>
                    <div className="video-container">
                        <video ref={videoRef} style={{ display: 'none' }} />
                        <canvas ref={canvasRef} />
                    </div>
                    <div className="controls">
                        <button onClick={() => setIsTracking(!isTracking)}>
                            {isTracking ? 'Stop Training' : 'Start Training'}
                        </button>
                        <p className="status">
                            {isTracking ? (faceDetected ? (eyeContact ? '✓ Following prompts!' : (showPrompts ? '→ Follow the cues' : '○ Waiting...')) : '✗ Position yourself') : 'Click to begin guided training'}
                        </p>
                        <div className="prompt-intensity">
                            <label>Prompt Strength: {promptIntensity}%</label>
                        </div>
                    </div>
                </div>

                <div className="avatar-section">
                    <h3>Responsive Avatar</h3>
                    <ReadyPlayerMeAvatar eyeContact={eyeContact} />
                </div>
            </div>
        </div>
    );
}
