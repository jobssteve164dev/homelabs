'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Universe, type GalaxyData } from '../3d/Universe';
import { PlanetDetail } from './PlanetDetail';
import { StarDetail } from './StarDetail';
import { UniverseHUD } from './UniverseHUD';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * UniversePortal组件
 * 
 * 数据来源: 真实的后端API (/api/galaxies)
 * 数据流: API -> UniversePortal -> Universe -> Galaxy -> Star/Planet
 * 
 * 功能：
 * - 获取所有用户的星系数据
 * - 渲染多个星系（每个用户一个）
 * - 处理恒星和行星的点击事件
 * - 显示详情卡片
 */
export function UniversePortal() {
  const { data: session } = useSession();
  const [selectedPlanetId, setSelectedPlanetId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [galaxies, setGalaxies] = useState<GalaxyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [cameraTarget, setCameraTarget] = useState<{ x: number; y: number; z: number } | null>(null);

  // 获取所有星系数据
  useEffect(() => {
    fetchGalaxies();
  }, []);

  const fetchGalaxies = async () => {
    try {
      const response = await fetch('/api/galaxies');
      if (response.ok) {
        const data = await response.json();
        setGalaxies(data.galaxies || []);
      } else {
        console.error('获取星系列表失败:', response.statusText);
      }
    } catch (error) {
      console.error('获取星系列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 找到选中的行星数据
  const selectedPlanet = galaxies
    .flatMap(g => g.planets)
    .find(p => p.id === selectedPlanetId);

  // 找到选中的恒星（用户）数据
  const selectedStar = galaxies.find(g => g.userId === selectedUserId);

  // 欢迎提示5秒后自动淡出
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handlePlanetClick = (planetId: string) => {
    setSelectedPlanetId(planetId);
    setSelectedUserId(null);
    setShowWelcome(false);
  };

  const handleStarClick = (userId: string) => {
    setSelectedUserId(userId);
    setSelectedPlanetId(null);
    setShowWelcome(false);
  };

  const handleClose = () => {
    setSelectedPlanetId(null);
    setSelectedUserId(null);
  };

  // 处理跳转到指定星球
  const handleNavigateToPlanet = (planetId: string, galaxyCenter: { x: number; y: number; z: number }) => {
    // 找到目标星球
    const targetPlanet = galaxies
      .flatMap(g => g.planets)
      .find(p => p.id === planetId);
    
    if (targetPlanet) {
      // 计算星球在3D空间中的实际位置
      const planetPosition = {
        x: galaxyCenter.x + Math.cos(targetPlanet.orbitAngle) * targetPlanet.orbitRadius,
        y: galaxyCenter.y,
        z: galaxyCenter.z + Math.sin(targetPlanet.orbitAngle) * targetPlanet.orbitRadius,
      };
      
      // 设置相机跳转目标到星球位置
      setCameraTarget(planetPosition);
      
      // 设置选中星球以触发高亮效果
      setSelectedPlanetId(planetId);
    } else {
      // 如果找不到星球，跳转到星系中心
      setCameraTarget(galaxyCenter);
    }
    
    // 关闭其他面板
    setSelectedUserId(null);
    setShowWelcome(false);
    
    // 3秒后清除跳转目标，但保持星球选中状态
    setTimeout(() => {
      setCameraTarget(null);
    }, 3000);
  };

  // 统计数据
  const totalPlanets = galaxies.reduce((sum, g) => sum + g.planets.length, 0);
  const totalStars = galaxies.filter(g => g.star !== null).length;

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
      <Universe
        galaxies={galaxies}
        onStarClick={handleStarClick}
        onPlanetClick={handlePlanetClick}
        currentUserId={session?.user ? (session.user as { id: string }).id : undefined}
        cameraTarget={cameraTarget}
      />

      {/* HUD界面 */}
      <UniverseHUD
        totalPlanets={totalPlanets + totalStars}
        activePlanets={totalPlanets}
        onNavigateToPlanet={handleNavigateToPlanet}
      />

      {/* 优雅的欢迎提示 */}
      <AnimatePresence>
        {showWelcome && !selectedPlanetId && !selectedUserId && (
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
                className="text-foreground/50 text-base md:text-lg font-light tracking-wider mb-2"
              >
                每个星系代表一位创作者
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="text-foreground/40 text-sm md:text-base font-light tracking-wider"
              >
                ⭐ 恒星是创作者介绍 • 🪐 行星是AI项目
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 行星详情面板 */}
      <AnimatePresence>
        {selectedPlanet && (
          <PlanetDetail
            planet={{
              id: selectedPlanet.id,
              name: selectedPlanet.title,
              color: '#00ffff', // 这里可以从category映射颜色
              category: selectedPlanet.category,
              description: selectedPlanet.description,
              tags: selectedPlanet.tags,
              status: 'active',
            }}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>

      {/* 恒星详情面板（用户个人介绍） */}
      <AnimatePresence>
        {selectedStar && selectedStar.star && (
          <StarDetail
            star={{
              userId: selectedStar.userId,
              userName: selectedStar.userName,
              userAvatar: selectedStar.userAvatar,
              userTitle: selectedStar.star.userTitle || undefined,
              userBio: selectedStar.star.userBio || undefined,
              userSkills: selectedStar.star.userSkills as string[] | undefined,
              socialLinks: selectedStar.star.socialLinks as Record<string, string> | undefined,
            }}
            onClose={handleClose}
          />
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
