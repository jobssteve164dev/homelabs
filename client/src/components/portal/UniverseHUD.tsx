'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Zap, Globe, LogIn, UserPlus, Home, FolderKanban, PlusCircle, Settings, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { AuthSession } from '@/types/auth';
import { PopularPlanetsModal } from './PopularPlanetsModal';

interface UniverseHUDProps {
  totalPlanets: number;
  activePlanets: number;
  onNavigateToPlanet?: (galaxyCenter: { x: number; y: number; z: number }) => void;
}

export function UniverseHUD({ totalPlanets, activePlanets, onNavigateToPlanet }: UniverseHUDProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showPopularPlanets, setShowPopularPlanets] = useState(false);
  const { data: session } = useSession() as { data: AuthSession | null };
  const router = useRouter();
  const logoRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (logoRef.current && !logoRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // 处理右键点击
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  // 处理导航
  const handleNavigation = (path: string) => {
    router.push(path);
    setShowMenu(false);
  };

  // 处理登出
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
    setShowMenu(false);
  };

  return (
    <>
      {/* 左上角 Logo - 可右键弹出菜单 */}
      <motion.div
        ref={logoRef}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-4 left-4 md:top-6 md:left-6 z-10"
        onContextMenu={handleContextMenu}
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="glass-card px-6 py-3 rounded-full border border-neon-blue/30 cursor-pointer"
        >
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
        </motion.div>
      </motion.div>

      {/* 右键菜单 */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50"
            style={{
              left: `${menuPosition.x}px`,
              top: `${menuPosition.y}px`,
            }}
          >
            <div className="glass-card border border-neon-blue/40 rounded-xl p-2 min-w-[240px] shadow-2xl shadow-neon-blue/20">
              {session ? (
                // 已登录状态
                <div className="space-y-1">
                  {/* 用户信息 */}
                  <div className="px-3 py-2 mb-2 border-b border-neon-blue/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {session.user?.name || '用户'}
                        </p>
                        <p className="text-xs text-foreground/60 truncate">
                          {session.user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 菜单项 */}
                  <MenuItem
                    icon={<Home className="w-4 h-4" />}
                    label="探索宇宙"
                    onClick={() => handleNavigation('/')}
                  />
                  <MenuItem
                    icon={<FolderKanban className="w-4 h-4" />}
                    label="我的项目"
                    onClick={() => handleNavigation('/dashboard')}
                  />
                  <MenuItem
                    icon={<PlusCircle className="w-4 h-4" />}
                    label="创建项目"
                    onClick={() => handleNavigation('/dashboard/create')}
                  />
                  
                  {session.user?.role === 'ADMIN' && (
                    <>
                      <div className="my-1 border-t border-neon-purple/20" />
                      <MenuItem
                        icon={<Settings className="w-4 h-4" />}
                        label="管理后台"
                        onClick={() => handleNavigation('/admin')}
                        highlight
                      />
                    </>
                  )}

                  <div className="my-1 border-t border-neon-blue/20" />
                  <MenuItem
                    icon={<LogOut className="w-4 h-4" />}
                    label="退出登录"
                    onClick={handleSignOut}
                    danger
                  />
                </div>
              ) : (
                // 未登录状态
                <div className="space-y-1">
                  <div className="px-3 py-2 mb-2 text-center border-b border-neon-blue/20">
                    <p className="text-sm text-foreground/80">
                      欢迎来到 AI 宇宙
                    </p>
                    <p className="text-xs text-foreground/60">
                      登录以探索更多功能
                    </p>
                  </div>

                  <MenuItem
                    icon={<LogIn className="w-4 h-4" />}
                    label="登录"
                    onClick={() => handleNavigation('/auth/signin')}
                  />
                  <MenuItem
                    icon={<UserPlus className="w-4 h-4" />}
                    label="注册"
                    onClick={() => handleNavigation('/auth/signup')}
                    highlight
                  />

                  <div className="my-1 border-t border-neon-blue/20" />
                  <MenuItem
                    icon={<Home className="w-4 h-4" />}
                    label="探索宇宙"
                    onClick={() => handleNavigation('/')}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 右上角统计信息 */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-4 right-4 md:top-6 md:right-6 z-10"
      >
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowPopularPlanets(true)}
            className="glass-card px-4 py-2 rounded-lg border border-neon-blue/30 hover:border-neon-blue/50 transition-all duration-200 cursor-pointer group"
            title="点击查看热门星球排行榜"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-neon-blue group-hover:text-neon-purple transition-colors" />
              <div className="text-sm">
                <span className="text-foreground/60">星球总数: </span>
                <span className="text-neon-blue font-bold group-hover:text-neon-purple transition-colors">{totalPlanets}</span>
              </div>
            </div>
          </motion.button>

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

      {/* 热门星球排行榜模态框 */}
      <PopularPlanetsModal
        isOpen={showPopularPlanets}
        onClose={() => setShowPopularPlanets(false)}
        onNavigateToPlanet={onNavigateToPlanet || (() => {})}
      />
    </>
  );
}

// 菜单项组件
interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  highlight?: boolean;
  danger?: boolean;
}

function MenuItem({ icon, label, onClick, highlight, danger }: MenuItemProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 2 }}
      className={`
        w-full flex items-center gap-3 px-3 py-2 rounded-lg
        transition-all duration-200 text-left
        ${
          highlight
            ? 'bg-gradient-to-r from-neon-blue/10 to-neon-purple/10 border border-neon-blue/30 text-neon-blue hover:border-neon-purple/50'
            : danger
            ? 'hover:bg-red-500/10 text-red-400 hover:text-red-300'
            : 'hover:bg-neon-blue/10 text-foreground hover:text-neon-blue'
        }
      `}
    >
      <div className={`
        ${highlight ? 'text-neon-purple' : danger ? 'text-red-400' : 'text-foreground/60'}
      `}>
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </motion.button>
  );
}
