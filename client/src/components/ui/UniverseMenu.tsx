'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { AuthSession } from '@/types/auth';

export function UniverseMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession() as { data: AuthSession | null };
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
    setIsOpen(false);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* AI宇宙按钮 */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-neon-blue/10 to-neon-purple/10 border border-neon-blue/30 hover:border-neon-purple/50 transition-all duration-300"
      >
        {/* 火箭图标 */}
        <svg
          className="w-5 h-5 text-neon-blue"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
        
        <div className="flex flex-col items-start">
          <span className="text-xs font-medium text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple">
            AI宇宙
          </span>
          <span className="text-[10px] text-foreground/60">
            My AI Universe
          </span>
        </div>

        {/* 下拉箭头 */}
        <motion.svg
          className="w-4 h-4 text-foreground/60"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </motion.svg>
      </motion.button>

      {/* 下拉菜单 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 top-full mt-2 w-72 rounded-xl bg-sci-dark/95 backdrop-blur-xl border border-neon-blue/30 shadow-2xl shadow-neon-blue/20 overflow-hidden"
          >
            {session ? (
              // 已登录状态
              <div className="p-2">
                {/* 用户信息 */}
                <div className="px-4 py-3 mb-2 rounded-lg bg-gradient-to-r from-neon-blue/10 to-neon-purple/10 border border-neon-blue/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple flex items-center justify-center">
                      <span className="text-white font-bold">
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
                      onClick={() => { setShowEdit(true); setIsOpen(false); setName(session.user?.name || ''); setCurrentPassword(''); setNewPassword(''); setMessage(null); }}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-neon-blue/10 border-2 border-neon-blue/60 text-neon-blue hover:bg-neon-blue/20 hover:border-neon-blue hover:scale-110 transition-all shadow-sm shadow-neon-blue/20"
                      title="编辑账户信息"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 菜单项 */}
                <div className="space-y-1">
                  <MenuItem
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    }
                    label="探索宇宙"
                    onClick={() => handleNavigation('/')}
                  />

                  <MenuItem
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    }
                    label="我的项目"
                    onClick={() => handleNavigation('/dashboard')}
                  />

                  <MenuItem
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    }
                    label="创建项目"
                    onClick={() => handleNavigation('/dashboard/create')}
                  />

                  {session.user?.role === 'ADMIN' && (
                    <MenuItem
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      }
                      label="管理后台"
                      onClick={() => handleNavigation('/admin')}
                      highlight
                    />
                  )}

                  <div className="my-2 border-t border-neon-blue/20" />

                  <MenuItem
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    }
                    label="退出登录"
                    onClick={handleSignOut}
                    danger
                  />
                </div>
              </div>
            ) : (
              // 未登录状态
              <div className="p-2">
                <div className="px-4 py-3 mb-2 text-center">
                  <p className="text-sm text-foreground/80 mb-1">
                    欢迎来到 AI 宇宙
                  </p>
                  <p className="text-xs text-foreground/60">
                    登录以探索更多功能
                  </p>
                </div>

                <div className="space-y-1">
                  <MenuItem
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                    }
                    label="登录"
                    onClick={() => handleNavigation('/auth/signin')}
                  />

                  <MenuItem
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    }
                    label="注册"
                    onClick={() => handleNavigation('/auth/signup')}
                    highlight
                  />

                  <div className="my-2 border-t border-neon-blue/20" />

                  <MenuItem
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    }
                    label="探索宇宙"
                    onClick={() => handleNavigation('/')}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 编辑资料/修改密码对话框 */}
      <AnimatePresence>
        {showEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
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
    </div>
  );
}

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
      whileHover={{ x: 4 }}
      className={`
        w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg
        transition-all duration-200
        ${
          highlight
            ? 'bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30 text-neon-blue hover:border-neon-purple/50'
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

