import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  barCount?: number;
}

export function AudioVisualizer({ analyser, isPlaying, barCount = 28 }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const dataArray = new Uint8Array(analyser ? analyser.frequencyBinCount : 32);

    const render = () => {
      animId = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const values: number[] = [];

      if (analyser && isPlaying) {
        // Real-time audio analysis via Web Audio API
        analyser.getByteFrequencyData(dataArray);
        const step = Math.max(1, Math.floor(dataArray.length / barCount));
        for (let i = 0; i < barCount; i++) {
          values.push(dataArray[i * step] || 0);
        }
      } else {
        // Neat static waveform profile when Web Audio is not permitted or audio is paused
        for (let i = 0; i < barCount; i++) {
          const centerDist = Math.abs(i - barCount / 2) / (barCount / 2);
          const bellCurve = Math.cos(centerDist * (Math.PI / 2.2));
          values.push(isPlaying ? Math.max(8, 70 * bellCurve) : Math.max(3, 20 * bellCurve));
        }
      }

      // Draw vertical white bars with bell shape weighting
      const barWidth = 3;
      const gap = 3.5;
      const totalWidth = barCount * (barWidth + gap);
      const startX = Math.max(0, (width - totalWidth) / 2);

      for (let i = 0; i < barCount; i++) {
        const val = values[i];
        const centerFactor = 1 - Math.pow(Math.abs(i - barCount / 2) / (barCount / 2), 1.8) * 0.65;
        const barHeight = Math.max(3, (val / 255) * height * centerFactor * 0.95);

        const x = startX + i * (barWidth + gap);
        const y = height - barHeight;

        ctx.fillStyle = isPlaying ? 'rgba(255, 255, 255, 0.88)' : 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [1.5, 1.5, 0, 0]);
        ctx.fill();
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [analyser, isPlaying, barCount]);

  return (
    <div className="flex flex-col items-start gap-1 select-none pointer-events-none">
      <div className="flex items-center gap-2">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isPlaying ? (analyser ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400') : 'bg-white/20'
          }`}
        />
        <span className="text-[10px] tracking-widest font-mono text-white/50 uppercase font-medium">
          {analyser && isPlaying ? 'AUDIO SPECTRUM // 48kHz' : 'AUDIO SPECTRUM // PASSIVE'}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={180}
        height={32}
        className="w-[180px] h-[32px] block"
      />
    </div>
  );
}
