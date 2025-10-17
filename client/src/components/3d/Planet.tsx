'use client';

import { useRef, useState, useMemo } from 'react';
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
  
  // 使用planetId生成随机种子
  const seed = planetId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // 存储已放置的圆形
  const circles: Circle[] = [];
  const maxAttempts = 150; // 增加尝试次数以放置更多色块
  const targetCount = 12 + Math.floor(seededRandom(seed) * 8); // 12-19个色块（更多）
  
  // 尝试放置圆形，确保不重叠
  let currentSeed = seed;
  while (circles.length < targetCount) {
    let placed = false;
    
    for (let attempt = 0; attempt < maxAttempts && !placed; attempt++) {
      currentSeed++;
      
      // 生成候选圆形
      const cx = seededRandom(currentSeed) * resolution;
      const cy = seededRandom(currentSeed + 1) * resolution;
      
      // 圆形或椭圆形（随机选择）
      const isEllipse = seededRandom(currentSeed + 2) > 0.6;
      let radiusX, radiusY;
      
      if (isEllipse) {
        // 椭圆：更小的半径范围
        radiusX = 30 + seededRandom(currentSeed + 3) * 60; // 30-90像素
        radiusY = 30 + seededRandom(currentSeed + 4) * 60;
      } else {
        // 圆形：更小的半径范围
        const radius = 35 + seededRandom(currentSeed + 3) * 55; // 35-90像素
        radiusX = radius;
        radiusY = radius;
      }
      
      // 选择颜色变体
      const colorType = seededRandom(currentSeed + 5);
      let craterColor;
      
      if (colorType < 0.33) {
        craterColor = {
          r: Math.floor(darkerColor.r * 255),
          g: Math.floor(darkerColor.g * 255),
          b: Math.floor(darkerColor.b * 255),
        };
      } else if (colorType < 0.66) {
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
  
  // 添加一些波浪状条纹效果（改进版，避免裂缝）
  const hasStripes = seededRandom(seed + 9999) > 0.6;
  if (hasStripes) {
    const stripeCount = 2 + Math.floor(seededRandom(seed + 10000) * 2);
    for (let s = 0; s < stripeCount; s++) {
      const centerY = seededRandom(seed + 20000 + s) * resolution;
      const stripeHeight = 30 + seededRandom(seed + 30000 + s) * 50;
      const stripeColor = s % 2 === 0 ? darkerColor : lighterColor;
      const waveAmplitude = 20 + seededRandom(seed + 40000 + s) * 30;
      const waveFrequency = 0.01 + seededRandom(seed + 50000 + s) * 0.02;
      
      for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
          // 添加波浪效果，让条纹更自然
          const wave = Math.sin(i * waveFrequency) * waveAmplitude;
          const dy = Math.abs(j - (centerY + wave));
          
          if (dy < stripeHeight) {
            // 更柔和的渐变
            const fade = Math.pow(1 - (dy / stripeHeight), 2) * 0.4;
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
}

export function Planet({ id, name, position, color, size, category, onClick }: PlanetProps) {
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
    
    // 整个group浮动，所有特效跟随
    if (groupRef.current && hovered) {
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
            emissiveIntensity={hovered ? 0.3 : 0.1}
            roughness={0.8}
            metalness={0.2}
            bumpMap={normalMap}
            bumpScale={0.05}
          />
        </Sphere>

        {/* 星球光环 */}
        {hovered && (
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
            opacity={hovered ? 0.2 : 0.1}
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
}

// 轨道粒子组件
function OrbitParticles({ radius, color }: { radius: number; color: string }) {
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
}
