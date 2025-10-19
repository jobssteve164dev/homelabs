'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Users, FolderOpen, BarChart3, Settings, Eye, Edit, Trash2, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

interface ExtendedSession {
  user: ExtendedUser;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: {
    projects: number;
  };
}

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  isActive: boolean;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  author: {
    name: string;
    email: string;
  };
}

export default function AdminPage() {
  const { data: session, status } = useSession() as { data: ExtendedSession | null; status: string };
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // 检查管理员权限
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // 获取数据
  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      // 并行获取用户、项目和统计数据
      const [usersRes, projectsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/projects')
      ]);

      if (!usersRes.ok || !projectsRes.ok) {
        throw new Error('获取数据失败');
      }

      const usersData = await usersRes.json();
      const projectsData = await projectsRes.json();

      setUsers(usersData.users || []);
      setProjects(projectsData.projects || []);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 切换项目状态
  const toggleProjectStatus = async (projectId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, isActive: !currentStatus })
      });

      if (!response.ok) {
        throw new Error('更新项目状态失败');
      }

      // 刷新数据
      fetchData();
    } catch (error) {
      console.error('更新项目状态错误:', error);
      alert('更新项目状态失败');
    }
  };

  // 删除项目
  const deleteProject = async (projectId: string) => {
    if (!confirm('确定要删除这个项目吗？此操作不可恢复。')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/projects?projectId=${projectId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('删除项目失败');
      }

      // 刷新数据
      fetchData();
    } catch (error) {
      console.error('删除项目错误:', error);
      alert('删除项目失败');
    }
  };

  // 删除用户
  const deleteUser = async (userId: string) => {
    if (!confirm('确定要删除这个用户吗？此操作将同时删除该用户的所有项目，且不可恢复。')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('删除用户失败');
      }

      // 刷新数据
      fetchData();
    } catch (error) {
      console.error('删除用户错误:', error);
      alert('删除用户失败');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return null;
  }

  const stats = {
    totalUsers: users.length,
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.isActive).length,
    totalViews: projects.reduce((sum, p) => sum + p.viewCount, 0)
  };

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

            {/* 中间标题 */}
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-neon-purple" />
              <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple">
                管理后台
              </h1>
            </div>

            {/* 右侧导航 */}
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-foreground/80 hover:text-neon-blue transition-colors"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span className="text-sm">我的项目</span>
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
          <div className="flex items-center mb-4">
            <Shield className="w-8 h-8 text-neon-blue mr-3" />
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple">
              管理后台
            </h1>
          </div>
          <p className="text-foreground/60">系统管理和数据监控</p>
        </div>

        {/* 标签页导航 */}
        <div className="flex space-x-1 mb-8 bg-sci-dark/50 p-1 rounded-lg">
          {[
            { id: 'overview', label: '概览', icon: BarChart3 },
            { id: 'users', label: '用户管理', icon: Users },
            { id: 'projects', label: '项目管理', icon: FolderOpen },
            { id: 'settings', label: '系统设置', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-neon-blue text-white'
                  : 'text-foreground/60 hover:text-foreground hover:bg-sci-dark/50'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 概览标签页 */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-sci-dark/80 backdrop-blur-sm border border-neon-blue/30 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground/60 mb-1">总用户数</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
                  </div>
                  <Users className="w-8 h-8 text-neon-blue" />
                </div>
              </div>

              <div className="bg-sci-dark/80 backdrop-blur-sm border border-neon-blue/30 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground/60 mb-1">总项目数</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalProjects}</p>
                  </div>
                  <FolderOpen className="w-8 h-8 text-neon-purple" />
                </div>
              </div>

              <div className="bg-sci-dark/80 backdrop-blur-sm border border-neon-blue/30 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground/60 mb-1">活跃项目</p>
                    <p className="text-2xl font-bold text-foreground">{stats.activeProjects}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-neon-green" />
                </div>
              </div>

              <div className="bg-sci-dark/80 backdrop-blur-sm border border-neon-blue/30 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground/60 mb-1">总浏览量</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalViews}</p>
                  </div>
                  <Eye className="w-8 h-8 text-orange-400" />
                </div>
              </div>
            </div>

            {/* 最近活动 */}
            <div className="bg-sci-dark/80 backdrop-blur-sm border border-neon-blue/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">最近活动</h3>
              <div className="space-y-3">
                {projects.slice(0, 5).map((project) => (
                  <div key={project.id} className="flex items-center justify-between py-2 border-b border-foreground/10 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{project.title}</p>
                      <p className="text-xs text-foreground/60">由 {project.author.name} 创建</p>
                    </div>
                    <span className="text-xs text-foreground/50">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* 用户管理标签页 */}
        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-sci-dark/80 backdrop-blur-sm border border-neon-blue/30 rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">用户列表</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-foreground/10">
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground/60">用户</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground/60">角色</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground/60">项目数</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground/60">注册时间</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground/60">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-foreground/5">
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">{user.name}</p>
                          <p className="text-xs text-foreground/60">{user.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'ADMIN' 
                            ? 'bg-neon-purple/20 text-neon-purple' 
                            : 'bg-neon-blue/20 text-neon-blue'
                        }`}>
                          {user.role === 'ADMIN' ? '管理员' : '用户'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">{user._count.projects}</td>
                      <td className="py-3 px-4 text-sm text-foreground/60">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => deleteUser(user.id)}
                            className="p-1 text-foreground/60 hover:text-red-400 transition-colors"
                            title="删除用户"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* 项目管理标签页 */}
        {activeTab === 'projects' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-sci-dark/80 backdrop-blur-sm border border-neon-blue/30 rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">项目列表</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-foreground/10">
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground/60">项目</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground/60">作者</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground/60">分类</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground/60">状态</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground/60">浏览量</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground/60">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id} className="border-b border-foreground/5">
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">{project.title}</p>
                          <p className="text-xs text-foreground/60 line-clamp-1">{project.description}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">{project.author.name}</td>
                      <td className="py-3 px-4 text-sm text-foreground">{project.category}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          project.isActive 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {project.isActive ? '活跃' : '暂停'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">{project.viewCount}</td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => toggleProjectStatus(project.id, project.isActive)}
                            className={`p-1 transition-colors ${
                              project.isActive 
                                ? 'text-foreground/60 hover:text-yellow-400' 
                                : 'text-foreground/60 hover:text-green-400'
                            }`}
                            title={project.isActive ? '暂停项目' : '激活项目'}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteProject(project.id)}
                            className="p-1 text-foreground/60 hover:text-red-400 transition-colors"
                            title="删除项目"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* 系统设置标签页 */}
        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-sci-dark/80 backdrop-blur-sm border border-neon-blue/30 rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">系统设置</h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-medium text-foreground mb-3">系统信息</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-sci-darker/50 rounded-lg p-4">
                    <p className="text-sm text-foreground/60 mb-1">系统版本</p>
                    <p className="text-sm text-foreground">v1.0.0</p>
                  </div>
                  <div className="bg-sci-darker/50 rounded-lg p-4">
                    <p className="text-sm text-foreground/60 mb-1">数据库状态</p>
                    <p className="text-sm text-green-400">正常</p>
                  </div>
                  <div className="bg-sci-darker/50 rounded-lg p-4">
                    <p className="text-sm text-foreground/60 mb-1">服务器状态</p>
                    <p className="text-sm text-green-400">运行中</p>
                  </div>
                  <div className="bg-sci-darker/50 rounded-lg p-4">
                    <p className="text-sm text-foreground/60 mb-1">最后备份</p>
                    <p className="text-sm text-foreground">2025-01-17 10:00</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-foreground mb-3">维护操作</h4>
                <div className="flex space-x-4">
                  <button className="px-4 py-2 bg-neon-blue/20 text-neon-blue rounded-lg hover:bg-neon-blue/30 transition-colors">
                    清理缓存
                  </button>
                  <button className="px-4 py-2 bg-neon-purple/20 text-neon-purple rounded-lg hover:bg-neon-purple/30 transition-colors">
                    备份数据
                  </button>
                  <button className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors">
                    系统重启
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
