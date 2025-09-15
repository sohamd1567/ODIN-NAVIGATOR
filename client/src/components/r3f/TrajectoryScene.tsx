import React, { useMemo, useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, Html, Line, Trail, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { usePlanetCullingGuard } from '@/hooks/usePlanetCullingGuard';

export type TrajectorySceneHandles = {
  resetView: () => void;
};

type TrajectorySceneProps = {
  progress: number; // 0..1
  playing: boolean;
  onProgress?: (p: number) => void;
};

function EarthMoonSystem({ curve, progress }: { curve: THREE.CatmullRomCurve3; progress: number }) {
  const shipRef = useRef<THREE.Mesh>(null);
  const earthGroupRef = useRef<THREE.Group>(null);
  const moonRef = useRef<THREE.Mesh>(null);

  // Harden frustum-culling behavior for planet meshes
  usePlanetCullingGuard(earthGroupRef, 'disable');
  usePlanetCullingGuard(moonRef as any, 'disable');

  // Earth textures (three.js example textures hosted on GitHub)
  const [earthColor, earthNormal, earthSpec, clouds] = useLoader(THREE.TextureLoader, [
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png',
  ]);

  // Ensure proper color space for sRGB textures (for newer three)
  useMemo(() => {
    // @ts-ignore optional in older three versions
    if (earthColor && (earthColor as any).colorSpace !== undefined) {
      (earthColor as any).colorSpace = (THREE as any).SRGBColorSpace ?? (THREE as any).sRGBEncoding;
    }
    // @ts-ignore optional in older three versions
    if (clouds && (clouds as any).colorSpace !== undefined) {
      (clouds as any).colorSpace = (THREE as any).SRGBColorSpace ?? (THREE as any).sRGBEncoding;
    }
    return undefined;
  }, [earthColor, clouds]);

  // Bodies
  const moonMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#cfcfd1', roughness: 1, metalness: 0 }), []);

  // Path points for Line
  const pathPoints = useMemo(() => curve.getPoints(200).map(p => [p.x, p.y, p.z]), [curve]);

  useFrame((_, dt) => {
    if (!shipRef.current) return;
    const p = curve.getPointAt(THREE.MathUtils.clamp(progress, 0, 1));
    shipRef.current.position.set(p.x, p.y, p.z);
    const tangent = curve.getTangentAt(THREE.MathUtils.clamp(progress, 0, 1));
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, tangent.clone().normalize());
    shipRef.current.quaternion.slerp(quat, 0.2);
    // Gentle Earth/clouds rotation
    if (earthGroupRef.current) {
      earthGroupRef.current.rotation.y += dt * 0.02;
    }
  });

  return (
    <group>
      {/* Earth */}
      <group position={[0, 0, 0]} ref={earthGroupRef} renderOrder={0}>
        {/* Earth body with maps */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[1.0, 64, 64]} />
          <meshPhongMaterial
            map={earthColor}
            normalMap={earthNormal}
            specularMap={earthSpec}
            specular={new THREE.Color('#222')}
            shininess={8}
          />
        </mesh>
        {/* Clouds layer */}
        <mesh>
          <sphereGeometry args={[1.01, 64, 64]} />
          <meshPhongMaterial map={clouds} transparent opacity={0.5} depthWrite={false} />
        </mesh>
        {/* Subtle atmosphere glow */}
        <mesh>
          <sphereGeometry args={[1.05, 64, 64]} />
          <meshBasicMaterial color="#2e83ff" transparent opacity={0.08} />
        </mesh>
      </group>

      {/* Moon */}
      <mesh ref={moonRef} position={[4, 0.2, -0.5]} castShadow receiveShadow renderOrder={0}>
        <sphereGeometry args={[0.27, 32, 32]} />
        <primitive object={moonMat} attach="material" />
      </mesh>

      {/* Trajectory */}
  <Line points={pathPoints as any} color="#00e6ff" lineWidth={2} transparent opacity={0.9} />

      {/* Spacecraft */}
  <mesh ref={shipRef} castShadow>
        <icosahedronGeometry args={[0.08, 0]} />
        <meshStandardMaterial color="#fff48c" emissive="#5f5a00" emissiveIntensity={0.5} metalness={0.3} roughness={0.4} />
      </mesh>
    </group>
  );
}

