import React, { useRef, useEffect, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import '../styles/FaceTracker.css';

export default function FaceTracker() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isTracking, setIsTracking] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);

    useEffect(() => {
        if (!isTracking) return;

        const faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
        });

        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        faceMesh.onResults(onResults);

        if (videoRef.current) {
            const camera = new Camera(videoRef.current, {
                onFrame: async () => {
                    await faceMesh.send({ image: videoRef.current });
                },
                width: 640,
                height: 480
            });
            camera.start();
        }

        function onResults(results) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;

            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                setFaceDetected(true);
                const landmarks = results.multiFaceLandmarks[0];
                
                // Draw eye landmarks
                drawLandmarks(ctx, canvas, [landmarks[33], landmarks[133]], '#4A90E2');
                drawLandmarks(ctx, canvas, [landmarks[362], landmarks[263]], '#52C4B8');
            } else {
                setFaceDetected(false);
            }
            ctx.restore();
        }

        function drawLandmarks(ctx, canvas, landmarks, color) {
            landmarks.forEach(landmark => {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 5, 0, 2 * Math.PI);
                ctx.fill();
            });
        }

    }, [isTracking]);

    return (
        <div className="facetracker-container">
            <h2>Face Tracking Test</h2>
            <div className="video-container">
                <video ref={videoRef} style={{ display: 'none' }} />
                <canvas ref={canvasRef} />
            </div>
            <div className="controls">
                <button onClick={() => setIsTracking(!isTracking)}>
                    {isTracking ? 'Stop Tracking' : 'Start Tracking'}
                </button>
                <p className="status">
                    {isTracking ? (faceDetected ? '✓ Face Detected' : '✗ No Face Detected') : 'Click to start'}
                </p>
            </div>
        </div>
    );
}
