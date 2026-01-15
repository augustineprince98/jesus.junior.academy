'use client';

/**
 * Campus - The Heart of the 3D Experience
 *
 * This is NOT a game. This is a digital campus.
 * Users don't play - they ENTER.
 *
 * Design principles:
 * - Calm, dignified visuals
 * - Tap/click navigation (no joystick)
 * - Smooth camera transitions
 * - Works on mobile without overheating
 */

import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  Sky,
  ContactShadows,
  Html,
  useProgress,
} from '@react-three/drei';
import { Vector3, MathUtils } from 'three';
import { useCampusStore, useAuthStore, canAccessBuilding } from '@/store/useStore';
import type { BuildingType } from '@/types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LOADING SCREEN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        <p className="text-primary-600 font-medium">
          Entering Campus... {progress.toFixed(0)}%
        </p>
      </div>
    </Html>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CAMERA CONTROLLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function CameraController() {
  const { camera } = useThree();
  const cameraTarget = useCampusStore((s) => s.cameraTarget);
  const setTransitioning = useCampusStore((s) => s.setTransitioning);

  const targetPosition = useRef(new Vector3(...cameraTarget.position));
  const targetLookAt = useRef(new Vector3(...cameraTarget.lookAt));

  useEffect(() => {
    targetPosition.current.set(...cameraTarget.position);
    targetLookAt.current.set(...cameraTarget.lookAt);
  }, [cameraTarget]);

  useFrame((_, delta) => {
    // Smooth camera movement
    const lerpFactor = MathUtils.clamp(delta * 2, 0, 1);

    camera.position.lerp(targetPosition.current, lerpFactor);

    // Check if camera reached target
    const distance = camera.position.distanceTo(targetPosition.current);
    if (distance < 0.1) {
      setTransitioning(false);
    }
  });

  return null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GROUND PLANE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function Ground() {
  return (
    <group>
      {/* Main grass area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#4A7C59" roughness={0.9} />
      </mesh>

      {/* Pathway - Central */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 5]} receiveShadow>
        <planeGeometry args={[4, 20]} />
        <meshStandardMaterial color="#C4B5A0" roughness={0.8} />
      </mesh>

      {/* Pathway - To Classroom */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-6, 0.01, 0]} receiveShadow>
        <planeGeometry args={[12, 3]} />
        <meshStandardMaterial color="#C4B5A0" roughness={0.8} />
      </mesh>

      {/* Pathway - To Library */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6, 0.01, 0]} receiveShadow>
        <planeGeometry args={[12, 3]} />
        <meshStandardMaterial color="#C4B5A0" roughness={0.8} />
      </mesh>
    </group>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BUILDING COMPONENT (Reusable)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface BuildingProps {
  id: BuildingType;
  name: string;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  roofColor?: string;
}

