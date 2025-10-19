'use client';

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';

interface StarProps {
  id: string;
  name: string;
  position: [number, number, number];
  size?: number;
  userTitle?: string;
  onClick?: () => void;
}

/**
 * Star恒星组件
 * 代表用户的个人介绍卡片，作为星系的中心天体
 * 
 * 视觉特征：
 * - 比行星更大（1.5-2倍）
 * - 强烈的自发光效果
 * - 金黄色调
 * - 脉动呼吸动画
 * - 光芒四射的粒子效果
 */
export function Star({ id, name, position, size = 2, userTitle, onClick }: StarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [showLabel, setShowLabel] = useState(false);

  // 恒星颜色（金黄色调）
  const starColor = useMemo(() => {
    const colors = [
      '#FFD700', // 金色
      '#FFA500', // 橙色
      '#FF8C00', // 深橙色
    ];
    // 基于ID生成一致的颜色
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }, [id]);

  // 脉动动画
  useFrame((state) => {
    if (meshRef.current) {
      // 呼吸效果：尺寸在95%-105%之间变化
      const breathe = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      meshRef.current.scale.setScalar(breathe);
      
      // 慢速自转
      meshRef.current.rotation.y += 0.001;
    }
    
    // 整个group浮动
    if (groupRef.current && hovered) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.15;
    } else if (groupRef.current) {
      groupRef.current.position.y = 0;
    }
  });

  return (
    <group position={position}>
      <group ref={groupRef}>
        {/* 恒星主体 */}
        <Sphere
          ref={meshRef}
          args={[size, 64, 64]}
          onPointerOver={() => {
            setHovered(true);
            setShowLabel(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(false);
            setShowLabel(false);
            document.body.style.cursor = 'auto';
          }}
          onClick={onClick}
        >
          <meshStandardMaterial
            color={starColor}
            emissive={starColor}
            emissiveIntensity={hovered ? 1.5 : 1.0}
            roughness={0.3}
            metalness={0.5}
          />
        </Sphere>

        {/* 内层光晕（强烈发光） */}
        <Sphere args={[size * 1.15, 32, 32]}>
          <meshBasicMaterial
            color={starColor}
            transparent
            opacity={hovered ? 0.4 : 0.3}
            side={THREE.BackSide}
          />
        </Sphere>

        {/* 外层光晕（扩散效果） */}
        <Sphere args={[size * 1.3, 32, 32]}>
          <meshBasicMaterial
            color={starColor}
            transparent
            opacity={hovered ? 0.25 : 0.15}
            side={THREE.BackSide}
          />
        </Sphere>

        {/* 点光源（照亮周围） */}
        <pointLight
          color={starColor}
          intensity={hovered ? 3 : 2}
          distance={size * 10}
          decay={2}
        />

        {/* 恒星标签 */}
        {showLabel && (
          <Html
            position={[0, size + 1, 0]}
            center
            distanceFactor={10}
            style={{
              transition: 'all 0.2s',
              opacity: showLabel ? 1 : 0,
              transform: `scale(${showLabel ? 1 : 0.5})`,
            }}
          >
            <div className="glass-card px-6 py-3 rounded-lg border-2 border-yellow-500/80 backdrop-blur-md bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
              <div className="text-yellow-400 font-display font-bold text-base whitespace-nowrap flex items-center gap-2">
                ⭐ {name}
              </div>
              {userTitle && (
                <div className="text-yellow-300/90 text-sm mt-1">
                  {userTitle}
                </div>
              )}
            </div>
          </Html>
        )}

        {/* 光芒粒子（悬停时显示） */}
        {hovered && <StarParticles radius={size * 2} color={starColor} />}
      </group>
    </group>
  );
}

/**
 * 恒星光芒粒子组件
 * 模拟恒星向外辐射的光芒
 */
function StarParticles({ radius, color }: { radius: number; color: string }) {
  const particlesRef = useRef<THREE.Points>(null);
  
  useFrame((state) => {
    if (particlesRef.current) {
      // 粒子向外扩散
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      particlesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  const particleCount = 100;
  const positions = new Float32Array(particleCount * 3);
  
  // 在球面上随机分布粒子
  for (let i = 0; i < particleCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const r = radius + Math.random() * radius * 0.5;
    
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color={color}
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

