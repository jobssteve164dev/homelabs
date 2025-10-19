'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Eye } from 'lucide-react';
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
}

export default function EditProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [, setProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    demoUrl: '',
    githubUrl: '',
    imageUrl: '',
    isActive: true
  });

  // 重定向未登录用户
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
        setFormData({
          title: data.project.title,
          description: data.project.description,
          category: data.project.category,
          tags: data.project.tags.join(', '),
          demoUrl: data.project.demoUrl || '',
          githubUrl: data.project.githubUrl || '',
          imageUrl: data.project.imageUrl || '',
          isActive: data.project.isActive
        });
      } else {
        alert('项目不存在或无权限访问');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('获取项目失败:', error);
      alert('获取项目失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取项目数据
  useEffect(() => {
    if (session && projectId) {
      fetchProject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, projectId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
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
        alert(data.error || '更新失败');
      }
    } catch (error) {
      console.error('更新项目失败:', error);
      alert('更新失败');
    } finally {
      setSaving(false);
    }
  };

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面头部 */}
        <div className="flex items-center mb-8">
          <Link
            href="/dashboard"
            className="flex items-center text-foreground/60 hover:text-neon-blue transition-colors mr-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple">
              编辑项目
            </h1>
            <p className="text-foreground/60">修改您的AI工具项目信息</p>
          </div>
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

                {/* 项目状态 */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-4 h-4 text-neon-blue bg-sci-darker border-neon-blue/30 rounded focus:ring-neon-blue/50 focus:ring-2"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-foreground">
                    项目活跃状态
                  </label>
                </div>

                {/* 提交按钮 */}
                <div className="flex space-x-4 pt-6">
                  <motion.button
                    type="submit"
                    disabled={saving}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-medium rounded-lg hover:shadow-glow-blue transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? '保存中...' : '保存更改'}
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

                <div>
                  <h4 className="text-sm font-medium text-foreground mb-1">状态</h4>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    formData.isActive 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {formData.isActive ? '活跃' : '暂停'}
                  </span>
                </div>

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
