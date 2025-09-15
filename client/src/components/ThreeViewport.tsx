import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

type Props = { width: number; height: number };

export default function ThreeViewport({ width, height }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const mount = mountRef.current!;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050a15);
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    camera.position.set(0, 0, 220);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    mount.appendChild(renderer.domElement);

    // Lights
    const light = new THREE.PointLight(0x66d9ff, 1.2, 0);
    light.position.set(50, 50, 100);
    scene.add(light);

    // Earth sphere
    const earthGeo = new THREE.SphereGeometry(16, 32, 32);
    const earthMat = new THREE.MeshStandardMaterial({ color: 0x0a78a5, emissive: 0x0a1e2a, metalness: 0.1, roughness: 0.7 });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earth.position.set(-60, 0, 0);
    scene.add(earth);

    // Moon sphere
    const moonGeo = new THREE.SphereGeometry(6, 24, 24);
    const moonMat = new THREE.MeshStandardMaterial({ color: 0xb6b6b6, emissive: 0x222222, metalness: 0.05, roughness: 0.9 });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(60, 0, 0);
    scene.add(moon);

    // Particles
    const starCount = Math.min(6000, Math.floor((width * height) / 6));
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 600;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 300;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 400;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, transparent: true, opacity: 0.8 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Trajectory arc (simple curve)
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-40, -10, 0),
      new THREE.Vector3(0, 40, 0),
      new THREE.Vector3(40, 0, 0)
    );
    const points = curve.getPoints(100);
    const curveGeo = new THREE.BufferGeometry().setFromPoints(points);
    const curveMat = new THREE.LineBasicMaterial({ color: 0x5ee0ff });
    const line = new THREE.Line(curveGeo, curveMat);
    scene.add(line);

    sceneRef.current = scene; cameraRef.current = camera; rendererRef.current = renderer;

    const onResize = () => {
      if (!rendererRef.current || !cameraRef.current) return;
      const w = width; const h = height;
      rendererRef.current.setSize(w, h);
      cameraRef.current.aspect = w / h; cameraRef.current.updateProjectionMatrix();
    };

    function animate() {
      earth.rotation.y += 0.002;
      moon.rotation.y += 0.003;
      stars.rotation.y += 0.0005;
      renderer.render(scene, camera);
      animRef.current = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      starGeo.dispose();
      curveGeo.dispose();
    };
  }, [width, height]);

  return <div ref={mountRef} style={{ width, height, borderRadius: 10, overflow: 'hidden' }} aria-label="Three.js 3D viewport" />;
}