function Building({ id, name, position, size, color, roofColor = '#8B4513' }: BuildingProps) {
  const user = useAuthStore((s) => s.user);
  const enterBuilding = useCampusStore((s) => s.enterBuilding);
  const currentBuilding = useCampusStore((s) => s.currentBuilding);
  const isTransitioning = useCampusStore((s) => s.isTransitioning);

  const canAccess = canAccessBuilding(user?.role, id);
  const isActive = currentBuilding === id;

  const handleClick = () => {
    if (canAccess && !isTransitioning && !isActive) {
      enterBuilding(id);
    }
  };

  return (
    <group position={position}>
      {/* Building body */}
      <mesh
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={() => document.body.style.cursor = canAccess ? 'pointer' : 'default'}
        onPointerOut={() => document.body.style.cursor = 'default'}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={isActive ? '#FFD700' : color}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Roof */}
      <mesh position={[0, size[1] / 2 + 0.5, 0]} castShadow>
        <coneGeometry args={[size[0] * 0.7, 1.5, 4]} />
        <meshStandardMaterial color={roofColor} roughness={0.8} />
      </mesh>

      {/* Label */}
      <Html
        position={[0, size[1] + 2, 0]}
        center
        distanceFactor={15}
        occlude
      >
        <div
          className={`building-label ${isActive ? 'active' : ''} ${!canAccess ? 'opacity-50' : ''}`}
          onClick={handleClick}
        >
          {name}
        </div>
      </Html>
    </group>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NOTICE BOARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function NoticeBoard() {
  const user = useAuthStore((s) => s.user);
  const enterBuilding = useCampusStore((s) => s.enterBuilding);
  const currentBuilding = useCampusStore((s) => s.currentBuilding);

  const isActive = currentBuilding === 'noticeboard';
  const canAccess = canAccessBuilding(user?.role, 'noticeboard');

  return (
    <group position={[3, 0, 8]}>
      {/* Post */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 2, 8]} />
        <meshStandardMaterial color="#5C4033" roughness={0.9} />
      </mesh>

      {/* Board */}
      <mesh
        position={[0, 2.2, 0]}
        castShadow
        onClick={() => canAccess && enterBuilding('noticeboard')}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'default'}
      >
        <boxGeometry args={[2, 1.5, 0.1]} />
        <meshStandardMaterial
          color={isActive ? '#FFD700' : '#DEB887'}
          roughness={0.6}
        />
      </mesh>

      {/* Header */}
      <mesh position={[0, 3.1, 0]} castShadow>
        <boxGeometry args={[2.2, 0.3, 0.15]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>

      <Html position={[0, 3.5, 0]} center distanceFactor={15}>
        <div className={`building-label ${isActive ? 'active' : ''}`}>
          Notice Board
        </div>
      </Html>
    </group>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ENTRANCE GATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function EntranceGate() {
  return (
    <group position={[0, 0, 12]}>
      {/* Left pillar */}
      <mesh position={[-2.5, 2, 0]} castShadow>
        <boxGeometry args={[0.8, 4, 0.8]} />
        <meshStandardMaterial color="#D4B896" roughness={0.7} />
      </mesh>

      {/* Right pillar */}
      <mesh position={[2.5, 2, 0]} castShadow>
        <boxGeometry args={[0.8, 4, 0.8]} />
        <meshStandardMaterial color="#D4B896" roughness={0.7} />
      </mesh>

      {/* Arch */}
      <mesh position={[0, 4.5, 0]} castShadow>
        <boxGeometry args={[6, 1, 0.6]} />
        <meshStandardMaterial color="#D4B896" roughness={0.7} />
      </mesh>

      {/* School name plate */}
      <Html position={[0, 5.5, 0]} center distanceFactor={20}>
        <div className="px-6 py-2 bg-primary-500 text-white font-bold rounded-lg shadow-lg whitespace-nowrap">
          Jesus Junior Academy
        </div>
      </Html>
    </group>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TREES (Decorative)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 2, 8]} />
        <meshStandardMaterial color="#5C4033" roughness={0.9} />
      </mesh>

      {/* Foliage */}
      <mesh position={[0, 3, 0]} castShadow>
        <coneGeometry args={[1.5, 3, 8]} />
        <meshStandardMaterial color="#2D5A27" roughness={0.8} />
      </mesh>
    </group>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN SCENE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function Scene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      {/* Environment */}
      <Sky sunPosition={[100, 20, 100]} />
      <Environment preset="dawn" />

      {/* Camera Controller */}
      <CameraController />

      {/* Ground */}
      <Ground />
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.4}
        scale={50}
        blur={2}
        far={20}
      />

      {/* Entrance */}
      <EntranceGate />

      {/* Buildings */}
      <Building
        id="classroom"
        name="Classroom Building"
        position={[-10, 2, 0]}
        size={[8, 4, 6]}
        color="#D4B896"
      />

      <Building
        id="library"
        name="Library"
        position={[10, 2, 0]}
        size={[6, 4, 6]}
        color="#C9B896"
      />

      <Building
        id="accounts"
        name="Accounts Office"
        position={[12, 1.5, -8]}
        size={[5, 3, 4]}
        color="#D4C4A8"
      />

      <Building
        id="staffroom"
        name="Staff Room"
        position={[-12, 1.5, -8]}
        size={[5, 3, 4]}
        color="#D4C4A8"
      />

      <Building
        id="adminblock"
        name="Admin Block"
        position={[0, 2.5, -15]}
        size={[10, 5, 6]}
        color="#BFA98F"
        roofColor="#6B4423"
      />

      {/* Notice Board */}
      <NoticeBoard />

      {/* Trees */}
      <Tree position={[-6, 0, 8]} />
      <Tree position={[6, 0, 8]} />
      <Tree position={[-18, 0, -5]} />
      <Tree position={[18, 0, -5]} />
      <Tree position={[-15, 0, 5]} />
      <Tree position={[15, 0, 5]} />
    </>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function Campus() {
  return (
    <div className="canvas-container">
      <Canvas
        shadows
        camera={{ position: [0, 15, 25], fov: 50 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]} // Adaptive pixel ratio for performance
      >
        <Suspense fallback={<Loader />}>
          <Scene />
        </Suspense>

        {/* Controls - Limited for non-game feel */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          minDistance={10}
          maxDistance={40}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 6}
          rotateSpeed={0.5}
          zoomSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
