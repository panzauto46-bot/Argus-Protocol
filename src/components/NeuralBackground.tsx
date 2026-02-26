import { useEffect, useRef } from 'react';

interface NeuralBackgroundProps {
  dark: boolean;
}

interface BackgroundNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  drift: number;
}

export default function NeuralBackground({ dark }: NeuralBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nodes: BackgroundNode[] = [];
    const pointer = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.45,
      active: false,
    };

    let width = 0;
    let height = 0;
    let dpr = 1;
    let rafId = 0;
    let t = 0;

    const makeNode = (): BackgroundNode => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      radius: 1.2 + Math.random() * 2.1,
      phase: Math.random() * Math.PI * 2,
      drift: 0.2 + Math.random() * 0.7,
    });

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const targetCount = Math.max(72, Math.min(132, Math.floor((width * height) / 18500)));
      nodes.length = 0;
      for (let i = 0; i < targetCount; i += 1) {
        nodes.push(makeNode());
      }
    };

    const drawFrame = () => {
      t += 0.016;
      ctx.clearRect(0, 0, width, height);

      const orbX1 = width * 0.3 + Math.cos(t * 0.2) * width * 0.14;
      const orbY1 = height * 0.42 + Math.sin(t * 0.24) * height * 0.12;
      const orbX2 = width * 0.7 + Math.sin(t * 0.15) * width * 0.12;
      const orbY2 = height * 0.58 + Math.cos(t * 0.22) * height * 0.12;

      const glowA = ctx.createRadialGradient(orbX1, orbY1, 0, orbX1, orbY1, width * 0.72);
      glowA.addColorStop(0, dark ? 'rgba(6, 182, 212, 0.2)' : 'rgba(14, 165, 233, 0.12)');
      glowA.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowA;
      ctx.fillRect(0, 0, width, height);

      const glowB = ctx.createRadialGradient(orbX2, orbY2, 0, orbX2, orbY2, width * 0.64);
      glowB.addColorStop(0, dark ? 'rgba(59, 130, 246, 0.18)' : 'rgba(37, 99, 235, 0.1)');
      glowB.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowB;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 5; i += 1) {
        const progress = ((t * 34) + i * (width * 0.24)) % (width + 260) - 130;
        const y = height * (0.12 + i * 0.2) + Math.sin(t * 0.6 + i) * 22;
        const beam = ctx.createLinearGradient(progress - 140, y, progress + 140, y);
        beam.addColorStop(0, 'rgba(0,0,0,0)');
        beam.addColorStop(0.5, dark ? 'rgba(34, 211, 238, 0.44)' : 'rgba(56, 189, 248, 0.3)');
        beam.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.strokeStyle = beam;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(progress - 140, y);
        ctx.lineTo(progress + 140, y);
        ctx.stroke();
      }

      for (let i = 0; i < 3; i += 1) {
        const progress = ((t * 22) + i * (height * 0.32)) % (height + 260) - 130;
        const x = width * (0.2 + i * 0.3) + Math.cos(t * 0.5 + i) * 18;
        const beam = ctx.createLinearGradient(x, progress - 130, x, progress + 130);
        beam.addColorStop(0, 'rgba(0,0,0,0)');
        beam.addColorStop(0.5, dark ? 'rgba(56, 189, 248, 0.36)' : 'rgba(59, 130, 246, 0.24)');
        beam.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.strokeStyle = beam;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, progress - 130);
        ctx.lineTo(x, progress + 130);
        ctx.stroke();
      }

      const maxLinkDistance = dark ? 172 : 146;
      const maxLinkDistanceSq = maxLinkDistance * maxLinkDistance;
      const pointerRadius = dark ? 180 : 150;
      const lineColor = dark ? '6, 182, 212' : '37, 99, 235';
      const dotColor = dark ? '125, 211, 252' : '14, 116, 144';

      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];

        node.x += node.vx + Math.cos(t * node.drift + node.phase) * 0.08;
        node.y += node.vy + Math.sin(t * node.drift + node.phase) * 0.08;

        if (node.x < -16) node.x = width + 16;
        else if (node.x > width + 16) node.x = -16;

        if (node.y < -16) node.y = height + 16;
        else if (node.y > height + 16) node.y = -16;

        if (pointer.active) {
          const dx = pointer.x - node.x;
          const dy = pointer.y - node.y;
          const distance = Math.hypot(dx, dy);
          if (distance < pointerRadius) {
            const pull = (1 - distance / pointerRadius) * 0.018;
            node.x += dx * pull;
            node.y += dy * pull;
          }
        }
      }

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const distSq = dx * dx + dy * dy;
          if (distSq > maxLinkDistanceSq) continue;

          const distance = Math.sqrt(distSq);
          const alpha = (1 - distance / maxLinkDistance) * (dark ? 0.42 : 0.28);
          ctx.strokeStyle = `rgba(${lineColor}, ${alpha.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }

      for (const node of nodes) {
        ctx.fillStyle = `rgba(${dotColor}, ${dark ? 0.95 : 0.72})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (pointer.active) {
        const halo = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, pointerRadius * 1.15);
        halo.addColorStop(0, dark ? 'rgba(34, 211, 238, 0.28)' : 'rgba(14, 165, 233, 0.18)');
        halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = halo;
        ctx.fillRect(0, 0, width, height);
      }
    };

    const render = () => {
      drawFrame();
      rafId = window.requestAnimationFrame(render);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    resize();
    window.addEventListener('resize', resize);

    if (reduceMotion) {
      drawFrame();
    } else {
      rafId = window.requestAnimationFrame(render);
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerleave', onPointerLeave);
    }

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [dark]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
