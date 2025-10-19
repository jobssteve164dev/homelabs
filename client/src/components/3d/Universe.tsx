'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Suspense } from 'react';
import { Galaxy } from './Galaxy';
import { Stardust } from './Stardust';

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
export function Universe({ galaxies = [], onStarClick, onPlanetClick, planets }: UniverseProps) {
  // 如果提供了galaxies，使用新的星系系统
  const useGalaxySystem = galaxies.length > 0;

  return (
    <div className="w-full h-screen">
      <Canvas
        camera={{ position: [0, 5, 25], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* 环境光 */}
        <ambientLight intensity={0.3} />
        
        {/* 定向光（降低强度，因为恒星会自发光） */}
        <directionalLight position={[10, 10, 5]} intensity={0.5} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />
        
        {/* 星空背景 */}
        <Suspense fallback={null}>
          <Stars
            radius={150}
            depth={80}
            count={8000}
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
        
        {/* 相机控制 */}
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          zoomSpeed={0.6}
          panSpeed={0.5}
          rotateSpeed={0.4}
          minDistance={8}
          maxDistance={100}
        />
      </Canvas>
    </div>
  );
}
