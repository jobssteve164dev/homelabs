'use client';

import { motion } from 'framer-motion';
import { Rocket, Zap, Globe } from 'lucide-react';

interface UniverseHUDProps {
  totalPlanets: number;
  activePlanets: number;
}

export function UniverseHUD({ totalPlanets, activePlanets }: UniverseHUDProps) {
  return (
    <>
      {/* 左上角 Logo */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-4 left-4 md:top-6 md:left-6 z-10"
      >
        <div className="glass-card px-6 py-3 rounded-full border border-neon-blue/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-neon-blue">
                AI宇宙
              </h1>
              <p className="text-xs text-foreground/60">
                My AI Universe
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 右上角统计信息 */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-4 right-4 md:top-6 md:right-6 z-10"
      >
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="glass-card px-4 py-2 rounded-lg border border-neon-blue/30"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-neon-blue" />
              <div className="text-sm">
                <span className="text-foreground/60">星球总数: </span>
                <span className="text-neon-blue font-bold">{totalPlanets}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="glass-card px-4 py-2 rounded-lg border border-neon-green/30"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-neon-green" />
              <div className="text-sm">
                <span className="text-foreground/60">活跃: </span>
                <span className="text-neon-green font-bold">{activePlanets}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* 底部操作提示 - 独立定位 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-10 glass-card px-5 py-2.5 rounded-full border border-neon-purple/20 backdrop-blur-sm pointer-events-none"
      >
        <div className="flex items-center gap-6 text-xs text-foreground/60">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-neon-blue/60" />
            <span>拖拽旋转</span>
          </div>
          <div className="w-px h-3 bg-foreground/10" />
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-neon-purple/60" />
            <span>滚轮缩放</span>
          </div>
          <div className="w-px h-3 bg-foreground/10" />
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-neon-green/60" />
            <span>点击星球</span>
          </div>
        </div>
      </motion.div>
    </>
  );
}
