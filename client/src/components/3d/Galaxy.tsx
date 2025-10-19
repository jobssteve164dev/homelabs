'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Star } from './Star';
import { Planet } from './Planet';
import { OrbitRing } from './OrbitRing';
import * as THREE from 'three';

interface GalaxyProps {
  userId: string;
  userName: string;
  galaxyCenter: [number, number, number];
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
  onStarClick?: () => void;
  onPlanetClick?: (planetId: string) => void;
}

/**
 * Galaxy星系组件
 * 管理一个用户的完整星系：恒星+行星+轨道
 * 
 * 结构：
 * - 中心：恒星（用户个人介绍）
 * - 周围：行星（用户的AI项目）围绕恒星公转
 * - 轨道线：可视化行星轨道
 */
export function Galaxy({
  userName,
  galaxyCenter,
  star,
  planets,
  onStarClick,
  onPlanetClick,
}: GalaxyProps) {
  const groupRef = useRef<THREE.Group>(null);

  // 根据分类生成行星颜色
  const categoryColors: { [key: string]: string } = {
    '文本处理': '#00ffff',
    '图像处理': '#ff00ff',
    '语音处理': '#00ff00',
    '开发工具': '#ff8c00',
    '数据分析': '#1e90ff',
    '对话系统': '#ff1493',
    '机器学习': '#9d4edd',
    '其他': '#f72585',
  };

  // 实时计算行星位置
  useFrame(() => {
    // 这里可以添加整个星系的动画效果
    // 例如，缓慢的自转或浮动
  });

  return (
    <group ref={groupRef} position={galaxyCenter}>
      {/* 恒星（如果存在） */}
      {star && (
        <Star
          id={star.id}
          name={userName}
          position={[0, 0, 0]}
          size={2}
          userTitle={star.userTitle}
          onClick={onStarClick}
        />
      )}

      {/* 行星和轨道 */}
      {planets.map((planet) => {
        const planetColor = planet.color || categoryColors[planet.category] || '#f72585';
        
        return (
          <group key={planet.id}>
            {/* 轨道线 */}
            <OrbitRing
              radius={planet.orbitRadius}
              color={planetColor}
              opacity={0.2}
            />

            {/* 行星（使用实时计算的位置） */}
            <OrbitingPlanet
              id={planet.id}
              name={planet.title}
              color={planetColor}
              size={planet.size || Math.max(0.8, Math.min(1.5, 1 + planet.likeCount / 50))}
              category={planet.category}
              description={planet.description}
              tags={planet.tags}
              status={star ? 'active' : 'inactive'}
              demoUrl={planet.demoUrl}
              githubUrl={planet.githubUrl}
              imageUrl={planet.imageUrl}
              viewCount={planet.viewCount}
              likeCount={planet.likeCount}
              orbitRadius={planet.orbitRadius}
              orbitAngle={planet.orbitAngle}
              orbitSpeed={planet.orbitSpeed}
              onClick={() => onPlanetClick?.(planet.id)}
            />
          </group>
        );
      })}
    </group>
  );
}

/**
 * 公转行星组件
 * 基于时间实时计算行星在轨道上的位置
 */
interface OrbitingPlanetProps {
  id: string;
  name: string;
  color: string;
  size: number;
  category: string;
  description: string;
  tags: string[];
  status: string;
  demoUrl?: string;
  githubUrl?: string;
  imageUrl?: string;
  viewCount: number;
  likeCount: number;
  orbitRadius: number;
  orbitAngle: number;
  orbitSpeed: number;
  onClick?: () => void;
}

function OrbitingPlanet({
  id,
  name,
  color,
  size,
  category,
  orbitRadius,
  orbitAngle,
  orbitSpeed,
  onClick,
}: OrbitingPlanetProps) {
  const planetRef = useRef<THREE.Group>(null);

  // 实时计算行星位置（基于时间的公转）
  useFrame((state) => {
    if (planetRef.current) {
      const elapsedTime = state.clock.elapsedTime;
      const currentAngle = orbitAngle + orbitSpeed * elapsedTime;
      
      // 在XZ平面上公转
      const x = orbitRadius * Math.cos(currentAngle);
      const z = orbitRadius * Math.sin(currentAngle);
      
      planetRef.current.position.set(x, 0, z);
    }
  });

  return (
    <group ref={planetRef}>
      <Planet
        id={id}
        name={name}
        position={[0, 0, 0]} // 位置由group控制
        color={color}
        size={size}
        category={category}
        onClick={onClick}
      />
    </group>
  );
}

