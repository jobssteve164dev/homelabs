'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Universe, type GalaxyData } from '../3d/Universe';
import { PlanetDetail } from './PlanetDetail';
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
      />

      {/* HUD界面 */}
      <UniverseHUD
        totalPlanets={totalPlanets + totalStars}
        activePlanets={totalPlanets}
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
              userName: selectedStar.userName,
              userAvatar: selectedStar.userAvatar,
              userTitle: selectedStar.star.userTitle,
              // 这里需要从API获取完整的恒星数据
              // 暂时使用占位符
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

/**
 * StarDetail组件（临时实现，后续会完善）
 */
interface StarDetailProps {
  star: {
    userName: string;
    userAvatar?: string;
    userTitle?: string;
  };
  onClose: () => void;
}

function StarDetail({ star, onClose }: StarDetailProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ type: 'spring', damping: 25 }}
      className="fixed top-0 right-0 h-full w-full md:w-[480px] z-30"
    >
      <div className="relative h-full bg-gradient-to-br from-sci-dark/95 to-sci-darker/95 backdrop-blur-xl border-l border-neon-blue/30 shadow-2xl overflow-y-auto">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-sci-dark/50 hover:bg-sci-dark border border-neon-blue/30 flex items-center justify-center transition-all duration-300 hover:scale-110 z-10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 text-foreground/60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="p-8">
          {/* 用户头像和名称 */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 mx-auto mb-4 flex items-center justify-center text-4xl">
              {star.userAvatar || '⭐'}
            </div>
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">
              {star.userName}
            </h2>
            {star.userTitle && (
              <p className="text-foreground/70">{star.userTitle}</p>
            )}
          </div>

          <div className="text-center text-foreground/50">
            详细个人介绍将在后续版本中完善
          </div>
        </div>
      </div>
    </motion.div>
  );
}
