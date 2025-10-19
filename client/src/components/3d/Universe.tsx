'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Suspense, useMemo, useState, useEffect } from 'react';
import { Galaxy } from './Galaxy';
import { Stardust } from './Stardust';
import { PerformanceStatsProvider } from './PerformanceStatsProvider';
import { useResponsive, getQualityPreset } from '@/hooks/useResponsive';
import * as THREE from 'three';

// 星系数据类型
export interface GalaxyData {
  userId: string;
  userName: string;
  userAvatar?: string;
  galaxyCenter: {
    x: number;
    y: number;
    z: number;
  };
  star: {
    id: string;
    title: string;
    userTitle?: string;
    userBio?: string;
    userSkills?: string[];
    socialLinks?: Record<string, string>;
  } | null;
  planets: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    color?: string;
    size?: number;
    orbitRadius: number;
    orbitAngle: number;
    orbitSpeed: number;
    demoUrl?: string;
    githubUrl?: string;
    imageUrl?: string;
    viewCount: number;
    likeCount: number;
  }>;
}

interface UniverseProps {
  galaxies?: GalaxyData[];
  onStarClick?: (userId: string) => void;
  onPlanetClick?: (planetId: string) => void;
  // 新增：当前用户信息，用于确定初始相机位置
  currentUserId?: string;
  // 保持向后兼容的旧API
  planets?: Array<{
    id: string;
    name: string;
    position: [number, number, number];
    color: string;
    size: number;
    category: string;
  }>;
}

/**
 * Universe宇宙场景组件
 * 
 * 新架构：
 * - 支持多个星系（每个用户一个星系）
 * - 每个星系包含：1个恒星 + N个行星
 * - 行星围绕恒星公转
 * 
 * 向后兼容：
 * - 仍然支持旧的planets属性（用于渐进式迁移）
 */
