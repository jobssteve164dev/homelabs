'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

interface OrbitRingProps {
  radius: number;
  color: string;
  opacity?: number;
}

/**
 * OrbitRing轨道线组件
 * 显示行星围绕恒星的公转轨道
 * 
 * 视觉特征：
 * - 虚线圆环
 * - 半透明
 * - 与行星颜色匹配
 * - 在XZ平面上的圆形轨道
 */
export function OrbitRing({ radius, color, opacity = 0.3 }: OrbitRingProps) {
  // 创建虚线圆环几何体
  const geometry = useMemo(() => {
    const segments = 128; // 圆环的分段数
    const points: THREE.Vector3[] = [];

    // 在XZ平面上创建圆形路径
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);
      points.push(new THREE.Vector3(x, 0, z));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [radius]);

  // 创建LineDashedMaterial
  const material = useMemo(() => {
    const mat = new THREE.LineDashedMaterial({
      color,
      transparent: true,
      opacity,
      dashSize: 0.5,
      gapSize: 0.3,
      linewidth: 1,
    });
    return mat;
  }, [color, opacity]);

  // 创建Line对象
  const line = useMemo(() => {
    const lineObj = new THREE.Line(geometry, material);
    lineObj.computeLineDistances(); // 虚线效果必需
    return lineObj;
  }, [geometry, material]);

  return <primitive object={line} />;
}

