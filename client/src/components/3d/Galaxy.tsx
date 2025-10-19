'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Star } from './Star';
import { Planet } from './Planet';
import { OrbitRing } from './OrbitRing';
import { detectAndAvoidCollisions, predictCollisionRisk } from '@/lib/galaxy/layout';
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
// LOD距离阈值
const LOD_DISTANCES = {
  NEAR: 40,   // 近距离：完整渲染
  MEDIUM: 80, // 中距离：简化渲染
  FAR: 150,   // 远距离：最简渲染
};

export function Galaxy({
  userName,
  galaxyCenter,
  star,
  planets,
  onStarClick,
  onPlanetClick,
}: GalaxyProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const [lodLevel, setLodLevel] = useState<'near' | 'medium' | 'far'>('near');
  const [adjustedPlanets, setAdjustedPlanets] = useState(planets);
  const [collisionRisk, setCollisionRisk] = useState<{
    hasRisk: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    closestApproach: number;
  }>({ hasRisk: false, riskLevel: 'low', closestApproach: Infinity });

  // 根据分类生成行星颜色
  const categoryColors: { [key: string]: string } = useMemo(() => ({
    '文本处理': '#00ffff',
    '图像处理': '#ff00ff',
    '语音处理': '#00ff00',
    '开发工具': '#ff8c00',
    '数据分析': '#1e90ff',
    '对话系统': '#ff1493',
    '机器学习': '#9d4edd',
    '其他': '#f72585',
  }), []);

  // 初始化时预测碰撞风险
  useEffect(() => {
    if (planets.length > 1) {
      const planetData = planets.map(planet => ({
        id: planet.id,
        radius: planet.orbitRadius,
        angle: planet.orbitAngle,
        speed: planet.orbitSpeed
      }));
      
      const risk = predictCollisionRisk(planetData, 50);
      setCollisionRisk({
        hasRisk: risk.hasRisk,
        riskLevel: risk.riskLevel,
        closestApproach: risk.closestApproach
      });
    }
  }, [planets]);

  // 计算相机到星系的距离，更新LOD等级，并执行碰撞避免
  useFrame((state) => {
    if (groupRef.current) {
      const galaxyPosition = new THREE.Vector3(...galaxyCenter);
      const distance = camera.position.distanceTo(galaxyPosition);

      let newLodLevel: 'near' | 'medium' | 'far';
      if (distance < LOD_DISTANCES.NEAR) {
        newLodLevel = 'near';
      } else if (distance < LOD_DISTANCES.MEDIUM) {
        newLodLevel = 'medium';
      } else {
        newLodLevel = 'far';
      }

      if (newLodLevel !== lodLevel) {
        setLodLevel(newLodLevel);
      }

      // 实时碰撞避免（仅在近距离时执行，避免性能问题）
      if (newLodLevel === 'near' && planets.length > 1) {
        const planetData = planets.map(planet => ({
          id: planet.id,
          radius: planet.orbitRadius,
          angle: planet.orbitAngle,
          speed: planet.orbitSpeed
        }));
        
        const adjusted = detectAndAvoidCollisions(planetData, state.clock.elapsedTime);
        
        // 更新行星速度（如果检测到需要调整）
        const hasAdjustment = adjusted.some((adj, index) => 
          Math.abs(adj.speed - planetData[index].speed) > 0.001
        );
        
        if (hasAdjustment) {
          const updatedPlanets = planets.map((planet, index) => ({
            ...planet,
            orbitSpeed: adjusted[index].speed
          }));
          setAdjustedPlanets(updatedPlanets);
        }
      }
    }
  });

  return (
    <group ref={groupRef} position={galaxyCenter}>
      {/* 恒星（所有LOD等级都渲染） */}
      {star && (
        <Star
          id={star.id}
          name={userName}
          position={[0, 0, 0]}
          size={lodLevel === 'far' ? 1.5 : 2} // 远距离时缩小
          userTitle={star.userTitle}
          onClick={onStarClick}
        />
      )}

      {/* 行星和轨道 - 根据LOD等级决定渲染 */}
      {lodLevel === 'near' && adjustedPlanets.map((planet) => {
        const planetColor = planet.color || categoryColors[planet.category] || '#f72585';
        
        return (
          <group key={planet.id}>
            {/* 轨道线 - 仅近距离显示 */}
            <OrbitRing
              radius={planet.orbitRadius}
              color={planetColor}
              opacity={0.2}
            />

            {/* 行星 - 完整渲染 */}
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
              lodLevel="full"
            />
          </group>
        );
      })}

      {/* 中距离：仅显示行星，不显示轨道 */}
      {lodLevel === 'medium' && adjustedPlanets.map((planet) => {
        const planetColor = planet.color || categoryColors[planet.category] || '#f72585';
        
        return (
          <OrbitingPlanet
            key={planet.id}
            id={planet.id}
            name={planet.title}
            color={planetColor}
            size={(planet.size || 1) * 0.8} // 稍微缩小
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
            lodLevel="simplified"
          />
        );
      })}

      {/* 远距离：仅显示星系中心的发光效果 */}
      {lodLevel === 'far' && adjustedPlanets.length > 0 && (
        <mesh>
          <sphereGeometry args={[Math.max(...planets.map(p => p.orbitRadius)) * 1.2, 16, 16]} />
          <meshBasicMaterial
            color="#FDB813"
            transparent
            opacity={0.1}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* 碰撞风险指示器 - 仅在近距离且有风险时显示 */}
      {lodLevel === 'near' && collisionRisk.hasRisk && (
        <Html
          position={[0, 8, 0]}
          center
          distanceFactor={15}
        >
          <div className={`glass-card px-3 py-2 rounded-lg border backdrop-blur-md text-xs font-mono ${
            collisionRisk.riskLevel === 'high' 
              ? 'border-red-500/80 bg-red-500/20 text-red-300' 
              : collisionRisk.riskLevel === 'medium'
              ? 'border-yellow-500/80 bg-yellow-500/20 text-yellow-300'
              : 'border-blue-500/80 bg-blue-500/20 text-blue-300'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {collisionRisk.riskLevel === 'high' ? '⚠️' : 
                 collisionRisk.riskLevel === 'medium' ? '⚡' : '🛡️'}
              </span>
              <div>
                <div className="font-semibold">
                  {collisionRisk.riskLevel === 'high' ? '高风险' : 
                   collisionRisk.riskLevel === 'medium' ? '中风险' : '低风险'}
                </div>
                <div className="text-xs opacity-75">
                  最近距离: {collisionRisk.closestApproach.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </Html>
      )}
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
  lodLevel?: 'full' | 'simplified';
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
  lodLevel = 'full',
}: OrbitingPlanetProps) {
  const planetRef = useRef<THREE.Group>(null);

  // 优化的公转计算 - 减少计算频率
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
      {lodLevel === 'full' ? (
        <Planet
          id={id}
          name={name}
          position={[0, 0, 0]}
          color={color}
          size={size}
          category={category}
          onClick={onClick}
        />
      ) : (
        // 简化版本：仅显示简单的球体
        <SimplePlanet
          color={color}
          size={size}
          onClick={onClick}
        />
      )}
    </group>
  );
}

// 简化的行星组件（用于中远距离LOD）
function SimplePlanet({
  color,
  size,
  onClick,
}: {
  color: string;
  size: number;
  onClick?: () => void;
}) {
  return (
    <mesh onClick={onClick}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.2}
        roughness={0.8}
      />
    </mesh>
  );
}

