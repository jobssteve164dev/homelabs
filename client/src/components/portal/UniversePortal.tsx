'use client';

import { useState, useEffect } from 'react';
import { Universe } from '../3d/Universe';
import { PlanetDetail } from './PlanetDetail';
import { UniverseHUD } from './UniverseHUD';
import { motion, AnimatePresence } from 'framer-motion';

// 示例星球数据
const samplePlanets = [
  {
    id: '1',
    name: 'AI文本生成器',
    position: [0, 0, 0] as [number, number, number],
    color: '#00ffff',
    size: 1.5,
    category: '文本处理',
    description: '基于GPT的智能文本生成工具',
    tags: ['GPT', '文本生成', 'AI写作'],
    status: 'active',
  },
  {
    id: '2',
    name: '图像识别',
    position: [4, 2, -3] as [number, number, number],
    color: '#ff00ff',
    size: 1.2,
    category: '图像处理',
    description: '高精度图像识别系统',
    tags: ['计算机视觉', '图像识别'],
    status: 'active',
  },
  {
    id: '3',
    name: '语音转文字',
    position: [-5, -1, 2] as [number, number, number],
    color: '#00ff00',
    size: 1.0,
    category: '语音处理',
    description: '实时语音识别和转录服务',
    tags: ['语音识别', 'ASR'],
    status: 'active',
  },
  {
    id: '4',
    name: '代码助手',
    position: [3, -3, 4] as [number, number, number],
    color: '#ff8c00',
    size: 1.3,
    category: '开发工具',
    description: 'AI驱动的代码生成工具',
    tags: ['代码生成', '编程助手'],
    status: 'development',
  },
  {
    id: '5',
    name: '数据分析',
    position: [-3, 3, -2] as [number, number, number],
    color: '#1e90ff',
    size: 1.1,
    category: '数据分析',
    description: '智能数据分析平台',
    tags: ['数据分析', '可视化'],
    status: 'active',
  },
  {
    id: '6',
    name: '智能客服',
    position: [2, 1, 5] as [number, number, number],
    color: '#ff1493',
    size: 0.9,
    category: '对话系统',
    description: '基于NLP的智能客服系统',
    tags: ['NLP', '对话系统'],
    status: 'planning',
  },
];

export function UniversePortal() {
  const [selectedPlanetId, setSelectedPlanetId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);

  const selectedPlanet = samplePlanets.find(p => p.id === selectedPlanetId);

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

  return (
    <div className="relative w-full h-screen overflow-hidden bg-sci-darker">
      {/* 3D宇宙场景 */}
      <Universe planets={samplePlanets} onPlanetClick={handlePlanetClick} />

      {/* HUD界面 */}
      <UniverseHUD
        totalPlanets={samplePlanets.length}
        activePlanets={samplePlanets.filter(p => p.status === 'active').length}
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
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 z-20 w-16 h-16 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple flex items-center justify-center shadow-glow-blue hover:shadow-glow-purple transition-all duration-300"
        onClick={() => {
          // TODO: 打开创建星球对话框
          alert('创建新星球功能即将推出！');
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
    </div>
  );
}
