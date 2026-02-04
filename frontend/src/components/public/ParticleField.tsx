'use client';

/**
 * ParticleField - Canvas-based particle system
 *
 * Igloo.inc uses 3D ice blocks with WebGL. Since we don't have 3D assets,
 * we create an atmospheric particle field that responds to scroll,
 * giving a similar high-end, immersive feel.
 *
 * Features:
 * - Floating particles with depth (parallax layers)
 * - Scroll-reactive movement
 * - Mouse interaction (particles drift away from cursor)
 * - Color-matched to the school's blue/gold accent palette
 * - Connects nearby particles with faint lines (constellation effect)
 */

import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number; // depth layer (0-1)
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  baseAlpha: number;
}

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const scrollRef = useRef(0);
  const animRef = useRef<number>(0);
  const dimensionsRef = useRef({ w: 0, h: 0 });

  const PARTICLE_COUNT = 150;
  const CONNECTION_DISTANCE = 120;
  const MOUSE_RADIUS = 150;

  const createParticle = useCallback((w: number, h: number): Particle => {
    const z = Math.random();
    const isGold = Math.random() < 0.3;
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      z,
      vx: (Math.random() - 0.5) * 0.3 * (1 - z * 0.5),
      vy: (Math.random() - 0.5) * 0.2 * (1 - z * 0.5),
      size: (1 + Math.random() * 2) * (0.5 + z * 0.5),
      color: isGold ? '#F5D76E' : '#6691E5',
      alpha: 0,
      baseAlpha: (0.3 + Math.random() * 0.5) * (0.4 + z * 0.6),
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);
      dimensionsRef.current = { w, h };
    };

    const initParticles = () => {
      const { w, h } = dimensionsRef.current;
      particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () =>
        createParticle(w, h)
      );
    };

    resize();
    initParticles();

    const handleResize = () => {
      resize();
      initParticles();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleScroll = () => {
      scrollRef.current = window.scrollY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    let lastTime = 0;

    const animate = (time: number) => {
      const delta = Math.min((time - lastTime) / 16.67, 3); // cap at 3x speed
      lastTime = time;

      const { w, h } = dimensionsRef.current;
      const scrollOffset = scrollRef.current;
      const mouse = mouseRef.current;

      ctx.clearRect(0, 0, w, h);

      const particles = particlesRef.current;

      // Update & draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Fade in
        if (p.alpha < p.baseAlpha) {
          p.alpha = Math.min(p.alpha + 0.005 * delta, p.baseAlpha);
        }

        // Scroll parallax - deeper particles move slower
        const scrollEffect = scrollOffset * 0.0003 * (1 - p.z * 0.7);
        const scrollY = Math.sin(scrollEffect + p.x * 0.001) * 20 * p.z;

        // Mouse repulsion
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
          p.vx += (dx / dist) * force * 0.5 * delta;
          p.vy += (dy / dist) * force * 0.5 * delta;
        }

        // Apply velocity with damping
        p.x += p.vx * delta;
        p.y += (p.vy + scrollY * 0.01) * delta;
        p.vx *= 0.98;
        p.vy *= 0.98;

        // Wrap around edges
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();

        // Draw glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        const glow = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, p.size * 3
        );
        glow.addColorStop(0, p.color);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.globalAlpha = p.alpha * 0.4;
        ctx.fill();
      }

      // Draw connections between nearby particles
      ctx.globalAlpha = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DISTANCE) {
            const alpha = (1 - dist / CONNECTION_DISTANCE) * 0.12 * Math.min(a.alpha, b.alpha) / Math.max(a.baseAlpha, 0.01);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = a.color;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [createParticle]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
