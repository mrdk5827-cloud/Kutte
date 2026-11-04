import React, { useEffect, useRef } from 'react';
import type { FixaState } from '../types/fixa';

interface FixaFaceCanvasProps {
  state: FixaState;
  size?: number;
  interactive?: boolean;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
  baseRadius?: number;
  region: 'eye' | 'brow' | 'nose' | 'lip' | 'cheek' | 'forehead' | 'jaw' | 'neck';
  isUpperLid?: boolean;
  isLowerLid?: boolean;
  isUpperLip?: boolean;
  isLowerLip?: boolean;
}

export const FixaFaceCanvas: React.FC<FixaFaceCanvasProps> = ({
  state,
  size = 380,
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;
    let blinkProgress = 0;
    let nextBlinkTime = 2.0;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      mouseRef.current.targetX = Math.max(-1, Math.min(1, nx));
      mouseRef.current.targetY = Math.max(-1, Math.min(1, ny));
    };

    window.addEventListener('mousemove', handleMouseMove);

    // =========================================================================
    // DENSE 3D HUMAN POINT CLOUD DATA (OVER 750 REALISTIC ANATOMICAL NODES)
    // PURE BLUE DOTS ONLY (NO WIREFRAME LINES)
    // =========================================================================
    const rawCloud: Point3D[] = [];

    // Helper: interpolate points between two 3D coordinates
    const addSpan = (
      p1: { x: number; y: number; z: number },
      p2: { x: number; y: number; z: number },
      count: number,
      region: Point3D['region'],
      flags: Partial<Point3D> = {}
    ) => {
      for (let i = 0; i <= count; i++) {
        const t = i / count;
        rawCloud.push({
          x: p1.x + (p2.x - p1.x) * t,
          y: p1.y + (p2.y - p1.y) * t,
          z: p1.z + (p2.z - p1.z) * t,
          region,
          ...flags,
        });
      }
    };

    // 1. FOREHEAD DOME & TEMPLE POINT CLOUD
    for (let row = 0; row < 7; row++) {
      const v = row / 6; // 0 to 1 from top to eyebrows
      const y = -0.74 + v * 0.44;
      const arcWidth = 0.54 * Math.sin(Math.acos(v * 0.8 - 0.4));
      const z = 0.15 + Math.sin(v * Math.PI) * 0.18;
      const numDots = 14 + row * 2;
      for (let j = 0; j < numDots; j++) {
        const u = (j / (numDots - 1) - 0.5) * 2; // -1 to 1
        const x = u * arcWidth;
        const depth = z - Math.abs(u) * 0.22;
        rawCloud.push({ x, y, z: depth, region: 'forehead', baseRadius: 1.6 });
      }
    }

    // 2. ARCHED HUMAN EYEBROWS (DOUBLE ROW OF DENSE DOTS)
    const browGuides = [
      [-0.42, -0.24, 0.28], // left tail
      [-0.32, -0.30, 0.36], // left arch
      [-0.22, -0.29, 0.38], // left mid
      [-0.11, -0.23, 0.38], // left head
      [0.11,  -0.23, 0.38], // right head
      [0.22,  -0.29, 0.38], // right mid
      [0.32,  -0.30, 0.36], // right arch
      [0.42,  -0.24, 0.28], // right tail
    ];
    for (let i = 0; i < 3; i++) {
      addSpan(
        { x: browGuides[i][0], y: browGuides[i][1], z: browGuides[i][2] },
        { x: browGuides[i + 1][0], y: browGuides[i + 1][1], z: browGuides[i + 1][2] },
        10,
        'brow',
        { baseRadius: 1.8 }
      );
      // Secondary parallel row for natural brow thickness
      addSpan(
        { x: browGuides[i][0], y: browGuides[i][1] - 0.02, z: browGuides[i][2] - 0.02 },
        { x: browGuides[i + 1][0], y: browGuides[i + 1][1] - 0.02, z: browGuides[i + 1][2] - 0.02 },
        8,
        'brow',
        { baseRadius: 1.5 }
      );
    }
    for (let i = 4; i < 7; i++) {
      addSpan(
        { x: browGuides[i][0], y: browGuides[i][1], z: browGuides[i][2] },
        { x: browGuides[i + 1][0], y: browGuides[i + 1][1], z: browGuides[i + 1][2] },
        10,
        'brow',
        { baseRadius: 1.8 }
      );
      addSpan(
        { x: browGuides[i][0], y: browGuides[i][1] - 0.02, z: browGuides[i][2] - 0.02 },
        { x: browGuides[i + 1][0], y: browGuides[i + 1][1] - 0.02, z: browGuides[i + 1][2] - 0.02 },
        8,
        'brow',
        { baseRadius: 1.5 }
      );
    }

    // 3. HUMAN ALMOND EYES, EYELIDS, IRISES & PUPILS
    const eyeSides = [-1, 1];
    eyeSides.forEach((side) => {
      const cx = side * 0.27;
      const cy = -0.16;
      const cz = 0.38;

      // Upper Eyelid curve (responds to blink)
      for (let i = 0; i <= 16; i++) {
        const t = (i / 16 - 0.5) * 2; // -1 to 1
        const x = cx + t * 0.12;
        const y = cy - Math.cos((t * Math.PI) / 2) * 0.05;
        const z = cz - Math.abs(t) * 0.06;
        rawCloud.push({ x, y, z, region: 'eye', isUpperLid: true, baseRadius: 1.9 });
      }

      // Upper eyelid crease (epicanthic fold / lid fold)
      for (let i = 0; i <= 12; i++) {
        const t = (i / 12 - 0.5) * 2;
        const x = cx + t * 0.13;
        const y = cy - Math.cos((t * Math.PI) / 2) * 0.08 - 0.01;
        const z = cz - Math.abs(t) * 0.05 + 0.01;
        rawCloud.push({ x, y, z, region: 'eye', baseRadius: 1.4 });
      }

      // Lower Eyelid curve
      for (let i = 0; i <= 14; i++) {
        const t = (i / 14 - 0.5) * 2;
        const x = cx + t * 0.12;
        const y = cy + Math.cos((t * Math.PI) / 2) * 0.035;
        const z = cz - Math.abs(t) * 0.06;
        rawCloud.push({ x, y, z, region: 'eye', isLowerLid: true, baseRadius: 1.7 });
      }

      // Iris circular dot ring (8 luminous dots)
      for (let j = 0; j < 10; j++) {
        const a = (j / 10) * Math.PI * 2;
        const rx = 0.025 * Math.cos(a);
        const ry = 0.025 * Math.sin(a);
        rawCloud.push({ x: cx + rx, y: cy + ry, z: cz + 0.03, region: 'eye', baseRadius: 1.8 });
      }

      // Luminous Pupil Center dot
      rawCloud.push({ x: cx, y: cy, z: cz + 0.04, region: 'eye', baseRadius: 2.4 });
    });

    // 4. REALISTIC SCULPTED HUMAN NOSE
    // Nose bridge (dorsum)
    const noseRidge = [
      { x: 0.0, y: -0.22, z: 0.38 },
      { x: 0.0, y: -0.12, z: 0.43 },
      { x: 0.0, y: -0.02, z: 0.48 },
      { x: 0.0, y: 0.08,  z: 0.52 },
      { x: 0.0, y: 0.13,  z: 0.55 }, // Tip (pronasale)
      { x: 0.0, y: 0.18,  z: 0.49 }, // Subnasale / columella
    ];
    for (let i = 0; i < noseRidge.length - 1; i++) {
      addSpan(noseRidge[i], noseRidge[i + 1], 6, 'nose', { baseRadius: 2.0 });
    }

    // Lateral nose walls (sides)
    for (let side of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const y = -0.15 + i * 0.07;
        const x = side * (0.04 + i * 0.015);
        const z = 0.40 + i * 0.03;
        rawCloud.push({ x, y, z, region: 'nose', baseRadius: 1.7 });
      }
      // Alar wings & nostrils (rounded curves at base of nose)
      for (let j = 0; j <= 8; j++) {
        const a = (j / 8) * Math.PI;
        const x = side * (0.04 + Math.sin(a) * 0.07);
        const y = 0.13 + Math.cos(a) * 0.04;
        const z = 0.52 - Math.sin(a) * 0.08;
        rawCloud.push({ x, y, z, region: 'nose', baseRadius: 1.7 });
      }
    }

    // 5. CHEEKBONES & MALAR FACIAL SURFACES
    for (let side of [-1, 1]) {
      for (let row = 0; row < 6; row++) {
        const ry = -0.05 + row * 0.07;
        const rowWidth = 4 + row;
        for (let col = 0; col < rowWidth; col++) {
          const cx = side * (0.16 + col * 0.06);
          const cz = 0.40 - col * 0.06 - Math.abs(ry) * 0.08;
          rawCloud.push({ x: cx, y: ry, z: cz, region: 'cheek', baseRadius: 1.5 });
        }
      }
    }

    // 6. HUMAN LIPS & PHILTRUM (ANATOMICAL CUPID'S BOW & FULL LOWER LIP)
    // Philtrum ridges (between nose and lip)
    addSpan({ x: -0.03, y: 0.18, z: 0.48 }, { x: -0.04, y: 0.28, z: 0.46 }, 4, 'lip', { baseRadius: 1.6 });
    addSpan({ x: 0.03,  y: 0.18, z: 0.48 }, { x: 0.04,  y: 0.28, z: 0.46 }, 4, 'lip', { baseRadius: 1.6 });

    // Upper lip vermilion (Cupid's bow curve)
    const upperLipPoints = [
      { x: -0.22, y: 0.34, z: 0.36 }, // left corner
      { x: -0.15, y: 0.32, z: 0.42 },
      { x: -0.07, y: 0.30, z: 0.47 }, // left Cupid's bow peak
      { x: 0.0,   y: 0.32, z: 0.46 }, // center dip
      { x: 0.07,  y: 0.30, z: 0.47 }, // right Cupid's bow peak
      { x: 0.15,  y: 0.32, z: 0.42 },
      { x: 0.22,  y: 0.34, z: 0.36 }, // right corner
    ];
    for (let i = 0; i < upperLipPoints.length - 1; i++) {
      addSpan(upperLipPoints[i], upperLipPoints[i + 1], 6, 'lip', { isUpperLip: true, baseRadius: 2.1 });
    }

    // Lower lip vermilion (full, rounded curve)
    const lowerLipPoints = [
      { x: -0.22, y: 0.34, z: 0.36 },
      { x: -0.14, y: 0.40, z: 0.41 },
      { x: 0.0,   y: 0.44, z: 0.46 }, // center fullness
      { x: 0.14,  y: 0.40, z: 0.41 },
      { x: 0.22,  y: 0.34, z: 0.36 },
    ];
    for (let i = 0; i < lowerLipPoints.length - 1; i++) {
      addSpan(lowerLipPoints[i], lowerLipPoints[i + 1], 7, 'lip', { isLowerLip: true, baseRadius: 2.1 });
    }

    // Lip fullness body (inner volume dots)
    for (let col = -5; col <= 5; col++) {
      const u = col / 5;
      const x = u * 0.17;
      // Upper lip interior
      rawCloud.push({ x, y: 0.325 + Math.abs(u) * 0.015, z: 0.44 - Math.abs(u) * 0.06, region: 'lip', isUpperLip: true, baseRadius: 1.8 });
      // Lower lip interior
      rawCloud.push({ x, y: 0.38 + (1 - Math.abs(u)) * 0.025, z: 0.43 - Math.abs(u) * 0.06, region: 'lip', isLowerLip: true, baseRadius: 1.8 });
    }

    // 7. JAWLINE, CHIN & MANDIBLE (ELEGANT OVAL HUMAN JAW)
    const jawNodes = [
      { x: -0.54, y: -0.12, z: -0.05 }, // upper jaw near ear
      { x: -0.50, y: 0.08,  z: 0.08 },  // jaw angle (gonion)
      { x: -0.42, y: 0.26,  z: 0.20 },  // body of mandible
      { x: -0.30, y: 0.44,  z: 0.32 },  // lower jaw curve
      { x: -0.15, y: 0.58,  z: 0.41 },  // lateral chin
      { x: 0.0,   y: 0.63,  z: 0.45 },  // chin apex (mentum)
      { x: 0.15,  y: 0.58,  z: 0.41 },
      { x: 0.30,  y: 0.44,  z: 0.32 },
      { x: 0.42,  y: 0.26,  z: 0.20 },
      { x: 0.50,  y: 0.08,  z: 0.08 },
      { x: 0.54,  y: -0.12, z: -0.05 },
    ];
    for (let i = 0; i < jawNodes.length - 1; i++) {
      addSpan(jawNodes[i], jawNodes[i + 1], 10, 'jaw', { baseRadius: 1.9 });
    }

    // Chin pad fullness dots
    for (let r = 0; r < 4; r++) {
      for (let c = -3; c <= 3; c++) {
        const cx = c * 0.04;
        const cy = 0.50 + r * 0.035;
        const cz = 0.44 - Math.abs(c) * 0.03 - r * 0.02;
        rawCloud.push({ x: cx, y: cy, z: cz, region: 'jaw', baseRadius: 1.6 });
      }
    }

    // 8. NECK & POSTURE CONTOURS
    for (let side of [-1, 1]) {
      addSpan(
        { x: side * 0.24, y: 0.56, z: 0.18 },
        { x: side * 0.22, y: 0.82, z: 0.12 },
        8,
        'neck',
        { baseRadius: 1.5 }
      );
      addSpan(
        { x: side * 0.22, y: 0.82, z: 0.12 },
        { x: side * 0.34, y: 0.94, z: 0.05 },
        6,
        'neck',
        { baseRadius: 1.4 }
      );
    }

    // =========================================================================
    // HIGH-PERFORMANCE RENDER LOOP (PURE BLUE DOTS ONLY)
    // =========================================================================
    const render = () => {
      time += 0.035;

      // Realistic Human Blinking (every 2.5 - 5 seconds)
      if (time > nextBlinkTime) {
        blinkProgress += 0.24;
        if (blinkProgress >= Math.PI) {
          blinkProgress = 0;
          nextBlinkTime = time + 2.5 + Math.random() * 3.0;
        }
      }
      const blinkFactor = blinkProgress > 0 ? Math.sin(blinkProgress) : 0;

      // Smooth mouse parallax interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.07;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.07;

      const rotY = mouseRef.current.x * 0.38;
      const rotX = -mouseRef.current.y * 0.30;

      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2 - 10;
      const scale = size * 0.43;

      // Dynamic speech lip articulation when speaking
      let speechOpen = 0;
      if (state === 'speaking') {
        speechOpen = Math.abs(Math.sin(time * 12)) * 0.065 + Math.sin(time * 17) * 0.03;
      }

      // Breathing subtle sway
      const breathe = Math.sin(time * 1.8) * 0.012;

      // 3D Matrix Math
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const fov = 2.4;

      // Project all points and sort by z-depth for photorealistic 3D dot cloud
      const projected = [];
      for (let i = 0; i < rawCloud.length; i++) {
        const pt = rawCloud[i];
        let px = pt.x;
        let py = pt.y + breathe;
        let pz = pt.z;

        // Blinking eyelid displacement
        if (pt.isUpperLid) {
          py += blinkFactor * 0.065;
        } else if (pt.isLowerLid) {
          py -= blinkFactor * 0.02;
        }

        // Speech mouth articulation
        if (pt.isUpperLip) {
          py -= speechOpen * 0.4;
        } else if (pt.isLowerLip) {
          py += speechOpen * 0.7;
        }

        // 3D rotation Y
        const x1 = px * cosY - pz * sinY;
        const z1 = px * sinY + pz * cosY;

        // 3D rotation X
        const y2 = py * cosX - z1 * sinX;
        const z2 = py * sinX + z1 * cosX;

        // Perspective
        const depthDist = z2 + fov;
        const projScale = scale / depthDist;
        const screenX = cx + x1 * projScale;
        const screenY = cy + y2 * projScale;

        projected.push({
          x: screenX,
          y: screenY,
          z: z2,
          baseRadius: pt.baseRadius || 1.8,
          region: pt.region,
        });
      }

      // Sort back-to-front so foreground dots glow above background dots
      projected.sort((a, b) => a.z - b.z);

      // Render PURE BLUE DOTS (NO LINES)
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];

        // 3D Depth Luminance & Scaling
        const normZ = Math.max(-0.4, Math.min(0.6, p.z));
        const depthRatio = (normZ + 0.4) / 1.0; // 0 to 1

        // Color grading: Forefront points (nose, lips, eyes) are brilliant neon cyan / electric blue;
        // Peripheral points (temples, jaw angles) are soft celestial cyan-blue.
        let alpha = 0.45 + depthRatio * 0.55;
        let radius = p.baseRadius * (0.8 + depthRatio * 0.45);

        if (p.region === 'eye') {
          radius *= 1.15;
          alpha = Math.min(1.0, alpha + 0.15);
        } else if (p.region === 'lip' && state === 'speaking') {
          alpha = Math.min(1.0, alpha + 0.2);
        }

        // Color palette based on depth
        if (depthRatio > 0.75) {
          ctx.fillStyle = `rgba(224, 242, 254, ${alpha})`; // Glowing white-cyan core
        } else if (depthRatio > 0.45) {
          ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;  // Electric sky blue
        } else {
          ctx.fillStyle = `rgba(14, 165, 233, ${alpha})`;  // Deep technological blue
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.8, radius), 0, Math.PI * 2);
        ctx.fill();
      }

      // Subtle Outer Concentric Holographic HUD Degree Ticks (Pure dots)
      ctx.fillStyle = 'rgba(14, 165, 233, 0.4)';
      const hudRadius = scale * 1.18;
      for (let a = 0; a < 36; a++) {
        const rad = (a / 36) * Math.PI * 2 + time * 0.1;
        const hx = cx + Math.cos(rad) * hudRadius;
        const hy = cy + Math.sin(rad) * hudRadius;
        ctx.beginPath();
        ctx.arc(hx, hy, a % 3 === 0 ? 1.8 : 1.0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Clean Tech Status Label
      ctx.font = '10px "Chakra Petch", sans-serif';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.fillText('FIXA // PURE BLUE DOTTED POINT CLOUD', 16, size - 14);
      ctx.fillText(`NODES: ${projected.length} // STATE: ${state.toUpperCase()}`, size - 165, size - 14);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [state, size, interactive]);

  return (
    <div className="relative flex items-center justify-center select-none">
      <canvas
        ref={canvasRef}
        style={{ width: `${size}px`, height: `${size}px` }}
        className="rounded-full cursor-crosshair drop-shadow-[0_0_35px_rgba(0,229,255,0.35)] transition-all duration-300"
      />
      {/* Sleek Corner Brackets */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400/60" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400/60" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400/60" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400/60" />
      </div>
    </div>
  );
};
