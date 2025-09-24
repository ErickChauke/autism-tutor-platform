import React, { useRef, useEffect, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import AvatarRenderer from './AvatarRenderer';
import '../styles/FaceTracker.css';

export default function FaceTracker({ mode }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isTracking, setIsTracking] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [eyeContact, setEyeContact] = useState(false);

    const modeNames = {
        assessment: 'Assessment Mode',
        prompting: 'Prompting Mode',
        prt: 'PRT Mode',
        research: 'Research Mode'
    };

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
                
                const color = lookingForward ? '#00ff00' : '#4A90E2';
                [leftEye, rightEye].forEach(landmark => {
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 8, 0, 2 * Math.PI);
                    ctx.fill();
                });
            } else {
                setFaceDetected(false);
                setEyeContact(false);
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
    }, [isTracking]);

    return (
        <div className="facetracker-container">
            <div className="mode-indicator">
                <span className="mode-badge">{modeNames[mode]}</span>
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
                    </div>
                </div>

                <div className="avatar-section">
                    <h3>Training Avatar</h3>
                    <AvatarRenderer eyeContact={eyeContact} />
                </div>
            </div>
        </div>
    );
}
