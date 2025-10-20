'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, ExternalLink, Github, Home, ArrowLeft, Star } from 'lucide-react';
import { logClientError } from '@/lib/clientLogger';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  demoUrl?: string;
  githubUrl?: string;
  imageUrl?: string;
  isActive: boolean;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // 重定向未登录用户
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // 获取项目列表
  useEffect(() => {
    if (session) {
      fetchProjects();
    }
  }, [session]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      }
    } catch (error) {
      logClientError('获取项目列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProjects(projects.filter(p => p.id !== projectId));
        setShowDeleteConfirm(null);
      } else {
        alert('删除失败');
      }
    } catch (error) {
      logClientError('删除项目失败', error);
      alert('删除失败');
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || project.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(projects.map(p => p.category))];

  if (status === 'loading' || loading) {
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
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-blue/10 border border-neon-blue/30 text-neon-blue hover:bg-neon-blue/20 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">返回首页</span>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            我的AI项目
          </h1>
          <p className="text-foreground/60">管理和探索您的AI工具项目</p>
        </div>

        {/* 操作栏 - 仅在有项目时显示 */}
        {filteredProjects.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 flex gap-4">
              {/* 搜索框 */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/40 w-4 h-4" />
                <input
                  type="text"
                  placeholder="搜索项目..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-sci-dark border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-colors text-foreground placeholder-foreground/50"
                />
              </div>

              {/* 分类筛选 */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 bg-sci-dark border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-colors text-foreground"
              >
                <option value="">所有分类</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* 项目网格 */}
        {filteredProjects.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-sci-dark/50 backdrop-blur-sm border border-neon-blue/30 rounded-2xl p-12">
              {/* 空状态图标 */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  {/* 外圈光晕效果 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 rounded-full blur-xl"></div>
                  {/* 主图标 */}
                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-sci-dark to-sci-darker border-2 border-neon-blue/40 flex items-center justify-center">
                    <svg 
                      className="w-16 h-16 text-neon-blue" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={1.5} 
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* 文案区域 */}
              <div className="text-center space-y-3 mb-8">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                  开启您的AI之旅
                </h3>
                <p className="text-foreground/70 text-lg">
                  在宇宙中还没有属于您的星球
                </p>
                <p className="text-foreground/50 text-sm max-w-md mx-auto">
                  创建第一个AI项目，让它成为浩瀚星系中闪耀的新星✨
                </p>
              </div>

              {/* 提示卡片 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-sci-darker/50 border border-neon-blue/20 rounded-lg p-4 text-center">
                  <div className="text-neon-blue text-2xl mb-2">🌟</div>
                  <div className="text-sm text-foreground/70">展示您的AI工具</div>
                </div>
                <div className="bg-sci-darker/50 border border-neon-purple/20 rounded-lg p-4 text-center">
                  <div className="text-neon-purple text-2xl mb-2">🚀</div>
                  <div className="text-sm text-foreground/70">与社区分享创意</div>
                </div>
                <div className="bg-sci-darker/50 border border-neon-blue/20 rounded-lg p-4 text-center">
                  <div className="text-neon-blue text-2xl mb-2">💫</div>
                  <div className="text-sm text-foreground/70">探索无限可能</div>
                </div>
              </div>

              {/* 行动提示 */}
              <div className="text-center">
                <p className="text-foreground/50 text-sm mb-4">
                  点击右上角的 <span className="text-neon-blue font-medium">&ldquo;创建项目&rdquo;</span> 按钮开始
                </p>
                <div className="inline-flex items-center gap-2 text-neon-blue/60 text-xs">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span>您也可以先访问 &ldquo;我的星系&rdquo; 完善个人介绍</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-sci-dark/80 backdrop-blur-sm border border-neon-blue/30 rounded-xl p-6 hover:border-neon-blue/50 transition-all duration-300 group"
              >
                {/* 项目头部 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-neon-blue transition-colors">
                      {project.title}
                    </h3>
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-neon-blue/20 text-neon-blue rounded-full">
                      {project.category}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/dashboard/edit/${project.id}`}
                      className="p-1 text-foreground/60 hover:text-neon-blue transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setShowDeleteConfirm(project.id)}
                      className="p-1 text-foreground/60 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 项目描述 */}
                <p className="text-foreground/70 text-sm mb-4 line-clamp-3">
                  {project.description}
                </p>

                {/* 标签 */}
                {project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {project.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 text-xs bg-sci-darker text-foreground/60 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {project.tags.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-sci-darker text-foreground/40 rounded">
                        +{project.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* 项目链接 */}
                <div className="flex items-center space-x-3 mb-4">
                  {project.demoUrl && (
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-neon-blue hover:text-neon-purple transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      演示
                    </a>
                  )}
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-foreground/60 hover:text-foreground transition-colors"
                    >
                      <Github className="w-3 h-3 mr-1" />
                      代码
                    </a>
                  )}
                </div>

                {/* 项目统计 */}
                <div className="flex items-center justify-between text-xs text-foreground/50">
                  <span>{project.viewCount} 次查看</span>
                  <span>{project.likeCount} 个赞</span>
                  <span className={project.isActive ? 'text-green-400' : 'text-yellow-400'}>
                    {project.isActive ? '活跃' : '暂停'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* 删除确认对话框 */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-sci-darker/95 backdrop-blur-xl border-2 border-red-500/50 rounded-xl p-8 max-w-md mx-4 shadow-2xl shadow-red-500/20"
              >
                <h3 className="text-xl font-bold text-white mb-3">确认删除</h3>
                <p className="text-white/90 text-base mb-8">此操作无法撤销，确定要删除这个项目吗？</p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 px-5 py-3 bg-white/10 border border-white/30 text-white rounded-lg hover:bg-white/20 transition-all font-semibold"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => handleDelete(showDeleteConfirm)}
                    className="flex-1 px-5 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/30 transition-all font-semibold"
                  >
                    删除
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