function HazardLayer({ curve, progress }: { curve: THREE.CatmullRomCurve3; progress: number }) {
  // Debris cloud near the middle of the path
  const debris = useMemo(() => {
    const pts: [number, number, number][] = [];
    const center = curve.getPointAt(0.5);
    for (let i = 0; i < 250; i++) {
      const r = 0.6 + Math.random() * 0.7;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pts.push([
        center.x + r * Math.sin(phi) * Math.cos(theta),
        center.y + r * Math.sin(phi) * Math.sin(theta),
        center.z + r * Math.cos(phi),
      ]);
    }
    return pts;
  }, [curve]);

  // Small asteroids placed along the trajectory at fixed progress points
  const asteroidSeeds = useMemo(() => [0.15, 0.33, 0.5, 0.62, 0.74, 0.82, 0.9]
    .map(t => ({ t, ofs: new THREE.Vector3((Math.random()-0.5)*0.4, (Math.random()-0.5)*0.4, (Math.random()-0.5)*0.4) })), []);
  const asteroidPositions = useMemo(() => asteroidSeeds.map(({ t, ofs }) => curve.getPointAt(t).clone().add(ofs)), [asteroidSeeds, curve]);

  // Comet moving roughly along the path with a trailing tail
  const cometRef = useRef<THREE.Mesh>(null);
  const [cometPhase, setCometPhase] = useState(0);
  useFrame((_, dt) => {
    setCometPhase(p => (p + dt * 0.12) % 1);
    if (cometRef.current) {
      const u = (cometPhase + 0.1) % 1;
      const p = curve.getPointAt(u);
      const tangent = curve.getTangentAt(u).normalize();
      const sideways = new THREE.Vector3(0, 1, 0).cross(tangent).normalize().multiplyScalar(0.25);
      cometRef.current.position.set(p.x + sideways.x, p.y + sideways.y, p.z + sideways.z);
    }
  });

  // Solar flare highlighted segment on the trajectory
  const [sfStart, sfEnd] = [0.58, 0.68];
  const flarePoints = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= 40; i++) {
      const tt = sfStart + (sfEnd - sfStart) * (i / 40);
      const v = curve.getPointAt(tt);
      pts.push([v.x, v.y, v.z]);
    }
    return pts;
  }, [curve]);
  const flareMid = useMemo(() => curve.getPointAt((sfStart + sfEnd) / 2), [curve]);
  const flarePulse = 0.6 + Math.abs(Math.sin(progress * Math.PI * 2)) * 0.4;

  return (
    <group>
      {/* Debris background */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={debris.length} array={new Float32Array(debris.flat())} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color="#b0bcd3" size={0.02} sizeAttenuation depthWrite={false} />
      </points>

      {/* Asteroids along the path */}
      {asteroidPositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow receiveShadow>
          <icosahedronGeometry args={[0.06 + (i % 3) * 0.02, 0]} />
          <meshStandardMaterial color="#9aa3ad" roughness={1} metalness={0} />
        </mesh>
      ))}

      {/* Comet and tail */}
      <Trail width={0.25} length={16} color="#bfe8ff" attenuation={(t) => t}>
        <mesh ref={cometRef}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#66ccff" emissiveIntensity={1} />
        </mesh>
      </Trail>

      {/* Solar flare highlighted segment */}
      <Line points={flarePoints as any} color="#ff9a2e" lineWidth={3} transparent opacity={flarePulse} />
      <Sparkles color="#ffb766" count={80} size={2} speed={0.5} noise={0.6} scale={[0.8, 0.8, 0.8]} position={[flareMid.x, flareMid.y, flareMid.z]} />
    </group>
  );
}

