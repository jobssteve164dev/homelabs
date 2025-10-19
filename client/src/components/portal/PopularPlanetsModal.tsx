'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Eye, ExternalLink, Github, MapPin } from 'lucide-react';

interface PopularPlanet {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  demoUrl?: string;
  githubUrl?: string;
  imageUrl?: string;
  viewCount: number;
  likeCount: number;
  author: {
    id: string;
    name: string;
    email: string;
    galaxyCenter: {
      x: number;
      y: number;
      z: number;
    };
  };
  orbitRadius: number;
  orbitAngle: number;
  orbitSpeed: number;
  createdAt: string;
  updatedAt: string;
}

interface PopularPlanetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPlanet: (galaxyCenter: { x: number; y: number; z: number }) => void;
}

/**
 * PopularPlanetsModal组件
 * 
 * 数据来源: 真实的后端API (/api/planets/popular)
 * 数据流: API -> PopularPlanetsModal -> 用户交互
 * 
 * 功能：
 * - 显示最受欢迎的10个星球
 * - 提供跳转到对应星球的功能
 * - 显示星球的详细信息
 */
export function PopularPlanetsModal({ isOpen, onClose, onNavigateToPlanet }: PopularPlanetsModalProps) {
  const [planets, setPlanets] = useState<PopularPlanet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取热门星球数据
  useEffect(() => {
    if (isOpen) {
      fetchPopularPlanets();
    }
  }, [isOpen]);

  const fetchPopularPlanets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/planets/popular');
      if (response.ok) {
        const data = await response.json();
        setPlanets(data.planets || []);
      } else {
        setError('获取热门星球失败');
      }
    } catch (err) {
      console.error('获取热门星球失败:', err);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanetClick = (planet: PopularPlanet) => {
    // 跳转到对应星球所在的星系
    onNavigateToPlanet(planet.author.galaxyCenter);
    onClose();
  };

  const handleExternalLink = (url: string, event: React.MouseEvent) => {
    event.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* 模态框 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 z-50 flex items-center justify-center"
          >
            <div className="glass-card border border-neon-blue/30 rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
              {/* 头部 */}
              <div className="flex items-center justify-between p-6 border-b border-neon-blue/20">
                <div>
                  <h2 className="text-2xl font-bold text-neon-blue mb-1">
                    热门星球排行榜
                  </h2>
                  <p className="text-foreground/60 text-sm">
                    按点赞数排序的最受欢迎AI工具
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-neon-blue/10 transition-colors"
                >
                  <X className="w-6 h-6 text-foreground/60" />
                </motion.button>
              </div>

              {/* 内容区域 */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mx-auto mb-4"></div>
                      <p className="text-foreground/60">加载热门星球中...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <p className="text-red-400 mb-4">{error}</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={fetchPopularPlanets}
                      className="px-4 py-2 bg-neon-blue/20 border border-neon-blue/30 rounded-lg text-neon-blue hover:bg-neon-blue/30 transition-colors"
                    >
                      重试
                    </motion.button>
                  </div>
                ) : planets.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-foreground/60">暂无热门星球数据</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {planets.map((planet, index) => (
                      <motion.div
                        key={planet.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => handlePlanetClick(planet)}
                        className="glass-card border border-neon-purple/20 rounded-xl p-4 cursor-pointer hover:border-neon-purple/40 transition-all duration-200 group"
                      >
                        <div className="flex items-start gap-4">
                          {/* 排名 */}
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>

                          {/* 星球信息 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-foreground group-hover:text-neon-blue transition-colors mb-1">
                                  {planet.title}
                                </h3>
                                <p className="text-foreground/60 text-sm mb-2 line-clamp-2">
                                  {planet.description}
                                </p>
                                
                                {/* 标签 */}
                                <div className="flex flex-wrap gap-1 mb-3">
                                  <span className="px-2 py-1 bg-neon-blue/10 text-neon-blue text-xs rounded-full">
                                    {planet.category}
                                  </span>
                                  {planet.tags.slice(0, 3).map((tag, tagIndex) => (
                                    <span
                                      key={tagIndex}
                                      className="px-2 py-1 bg-foreground/10 text-foreground/60 text-xs rounded-full"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {planet.tags.length > 3 && (
                                    <span className="px-2 py-1 bg-foreground/10 text-foreground/40 text-xs rounded-full">
                                      +{planet.tags.length - 3}
                                    </span>
                                  )}
                                </div>

                                {/* 作者信息 */}
                                <div className="flex items-center gap-2 text-xs text-foreground/50">
                                  <span>by {planet.author.name}</span>
                                </div>
                              </div>

                              {/* 统计信息和操作按钮 */}
                              <div className="flex-shrink-0 flex flex-col items-end gap-2">
                                {/* 统计数据 */}
                                <div className="flex items-center gap-3 text-sm">
                                  <div className="flex items-center gap-1 text-neon-green">
                                    <Star className="w-4 h-4" />
                                    <span>{planet.likeCount}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-foreground/60">
                                    <Eye className="w-4 h-4" />
                                    <span>{planet.viewCount}</span>
                                  </div>
                                </div>

                                {/* 操作按钮 */}
                                <div className="flex items-center gap-2">
                                  {planet.demoUrl && (
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={(e) => handleExternalLink(planet.demoUrl!, e)}
                                      className="p-1.5 rounded-lg bg-neon-green/10 border border-neon-green/30 text-neon-green hover:bg-neon-green/20 transition-colors"
                                      title="查看演示"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </motion.button>
                                  )}
                                  {planet.githubUrl && (
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={(e) => handleExternalLink(planet.githubUrl!, e)}
                                      className="p-1.5 rounded-lg bg-foreground/10 border border-foreground/30 text-foreground hover:bg-foreground/20 transition-colors"
                                      title="查看源码"
                                    >
                                      <Github className="w-4 h-4" />
                                    </motion.button>
                                  )}
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handlePlanetClick(planet)}
                                    className="p-1.5 rounded-lg bg-neon-blue/10 border border-neon-blue/30 text-neon-blue hover:bg-neon-blue/20 transition-colors"
                                    title="跳转到星球"
                                  >
                                    <MapPin className="w-4 h-4" />
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* 底部提示 */}
              <div className="p-4 border-t border-neon-blue/20 bg-foreground/5">
                <p className="text-center text-xs text-foreground/50">
                  点击星球卡片可跳转到对应星系位置
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
