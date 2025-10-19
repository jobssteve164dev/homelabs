'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // 验证密码匹配
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      setIsLoading(false);
      return;
    }

    // 验证密码强度
    if (formData.password.length < 6) {
      setError('密码长度至少6位');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // 注册成功，跳转到登录页面
        router.push('/auth/signin?message=注册成功，请登录');
      } else {
        setError(data.error || '注册失败');
      }
    } catch {
      setError('网络错误，请重试');
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
              加入AI宇宙
            </motion.h1>
            <p className="text-foreground/60">开启您的AI工具探索之旅</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                姓名
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-sci-darker border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-colors text-foreground placeholder-foreground/50"
                placeholder="输入您的姓名"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                邮箱地址
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
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
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-sci-darker border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-colors text-foreground placeholder-foreground/50"
                placeholder="至少6位字符"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                确认密码
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-sci-darker border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-colors text-foreground placeholder-foreground/50"
                placeholder="再次输入密码"
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
              {isLoading ? '注册中...' : '注册'}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-foreground/60">
              已有账户？{' '}
              <Link 
                href="/auth/signin" 
                className="text-neon-blue hover:text-neon-purple transition-colors"
              >
                立即登录
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
