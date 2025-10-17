'use client';

import { motion } from 'framer-motion';
import { 
  X, 
  ExternalLink, 
  Github, 
  Tag, 
  Rocket,
  Zap,
  Eye,
  Heart,
  TrendingUp,
  Calendar,
  Clock
} from 'lucide-react';
import { useState } from 'react';

interface Planet {
  id: string;
  name: string;
  category: string;
  description: string;
  tags?: string[];
  status: string;
  color: string;
}

interface PlanetDetailProps {
  planet: Planet;
  onClose: () => void;
}

const statusConfig = {
  active: { 
    label: '运行中', 
    icon: Zap,
    color: 'text-neon-green', 
    bg: 'bg-neon-green/20',
    border: 'border-neon-green/50',
    glow: 'shadow-glow-green'
  },
  development: { 
    label: '开发中', 
    icon: Rocket,
    color: 'text-neon-blue', 
    bg: 'bg-neon-blue/20',
    border: 'border-neon-blue/50',
    glow: 'shadow-glow-blue'
  },
  planning: { 
    label: '规划中', 
    icon: Calendar,
    color: 'text-neon-purple', 
    bg: 'bg-neon-purple/20',
    border: 'border-neon-purple/50',
    glow: 'shadow-glow-purple'
  },
};

export function PlanetDetail({ planet, onClose }: PlanetDetailProps) {
  const [isLiked, setIsLiked] = useState(false);
  const status = statusConfig[planet.status as keyof typeof statusConfig] || statusConfig.active;
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-30 flex items-center justify-center p-6 sm:p-8 lg:p-12"
      onClick={onClose}
    >
      {/* 背景遮罩 - 增强模糊效果 */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-md" 
      />

      {/* 详情卡片 - 全新设计 */}
      <motion.div
        initial={{ scale: 0.8, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, y: 50, opacity: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20 
        }}
        onClick={(e) => e.stopPropagation()}
        className="relative glass-card rounded-3xl border-2 w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto max-h-[90vh] overflow-hidden"
        style={{
          borderColor: planet.color + '80',
          boxShadow: `0 0 50px ${planet.color}40, 0 25px 50px -12px rgba(0, 0, 0, 0.5)`,
        }}
      >
        {/* 顶部装饰条 */}
        <div 
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: `linear-gradient(90deg, transparent, ${planet.color}, transparent)`,
          }}
        />

        {/* 扫描线效果 */}
        <div className="absolute inset-0 scan-line opacity-20 pointer-events-none" />

        {/* 滚动容器 */}
        <div className="overflow-y-auto max-h-[90vh] custom-scrollbar">
          {/* 头部区域 */}
          <div className="relative p-6 sm:p-8 lg:p-10 pb-6 sm:pb-8">
            {/* 背景装饰 */}
            <div 
              className="absolute top-0 left-0 right-0 h-48 opacity-10"
              style={{
                background: `radial-gradient(circle at top, ${planet.color}, transparent)`,
              }}
            />

            {/* 关闭按钮 */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-8 right-8 z-10 w-12 h-12 rounded-full glass-card border border-foreground/20 hover:border-neon-blue/80 flex items-center justify-center transition-all group"
            >
              <X className="w-5 h-5 text-foreground/60 group-hover:text-neon-blue transition-colors" />
            </motion.button>

            {/* 星球信息 */}
            <div className="relative flex items-start gap-8 mb-12">
              {/* 星球图标 */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="relative"
              >
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center relative overflow-hidden group"
                  style={{
                    backgroundColor: planet.color + '20',
                    boxShadow: `0 0 40px ${planet.color}60`,
                  }}
                >
                  <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${planet.color}, transparent)`,
                    }}
                  />
                  <Rocket className="w-12 h-12 relative z-10 text-white drop-shadow-lg" />
                  
                  {/* 脉冲效果 */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0, 0.5]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 rounded-2xl"
                    style={{ border: `2px solid ${planet.color}` }}
                  />
                </div>
              </motion.div>

              {/* 标题和状态 */}
              <div className="flex-1 pt-2">
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="font-display text-4xl font-bold mb-4 leading-tight"
                >
                  <span 
                    className="text-transparent bg-clip-text"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${planet.color}, #ffffff)`,
                    }}
                  >
                    {planet.name}
                  </span>
                </motion.h2>
                
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-4 flex-wrap"
                >
                  <span className="text-foreground/70 text-lg font-medium">
                    {planet.category}
                  </span>
                  
                  {/* 状态徽章 */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold border-2 ${status.color} ${status.bg} ${status.border} flex items-center gap-2`}
                  >
                    <StatusIcon className="w-4 h-4" />
                    {status.label}
                  </motion.div>
                </motion.div>
              </div>
            </div>

            {/* 快速统计 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6"
            >
              <div className="glass-card p-6 rounded-xl border border-neon-blue/30 hover:border-neon-blue/60 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-neon-blue/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Eye className="w-6 h-6 text-neon-blue" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-neon-blue mb-1">0</div>
                    <div className="text-xs text-foreground/50">访问量</div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-xl border border-neon-green/30 hover:border-neon-green/60 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-neon-green/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Heart className={`w-6 h-6 text-neon-green ${isLiked ? 'fill-neon-green' : ''}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-neon-green mb-1">0</div>
                    <div className="text-xs text-foreground/50">点赞数</div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-xl border border-neon-purple/30 hover:border-neon-purple/60 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-neon-purple/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6 text-neon-purple" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-neon-purple mb-1">0</div>
                    <div className="text-xs text-foreground/50">使用次数</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 内容区域 */}
          <div className="px-6 sm:px-8 lg:px-10 pb-8 sm:pb-10 space-y-8 sm:space-y-10">
            {/* 分隔线 */}
            <div className="relative h-px">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
            </div>

            {/* 项目简介 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-lg font-display font-semibold text-foreground mb-6 flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-neon-blue to-neon-purple rounded-full" />
                项目简介
              </h3>
              <p className="text-foreground/80 leading-relaxed text-base pl-6">
                {planet.description}
              </p>
            </motion.div>

            {/* 技术标签 */}
            {planet.tags && planet.tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <h3 className="text-lg font-display font-semibold text-foreground mb-6 flex items-center gap-3">
                  <div className="w-1 h-6 bg-gradient-to-b from-neon-purple to-neon-green rounded-full" />
                  <Tag className="w-5 h-5 text-neon-purple" />
                  技术栈
                </h3>
                <div className="flex flex-wrap gap-4 pl-6">
                  {planet.tags.map((tag, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + index * 0.05 }}
                      whileHover={{ scale: 1.1, y: -2 }}
                      className="px-5 py-2.5 rounded-lg text-sm font-medium border-2 border-neon-purple/40 text-neon-purple bg-neon-purple/10 hover:bg-neon-purple/20 hover:border-neon-purple/60 transition-all cursor-pointer"
                    >
                      #{tag}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 项目时间线（示例） */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="glass-card p-6 rounded-xl border border-foreground/10"
            >
              <div className="flex items-center gap-8 text-sm text-foreground/60">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4" />
                  <span>创建于: 2024-01-15</span>
                </div>
                <div className="w-px h-4 bg-foreground/20" />
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4" />
                  <span>更新于: 2024-10-17</span>
                </div>
              </div>
            </motion.div>

            {/* 操作按钮 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4"
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 relative group overflow-hidden rounded-xl py-4 px-6 font-semibold transition-all"
                style={{
                  background: `linear-gradient(135deg, ${planet.color}40, ${planet.color}20)`,
                  border: `2px solid ${planet.color}60`,
                  boxShadow: `0 0 20px ${planet.color}40`,
                }}
              >
                <div className="relative z-10 flex items-center justify-center gap-2.5 text-white">
                  <ExternalLink className="w-5 h-5" />
                  <span>访问项目</span>
                </div>
                <div 
                  className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${planet.color}, ${planet.color}80)`,
                  }}
                />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 glass-card border-2 border-foreground/20 hover:border-neon-blue/60 px-6 py-4 rounded-xl transition-all flex items-center justify-center gap-2.5 font-semibold group"
              >
                <Github className="w-5 h-5 group-hover:text-neon-blue transition-colors" />
                <span className="group-hover:text-neon-blue transition-colors">查看源码</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsLiked(!isLiked)}
                className={`glass-card border-2 px-6 py-4 rounded-xl transition-all ${
                  isLiked 
                    ? 'border-neon-green/60 bg-neon-green/20' 
                    : 'border-foreground/20 hover:border-neon-green/60'
                }`}
              >
                <Heart className={`w-5 h-5 transition-all ${
                  isLiked 
                    ? 'fill-neon-green text-neon-green' 
                    : 'text-foreground/60'
                }`} />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
