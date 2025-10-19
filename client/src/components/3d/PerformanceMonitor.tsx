'use client';

import { useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';

interface PerformanceStats {
  fps: number;
  frameTime: number;
  geometries: number;
  textures: number;
  drawCalls: number;
  triangles: number;
}

export function PerformanceMonitor({ visible = false }: { visible?: boolean }) {
  const { gl } = useThree();
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 60,
    frameTime: 16,
    geometries: 0,
    textures: 0,
    drawCalls: 0,
    triangles: 0,
  });

  const [frameCount, setFrameCount] = useState(0);
  const [lastTime, setLastTime] = useState(performance.now());

  useFrame(() => {
    const currentTime = performance.now();
    const delta = currentTime - lastTime;
    
    setFrameCount((prev) => prev + 1);

    // 每秒更新一次统计
    if (delta >= 1000) {
      const fps = Math.round((frameCount * 1000) / delta);
      const frameTime = delta / frameCount;
      const info = gl.info.render;

      setStats({
        fps,
        frameTime: Math.round(frameTime * 100) / 100,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
        drawCalls: info.calls,
        triangles: info.triangles,
      });

      setFrameCount(0);
      setLastTime(currentTime);
    }
  });

  if (!visible) return null;

  return (
    <Html
      position={[0, 0, 0]}
      center
      distanceFactor={1}
      style={{
        position: 'fixed',
        top: '80px',
        left: '20px',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <div className="glass-card px-4 py-3 rounded-lg border border-neon-blue/30 backdrop-blur-md font-mono text-xs space-y-1">
        <div className="text-neon-blue font-bold mb-2">性能监控</div>
        <div className="flex justify-between gap-4">
          <span className="text-foreground/60">FPS:</span>
          <span className={`font-semibold ${stats.fps >= 55 ? 'text-neon-green' : stats.fps >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
            {stats.fps}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-foreground/60">帧时间:</span>
          <span className="text-foreground">{stats.frameTime}ms</span>
        </div>
        <div className="h-px bg-foreground/10 my-2" />
        <div className="flex justify-between gap-4">
          <span className="text-foreground/60">几何体:</span>
          <span className="text-foreground">{stats.geometries}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-foreground/60">纹理:</span>
          <span className="text-foreground">{stats.textures}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-foreground/60">绘制调用:</span>
          <span className="text-foreground">{stats.drawCalls}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-foreground/60">三角形:</span>
          <span className="text-foreground">{stats.triangles.toLocaleString()}</span>
        </div>
      </div>
    </Html>
  );
}

