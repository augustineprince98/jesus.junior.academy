'use client';

/**
 * Scene3D - Three.js 3D Background with Floating Geometric Shapes
 *
 * Creates an immersive 3D background with:
 * - Floating icosahedrons (crystal-like)
 * - Wireframe spheres (network nodes)
 * - Torus knots (complex geometry)
 * - Subtle rotation and floating animations
 * - Scroll-linked camera movement
 *
 * All geometries are procedurally generated - no external assets needed!
 */

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial, MeshWobbleMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Floating crystal icosahedron
function FloatingCrystal({ position, scale = 1, color = '#6691E5', speed = 1 }: {
    position: [number, number, number];
    scale?: number;
    color?: string;
    speed?: number;
}) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += 0.003 * speed;
            meshRef.current.rotation.y += 0.005 * speed;
        }
    });

    return (
        <Float
            speed={1.5 * speed}
            rotationIntensity={0.5}
            floatIntensity={0.8}
            floatingRange={[-0.2, 0.2]}
        >
            <mesh ref={meshRef} position={position} scale={scale}>
                <icosahedronGeometry args={[1, 0]} />
                <meshStandardMaterial
                    color={color}
                    wireframe
                    transparent
                    opacity={0.6}
                    emissive={color}
                    emissiveIntensity={0.2}
                />
            </mesh>
        </Float>
    );
}

// Wireframe sphere (network node)
function NetworkNode({ position, scale = 1, color = '#F5D76E' }: {
    position: [number, number, number];
    scale?: number;
    color?: string;
}) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
        }
    });

    return (
        <Float speed={1} floatIntensity={0.5}>
            <mesh ref={meshRef} position={position} scale={scale}>
                <sphereGeometry args={[1, 16, 16]} />
                <meshStandardMaterial
                    color={color}
                    wireframe
                    transparent
                    opacity={0.4}
                />
            </mesh>
        </Float>
    );
}

// Complex torus knot
function TorusKnotShape({ position, scale = 1, color = '#a855f7' }: {
    position: [number, number, number];
    scale?: number;
    color?: string;
}) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x = state.clock.elapsedTime * 0.1;
            meshRef.current.rotation.z = state.clock.elapsedTime * 0.15;
        }
    });

    return (
        <Float speed={0.8} floatIntensity={0.6}>
            <mesh ref={meshRef} position={position} scale={scale}>
                <torusKnotGeometry args={[1, 0.3, 64, 8]} />
                <meshStandardMaterial
                    color={color}
                    wireframe
                    transparent
                    opacity={0.3}
                />
            </mesh>
        </Float>
    );
}

// Octahedron (diamond shape)
function DiamondShape({ position, scale = 1, color = '#22d3d1' }: {
    position: [number, number, number];
    scale?: number;
    color?: string;
}) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.01;
            meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.2;
        }
    });

    return (
        <Float speed={1.2} floatIntensity={0.7}>
            <mesh ref={meshRef} position={position} scale={scale}>
                <octahedronGeometry args={[1, 0]} />
                <MeshDistortMaterial
                    color={color}
                    wireframe
                    transparent
                    opacity={0.5}
                    distort={0.2}
                    speed={2}
                />
            </mesh>
        </Float>
    );
}

// Particle points cloud
function ParticleCloud({ count = 200 }: { count?: number }) {
    const points = useMemo(() => {
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
        }
        return positions;
    }, [count]);

    const pointsRef = useRef<THREE.Points>(null);

    useFrame((state) => {
        if (pointsRef.current) {
            pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
        }
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={points}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.03}
                color="#6691E5"
                transparent
                opacity={0.6}
                sizeAttenuation
            />
        </points>
    );
}

// Main scene component
function Scene() {
    const { camera } = useThree();

    // Subtle camera movement based on mouse
    useFrame((state) => {
        const time = state.clock.elapsedTime;
        camera.position.x = Math.sin(time * 0.1) * 0.5;
        camera.position.y = Math.cos(time * 0.1) * 0.3;
        camera.lookAt(0, 0, 0);
    });

    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.3} />
            <pointLight position={[10, 10, 10]} intensity={0.5} color="#6691E5" />
            <pointLight position={[-10, -10, -10]} intensity={0.3} color="#F5D76E" />

            {/* Floating shapes */}
            <FloatingCrystal position={[-4, 2, -5]} scale={0.8} color="#6691E5" speed={0.8} />
            <FloatingCrystal position={[5, -1, -8]} scale={1.2} color="#a855f7" speed={1.2} />
            <FloatingCrystal position={[-2, -3, -6]} scale={0.6} color="#22d3d1" speed={1} />

            <NetworkNode position={[3, 3, -7]} scale={0.5} color="#F5D76E" />
            <NetworkNode position={[-5, -2, -10]} scale={0.7} color="#6691E5" />

            <TorusKnotShape position={[0, 0, -12]} scale={0.4} color="#a855f7" />
            <TorusKnotShape position={[6, 1, -15]} scale={0.3} color="#22d3d1" />

            <DiamondShape position={[-3, 4, -8]} scale={0.5} color="#F5D76E" />
            <DiamondShape position={[4, -3, -6]} scale={0.4} color="#6691E5" />

            {/* Particle cloud */}
            <ParticleCloud count={150} />
        </>
    );
}

export default function Scene3D() {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none">
            <Canvas
                camera={{ position: [0, 0, 8], fov: 60 }}
                dpr={[1, 1.5]}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: 'high-performance',
                    failIfMajorPerformanceCaveat: false,
                    stencil: false,
                    depth: true,
                }}
                frameloop="always"
                performance={{ min: 0.5 }}
                style={{ background: 'transparent' }}
            >
                <Suspense fallback={null}>
                    <Scene />
                </Suspense>
            </Canvas>
        </div>
    );
}
