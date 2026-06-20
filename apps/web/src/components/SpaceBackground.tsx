"use client";

import { useEffect, useRef } from "react";

export default function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Star configuration with parallax speeds
    const starLayers = [
      { density: 0.05, speed: 0.5, size: 1, color: "rgba(255, 255, 255, 0.3)" },
      { density: 0.02, speed: 1.2, size: 1.5, color: "rgba(255, 255, 255, 0.6)" },
      { density: 0.008, speed: 2.5, size: 2.5, color: "rgba(255, 255, 255, 0.9)" },
      { density: 0.003, speed: 4.0, size: 3.5, color: "rgba(0, 180, 216, 0.8)" } // Logo blue color
    ];

    interface Star {
      x: number;
      y: number;
      size: number;
      speed: number;
      color: string;
    }

    const stars: Star[] = [];

    starLayers.forEach((layer) => {
      const count = Math.floor((canvas.width * canvas.height * layer.density) / 1000);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: layer.size,
          speed: layer.speed,
          color: layer.color
        });
      }
    });

    const draw = () => {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        ctx.fillStyle = star.color;
        ctx.fillRect(star.x, star.y, star.size, star.size);

        star.y -= star.speed;

        if (star.y < -star.size) {
          star.y = canvas.height + star.size;
          star.x = Math.random() * canvas.width;
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
    />
  );
}
