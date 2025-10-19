'use client';

import { useRef, useState, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';

// 随机数生成器（基于种子）
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// 圆形/椭圆形结构
interface Circle {
  cx: number;
  cy: number;
  radiusX: number;
  radiusY: number;
  color: { r: number; g: number; b: number };
}

// 检查两个椭圆是否重叠
function checkOverlap(c1: Circle, c2: Circle): boolean {
  // 使用简化的距离检测（考虑椭圆的平均半径）
  const avgRadius1 = (c1.radiusX + c1.radiusY) / 2;
  const avgRadius2 = (c2.radiusX + c2.radiusY) / 2;
  const dx = c1.cx - c2.cx;
  const dy = c1.cy - c2.cy;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // 更小的色块使用更小的安全间距
  return distance < (avgRadius1 + avgRadius2 + 10);
}

// 生成程序化纹理 - 使用大圆形色块（无重叠）
function createPlanetTexture(color: string, planetId: string): THREE.DataTexture {
  const resolution = 1024;
  const data = new Uint8Array(resolution * resolution * 4);
  
  // 解析基础颜色
  const baseColor = new THREE.Color(color);
  const r = Math.floor(baseColor.r * 255);
  const g = Math.floor(baseColor.g * 255);
  const b = Math.floor(baseColor.b * 255);
  
  // 生成更深和更浅的颜色变体
  const darkerColor = baseColor.clone().multiplyScalar(0.6);
  const lighterColor = baseColor.clone().multiplyScalar(1.3);
  const accentColor = baseColor.clone();
  accentColor.offsetHSL(0.1, 0, -0.2);
  
  // 初始化为基础颜色
  for (let i = 0; i < resolution * resolution * 4; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }
  
  // 使用planetId生成更复杂的随机种子，确保每个星球都有独特的陨石坑分布
  const baseSeed = planetId.split('').reduce((acc, char, index) => {
    return acc + char.charCodeAt(0) * (index + 1);
  }, 0);
  
  // 为每个星球生成独特的陨石坑特征
  const craterSeed = baseSeed + planetId.length * 1000;
  const patternSeed = baseSeed + planetId.length * 2000;
  const sizeSeed = baseSeed + planetId.length * 3000;
  
  // 存储已放置的圆形
  const circles: Circle[] = [];
  const maxAttempts = 200; // 增加尝试次数
  
  // 每个星球的陨石坑数量和大小分布都不同
  const craterCount = 8 + Math.floor(seededRandom(craterSeed) * 12); // 8-19个陨石坑
  const sizeVariation = 0.3 + seededRandom(sizeSeed) * 0.7; // 0.3-1.0 的大小变化系数
  
  // 尝试放置圆形，确保不重叠
  let currentSeed = craterSeed;
  let placedCount = 0;
  
  while (placedCount < craterCount && circles.length < craterCount) {
    let placed = false;
    
    for (let attempt = 0; attempt < maxAttempts && !placed; attempt++) {
      currentSeed += attempt + 1; // 每次尝试都使用不同的种子增量
      
      // 生成候选圆形位置 - 使用更复杂的分布模式
      const positionSeed = currentSeed + patternSeed;
      const cx = seededRandom(positionSeed) * resolution;
      const cy = seededRandom(positionSeed + 1000) * resolution;
      
      // 每个星球的形状偏好不同
      const shapePreference = seededRandom(patternSeed + attempt);
      const isEllipse = shapePreference > (0.4 + seededRandom(patternSeed + attempt * 2) * 0.4);
      
      let radiusX, radiusY;
      
      if (isEllipse) {
        // 椭圆：每个星球的椭圆特征不同
        const ellipseSeed = sizeSeed + attempt * 3;
        const baseRadius = 25 + seededRandom(ellipseSeed) * 70; // 25-95像素
        radiusX = baseRadius * sizeVariation;
        radiusY = (baseRadius * (0.6 + seededRandom(ellipseSeed + 1) * 0.8)) * sizeVariation;
      } else {
        // 圆形：每个星球的圆形大小分布不同
        const circleSeed = sizeSeed + attempt * 5;
        const baseRadius = 30 + seededRandom(circleSeed) * 65; // 30-95像素
        const radius = baseRadius * sizeVariation;
        radiusX = radius;
        radiusY = radius;
      }
      
      // 每个星球的颜色变体偏好不同
      const colorSeed = currentSeed + patternSeed * 2;
      const colorType = seededRandom(colorSeed);
      let craterColor;
      
      // 根据星球特征调整颜色分布
      const colorBias = seededRandom(patternSeed + attempt * 7);
      let adjustedColorType = colorType;
      
      if (colorBias < 0.3) {
        // 偏向深色陨石坑
        adjustedColorType = colorType * 0.5;
      } else if (colorBias > 0.7) {
        // 偏向浅色陨石坑
        adjustedColorType = 0.5 + colorType * 0.5;
      }
      
      if (adjustedColorType < 0.33) {
        craterColor = {
          r: Math.floor(darkerColor.r * 255),
          g: Math.floor(darkerColor.g * 255),
          b: Math.floor(darkerColor.b * 255),
        };
      } else if (adjustedColorType < 0.66) {
        craterColor = {
          r: Math.floor(lighterColor.r * 255),
          g: Math.floor(lighterColor.g * 255),
          b: Math.floor(lighterColor.b * 255),
        };
      } else {
        craterColor = {
          r: Math.floor(accentColor.r * 255),
          g: Math.floor(accentColor.g * 255),
          b: Math.floor(accentColor.b * 255),
        };
      }
      
      const candidate: Circle = { cx, cy, radiusX, radiusY, color: craterColor };
      
      // 检查是否与已有圆形重叠
      let overlaps = false;
      for (const existing of circles) {
        if (checkOverlap(candidate, existing)) {
          overlaps = true;
          break;
        }
      }
      
      // 如果不重叠，则放置
      if (!overlaps) {
        circles.push(candidate);
        placed = true;
        placedCount++;
      }
    }
    
    // 如果尝试多次仍无法放置，则停止（避免无限循环）
    if (!placed) {
      break;
    }
  }
  
  // 绘制所有圆形/椭圆
  for (const circle of circles) {
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const dx = i - circle.cx;
        const dy = j - circle.cy;
        
        // 椭圆距离公式
        const distance = Math.sqrt((dx * dx) / (circle.radiusX * circle.radiusX) + 
                                   (dy * dy) / (circle.radiusY * circle.radiusY));
        
        if (distance < 1) {
          // 添加边缘渐变效果
          const fade = 1 - distance * 0.3;
          const idx = (i * resolution + j) * 4;
          
          data[idx] = Math.floor(circle.color.r * fade);
          data[idx + 1] = Math.floor(circle.color.g * fade);
          data[idx + 2] = Math.floor(circle.color.b * fade);
        }
        
        // 添加边缘描边
        if (distance > 0.95 && distance < 1.05) {
          const idx = (i * resolution + j) * 4;
          data[idx] = Math.floor(data[idx] * 0.7);
          data[idx + 1] = Math.floor(data[idx + 1] * 0.7);
          data[idx + 2] = Math.floor(data[idx + 2] * 0.7);
        }
      }
    }
  }
  
  // 添加一些波浪状条纹效果（每个星球都有独特的条纹特征）
  const stripeSeed = baseSeed + planetId.length * 4000;
  const hasStripes = seededRandom(stripeSeed) > 0.5; // 50%的星球有条纹
  
  if (hasStripes) {
    // 每个星球的条纹数量和特征都不同
    const stripeCount = 1 + Math.floor(seededRandom(stripeSeed + 1000) * 4); // 1-4条条纹
    const stripeDirection = seededRandom(stripeSeed + 2000) > 0.5; // 水平或垂直条纹
    
    for (let s = 0; s < stripeCount; s++) {
      const stripePatternSeed = stripeSeed + s * 10000;
      
      // 每个条纹都有独特的位置和特征
      const centerPos = seededRandom(stripePatternSeed) * resolution;
      const stripeWidth = 20 + seededRandom(stripePatternSeed + 1000) * 60; // 20-80像素宽
      const stripeColor = seededRandom(stripePatternSeed + 2000) > 0.5 ? darkerColor : lighterColor;
      const waveAmplitude = 10 + seededRandom(stripePatternSeed + 3000) * 40; // 10-50像素波浪幅度
      const waveFrequency = 0.005 + seededRandom(stripePatternSeed + 4000) * 0.03; // 0.005-0.035频率
      const stripeOpacity = 0.2 + seededRandom(stripePatternSeed + 5000) * 0.3; // 0.2-0.5透明度
      
      for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
          let distance;
          
          if (stripeDirection) {
            // 水平条纹
            const wave = Math.sin(i * waveFrequency) * waveAmplitude;
            distance = Math.abs(j - (centerPos + wave));
          } else {
            // 垂直条纹
            const wave = Math.sin(j * waveFrequency) * waveAmplitude;
            distance = Math.abs(i - (centerPos + wave));
          }
          
          if (distance < stripeWidth) {
            // 更柔和的渐变，每个条纹的渐变特征不同
            const fade = Math.pow(1 - (distance / stripeWidth), 1.5 + seededRandom(stripePatternSeed + 6000) * 1.5) * stripeOpacity;
            const idx = (i * resolution + j) * 4;
            data[idx] = Math.floor(stripeColor.r * 255 * fade + data[idx] * (1 - fade));
            data[idx + 1] = Math.floor(stripeColor.g * 255 * fade + data[idx + 1] * (1 - fade));
            data[idx + 2] = Math.floor(stripeColor.b * 255 * fade + data[idx + 2] * (1 - fade));
          }
        }
      }
    }
  }
  
  const texture = new THREE.DataTexture(data, resolution, resolution);
  texture.needsUpdate = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  
  return texture;
}