export function Universe({ galaxies = [], onStarClick, onPlanetClick, currentUserId, planets }: UniverseProps) {
  // 如果提供了galaxies，使用新的星系系统
  const useGalaxySystem = galaxies.length > 0;
  const [showPerformance, setShowPerformance] = useState(false);
  const [performanceStats, setPerformanceStats] = useState({
    fps: 60,
    frameTime: 16,
    geometries: 0,
    textures: 0,
    drawCalls: 0,
    triangles: 0,
  });

  // 响应式配置
  const responsive = useResponsive();
  const quality = useMemo(() => getQualityPreset(responsive), [responsive]);

  // 键盘快捷键：按P键切换性能监控
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.metaKey) {
        setShowPerformance((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // 计算目标星系中心位置，根据用户登录状态决定聚焦点
  const targetGalaxyCenter = useMemo(() => {
    if (galaxies.length === 0) {
      return new THREE.Vector3(0, 0, 0);
    }

    // 如果用户已登录，优先聚焦到用户自己的星系
    if (currentUserId) {
      const userGalaxy = galaxies.find(g => g.userId === currentUserId);
      if (userGalaxy) {
        return new THREE.Vector3(
          userGalaxy.galaxyCenter.x,
          userGalaxy.galaxyCenter.y,
          userGalaxy.galaxyCenter.z
        );
      }
    }

    // 如果用户未登录或找不到用户星系，则聚焦到第一个星系（通常是管理员）
    const firstGalaxy = galaxies[0];
    return new THREE.Vector3(
      firstGalaxy.galaxyCenter.x,
      firstGalaxy.galaxyCenter.y,
      firstGalaxy.galaxyCenter.z
    );
  }, [galaxies, currentUserId]);

  // 计算相机的初始位置（相对于目标星系）
  const cameraPosition = useMemo(() => {
    return [
      targetGalaxyCenter.x,
      targetGalaxyCenter.y + 5,
      targetGalaxyCenter.z + 25
    ] as [number, number, number];
  }, [targetGalaxyCenter]);

  return (
    <div className="w-full h-screen">
      <Canvas
        camera={{ position: cameraPosition, fov: responsive.isMobile ? 85 : 75 }}
        gl={{ 
          antialias: quality.antialias, 
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={quality.pixelRatio}
      >
        <PerformanceStatsProvider onStatsUpdate={setPerformanceStats}>
        {/* 环境光 */}
        <ambientLight intensity={0.3} />
        
        {/* 定向光（降低强度，因为恒星会自发光） */}
        <directionalLight position={[10, 10, 5]} intensity={0.5} castShadow={quality.shadowsEnabled} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />
        
        {/* 星空背景 - 根据设备性能调整 */}
        <Suspense fallback={null}>
          <Stars
            radius={150}
            depth={80}
            count={quality.starCount}
            factor={5}
            saturation={0}
            fade
            speed={0.5}
          />
          
          {/* 星尘粒子效果 */}
          <Stardust />
        </Suspense>
        
        {/* 新的星系系统 */}
        {useGalaxySystem && galaxies.map((galaxy) => (
          <Galaxy
            key={galaxy.userId}
            userId={galaxy.userId}
            userName={galaxy.userName}
            galaxyCenter={[
              galaxy.galaxyCenter.x,
              galaxy.galaxyCenter.y,
              galaxy.galaxyCenter.z,
            ]}
            star={galaxy.star}
            planets={galaxy.planets}
            onStarClick={() => onStarClick?.(galaxy.userId)}
            onPlanetClick={onPlanetClick}
          />
        ))}
        
        {/* 向后兼容：旧的行星系统（如果没有提供galaxies） */}
        {!useGalaxySystem && planets && planets.map(() => {
          // 导入Planet组件（如果需要向后兼容）
          // 这里暂时注释掉，因为我们专注于新系统
          return null;
        })}
        
        
        {/* 相机控制 - 根据设备类型调整 */}
        <OrbitControls
          target={targetGalaxyCenter}
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          zoomSpeed={responsive.isMobile ? 0.4 : 0.6}
          panSpeed={responsive.isMobile ? 0.3 : 0.5}
          rotateSpeed={responsive.isMobile ? 0.3 : 0.4}
          minDistance={responsive.isMobile ? 10 : 8}
          maxDistance={responsive.isMobile ? 80 : 100}
          enableDamping={true}
          dampingFactor={0.05}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,   // 左键/触摸：旋转
            MIDDLE: THREE.MOUSE.PAN,    // 中键：平移
            RIGHT: THREE.MOUSE.PAN      // 右键：平移
          }}
          touches={{
            ONE: THREE.TOUCH.ROTATE,    // 单指：旋转
            TWO: THREE.TOUCH.DOLLY_PAN  // 双指：缩放+平移
          }}
        />
        </PerformanceStatsProvider>
      </Canvas>

      {/* 性能监控面板 - 在Canvas外部渲染，位于提示文字上方 */}
      {showPerformance && (
        <div className="fixed bottom-32 left-20 glass-card px-4 py-3 rounded-lg border border-neon-blue/30 backdrop-blur-md font-mono text-xs space-y-1 pointer-events-none z-50">
          <div className="text-neon-blue font-bold mb-2">性能监控</div>
          <div className="flex justify-between gap-4">
            <span className="text-foreground/60">FPS:</span>
            <span className={`font-semibold ${performanceStats.fps >= 55 ? 'text-neon-green' : performanceStats.fps >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
              {performanceStats.fps}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-foreground/60">帧时间:</span>
            <span className="text-foreground">{performanceStats.frameTime}ms</span>
          </div>
          <div className="h-px bg-foreground/10 my-2" />
          <div className="flex justify-between gap-4">
            <span className="text-foreground/60">几何体:</span>
            <span className="text-foreground">{performanceStats.geometries}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-foreground/60">纹理:</span>
            <span className="text-foreground">{performanceStats.textures}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-foreground/60">绘制调用:</span>
            <span className="text-foreground">{performanceStats.drawCalls}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-foreground/60">三角形:</span>
            <span className="text-foreground">{performanceStats.triangles.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* 性能监控提示 */}
      {showPerformance && (
        <div className="fixed bottom-20 left-20 glass-card px-4 py-2 rounded-lg border border-neon-blue/30 backdrop-blur-md text-xs text-foreground/60 pointer-events-none">
          按 P 键隐藏性能监控
        </div>
      )}

      {!showPerformance && (
        <div className="fixed bottom-20 left-20 glass-card px-4 py-2 rounded-lg border border-foreground/20 backdrop-blur-md text-xs text-foreground/40 pointer-events-none opacity-50 hover:opacity-100 transition-opacity">
          按 P 键显示性能监控
        </div>
      )}
    </div>
  );
}
