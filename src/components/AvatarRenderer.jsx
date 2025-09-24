import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import '../styles/AvatarRenderer.css';

export default function AvatarRenderer({ eyeContact = false }) {
    const mountRef = useRef(null);
    const rendererRef = useRef(null);
    const mouthRef = useRef(null);

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;
        
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xe8f4f8);

        const camera = new THREE.PerspectiveCamera(50, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        camera.position.z = 3.5;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        currentMount.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        scene.add(ambientLight);

        // Face
        const faceGeometry = new THREE.CircleGeometry(1, 64);
        const faceMaterial = new THREE.MeshBasicMaterial({ color: 0xffd4a3 });
        const face = new THREE.Mesh(faceGeometry, faceMaterial);
        scene.add(face);

        // Eyes
        const eyeGeometry = new THREE.CircleGeometry(0.12, 32);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x2c3e50 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.3, 0.2, 0.01);
        scene.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.3, 0.2, 0.01);
        scene.add(rightEye);

        // Mouth
        const mouthCurve = new THREE.EllipseCurve(0, 0, 0.4, 0.2, 0, Math.PI, false);
        const mouthPoints = mouthCurve.getPoints(50);
        const mouthGeometry = new THREE.BufferGeometry().setFromPoints(mouthPoints);
        const mouthMaterial = new THREE.LineBasicMaterial({ color: 0xe74c3c, linewidth: 3 });
        const mouth = new THREE.Line(mouthGeometry, mouthMaterial);
        mouth.position.set(0, -0.3, 0.01);
        mouth.rotation.z = 0; // Default position
        mouthRef.current = mouth;
        scene.add(mouth);

        let animationId;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
            if (currentMount && renderer.domElement && currentMount.contains(renderer.domElement)) {
                currentMount.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, []);

    useEffect(() => {
        if (!mouthRef.current) return;

        const mouth = mouthRef.current;

        if (eyeContact) {
            // SMILE - mouth curves UP (rotation = Math.PI flips it upward)
            mouth.rotation.z = Math.PI;
            mouth.scale.set(1.3, 1.3, 1);
        } else {
            // FROWN - mouth curves DOWN (no rotation)
            mouth.rotation.z = 0;
            mouth.scale.set(1, 1, 1);
        }
    }, [eyeContact]);

    return (
        <div className="avatar-renderer">
            <div ref={mountRef} className="avatar-canvas" />
            <p className="avatar-status">
                {eyeContact ? '😊 Great eye contact!' : '☹️ Look at me'}
            </p>
        </div>
    );
}
