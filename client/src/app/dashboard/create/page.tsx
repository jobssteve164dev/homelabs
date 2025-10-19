'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Eye, Home, Star, Plus } from 'lucide-react';
import Link from 'next/link';

const categories = [
  '文本处理',
  '图像处理',
  '语音处理',
  '开发工具',
  '数据分析',
  '对话系统',
  '机器学习',
  '其他'
];

export default function CreateProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    demoUrl: '',
    githubUrl: '',
    imageUrl: ''
  });

  // 重定向未登录用户
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tags
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/dashboard');
      } else {
        alert(data.error || '创建失败');
      }
    } catch (error) {
      console.error('创建项目失败:', error);
      alert('创建失败');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-sci-darker">
      {/* 顶部导航栏 */}
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
                <span className="text-sm font-medium">返回项目</span>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            创建新项目
          </h1>
          <p className="text-foreground/60">为您的AI工具创建一个新的星球</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 表单 */}
          <div className="lg:col-span-2">
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              onSubmit={handleSubmit}
              className="bg-sci-dark/80 backdrop-blur-sm border border-neon-blue/30 rounded-xl p-8"
            >
              <div className="space-y-6">
                {/* 项目标题 */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                    项目标题 *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-sci-darker border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-colors text-foreground placeholder-foreground/50"
                    placeholder="输入项目名称"
                    required
                  />
                </div>

                {/* 项目描述 */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                    项目描述 *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-sci-darker border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-colors text-foreground placeholder-foreground/50 resize-none"
                    placeholder="详细描述您的AI工具功能和特点"
                    required
                  />
                </div>

                {/* 分类 */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
                    分类 *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-sci-darker border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-colors text-foreground"
                    required
                  >
                    <option value="">选择分类</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* 标签 */}
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-foreground mb-2">
                    标签
                  </label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-sci-darker border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-colors text-foreground placeholder-foreground/50"
                    placeholder="用逗号分隔多个标签，如：AI, 文本生成, GPT"
                  />
                  <p className="text-xs text-foreground/50 mt-1">用逗号分隔多个标签</p>
                </div>

                {/* 演示链接 */}
                <div>
                  <label htmlFor="demoUrl" className="block text-sm font-medium text-foreground mb-2">
                    演示链接
                  </label>
                  <input
                    type="url"
                    id="demoUrl"
                    name="demoUrl"
                    value={formData.demoUrl}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-sci-darker border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-colors text-foreground placeholder-foreground/50"
                    placeholder="https://demo.example.com"
                  />
                </div>

                {/* GitHub链接 */}
                <div>
                  <label htmlFor="githubUrl" className="block text-sm font-medium text-foreground mb-2">
                    GitHub链接
                  </label>
                  <input
                    type="url"
                    id="githubUrl"
                    name="githubUrl"
                    value={formData.githubUrl}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-sci-darker border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-colors text-foreground placeholder-foreground/50"
                    placeholder="https://github.com/username/repo"
                  />
                </div>

                {/* 图片链接 */}
                <div>
                  <label htmlFor="imageUrl" className="block text-sm font-medium text-foreground mb-2">
                    项目图片
                  </label>
                  <input
                    type="url"
                    id="imageUrl"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-sci-darker border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-colors text-foreground placeholder-foreground/50"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {/* 提交按钮 */}
                <div className="flex space-x-4 pt-6">
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-medium rounded-lg hover:shadow-glow-blue transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? '创建中...' : '创建项目'}
                  </motion.button>
                  
                  <Link
                    href="/dashboard"
                    className="px-6 py-3 bg-sci-darker border border-foreground/20 text-foreground rounded-lg hover:bg-foreground/5 transition-colors"
                  >
                    取消
                  </Link>
                </div>
              </div>
            </motion.form>
          </div>

          {/* 预览面板 */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="bg-sci-dark/80 backdrop-blur-sm border border-neon-blue/30 rounded-xl p-6 sticky top-8"
            >
              <div className="flex items-center mb-4">
                <Eye className="w-4 h-4 mr-2 text-neon-blue" />
                <h3 className="text-lg font-semibold text-foreground">预览</h3>
              </div>

              <div className="space-y-4">
                {formData.title ? (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">标题</h4>
                    <p className="text-sm text-foreground/70">{formData.title}</p>
                  </div>
                ) : null}

                {formData.category ? (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">分类</h4>
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-neon-blue/20 text-neon-blue rounded-full">
                      {formData.category}
                    </span>
                  </div>
                ) : null}

                {formData.description ? (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">描述</h4>
                    <p className="text-sm text-foreground/70 line-clamp-3">{formData.description}</p>
                  </div>
                ) : null}

                {formData.tags ? (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">标签</h4>
                    <div className="flex flex-wrap gap-1">
                      {formData.tags.split(',').map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-sci-darker text-foreground/60 rounded"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {!formData.title && !formData.category && !formData.description && !formData.tags && (
                  <p className="text-sm text-foreground/50 text-center py-8">
                    填写表单内容以查看预览
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
