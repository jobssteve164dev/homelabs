'use client';

import { usePerformanceStats } from './PerformanceStatsProvider';

export function PerformanceMonitor({ visible = false }: { visible?: boolean }) {
  const { stats } = usePerformanceStats();

  if (!visible) return null;

  return (
    <div className="fixed bottom-32 left-20 glass-card px-4 py-3 rounded-lg border border-neon-blue/30 backdrop-blur-md font-mono text-xs space-y-1 pointer-events-none z-50">
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
  );
}

