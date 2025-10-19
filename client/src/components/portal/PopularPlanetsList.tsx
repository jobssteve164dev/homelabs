'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Eye, ExternalLink, Github, MapPin, ChevronDown } from 'lucide-react';

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

interface PopularPlanetsListProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPlanet: (galaxyCenter: { x: number; y: number; z: number }) => void;
}

/**
 * PopularPlanetsList组件
 * 
 * 数据来源: 真实的后端API (/api/planets/popular)
 * 数据流: API -> PopularPlanetsList -> 用户交互
 * 
 * 功能：
 * - 显示最受欢迎的10个星球（简洁线条风格）
 * - 提供跳转到对应星球的功能
 * - 类似性能监控面板的设计风格
 */
export function PopularPlanetsList({ isOpen, onClose, onNavigateToPlanet }: PopularPlanetsListProps) {
  const [planets, setPlanets] = useState<PopularPlanet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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
    onNavigateToPlanet(planet.author.galaxyCenter);
    onClose();
  };

  const handleExternalLink = (url: string, event: React.MouseEvent) => {
    event.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const toggleExpanded = (planetId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(planetId)) {
      newExpanded.delete(planetId);
    } else {
      newExpanded.add(planetId);
    }
    setExpandedItems(newExpanded);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="absolute top-full right-0 mt-2 z-50"
    >
      <div className="glass-card px-4 py-3 rounded-lg border border-neon-blue/30 backdrop-blur-md font-mono text-xs min-w-[400px] max-w-[500px]">
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-neon-blue font-bold">热门星球排行榜</div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="text-foreground/60 hover:text-foreground transition-colors"
          >
            ×
          </motion.button>
        </div>

        {/* 内容区域 */}
        <div className="space-y-1 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="text-center py-4">
              <div className="text-foreground/60">加载中...</div>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <div className="text-red-400 mb-2">{error}</div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchPopularPlanets}
                className="text-neon-blue hover:text-neon-purple transition-colors"
              >
                重试
              </motion.button>
            </div>
          ) : planets.length === 0 ? (
            <div className="text-center py-4">
              <div className="text-foreground/60">暂无热门星球数据</div>
            </div>
          ) : (
            planets.map((planet, index) => {
              const isExpanded = expandedItems.has(planet.id);
              return (
                <motion.div
                  key={planet.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-foreground/10 last:border-b-0 pb-1 last:pb-0"
                >
                  {/* 主要信息行 */}
                  <div 
                    className="flex items-center justify-between py-1 cursor-pointer hover:bg-foreground/5 rounded px-1 -mx-1"
                    onClick={() => toggleExpanded(planet.id)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-neon-blue font-semibold w-4 text-right">
                        {index + 1}
                      </span>
                      <span className="text-foreground font-medium truncate">
                        {planet.title}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-foreground/60">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-neon-green" />
                        <span>{planet.likeCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{planet.viewCount}</span>
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </motion.div>
                    </div>
                  </div>

                  {/* 展开的详细信息 */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-6 pr-2 py-2 space-y-2">
                          {/* 描述 */}
                          <div className="text-foreground/60 text-xs leading-relaxed">
                            {planet.description}
                          </div>
                          
                          {/* 标签 */}
                          <div className="flex flex-wrap gap-1">
                            <span className="px-1.5 py-0.5 bg-neon-blue/10 text-neon-blue text-xs rounded">
                              {planet.category}
                            </span>
                            {planet.tags.slice(0, 2).map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="px-1.5 py-0.5 bg-foreground/10 text-foreground/60 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {planet.tags.length > 2 && (
                              <span className="px-1.5 py-0.5 bg-foreground/10 text-foreground/40 text-xs rounded">
                                +{planet.tags.length - 2}
                              </span>
                            )}
                          </div>

                          {/* 作者信息 */}
                          <div className="text-foreground/50 text-xs">
                            by {planet.author.name}
                          </div>

                          {/* 操作按钮 */}
                          <div className="flex items-center gap-2 pt-1">
                            {planet.demoUrl && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => handleExternalLink(planet.demoUrl!, e)}
                                className="p-1 rounded bg-neon-green/10 border border-neon-green/30 text-neon-green hover:bg-neon-green/20 transition-colors"
                                title="查看演示"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </motion.button>
                            )}
                            {planet.githubUrl && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => handleExternalLink(planet.githubUrl!, e)}
                                className="p-1 rounded bg-foreground/10 border border-foreground/30 text-foreground hover:bg-foreground/20 transition-colors"
                                title="查看源码"
                              >
                                <Github className="w-3 h-3" />
                              </motion.button>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handlePlanetClick(planet)}
                              className="p-1 rounded bg-neon-blue/10 border border-neon-blue/30 text-neon-blue hover:bg-neon-blue/20 transition-colors"
                              title="跳转到星球"
                            >
                              <MapPin className="w-3 h-3" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>

        {/* 底部提示 */}
        <div className="mt-3 pt-2 border-t border-foreground/10">
          <div className="text-foreground/40 text-xs text-center">
            点击展开查看详情 • 点击位置图标跳转
          </div>
        </div>
      </div>
    </motion.div>
  );
}
