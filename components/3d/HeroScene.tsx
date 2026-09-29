'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Low-poly Building Tower with glowing windows
function Tower({
  position,
  height,
  width,
  depth,
  glowColor = '#06b6d4',
  wingLabel,
}: {
  position: [number, number, number];
  height: number;
  width: number;
  depth: number;
  glowColor?: string;
  wingLabel: string;
}) {
  const floors = Math.floor(height / 0.8);

  const windowGrids = useMemo(() => {
    const arr = [];
    for (let f = 0; f < floors; f++) {
      for (let side = 0; side < 2; side++) {
        arr.push({
          y: -height / 2 + 0.5 + f * 0.75,
          x: side === 0 ? -width / 2 + 0.35 : width / 2 - 0.35,
          z: depth / 2 + 0.02,
          isLit: Math.random() > 0.35,
        });
      }
    }
    return arr;
  }, [floors, height, width, depth]);

  return (
    <group position={position}>
      {/* Tower Body */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color="#151d30"
          roughness={0.4}
          metalness={0.7}
        />
      </mesh>

      {/* Rooftop Parapet / Terrace */}
      <mesh position={[0, height / 2 + 0.1, 0]}>
        <boxGeometry args={[width + 0.1, 0.2, depth + 0.1]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} />
      </mesh>

      {/* Rooftop Water Tank */}
      <mesh position={[0, height / 2 + 0.55, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.7, 16]} />
        <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Glowing Windows */}
      {windowGrids.map((w, idx) => (
        <mesh key={idx} position={[w.x, w.y, w.z]}>
          <planeGeometry args={[0.3, 0.4]} />
          <meshBasicMaterial
            color={w.isLit ? glowColor : '#1e293b'}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Rooftop Beacon Light */}
      <pointLight
        position={[0, height / 2 + 1, 0]}
        color={glowColor}
        intensity={0.8}
        distance={4}
      />
    </group>
  );
}

// Animated Elevator Shaft and Moving Lift Cabin
function AnimatedLiftShaft({ position }: { position: [number, number, number] }) {
  const liftCabinRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (liftCabinRef.current) {
      // Oscillate lift cabin up and down between floor 0 and 5
      const t = state.clock.getElapsedTime();
      liftCabinRef.current.position.y = Math.sin(t * 0.8) * 2.2 + 2.5;
    }
  });

  return (
    <group position={position}>
      {/* Glass Lift Column */}
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[0.9, 5.2, 0.9]} />
        <meshPhysicalMaterial
          color="#06b6d4"
          transmission={0.8}
          opacity={0.35}
          transparent
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Moving Lift Cabin with glowing interior */}
      <mesh ref={liftCabinRef} position={[0, 1, 0]}>
        <boxGeometry args={[0.7, 0.8, 0.7]} />
        <meshStandardMaterial
          color="#f8fafc"
          emissive="#06b6d4"
          emissiveIntensity={1.2}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

// Floating Dust Particles in Zero-G
function ZeroGParticles({ count = 60 }: { count?: number }) {
  const points = useMemo(() => {
    const coords = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      coords[i * 3] = (Math.random() - 0.5) * 20;
      coords[i * 3 + 1] = Math.random() * 12;
      coords[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return coords;
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[points, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#38bdf8"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// Ground Plane with Parking Bays and Road
function SocietyGround() {
  return (
    <group position={[0, -0.05, 0]}>
      {/* Dark ground pavement */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 26]} />
        <meshStandardMaterial color="#0b0f19" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Parking bay striping */}
      {[-3, -1.8, -0.6, 0.6, 1.8, 3].map((x, idx) => (
        <mesh key={idx} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, 3.8]}>
          <planeGeometry args={[0.9, 1.8]} />
          <meshBasicMaterial color="#06b6d4" opacity={0.15} transparent />
        </mesh>
      ))}

      {/* Tiny Low-Poly Parked Cars */}
      <mesh position={[-1.8, 0.25, 3.8]}>
        <boxGeometry args={[0.7, 0.45, 1.2]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[1.8, 0.25, 3.8]}>
        <boxGeometry args={[0.7, 0.45, 1.2]} />
        <meshStandardMaterial color="#8b5cf6" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

// Scene Root with Sci-Fi 3-Point Lighting and Parallax
function Scene() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle auto-rotation & parallax
      const t = state.clock.getElapsedTime();
      groupRef.current.rotation.y = Math.sin(t * 0.15) * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Sci-Fi 3-Point Lighting Setup:
          1. Rim Light: strong cyan neon from behind/above
          2. Key Light: soft cool-white front spot
          3. Fill Light: dim deep purple opposite key
      */}
      <directionalLight
        position={[6, 12, -8]}
        intensity={2.2}
        color="#06b6d4"
      />
      <directionalLight
        position={[-6, 10, -8]}
        intensity={1.5}
        color="#ec4899"
      />
      <spotLight
        position={[4, 8, 8]}
        angle={0.6}
        penumbra={0.8}
        intensity={1.2}
        color="#e0f2fe"
        castShadow
      />
      <ambientLight intensity={0.25} color="#581c87" />

      {/* Float Wrapper for subtle zero-gravity levitation */}
      <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.3}>
        {/* Tower A (Left) */}
        <Tower
          position={[-3.6, 2.8, -1]}
          height={5.6}
          width={2.2}
          depth={2}
          glowColor="#06b6d4"
          wingLabel="A"
        />

        {/* Tower B (Center Back - Taller) */}
        <Tower
          position={[-0.8, 3.6, -3.2]}
          height={7.2}
          width={2.4}
          depth={2.2}
          glowColor="#8b5cf6"
          wingLabel="B"
        />

        {/* Tower C (Right) */}
        <Tower
          position={[3.4, 3.1, -1.2]}
          height={6.2}
          width={2.2}
          depth={2}
          glowColor="#10b981"
          wingLabel="C"
        />

        {/* Tower D (Front Right) */}
        <Tower
          position={[1.5, 2.2, 1.2]}
          height={4.4}
          width={2}
          depth={1.8}
          glowColor="#f59e0b"
          wingLabel="D"
        />

        {/* Animated Lift Shaft adjacent to Tower A */}
        <AnimatedLiftShaft position={[-2.1, 0, -1]} />

        {/* Society Ground with Parking */}
        <SocietyGround />

        {/* Floating Particles */}
        <ZeroGParticles count={70} />
      </Float>
    </group>
  );
}

export default function HeroScene({ onLoaded }: { onLoaded?: () => void }) {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{ position: [0, 5, 12], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={() => {
          if (onLoaded) {
            setTimeout(onLoaded, 50);
          }
        }}
      >
        <Scene />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={Math.PI / 4}
          autoRotate
          autoRotateSpeed={0.6}
        />
      </Canvas>
    </div>
  );
}
