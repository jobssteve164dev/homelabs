'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Zap, Globe, LogIn, UserPlus, Home, FolderKanban, PlusCircle, Settings, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { AuthSession } from '@/types/auth';
import { PopularPlanetsList } from './PopularPlanetsList';

interface UniverseHUDProps {
  totalPlanets: number;
  activePlanets: number;
  onNavigateToPlanet?: (planetId: string, galaxyCenter: { x: number; y: number; z: number }) => void;
}

export function UniverseHUD({ totalPlanets, activePlanets, onNavigateToPlanet }: UniverseHUDProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showPopularPlanets, setShowPopularPlanets] = useState(false);
  const { data: session } = useSession() as { data: AuthSession | null };
  const router = useRouter();
  const logoRef = useRef<HTMLDivElement>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

  // 处理点击事件
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMenu(!showMenu);
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
      {/* 未登录用户提示横幅 */}
      {!session && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20 pointer-events-auto"
        >
          <div className="bg-sci-dark/60 backdrop-blur-sm border border-foreground/20 rounded-full px-6 py-3 shadow-lg">
            <div className="flex items-center gap-6">
              {/* 左侧文字 */}
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-foreground/80" />
                <span className="text-foreground/80 text-sm font-medium">
                  探索AI宇宙，创建您的星系
                </span>
              </div>
              
              {/* 分隔线 */}
              <div className="w-px h-4 bg-foreground/20"></div>
              
              {/* 右侧按钮组 */}
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNavigation('/auth/signin')}
                  className="px-4 py-2 bg-foreground/10 border border-foreground/30 text-foreground/80 text-sm font-medium rounded-lg hover:bg-foreground/20 hover:border-foreground/40 transition-all duration-200 flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  登录
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNavigation('/auth/signup')}
                  className="px-4 py-2 bg-transparent border border-foreground/30 text-foreground/80 text-sm font-medium rounded-lg hover:bg-foreground/10 hover:border-foreground/40 transition-all duration-200 flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  注册
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 左上角 Logo - 可点击弹出菜单 */}
      <motion.div
        ref={logoRef}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-4 left-4 md:top-6 md:left-6 z-10"
      >
        <div className="relative">
          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={handleClick}
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

          {/* 点击菜单 */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 top-full mt-2 z-50"
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
                      <button
                        aria-label="编辑账户"
                        onClick={(e) => { e.stopPropagation(); setShowEdit(true); setShowMenu(false); setName(session.user?.name || ''); setCurrentPassword(''); setNewPassword(''); setMessage(null); }}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-neon-blue/10 border-2 border-neon-blue/60 text-neon-blue hover:bg-neon-blue/20 hover:border-neon-blue hover:scale-110 transition-all shadow-sm shadow-neon-blue/20"
                        title="编辑账户信息"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
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
        </div>
      </motion.div>

      {/* 右上角统计信息 */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-4 right-4 md:top-6 md:right-6 z-10"
      >
        <div className="relative">
          <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowPopularPlanets(true)}
            className="glass-card px-6 py-3 rounded-full border border-neon-blue/30 hover:border-neon-blue/50 transition-all duration-200 cursor-pointer group"
            title="点击查看热门星球排行榜"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-neon-blue group-hover:text-neon-purple transition-colors" />
              <div className="text-sm">
                <span className="text-foreground/60">星球总数: </span>
                <span className="text-neon-blue font-bold group-hover:text-neon-purple transition-colors">{totalPlanets}</span>
              </div>
            </div>
          </motion.button>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="glass-card px-6 py-3 rounded-full border border-neon-green/30"
          >
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-neon-green" />
              <div className="text-sm">
                <span className="text-foreground/60">活跃: </span>
                <span className="text-neon-green font-bold">{activePlanets}</span>
              </div>
            </div>
          </motion.div>
          </div>
          
          {/* 热门星球排行榜列表 */}
          <PopularPlanetsList
            isOpen={showPopularPlanets}
            onClose={() => setShowPopularPlanets(false)}
            onNavigateToPlanet={onNavigateToPlanet || (() => {})}
          />
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

      {/* 编辑资料/修改密码对话框 */}
      <AnimatePresence>
        {showEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60"
            onClick={() => !saving && setShowEdit(false)}
          >
            <motion.div
              initial={{ scale: 0.97, y: 8, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.97, y: 8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-xl border border-neon-blue/30 bg-sci-dark p-5 shadow-glow-blue"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold text-foreground">账户设置</h3>
              <p className="text-xs text-foreground/60 mt-1">修改昵称或更新登录密码</p>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs text-foreground/70 mb-1">昵称</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="新的昵称"
                    className="w-full rounded-md bg-transparent border border-neon-blue/30 px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-foreground/70 mb-1">当前密码</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="当前密码"
                      className="w-full rounded-md bg-transparent border border-neon-blue/30 px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-foreground/70 mb-1">新密码</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="新密码（至少8位）"
                      className="w-full rounded-md bg-transparent border border-neon-blue/30 px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
                    />
                  </div>
                </div>
                {message && (
                  <div className="text-xs text-red-400">{message}</div>
                )}
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  disabled={saving}
                  onClick={() => setShowEdit(false)}
                  className="px-3 py-2 text-sm rounded-md border border-neon-blue/30 text-foreground hover:bg-foreground/5 disabled:opacity-60"
                >
                  取消
                </button>
                <button
                  disabled={saving}
                  onClick={async () => {
                    try {
                      setSaving(true);
                      setMessage(null);
                      if (name && name !== (session?.user?.name || '')) {
                        const r = await fetch('/api/auth/account', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ name }),
                        });
                        if (!r.ok) {
                          const d = await r.json().catch(() => ({}));
                          throw new Error(d?.error || '更新昵称失败');
                        }
                      }
                      if (newPassword) {
                        const res = await fetch('/api/auth/change-password', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ currentPassword, newPassword }),
                        });
                        if (!res.ok) {
                          const data = await res.json().catch(() => ({}));
                          throw new Error(data?.error || '修改密码失败');
                        }
                      }
                      setShowEdit(false);
                      window.location.reload();
                    } catch (e) {
                      setMessage(e instanceof Error ? e.message : '保存失败');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="px-3 py-2 text-sm rounded-md bg-gradient-to-r from-neon-blue to-neon-purple text-white hover:shadow-glow-blue disabled:opacity-60"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
