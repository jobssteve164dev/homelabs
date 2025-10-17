'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Suspense } from 'react';
import { Planet } from './Planet';
import { Stardust } from './Stardust';

interface UniverseProps {
  planets?: Array<{
    id: string;
    name: string;
    position: [number, number, number];
    color: string;
    size: number;
    category: string;
  }>;
  onPlanetClick?: (planetId: string) => void;
}

export function Universe({ planets = [], onPlanetClick }: UniverseProps) {
  return (
    <div className="w-full h-screen">
      <Canvas
        camera={{ position: [0, 0, 15], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* 环境光 */}
        <ambientLight intensity={0.5} />
        
        {/* 定向光 */}
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        
        {/* 点光源 */}
        <pointLight position={[0, 0, 0]} intensity={2} color="#00ffff" />
        
        {/* 星空背景 */}
        <Suspense fallback={null}>
          <Stars
            radius={100}
            depth={50}
            count={5000}
            factor={4}
            saturation={0}
            fade
            speed={1}
          />
          
          {/* 星尘粒子效果 */}
          <Stardust />
        </Suspense>
        
        {/* 渲染星球 */}
        {planets.map((planet) => (
          <Planet
            key={planet.id}
            {...planet}
            onClick={() => onPlanetClick?.(planet.id)}
          />
        ))}
        
        {/* 相机控制 */}
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          zoomSpeed={0.6}
          panSpeed={0.5}
          rotateSpeed={0.4}
          minDistance={5}
          maxDistance={50}
        />
      </Canvas>
    </div>
  );
}