function Labels({ curve, progress }: { curve: THREE.CatmullRomCurve3; progress: number }) {
  const shipPos = useMemo(() => curve.getPointAt(progress), [curve, progress]);
  return (
    <group>
      <Html position={[0, 1.2, 0]} center>
        <div className="px-2 py-1 rounded bg-black/60 border border-white/10 text-xs">Earth</div>
      </Html>
      <Html position={[4, 0.6, -0.5]} center>
        <div className="px-2 py-1 rounded bg-black/60 border border-white/10 text-xs">Moon</div>
      </Html>
      <Html position={[shipPos.x, shipPos.y + 0.25, shipPos.z]} center>
        <div className="px-2 py-1 rounded bg-slate-900/80 border border-cyan-300/30 text-[11px]">
          <span className="font-mono">SC</span> · {(progress * 100).toFixed(0)}%
        </div>
      </Html>
    </group>
  );
}

function DevHUD() {
  // Lightweight HUD: show camera distance/planes in dev only
  // eslint-disable-next-line no-constant-condition
  if (process.env.NODE_ENV === 'production') return null as any;
  return (
    <Html position={[0, -2.2, 0]} center>
      <div id="odin-dev-hud" style={{ pointerEvents: 'none' }} className="font-mono text-[10px] text-white/80 bg-black/60 px-2 py-1 rounded border border-white/10">
        <CameraStats />
      </div>
    </Html>
  );
}

function CameraStats() {
  const { camera } = (require('@react-three/fiber') as any).useThree();
  const [txt, setTxt] = useState('');
  useFrame(() => {
    if (camera) {
      const d = (camera as THREE.PerspectiveCamera).position.length();
      const near = (camera as THREE.PerspectiveCamera).near;
      const far = (camera as THREE.PerspectiveCamera).far;
      setTxt(`d=${d.toFixed(2)} near=${near} far=${far}`);
    }
  });
  return <span>{txt}</span>;
}

function InnerScene({ progress, playing, onProgress }: TrajectorySceneProps) {
  // Curve from Earth to Moon with a nice arc
  const curve = useMemo(() => {
    const pts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1.2, 1.1, -0.3),
      new THREE.Vector3(2.4, 0.7, 0.6),
      new THREE.Vector3(3.2, 0.2, 0.1),
      new THREE.Vector3(4, 0.2, -0.5),
    ];
    const c = new THREE.CatmullRomCurve3(pts);
    c.curveType = 'centripetal';
    return c;
  }, []);

  // Auto-advance progress when playing
  useFrame((_, dt) => {
    if (!playing) return;
    const next = (progress + dt * 0.05) % 1; // ~20s per loop
    onProgress?.(next);
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 4]} intensity={1.2} castShadow />
      {/* Background starfield rendered behind planets; prevent depth conflicts */}
      <group renderOrder={-1}>
        <Stars radius={30} depth={60} count={8000} factor={3} fade speed={0.6} />
      </group>

      <EarthMoonSystem curve={curve} progress={progress} />
      <HazardLayer curve={curve} progress={progress} />
      <Labels curve={curve} progress={progress} />
  <DevHUD />
    </>
  );
}

const TrajectoryScene = forwardRef<TrajectorySceneHandles, TrajectorySceneProps>(function TrajectoryScene(
  { progress, playing, onProgress }: TrajectorySceneProps,
  ref
) {
  const controlsRef = useRef<any>(null);
  useImperativeHandle(ref, () => ({
    resetView: () => controlsRef.current?.reset?.(),
  }), []);

  // Camera plane assertions (dev-only warnings) and generous far plane
  const onCreated = ({ camera, gl }: any) => {
    // Perspective camera tuning for cislunar distances
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.near = 0.05;
      camera.far = 1e7;
      camera.updateProjectionMatrix();
    }
    // Cap device pixel ratio to avoid perf regressions
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  return (
    <Canvas shadows camera={{ position: [3.5, 2.2, 4.8], fov: 52, near: 0.05, far: 1e7 }} onCreated={onCreated} style={{ width: '100%', height: '100%' }}>
      <color attach="background" args={[0x05070a]} />
      <InnerScene progress={progress} playing={playing} onProgress={onProgress} />
      <OrbitControls ref={controlsRef} enablePan enableRotate enableZoom minDistance={1.2} maxDistance={1800} makeDefault />
    </Canvas>
  );
});

export default TrajectoryScene;
