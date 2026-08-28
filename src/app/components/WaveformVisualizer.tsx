import { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  isPlaying: boolean;
  className?: string;
}

export function WaveformVisualizer({ isPlaying, className = '' }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Generate static waveform data
    const bars = 100;
    const baseHeights = Array.from({ length: bars }, () => 
      Math.random() * 0.6 + 0.2 // Random heights between 0.2 and 0.8
    );

    let phase = 0;

    const draw = () => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;
      
      ctx.clearRect(0, 0, width, height);

      const barWidth = width / bars;
      const centerY = height / 2;

      for (let i = 0; i < bars; i++) {
        const x = i * barWidth;
        
        // Animate heights when playing
        let barHeight = baseHeights[i];
        if (isPlaying) {
          const wave = Math.sin(phase + i * 0.1) * 0.15;
          barHeight = Math.min(0.95, barHeight + wave);
        }
        
        const h = barHeight * height;
        
        // Create gradient from cyan to purple
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#06b6d4'); // cyan
        gradient.addColorStop(0.5, '#3b82f6'); // blue
        gradient.addColorStop(1, '#a855f7'); // purple
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, centerY - h / 2, barWidth - 2, h);
      }

      if (isPlaying) {
        phase += 0.05;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', updateSize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`w-full ${className}`}
      style={{ height: '150px' }}
    />
  );
}
