'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // 开发环境自动登录
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // 自动填充测试账号
      setEmail('admin@homelabs.com');
      setPassword('admin123');
      
      // 1秒后自动登录
      const timer = setTimeout(async () => {
        setIsLoading(true);
        try {
          const result = await signIn('credentials', {
            email: 'admin@homelabs.com',
            password: 'admin123',
            redirect: false,
          });

          if (!result?.error) {
            router.push('/');
            router.refresh();
          }
        } catch (err) {
          console.error('自动登录失败:', err);
        } finally {
          setIsLoading(false);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('邮箱或密码错误');
      } else {
        // 登录成功，跳转到首页
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sci-darker relative">
      {/* 科幻背景效果 */}
      <div className="fixed inset-0 grid-bg opacity-20" />
      <div className="fixed inset-0 particles" />
      
      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-sci-dark/80 backdrop-blur-sm border border-neon-blue/30 rounded-2xl p-8 shadow-glow-blue"
        >
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple mb-2"
            >
              登录AI宇宙
            </motion.h1>
            <p className="text-foreground/60">探索无限可能的AI工具世界</p>
            {process.env.NODE_ENV === 'development' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-4 p-2 bg-neon-blue/10 border border-neon-blue/30 rounded-lg text-xs text-neon-blue"
              >
                🚀 开发模式：自动登录中...
              </motion.div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                邮箱地址
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-sci-darker border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-colors text-foreground placeholder-foreground/50"
                placeholder="输入您的邮箱"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-sci-darker border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-colors text-foreground placeholder-foreground/50"
                placeholder="输入您的密码"
                required
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-medium rounded-lg hover:shadow-glow-blue transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '登录中...' : '登录'}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-foreground/60">
              还没有账户？{' '}
              <Link 
                href="/auth/signup" 
                className="text-neon-blue hover:text-neon-purple transition-colors"
              >
                立即注册
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
