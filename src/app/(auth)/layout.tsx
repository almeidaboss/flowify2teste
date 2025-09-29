
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

const NUM_PARTICLES = 80;
const CONNECT_DISTANCE = 120;
const INTERACTION_RADIUS = 150;
const REPEL_STRENGTH = 0.5;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  originalX: number;
  originalY: number;
}

const ParticleNetwork = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const mouseRef = useRef({ x: -9999, y: -9999 });

    const createParticles = useCallback((width: number, height: number) => {
        const particles: Particle[] = [];
        for (let i = 0; i < NUM_PARTICLES; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
                originalX: x,
                originalY: y,
            });
        }
        particlesRef.current = particles;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            createParticles(canvas.width, canvas.height);
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        let animationFrameId: number;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const particles = particlesRef.current;
            
            // Draw lines
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < CONNECT_DISTANCE) {
                        ctx.beginPath();
                        ctx.strokeStyle = `hsla(28, 100%, 50%, ${1 - distance / CONNECT_DISTANCE})`;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
            
            // Draw particles and update positions
            particles.forEach(p => {
                // Interaction with mouse
                let interactDx = p.x - mouseRef.current.x;
                let interactDy = p.y - mouseRef.current.y;
                let interactDistance = Math.sqrt(interactDx * interactDx + interactDy * interactDy);

                if (interactDistance < INTERACTION_RADIUS) {
                    const force = (INTERACTION_RADIUS - interactDistance) / INTERACTION_RADIUS;
                    p.x += (interactDx / interactDistance) * force * REPEL_STRENGTH;
                    p.y += (interactDy / interactDistance) * force * REPEL_STRENGTH;
                }

                // Move particles
                p.x += p.vx;
                p.y += p.vy;

                // Bounce off walls
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
                
                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = 'hsl(var(--cod-orange))';
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [createParticles]);

    const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
        mouseRef.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseLeave = () => {
        mouseRef.current = { x: -9999, y: -9999 };
    };

    return <canvas ref={canvasRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className="absolute inset-0 z-0" />;
};


export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showParticles = pathname === '/signup';

  return (
    <main className="relative flex h-screen min-h-screen w-screen items-center justify-center bg-cod-bg p-4 overflow-hidden">
        {showParticles && <ParticleNetwork />}
        <div className="z-10">
            {children}
        </div>
    </main>
  );
}
