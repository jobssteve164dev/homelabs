'use client';

import { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

interface PerformanceStats {
  fps: number;
  frameTime: number;
  geometries: number;
  textures: number;
  drawCalls: number;
  triangles: number;
}

interface PerformanceContextType {
  stats: PerformanceStats;
}

const PerformanceContext = createContext<PerformanceContextType | null>(null);

export function usePerformanceStats() {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformanceStats must be used within a PerformanceStatsProvider');
  }
  return context;
}

interface PerformanceStatsProviderProps {
  children: ReactNode;
  onStatsUpdate?: (stats: PerformanceStats) => void;
}

export function PerformanceStatsProvider({ children, onStatsUpdate }: PerformanceStatsProviderProps) {
  const { gl } = useThree();
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 60,
    frameTime: 16,
    geometries: 0,
    textures: 0,
    drawCalls: 0,
    triangles: 0,
  });

  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useFrame(() => {
    const currentTime = performance.now();
    const delta = currentTime - lastTime.current;
    
    frameCount.current += 1;

    // 每秒更新一次统计
    if (delta >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / delta);
      const frameTime = delta / frameCount.current;
      const info = gl.info.render;

      const newStats = {
        fps,
        frameTime: Math.round(frameTime * 100) / 100,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
        drawCalls: info.calls,
        triangles: info.triangles,
      };
      
      setStats(newStats);
      onStatsUpdate?.(newStats);

      frameCount.current = 0;
      lastTime.current = currentTime;
    }
  });

  return (
    <PerformanceContext.Provider value={{ stats }}>
      {children}
    </PerformanceContext.Provider>
  );
}
