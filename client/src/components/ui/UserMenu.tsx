'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { User, Settings, LogOut, Plus, List, Shield, Pencil } from 'lucide-react';
import { AuthSession } from '@/types/auth';

export function UserMenu() {
  const { data: session, status } = useSession() as { data: AuthSession | null; status: string };
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
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
              <div className="flex items-start justify-between">
                <div className="flex-1">
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
                <button
                  aria-label="编辑账户"
                  onClick={() => { setShowEdit(true); setIsOpen(false); setName(session.user?.name || ''); setCurrentPassword(''); setNewPassword(''); setMessage(null); }}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-neon-blue/10 border-2 border-neon-blue/60 text-neon-blue hover:bg-neon-blue/20 hover:border-neon-blue hover:scale-110 transition-all shadow-sm shadow-neon-blue/20"
                  title="编辑账户信息"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
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
                      placeholder="新密码（至少8位，含大小写和数字）"
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
                      // 更新昵称（如果填写且变更）
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
