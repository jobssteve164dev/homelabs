'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Universe } from '../3d/Universe';
import { PlanetDetail } from './PlanetDetail';
import { UniverseHUD } from './UniverseHUD';
import { motion, AnimatePresence } from 'framer-motion';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  demoUrl?: string;
  githubUrl?: string;
  imageUrl?: string;
  isActive: boolean;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

// 将项目转换为星球数据的辅助函数
const convertProjectToPlanet = (project: Project, index: number) => {
  // 生成3D位置（在球形空间中分布）
  const radius = 8;
  const theta = (index * 137.5) % 360; // 黄金角度分布
  const phi = Math.acos(1 - 2 * index / 20); // 均匀分布在球面上
  
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);

  // 根据分类生成颜色
  const categoryColors: { [key: string]: string } = {
    '文本处理': '#00ffff',
    '图像处理': '#ff00ff',
    '语音处理': '#00ff00',
    '开发工具': '#ff8c00',
    '数据分析': '#1e90ff',
    '对话系统': '#ff1493',
    '机器学习': '#9d4edd',
    '其他': '#f72585'
  };

  return {
    id: project.id,
    name: project.title,
    position: [x, y, z] as [number, number, number],
    color: categoryColors[project.category] || '#f72585',
    size: Math.max(0.8, Math.min(1.5, 1 + project.likeCount / 50)), // 根据点赞数调整大小
    category: project.category,
    description: project.description,
    tags: project.tags,
    status: project.isActive ? 'active' : 'inactive',
    demoUrl: project.demoUrl,
    githubUrl: project.githubUrl,
    imageUrl: project.imageUrl,
    viewCount: project.viewCount,
    likeCount: project.likeCount
  };
};

export function UniversePortal() {
  const { data: session } = useSession();
  const [selectedPlanetId, setSelectedPlanetId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取所有公开项目
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects/public');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('获取项目列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 转换为星球数据
  const planets = projects.map(convertProjectToPlanet);
  const selectedPlanet = planets.find(p => p.id === selectedPlanetId);

  // 欢迎提示5秒后自动淡出
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handlePlanetClick = (planetId: string) => {
    setSelectedPlanetId(planetId);
    setShowWelcome(false);
  };

  const handleClose = () => {
    setSelectedPlanetId(null);
  };

  if (loading) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-sci-darker flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mx-auto mb-4"></div>
          <p className="text-foreground/60">加载AI宇宙中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-sci-darker">
      {/* 3D宇宙场景 */}
      <Universe planets={planets} onPlanetClick={handlePlanetClick} />

      {/* HUD界面 */}
      <UniverseHUD
        totalPlanets={planets.length}
        activePlanets={planets.filter(p => p.status === 'active').length}
      />

      {/* 优雅的欢迎提示 */}
      <AnimatePresence>
        {showWelcome && !selectedPlanetId && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
          >
            <div className="text-center px-4">
              <motion.h1
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="font-display text-4xl md:text-6xl font-bold mb-4"
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-neon-purple to-neon-green">
                  探索AI宇宙
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="text-foreground/50 text-base md:text-lg font-light tracking-wider"
              >
                每颗星球代表一个AI项目
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 星球详情面板 */}
      <AnimatePresence>
        {selectedPlanet && (
          <PlanetDetail planet={selectedPlanet} onClose={handleClose} />
        )}
      </AnimatePresence>

      {/* 创建星球按钮 */}
      {session && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-8 right-8 z-20 w-16 h-16 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple flex items-center justify-center shadow-glow-blue hover:shadow-glow-purple transition-all duration-300"
          onClick={() => {
            window.location.href = '/dashboard/create';
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </motion.button>
      )}
    </div>
  );
}
