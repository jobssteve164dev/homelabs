'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Star, 
  User, 
  Briefcase, 
  Github, 
  Linkedin, 
  Twitter, 
  Globe, 
  Mail,
  Plus,
  X,
  Save,
  Sparkles,
  Download,
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface StarFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    title?: string;
    userTitle?: string;
    userBio?: string;
    userSkills?: string[];
    socialLinks?: {
      github?: string;
      linkedin?: string;
      twitter?: string;
      website?: string;
      email?: string;
    };
  };
}

export function StarForm({ mode, initialData }: StarFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 表单数据
  const [title, setTitle] = useState(initialData?.title || '我的星系');
  const [userTitle, setUserTitle] = useState(initialData?.userTitle || '');
  const [userBio, setUserBio] = useState(initialData?.userBio || '');
  const [userSkills, setUserSkills] = useState<string[]>(initialData?.userSkills || []);
  const [currentSkill, setCurrentSkill] = useState('');
  
  // 社交链接
  const [socialLinks, setSocialLinks] = useState({
    github: initialData?.socialLinks?.github || '',
    linkedin: initialData?.socialLinks?.linkedin || '',
    twitter: initialData?.socialLinks?.twitter || '',
    website: initialData?.socialLinks?.website || '',
    email: initialData?.socialLinks?.email || '',
  });

  // GitHub导入状态
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    details?: {
      imported: number;
      skipped: number;
      total: number;
    };
  } | null>(null);

  const handleAddSkill = () => {
    if (currentSkill.trim() && !userSkills.includes(currentSkill.trim())) {
      setUserSkills([...userSkills, currentSkill.trim()]);
      setCurrentSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setUserSkills(userSkills.filter(s => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/projects/star', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: userBio || '暂无简介', // API要求必填，使用userBio作为description
          userTitle,
          userBio,
          userSkills,
          socialLinks,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '创建失败');
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  // GitHub项目导入
  const handleImportGitHub = async () => {
    if (!socialLinks.github) {
      setImportResult({
        success: false,
        message: '请先输入GitHub主页链接',
      });
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const response = await fetch('/api/github/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubUrl: socialLinks.github }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '导入失败');
      }

      setImportResult({
        success: true,
        message: data.message,
        details: data.result,
      });

      // 3秒后自动刷新页面以显示新创建的行星
      setTimeout(() => {
        router.refresh();
      }, 3000);
    } catch (err) {
      setImportResult({
        success: false,
        message: err instanceof Error ? err.message : '导入失败',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* 头部 */}
      <div className="glass-card p-4 sm:p-6 lg:p-8 rounded-xl border border-foreground/10">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-4 sm:mb-6">
          <div 
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: '#FDB81320',
              boxShadow: '0 0 30px #FDB81340',
            }}
          >
            <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 fill-current" />
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500">
              {mode === 'create' ? '创建个人星系' : '编辑个人介绍'}
            </h1>
            <p className="text-foreground/60 mt-1 text-sm sm:text-base">
              在AI宇宙中创建属于你的恒星
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* 基本信息 */}
      <div className="glass-card p-4 sm:p-6 lg:p-8 rounded-xl border border-foreground/10 space-y-4 sm:space-y-6">
        <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-3">
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-neon-blue" />
          基本信息
        </h2>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">
            星系名称
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-sci-dark/50 border border-foreground/20 rounded-lg focus:outline-none focus:border-neon-blue/60 transition-colors text-sm sm:text-base"
            placeholder="例如：我的AI宇宙"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">
            职位/头衔
          </label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-foreground/40" />
            <input
              type="text"
              value={userTitle}
              onChange={(e) => setUserTitle(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 bg-sci-dark/50 border border-foreground/20 rounded-lg focus:outline-none focus:border-neon-blue/60 transition-colors text-sm sm:text-base"
              placeholder="例如：全栈开发工程师"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">
            个人简介
          </label>
          <textarea
            value={userBio}
            onChange={(e) => setUserBio(e.target.value)}
            rows={4}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-sci-dark/50 border border-foreground/20 rounded-lg focus:outline-none focus:border-neon-blue/60 transition-colors resize-none text-sm sm:text-base"
            placeholder="介绍一下你自己，你的专长，你的经验..."
          />
          <p className="mt-2 text-xs text-foreground/50">
            {userBio.length} / 500 字符
          </p>
        </div>
      </div>

      {/* 技能标签 */}
      <div className="glass-card p-4 sm:p-6 lg:p-8 rounded-xl border border-foreground/10 space-y-4 sm:space-y-6">
        <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-3">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-neon-purple" />
          技能专长
        </h2>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={currentSkill}
            onChange={(e) => setCurrentSkill(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
            className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-sci-dark/50 border border-foreground/20 rounded-lg focus:outline-none focus:border-neon-blue/60 transition-colors text-sm sm:text-base"
            placeholder="输入技能，按回车添加"
          />
          <button
            type="button"
            onClick={handleAddSkill}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-neon-purple/20 border-2 border-neon-purple/40 text-neon-purple rounded-lg hover:bg-neon-purple/30 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            添加
          </button>
        </div>

        {userSkills.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {userSkills.map((skill, index) => (
              <div
                key={index}
                className="px-4 py-2 bg-yellow-500/10 border-2 border-yellow-500/40 text-yellow-500 rounded-lg flex items-center gap-2 group hover:bg-yellow-500/20 transition-all"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="w-5 h-5 rounded-full hover:bg-yellow-500/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 社交链接 */}
      <div className="glass-card p-4 sm:p-6 lg:p-8 rounded-xl border border-foreground/10 space-y-4 sm:space-y-6">
        <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-3">
          <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-neon-green" />
          社交链接
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-foreground/70 mb-2 flex items-center gap-2">
              <Github className="w-4 h-4" />
              GitHub
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={socialLinks.github}
                onChange={(e) => {
                  setSocialLinks({ ...socialLinks, github: e.target.value });
                  setImportResult(null); // 清除之前的导入结果
                }}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-sci-dark/50 border border-foreground/20 rounded-lg focus:outline-none focus:border-neon-blue/60 transition-colors text-sm sm:text-base"
                placeholder="https://github.com/username"
              />
              <button
                type="button"
                onClick={handleImportGitHub}
                disabled={importing || !socialLinks.github}
                className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-glow-purple disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2 text-sm sm:text-base"
                title="自动导入GitHub上的AI相关开源项目"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    导入中...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    导入项目
                  </>
                )}
              </button>
            </div>
            {/* 导入结果提示 */}
            {importResult && (
              <div className={`mt-3 p-4 rounded-lg border ${
                importResult.success 
                  ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              } flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300`}>
                {importResult.success ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{importResult.message}</p>
                  {importResult.details && (
                    <p className="text-sm mt-1 opacity-80">
                      成功导入 <span className="font-bold">{importResult.details.imported}</span> 个AI项目
                      {importResult.details.skipped > 0 && (
                        <>, 跳过 {importResult.details.skipped} 个已存在项目</>
                      )}
                      <> (共扫描 {importResult.details.total} 个仓库)</>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2 flex items-center gap-2">
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </label>
            <input
              type="url"
              value={socialLinks.linkedin}
              onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-sci-dark/50 border border-foreground/20 rounded-lg focus:outline-none focus:border-neon-blue/60 transition-colors text-sm sm:text-base"
              placeholder="https://linkedin.com/in/username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2 flex items-center gap-2">
              <Twitter className="w-4 h-4" />
              Twitter
            </label>
            <input
              type="url"
              value={socialLinks.twitter}
              onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-sci-dark/50 border border-foreground/20 rounded-lg focus:outline-none focus:border-neon-blue/60 transition-colors text-sm sm:text-base"
              placeholder="https://twitter.com/username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              个人网站
            </label>
            <input
              type="url"
              value={socialLinks.website}
              onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-sci-dark/50 border border-foreground/20 rounded-lg focus:outline-none focus:border-neon-blue/60 transition-colors text-sm sm:text-base"
              placeholder="https://yourwebsite.com"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-foreground/70 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              邮箱
            </label>
            <input
              type="email"
              value={socialLinks.email}
              onChange={(e) => setSocialLinks({ ...socialLinks, email: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-sci-dark/50 border border-foreground/20 rounded-lg focus:outline-none focus:border-neon-blue/60 transition-colors text-sm sm:text-base"
              placeholder="your@email.com"
            />
          </div>
        </div>
      </div>

      {/* 提交按钮 */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 sm:px-8 py-2 sm:py-3 glass-card border border-foreground/20 rounded-lg hover:border-foreground/40 transition-all font-semibold text-sm sm:text-base"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:shadow-glow-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              {mode === 'create' ? '创建星系' : '保存修改'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