// 生成简单的法线贴图（轻微凹凸）
function createNormalMap(): THREE.DataTexture {
  const resolution = 256;
  const data = new Uint8Array(resolution * resolution * 4);
  
  // 创建非常轻微的法线变化
  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const idx = (i * resolution + j) * 4;
      // 基本法线（指向外）
      data[idx] = 128;     // X
      data[idx + 1] = 128; // Y
      data[idx + 2] = 255; // Z (指向外)
      data[idx + 3] = 255; // Alpha
    }
  }
  
  const texture = new THREE.DataTexture(data, resolution, resolution);
  texture.needsUpdate = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  
  return texture;
}

interface PlanetProps {
  id: string;
  name: string;
  position: [number, number, number];
  color: string;
  size: number;
  category: string;
  onClick?: () => void;
  isFocused?: boolean;
}

export const Planet = memo(function Planet({ id, name, position, color, size, category, onClick, isFocused = false }: PlanetProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [showLabel, setShowLabel] = useState(false);

  // 生成星球纹理（只生成一次）
  const planetTexture = useMemo(() => createPlanetTexture(color, id), [color, id]);
  const normalMap = useMemo(() => createNormalMap(), []);

  // 星球自转和浮动动画
  useFrame((state, delta) => {
    if (meshRef.current) {
      // 自转
      meshRef.current.rotation.y += delta * 0.2;
    }
    
    // 整个group浮动，所有特效跟随（包括焦点状态）
    if (groupRef.current && (hovered || isFocused)) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    } else if (groupRef.current) {
      groupRef.current.position.y = 0;
    }
  });

  return (
    <group position={position}>
      <group ref={groupRef}>
        {/* 星球主体 */}
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
            map={planetTexture}
            normalMap={normalMap}
            normalScale={new THREE.Vector2(0.3, 0.3)}
            emissive={color}
            emissiveIntensity={(hovered || isFocused) ? 0.3 : 0.1}
            roughness={0.8}
            metalness={0.2}
            bumpMap={normalMap}
            bumpScale={0.05}
          />
        </Sphere>

        {/* 星球光环 */}
        {(hovered || isFocused) && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[size * 1.2, size * 1.4, 64]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}

        {/* 发光效果 */}
        <Sphere args={[size * 1.1, 32, 32]}>
          <meshBasicMaterial
            color={color}
            transparent
            opacity={(hovered || isFocused) ? 0.2 : 0.1}
            side={THREE.BackSide}
          />
        </Sphere>

        {/* 星球标签 */}
        {showLabel && (
          <Html
            position={[0, size + 0.5, 0]}
            center
            distanceFactor={10}
            style={{
              transition: 'all 0.2s',
              opacity: showLabel ? 1 : 0,
              transform: `scale(${showLabel ? 1 : 0.5})`,
            }}
          >
            <div className="glass-card px-4 py-2 rounded-lg border border-neon-blue/50 backdrop-blur-md">
              <div className="text-neon-blue font-display font-semibold text-sm whitespace-nowrap">
                {name}
              </div>
              <div className="text-foreground/70 text-xs mt-1">
                {category}
              </div>
            </div>
          </Html>
        )}

        {/* 轨道粒子 */}
        {hovered && <OrbitParticles radius={size * 1.5} color={color} />}
      </group>
    </group>
  );
});

// 轨道粒子组件 - 优化版
const OrbitParticles = memo(function OrbitParticles({ radius, color }: { radius: number; color: string }) {
  const particlesRef = useRef<THREE.Points>(null);
  
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  const particleCount = 50;
  const positions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
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
        size={0.05}
        color={color}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
});
