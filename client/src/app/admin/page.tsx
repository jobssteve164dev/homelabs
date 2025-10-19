'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Users, FolderOpen, BarChart3, Settings, Eye, Edit, Trash2, Home, ArrowLeft, Power, RefreshCcw, Database, RotateCw, Ban, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { logClientError } from '@/lib/clientLogger';

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
  isActive: boolean;
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
  projectType: 'STAR' | 'PLANET';
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
  const [maintenanceLoading, setMaintenanceLoading] = useState<string | null>(null);
  const [projectTypeFilter, setProjectTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [projectSearchTerm, setProjectSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const itemsPerPage = 10;
  
  // 用户管理筛选和分页状态
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const userItemsPerPage = 10;

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
  }, [session, projectTypeFilter, categoryFilter, projectSearchTerm, currentPage, userStatusFilter, userSearchTerm, userCurrentPage]);

  // 项目筛选条件变化时重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [projectTypeFilter, categoryFilter, projectSearchTerm]);

  // 用户筛选条件变化时重置到第一页
  useEffect(() => {
    setUserCurrentPage(1);
  }, [userStatusFilter, userSearchTerm]);

  const fetchData = async () => {
    try {
      // 构建用户查询参数
      const usersUrl = new URL('/api/admin/users', window.location.origin);
      usersUrl.searchParams.set('page', userCurrentPage.toString());
      usersUrl.searchParams.set('limit', userItemsPerPage.toString());
      if (userSearchTerm) {
        usersUrl.searchParams.set('search', userSearchTerm);
      }
      if (userStatusFilter && userStatusFilter !== 'all') {
        usersUrl.searchParams.set('isActive', userStatusFilter);
      }

      // 构建项目查询参数
      const projectsUrl = new URL('/api/admin/projects', window.location.origin);
      projectsUrl.searchParams.set('page', currentPage.toString());
      projectsUrl.searchParams.set('limit', itemsPerPage.toString());
      if (projectSearchTerm) {
        projectsUrl.searchParams.set('search', projectSearchTerm);
      }
      if (projectTypeFilter && projectTypeFilter !== 'all') {
        projectsUrl.searchParams.set('projectType', projectTypeFilter);
      }
      if (categoryFilter && categoryFilter !== 'all') {
        projectsUrl.searchParams.set('category', categoryFilter);
      }

      // 并行获取用户、项目和统计数据
      const [usersRes, projectsRes] = await Promise.all([
        fetch(usersUrl.toString()),
        fetch(projectsUrl.toString())
      ]);

      if (!usersRes.ok || !projectsRes.ok) {
        throw new Error('获取数据失败');
      }

      const usersData = await usersRes.json();
      const projectsData = await projectsRes.json();

      setUsers(usersData.users || []);
      setProjects(projectsData.projects || []);
      
      // 更新用户分页信息
      if (usersData.pagination) {
        setUserTotalPages(usersData.pagination.pages);
        setTotalUsers(usersData.pagination.total);
      }
      
      // 更新项目分页信息
      if (projectsData.pagination) {
        setTotalPages(projectsData.pagination.pages);
        setTotalProjects(projectsData.pagination.total);
      }
    } catch (error) {
      logClientError('获取管理后台数据失败', error);
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

  // 冻结/解冻用户
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? '冻结' : '解冻';
    const message = currentStatus 
      ? '确定要冻结这个用户吗？\n\n冻结后用户将无法登录系统，但数据会保留。'
      : '确定要解冻这个用户吗？\n\n解冻后用户将恢复正常访问权限。';
    
    if (!confirm(message)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive: !currentStatus })
      });

      if (!response.ok) {
        throw new Error(`${action}用户失败`);
      }

      // 刷新数据
      fetchData();
      alert(`✅ 用户${action}成功`);
    } catch (error) {
      console.error(`${action}用户错误:`, error);
      alert(`❌ ${action}用户失败`);
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

  // 清理缓存
  const handleClearCache = async () => {
    if (!confirm('确定要清理系统缓存吗？这将清除所有临时文件和缓存数据。')) {
      return;
    }

    setMaintenanceLoading('cache');
    try {
      const response = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-cache' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '清理缓存失败');
      }

      alert('✅ 缓存清理成功！\n\n' + data.message);
    } catch (error) {
      console.error('清理缓存错误:', error);
      alert('❌ 清理缓存失败\n\n' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setMaintenanceLoading(null);
    }
  };

  // 备份数据
  const handleBackupData = async () => {
    if (!confirm('确定要备份数据吗？这将创建完整的数据库备份。')) {
      return;
    }

    setMaintenanceLoading('backup');
    try {
      const response = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'backup' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '数据备份失败');
      }

      alert('✅ 数据备份成功！\n\n' + 
            `备份文件: ${data.backupFile}\n` +
            `时间: ${new Date(data.timestamp).toLocaleString()}`);
    } catch (error) {
      console.error('备份数据错误:', error);
      alert('❌ 数据备份失败\n\n' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setMaintenanceLoading(null);
    }
  };

  // 系统重启
  const handleSystemRestart = async () => {
    if (!confirm('⚠️ 警告：确定要重启系统吗？\n\n这将导致服务短暂中断，所有用户将被暂时断开连接。\n\n建议在低峰时段执行此操作。')) {
      return;
    }

    setMaintenanceLoading('restart');
    try {
      const response = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restart' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '系统重启失败');
      }

      alert('🔄 ' + data.message + '\n\n' + 
            (data.note || '服务将自动恢复，请稍候刷新页面。'));
      
      // 在生产环境中，3秒后刷新页面
      if (!data.note) {
        setTimeout(() => {
          window.location.reload();
        }, 5000);
      }
    } catch (error) {
      console.error('系统重启错误:', error);
      alert('❌ 系统重启失败\n\n' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setMaintenanceLoading(null);
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
    totalUsers: totalUsers,
    totalProjects: totalProjects,
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
            <h1 className="text-3xl font-bold text-white">
              管理后台
            </h1>
          </div>
          <p className="text-foreground/60">系统管理和数据监控</p>
        </div>

        {/* 标签页导航 - 独立按钮卡片布局 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* 概览按钮 */}
          <motion.button
            onClick={() => setActiveTab('overview')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative overflow-hidden rounded-xl p-6 text-left transition-all ${
              activeTab === 'overview'
                ? 'bg-neon-blue/20 border-2 border-neon-blue shadow-lg shadow-neon-blue/20'
                : 'bg-sci-dark/50 border border-foreground/10 hover:border-foreground/30'
            }`}
          >
            {/* 背景装饰 */}
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity ${
              activeTab === 'overview' ? 'opacity-30' : 'opacity-0'
            } bg-neon-blue`} />
            
            {/* 内容 */}
            <div className="relative z-10">
              <div className="flex items-center mb-3">
                <div className={`p-2 rounded-lg ${
                  activeTab === 'overview' ? 'bg-neon-blue/20' : 'bg-foreground/5'
                }`}>
                  <BarChart3 className={`w-6 h-6 ${
                    activeTab === 'overview' ? 'text-neon-blue' : 'text-foreground/60'
                  }`} />
                </div>
                {activeTab === 'overview' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto w-2 h-2 rounded-full bg-neon-blue"
                  />
                )}
              </div>
              <h3 className={`text-lg font-semibold mb-1 ${
                activeTab === 'overview' ? 'text-neon-blue' : 'text-foreground'
              }`}>
                概览
              </h3>
              <p className="text-sm text-foreground/60">
                查看系统统计和最近活动
              </p>
            </div>
          </motion.button>

          {/* 用户管理按钮 */}
          <motion.button
            onClick={() => setActiveTab('users')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative overflow-hidden rounded-xl p-6 text-left transition-all ${
              activeTab === 'users'
                ? 'bg-neon-purple/20 border-2 border-neon-purple shadow-lg shadow-neon-purple/20'
                : 'bg-sci-dark/50 border border-foreground/10 hover:border-foreground/30'
            }`}
          >
            {/* 背景装饰 */}
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity ${
              activeTab === 'users' ? 'opacity-30' : 'opacity-0'
            } bg-neon-purple`} />
            
            {/* 内容 */}
            <div className="relative z-10">
              <div className="flex items-center mb-3">
                <div className={`p-2 rounded-lg ${
                  activeTab === 'users' ? 'bg-neon-purple/20' : 'bg-foreground/5'
                }`}>
                  <Users className={`w-6 h-6 ${
                    activeTab === 'users' ? 'text-neon-purple' : 'text-foreground/60'
                  }`} />
                </div>
                {activeTab === 'users' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto w-2 h-2 rounded-full bg-neon-purple"
                  />
                )}
              </div>
              <h3 className={`text-lg font-semibold mb-1 ${
                activeTab === 'users' ? 'text-neon-purple' : 'text-foreground'
              }`}>
                用户管理
              </h3>
              <p className="text-sm text-foreground/60">
                管理用户账户和权限
              </p>
            </div>
          </motion.button>

          {/* 项目管理按钮 */}
          <motion.button
            onClick={() => setActiveTab('projects')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative overflow-hidden rounded-xl p-6 text-left transition-all ${
              activeTab === 'projects'
                ? 'bg-neon-green/20 border-2 border-neon-green shadow-lg shadow-neon-green/20'
                : 'bg-sci-dark/50 border border-foreground/10 hover:border-foreground/30'
            }`}
          >
            {/* 背景装饰 */}
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity ${
              activeTab === 'projects' ? 'opacity-30' : 'opacity-0'
            } bg-neon-green`} />
            
            {/* 内容 */}
            <div className="relative z-10">
              <div className="flex items-center mb-3">
                <div className={`p-2 rounded-lg ${
                  activeTab === 'projects' ? 'bg-neon-green/20' : 'bg-foreground/5'
                }`}>
                  <FolderOpen className={`w-6 h-6 ${
                    activeTab === 'projects' ? 'text-neon-green' : 'text-foreground/60'
                  }`} />
                </div>
                {activeTab === 'projects' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto w-2 h-2 rounded-full bg-neon-green"
                  />
                )}
              </div>
              <h3 className={`text-lg font-semibold mb-1 ${
                activeTab === 'projects' ? 'text-neon-green' : 'text-foreground'
              }`}>
                项目管理
              </h3>
              <p className="text-sm text-foreground/60">
                审核和管理所有项目
              </p>
            </div>
          </motion.button>

          {/* 系统设置按钮 */}
          <motion.button
            onClick={() => setActiveTab('settings')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative overflow-hidden rounded-xl p-6 text-left transition-all ${
              activeTab === 'settings'
                ? 'bg-orange-400/20 border-2 border-orange-400 shadow-lg shadow-orange-400/20'
                : 'bg-sci-dark/50 border border-foreground/10 hover:border-foreground/30'
            }`}
          >
            {/* 背景装饰 */}
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity ${
              activeTab === 'settings' ? 'opacity-30' : 'opacity-0'
            } bg-orange-400`} />
            
            {/* 内容 */}
            <div className="relative z-10">
              <div className="flex items-center mb-3">
                <div className={`p-2 rounded-lg ${
                  activeTab === 'settings' ? 'bg-orange-400/20' : 'bg-foreground/5'
                }`}>
                  <Settings className={`w-6 h-6 ${
                    activeTab === 'settings' ? 'text-orange-400' : 'text-foreground/60'
                  }`} />
                </div>
                {activeTab === 'settings' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto w-2 h-2 rounded-full bg-orange-400"
                  />
                )}
              </div>
              <h3 className={`text-lg font-semibold mb-1 ${
                activeTab === 'settings' ? 'text-orange-400' : 'text-foreground'
              }`}>
                系统设置
              </h3>
              <p className="text-sm text-foreground/60">
                配置系统参数和维护
              </p>
            </div>
          </motion.button>
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
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">用户列表</h3>
              </div>
              
              {/* 筛选器和搜索栏 */}
              <div className="flex flex-wrap items-center gap-4 p-4 bg-sci-darker/50 rounded-lg border border-neon-purple/20">
                {/* 搜索框 */}
                <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                  <label className="text-sm text-foreground/60 whitespace-nowrap">搜索：</label>
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    placeholder="搜索用户名或邮箱..."
                    className="flex-1 px-4 py-2 rounded-lg bg-sci-darker border border-neon-purple/30 text-foreground text-sm placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 hover:border-neon-purple/50 transition-all"
                  />
                </div>

                {/* 状态筛选器 */}
                <div className="flex items-center gap-3">
                  <label className="text-sm text-foreground/60 whitespace-nowrap">账户状态：</label>
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-sci-darker border border-neon-purple/30 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/50 hover:border-neon-purple/50 transition-all cursor-pointer"
                  >
                    <option value="all">全部状态</option>
                    <option value="true">正常</option>
                    <option value="false">已冻结</option>
                  </select>
                </div>

                {/* 筛选信息和重置按钮 */}
                <div className="flex items-center gap-3 ml-auto">
                  {/* 筛选结果统计 */}
                  <span className="text-sm text-foreground/60">
                    共 <span className="text-neon-purple font-semibold">{totalUsers}</span> 个用户
                  </span>
                  
                  {/* 重置筛选按钮 */}
                  {(userStatusFilter !== 'all' || userSearchTerm) && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setUserStatusFilter('all');
                        setUserSearchTerm('');
                      }}
                      className="px-4 py-2 rounded-lg bg-foreground/10 border border-foreground/20 text-foreground/80 text-sm hover:bg-foreground/20 hover:border-foreground/30 transition-all"
                    >
                      重置筛选
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-foreground/10">
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground/60">用户</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground/60">角色</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground/60">状态</th>
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
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          user.isActive 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {user.isActive ? '正常' : '已冻结'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">{user._count.projects}</td>
                      <td className="py-3 px-4 text-sm text-foreground/60">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleUserStatus(user.id, user.isActive)}
                            className={`p-2 rounded-lg border transition-all ${
                              user.isActive 
                                ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/20' 
                                : 'bg-green-400/10 border-green-400/30 text-green-400 hover:bg-green-400/20'
                            }`}
                            title={user.isActive ? '冻结用户' : '解冻用户'}
                          >
                            {user.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => deleteUser(user.id)}
                            className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all"
                            title="删除用户"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页控件 */}
            {userTotalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-foreground/10">
                <div className="text-sm text-foreground/60">
                  第 {userCurrentPage} 页，共 {userTotalPages} 页
                </div>
                <div className="flex items-center gap-2">
                  {/* 首页按钮 */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setUserCurrentPage(1)}
                    disabled={userCurrentPage === 1}
                    className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                      userCurrentPage === 1
                        ? 'bg-foreground/5 border-foreground/10 text-foreground/30 cursor-not-allowed'
                        : 'bg-sci-darker border-neon-purple/30 text-neon-purple hover:bg-neon-purple/10 hover:border-neon-purple'
                    }`}
                  >
                    首页
                  </motion.button>

                  {/* 上一页按钮 */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setUserCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={userCurrentPage === 1}
                    className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                      userCurrentPage === 1
                        ? 'bg-foreground/5 border-foreground/10 text-foreground/30 cursor-not-allowed'
                        : 'bg-sci-darker border-neon-purple/30 text-neon-purple hover:bg-neon-purple/10 hover:border-neon-purple'
                    }`}
                  >
                    上一页
                  </motion.button>

                  {/* 页码按钮组 */}
                  <div className="flex items-center gap-1">
                    {(() => {
                      const pageButtons = [];
                      const showEllipsisStart = userCurrentPage > 3;
                      const showEllipsisEnd = userCurrentPage < userTotalPages - 2;
                      
                      // 始终显示第一页
                      pageButtons.push(
                        <motion.button
                          key={1}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setUserCurrentPage(1)}
                          className={`w-10 h-10 rounded-lg border text-sm transition-all ${
                            userCurrentPage === 1
                              ? 'bg-neon-purple/20 border-neon-purple text-neon-purple font-semibold'
                              : 'bg-sci-darker border-foreground/20 text-foreground/80 hover:bg-foreground/10 hover:border-foreground/30'
                          }`}
                        >
                          1
                        </motion.button>
                      );

                      // 显示左侧省略号
                      if (showEllipsisStart) {
                        pageButtons.push(
                          <span key="ellipsis-start" className="px-2 text-foreground/40">...</span>
                        );
                      }

                      // 显示当前页附近的页码
                      const startPage = Math.max(2, userCurrentPage - 1);
                      const endPage = Math.min(userTotalPages - 1, userCurrentPage + 1);
                      
                      for (let i = startPage; i <= endPage; i++) {
                        pageButtons.push(
                          <motion.button
                            key={i}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setUserCurrentPage(i)}
                            className={`w-10 h-10 rounded-lg border text-sm transition-all ${
                              userCurrentPage === i
                                ? 'bg-neon-purple/20 border-neon-purple text-neon-purple font-semibold'
                                : 'bg-sci-darker border-foreground/20 text-foreground/80 hover:bg-foreground/10 hover:border-foreground/30'
                            }`}
                          >
                            {i}
                          </motion.button>
                        );
                      }

                      // 显示右侧省略号
                      if (showEllipsisEnd) {
                        pageButtons.push(
                          <span key="ellipsis-end" className="px-2 text-foreground/40">...</span>
                        );
                      }

                      // 始终显示最后一页
                      if (userTotalPages > 1) {
                        pageButtons.push(
                          <motion.button
                            key={userTotalPages}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setUserCurrentPage(userTotalPages)}
                            className={`w-10 h-10 rounded-lg border text-sm transition-all ${
                              userCurrentPage === userTotalPages
                                ? 'bg-neon-purple/20 border-neon-purple text-neon-purple font-semibold'
                                : 'bg-sci-darker border-foreground/20 text-foreground/80 hover:bg-foreground/10 hover:border-foreground/30'
                            }`}
                          >
                            {userTotalPages}
                          </motion.button>
                        );
                      }

                      return pageButtons;
                    })()}
                  </div>

                  {/* 下一页按钮 */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setUserCurrentPage(prev => Math.min(userTotalPages, prev + 1))}
                    disabled={userCurrentPage === userTotalPages}
                    className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                      userCurrentPage === userTotalPages
                        ? 'bg-foreground/5 border-foreground/10 text-foreground/30 cursor-not-allowed'
                        : 'bg-sci-darker border-neon-purple/30 text-neon-purple hover:bg-neon-purple/10 hover:border-neon-purple'
                    }`}
                  >
                    下一页
                  </motion.button>

                  {/* 末页按钮 */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setUserCurrentPage(userTotalPages)}
                    disabled={userCurrentPage === userTotalPages}
                    className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                      userCurrentPage === userTotalPages
                        ? 'bg-foreground/5 border-foreground/10 text-foreground/30 cursor-not-allowed'
                        : 'bg-sci-darker border-neon-purple/30 text-neon-purple hover:bg-neon-purple/10 hover:border-neon-purple'
                    }`}
                  >
                    末页
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* 项目管理标签页 */}
        {activeTab === 'projects' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-sci-dark/80 backdrop-blur-sm border border-neon-blue/30 rounded-xl p-6"
          >
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">项目列表</h3>
              </div>
              
              {/* 筛选器组 */}
              <div className="flex flex-wrap items-center gap-4 p-4 bg-sci-darker/50 rounded-lg border border-neon-blue/20">
                {/* 搜索框 */}
                <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                  <label className="text-sm text-foreground/60 whitespace-nowrap">搜索：</label>
                  <input
                    type="text"
                    value={projectSearchTerm}
                    onChange={(e) => setProjectSearchTerm(e.target.value)}
                    placeholder="搜索项目标题或描述..."
                    className="flex-1 px-4 py-2 rounded-lg bg-sci-darker border border-neon-blue/30 text-foreground text-sm placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-blue/50 hover:border-neon-blue/50 transition-all"
                  />
                </div>

                {/* 类型筛选器 */}
                <div className="flex items-center gap-3">
                  <label className="text-sm text-foreground/60 whitespace-nowrap">项目类型：</label>
                  <select
                    value={projectTypeFilter}
                    onChange={(e) => setProjectTypeFilter(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-sci-darker border border-neon-blue/30 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-blue/50 hover:border-neon-blue/50 transition-all cursor-pointer"
                  >
                    <option value="all">全部类型</option>
                    <option value="PLANET">行星项目（AI工具）</option>
                    <option value="STAR">恒星项目（个人介绍）</option>
                  </select>
                </div>

                {/* 分类筛选器 */}
                <div className="flex items-center gap-3">
                  <label className="text-sm text-foreground/60 whitespace-nowrap">项目分类：</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-sci-darker border border-neon-purple/30 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/50 hover:border-neon-purple/50 transition-all cursor-pointer"
                  >
                    <option value="all">全部分类</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* 筛选信息和重置按钮 */}
                <div className="flex items-center gap-3 ml-auto">
                  {/* 筛选结果统计 */}
                  <span className="text-sm text-foreground/60">
                    共 <span className="text-neon-blue font-semibold">{totalProjects}</span> 个项目
                  </span>
                  
                  {/* 重置筛选按钮 */}
                  {(projectTypeFilter !== 'all' || categoryFilter !== 'all' || projectSearchTerm) && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setProjectTypeFilter('all');
                        setCategoryFilter('all');
                        setProjectSearchTerm('');
                      }}
                      className="px-4 py-2 rounded-lg bg-foreground/10 border border-foreground/20 text-foreground/80 text-sm hover:bg-foreground/20 hover:border-foreground/30 transition-all"
                    >
                      重置筛选
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-foreground/10">
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground/60">项目</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground/60">作者</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground/60">分类</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground/60">类型</th>
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
                          project.projectType === 'STAR'
                            ? 'bg-orange-400/20 text-orange-400' 
                            : 'bg-neon-blue/20 text-neon-blue'
                        }`}>
                          {project.projectType === 'STAR' ? '恒星' : '行星'}
                        </span>
                      </td>
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
                        <div className="flex items-center gap-3">
                          <Link href={`/dashboard/edit/${project.id}`}>
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-2 rounded-lg bg-neon-blue/10 border border-neon-blue/30 text-neon-blue hover:bg-neon-blue/20 transition-all"
                              title="编辑项目"
                            >
                              <Edit className="w-4 h-4" />
                            </motion.button>
                          </Link>
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleProjectStatus(project.id, project.isActive)}
                            className={`p-2 rounded-lg border transition-all ${
                              project.isActive 
                                ? 'bg-green-400/10 border-green-400/30 text-green-400 hover:bg-yellow-400/10 hover:border-yellow-400/30 hover:text-yellow-400' 
                                : 'bg-foreground/5 border-foreground/20 text-foreground/40 hover:bg-green-400/10 hover:border-green-400/30 hover:text-green-400'
                            }`}
                            title={project.isActive ? '暂停项目' : '激活项目'}
                          >
                            <Power className="w-4 h-4" />
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => deleteProject(project.id)}
                            className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all"
                            title="删除项目"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页控件 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-foreground/10">
                <div className="text-sm text-foreground/60">
                  第 {currentPage} 页，共 {totalPages} 页
                </div>
                <div className="flex items-center gap-2">
                  {/* 首页按钮 */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                      currentPage === 1
                        ? 'bg-foreground/5 border-foreground/10 text-foreground/30 cursor-not-allowed'
                        : 'bg-sci-darker border-neon-blue/30 text-neon-blue hover:bg-neon-blue/10 hover:border-neon-blue'
                    }`}
                  >
                    首页
                  </motion.button>

                  {/* 上一页按钮 */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                      currentPage === 1
                        ? 'bg-foreground/5 border-foreground/10 text-foreground/30 cursor-not-allowed'
                        : 'bg-sci-darker border-neon-blue/30 text-neon-blue hover:bg-neon-blue/10 hover:border-neon-blue'
                    }`}
                  >
                    上一页
                  </motion.button>

                  {/* 页码按钮组 */}
                  <div className="flex items-center gap-1">
                    {(() => {
                      const pageButtons = [];
                      const showEllipsisStart = currentPage > 3;
                      const showEllipsisEnd = currentPage < totalPages - 2;
                      
                      // 始终显示第一页
                      pageButtons.push(
                        <motion.button
                          key={1}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setCurrentPage(1)}
                          className={`w-10 h-10 rounded-lg border text-sm transition-all ${
                            currentPage === 1
                              ? 'bg-neon-blue/20 border-neon-blue text-neon-blue font-semibold'
                              : 'bg-sci-darker border-foreground/20 text-foreground/80 hover:bg-foreground/10 hover:border-foreground/30'
                          }`}
                        >
                          1
                        </motion.button>
                      );

                      // 显示左侧省略号
                      if (showEllipsisStart) {
                        pageButtons.push(
                          <span key="ellipsis-start" className="px-2 text-foreground/40">...</span>
                        );
                      }

                      // 显示当前页附近的页码
                      const startPage = Math.max(2, currentPage - 1);
                      const endPage = Math.min(totalPages - 1, currentPage + 1);
                      
                      for (let i = startPage; i <= endPage; i++) {
                        pageButtons.push(
                          <motion.button
                            key={i}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setCurrentPage(i)}
                            className={`w-10 h-10 rounded-lg border text-sm transition-all ${
                              currentPage === i
                                ? 'bg-neon-blue/20 border-neon-blue text-neon-blue font-semibold'
                                : 'bg-sci-darker border-foreground/20 text-foreground/80 hover:bg-foreground/10 hover:border-foreground/30'
                            }`}
                          >
                            {i}
                          </motion.button>
                        );
                      }

                      // 显示右侧省略号
                      if (showEllipsisEnd) {
                        pageButtons.push(
                          <span key="ellipsis-end" className="px-2 text-foreground/40">...</span>
                        );
                      }

                      // 始终显示最后一页
                      if (totalPages > 1) {
                        pageButtons.push(
                          <motion.button
                            key={totalPages}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setCurrentPage(totalPages)}
                            className={`w-10 h-10 rounded-lg border text-sm transition-all ${
                              currentPage === totalPages
                                ? 'bg-neon-blue/20 border-neon-blue text-neon-blue font-semibold'
                                : 'bg-sci-darker border-foreground/20 text-foreground/80 hover:bg-foreground/10 hover:border-foreground/30'
                            }`}
                          >
                            {totalPages}
                          </motion.button>
                        );
                      }

                      return pageButtons;
                    })()}
                  </div>

                  {/* 下一页按钮 */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                      currentPage === totalPages
                        ? 'bg-foreground/5 border-foreground/10 text-foreground/30 cursor-not-allowed'
                        : 'bg-sci-darker border-neon-blue/30 text-neon-blue hover:bg-neon-blue/10 hover:border-neon-blue'
                    }`}
                  >
                    下一页
                  </motion.button>

                  {/* 末页按钮 */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                      currentPage === totalPages
                        ? 'bg-foreground/5 border-foreground/10 text-foreground/30 cursor-not-allowed'
                        : 'bg-sci-darker border-neon-blue/30 text-neon-blue hover:bg-neon-blue/10 hover:border-neon-blue'
                    }`}
                  >
                    末页
                  </motion.button>
                </div>
              </div>
            )}
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
                <h4 className="text-md font-medium text-foreground mb-4">维护操作</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 清理缓存 */}
                  <motion.button 
                    onClick={handleClearCache}
                    disabled={maintenanceLoading !== null}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative overflow-hidden bg-sci-darker/50 border border-neon-blue/30 rounded-xl p-6 text-left hover:border-neon-blue hover:shadow-lg hover:shadow-neon-blue/20 transition-all group ${
                      maintenanceLoading !== null ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {/* 背景光效 */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity" />
                    
                    {/* 内容 */}
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-neon-blue/10 rounded-lg group-hover:bg-neon-blue/20 transition-colors">
                          <RefreshCcw className={`w-6 h-6 text-neon-blue ${
                            maintenanceLoading === 'cache' ? 'animate-spin' : ''
                          }`} />
                        </div>
                        <span className="text-xs text-neon-blue/60 group-hover:text-neon-blue transition-colors">
                          {maintenanceLoading === 'cache' ? '处理中...' : '日常维护'}
                        </span>
                      </div>
                      <h5 className="text-base font-semibold text-foreground mb-2">清理缓存</h5>
                      <p className="text-sm text-foreground/60">
                        清理系统临时文件和缓存数据
                      </p>
                    </div>
                  </motion.button>

                  {/* 备份数据 */}
                  <motion.button 
                    onClick={handleBackupData}
                    disabled={maintenanceLoading !== null}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative overflow-hidden bg-sci-darker/50 border border-neon-purple/30 rounded-xl p-6 text-left hover:border-neon-purple hover:shadow-lg hover:shadow-neon-purple/20 transition-all group ${
                      maintenanceLoading !== null ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {/* 背景光效 */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity" />
                    
                    {/* 内容 */}
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-neon-purple/10 rounded-lg group-hover:bg-neon-purple/20 transition-colors">
                          <Database className={`w-6 h-6 text-neon-purple ${
                            maintenanceLoading === 'backup' ? 'animate-pulse' : ''
                          }`} />
                        </div>
                        <span className="text-xs text-neon-purple/60 group-hover:text-neon-purple transition-colors">
                          {maintenanceLoading === 'backup' ? '备份中...' : '数据保护'}
                        </span>
                      </div>
                      <h5 className="text-base font-semibold text-foreground mb-2">备份数据</h5>
                      <p className="text-sm text-foreground/60">
                        创建完整的数据库备份快照
                      </p>
                    </div>
                  </motion.button>

                  {/* 系统重启 */}
                  <motion.button 
                    onClick={handleSystemRestart}
                    disabled={maintenanceLoading !== null}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative overflow-hidden bg-sci-darker/50 border border-yellow-400/30 rounded-xl p-6 text-left hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-400/20 transition-all group ${
                      maintenanceLoading !== null ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {/* 背景光效 */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity" />
                    
                    {/* 内容 */}
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-yellow-400/10 rounded-lg group-hover:bg-yellow-400/20 transition-colors">
                          <RotateCw className={`w-6 h-6 text-yellow-400 ${
                            maintenanceLoading === 'restart' ? 'animate-spin' : ''
                          }`} />
                        </div>
                        <span className="text-xs text-yellow-400/60 group-hover:text-yellow-400 transition-colors">
                          {maintenanceLoading === 'restart' ? '重启中...' : '谨慎操作'}
                        </span>
                      </div>
                      <h5 className="text-base font-semibold text-foreground mb-2">系统重启</h5>
                      <p className="text-sm text-foreground/60">
                        重启应用服务以应用更改
                      </p>
                    </div>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
