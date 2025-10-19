'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { User, Settings, LogOut, Plus, List, Shield } from 'lucide-react';
import { AuthSession } from '@/types/auth';

export function UserMenu() {
  const { data: session, status } = useSession() as { data: AuthSession | null; status: string };
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  if (status === 'loading') {
    return (
      <div className="w-10 h-10 rounded-full bg-sci-dark border border-neon-blue/30 animate-pulse" />
    );
  }

  if (!session) {
    return (
      <div className="flex items-center space-x-4">
        <Link
          href="/auth/signin"
          className="px-4 py-2 text-sm font-medium text-foreground hover:text-neon-blue transition-colors"
        >
          登录
        </Link>
        <Link
          href="/auth/signup"
          className="px-4 py-2 bg-gradient-to-r from-neon-blue to-neon-purple text-white text-sm font-medium rounded-lg hover:shadow-glow-blue transition-all duration-300"
        >
          注册
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* 用户头像按钮 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple flex items-center justify-center text-white font-medium shadow-glow-blue hover:shadow-glow-purple transition-all duration-300"
      >
        {session.user?.name?.charAt(0).toUpperCase() || 'U'}
      </motion.button>

      {/* 下拉菜单 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-64 bg-sci-dark/95 backdrop-blur-sm border border-neon-blue/30 rounded-xl shadow-glow-blue overflow-hidden z-50"
          >
            {/* 用户信息 */}
            <div className="px-4 py-3 border-b border-neon-blue/20">
              <p className="text-sm font-medium text-foreground">
                {session.user?.name || '用户'}
              </p>
              <p className="text-xs text-foreground/60">
                {session.user?.email}
              </p>
              {session.user?.role === 'ADMIN' && (
                <span className="inline-flex items-center px-2 py-1 mt-1 text-xs font-medium bg-neon-purple/20 text-neon-purple rounded-full">
                  <Shield className="w-3 h-3 mr-1" />
                  管理员
                </span>
              )}
            </div>

            {/* 菜单项 */}
            <div className="py-2">
              <Link
                href="/dashboard"
                className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-neon-blue/10 hover:text-neon-blue transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <List className="w-4 h-4 mr-3" />
                我的项目
              </Link>
              
              <Link
                href="/dashboard/create"
                className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-neon-blue/10 hover:text-neon-blue transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Plus className="w-4 h-4 mr-3" />
                创建项目
              </Link>

              {session.user?.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-neon-blue/10 hover:text-neon-blue transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Shield className="w-4 h-4 mr-3" />
                  管理后台
                </Link>
              )}

              <Link
                href="/profile"
                className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-neon-blue/10 hover:text-neon-blue transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <User className="w-4 h-4 mr-3" />
                个人资料
              </Link>

              <Link
                href="/settings"
                className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-neon-blue/10 hover:text-neon-blue transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="w-4 h-4 mr-3" />
                设置
              </Link>

              <div className="border-t border-neon-blue/20 my-2" />

              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-3" />
                退出登录
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
