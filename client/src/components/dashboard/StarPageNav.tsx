'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Home, Star, Plus } from 'lucide-react';

export function StarPageNav() {
  return (
    <div className="border-b border-neon-blue/20 bg-sci-dark/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 返回按钮 */}
          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-blue/10 border border-neon-blue/30 text-neon-blue hover:bg-neon-blue/20 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">返回闭星</span>
            </motion.button>
          </Link>

          {/* 右侧导航 */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard/star">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-500 hover:border-orange-500/50 transition-all"
              >
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium">我的星系</span>
              </motion.button>
            </Link>
            <Link href="/dashboard/create">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30 text-neon-blue hover:border-neon-purple/50 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">创建项目</span>
              </motion.button>
            </Link>
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-foreground/80 hover:text-neon-blue transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="text-sm">探索宇宙</span>
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

