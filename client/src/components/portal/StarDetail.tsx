'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  X, 
  ExternalLink, 
  Github, 
  Linkedin,
  Twitter,
  Globe,
  Mail,
  Star,
  Sparkles,
  Award,
  Code2,
  Briefcase
} from 'lucide-react';

interface StarData {
  userId: string;
  userName: string;
  userAvatar?: string;
  userTitle?: string;
  userBio?: string;
  userSkills?: string[];
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
    email?: string;
    [key: string]: string | undefined;
  };
}

interface StarDetailProps {
  star: StarData;
  onClose: () => void;
}

export function StarDetail({ star, onClose }: StarDetailProps) {
  const primaryColor = '#FDB813'; // 金色，代表恒星

  const socialLinkIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    github: Github,
    linkedin: Linkedin,
    twitter: Twitter,
    website: Globe,
    email: Mail,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-30 flex items-center justify-center p-2 sm:p-6 lg:p-8"
      onClick={onClose}
    >
      {/* 背景遮罩 */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-md" 
      />

      {/* 详情卡片 */}
      <motion.div
        initial={{ scale: 0.8, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, y: 50, opacity: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20 
        }}
        onClick={(e) => e.stopPropagation()}
        className="relative glass-card rounded-3xl border-2 w-full max-w-sm sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
        style={{
          borderColor: primaryColor + '80',
          boxShadow: `0 0 50px ${primaryColor}40, 0 25px 50px -12px rgba(0, 0, 0, 0.5)`,
        }}
      >
        {/* 顶部装饰条 */}
        <div 
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)`,
          }}
        />

        {/* 扫描线效果 */}
        <div className="absolute inset-0 scan-line opacity-20 pointer-events-none" />

        {/* 滚动容器 */}
        <div className="overflow-y-auto max-h-[90vh] custom-scrollbar">
          {/* 头部区域 */}
          <div className="relative p-6 sm:p-8 lg:p-10 pb-6 sm:pb-8">
            {/* 背景装饰 */}
            <div 
              className="absolute top-0 left-0 right-0 h-48 opacity-10"
              style={{
                background: `radial-gradient(circle at top, ${primaryColor}, transparent)`,
              }}
            />

            {/* 关闭按钮 */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-8 right-8 z-10 w-12 h-12 rounded-full glass-card border border-foreground/20 hover:border-neon-blue/80 flex items-center justify-center transition-all group"
            >
              <X className="w-5 h-5 text-foreground/60 group-hover:text-neon-blue transition-colors" />
            </motion.button>

            {/* 用户信息 */}
            <div className="relative flex items-start gap-8 mb-12">
              {/* 头像/恒星图标 */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="relative"
              >
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center relative overflow-hidden group"
                  style={{
                    backgroundColor: primaryColor + '20',
                    boxShadow: `0 0 40px ${primaryColor}60`,
                  }}
                >
                  <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${primaryColor}, transparent)`,
                    }}
                  />
                  {star.userAvatar ? (
                    <Image 
                      src={star.userAvatar} 
                      alt={star.userName}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <Star className="w-12 h-12 relative z-10 text-white drop-shadow-lg fill-current" />
                  )}
                  
                  {/* 脉冲效果 */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0, 0.5]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 rounded-2xl"
                    style={{ border: `2px solid ${primaryColor}` }}
                  />
                </div>
              </motion.div>

              {/* 姓名和职位 */}
              <div className="flex-1 pt-2">
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="font-display text-4xl font-bold mb-4 leading-tight"
                >
                  <span 
                    className="text-transparent bg-clip-text"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${primaryColor}, #ffffff)`,
                    }}
                  >
                    {star.userName}
                  </span>
                </motion.h2>
                
                {star.userTitle && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center gap-4 flex-wrap"
                  >
                    <div
                      className="px-4 py-1.5 rounded-full text-sm font-semibold border-2 flex items-center gap-2"
                      style={{
                        color: primaryColor,
                        backgroundColor: primaryColor + '20',
                        borderColor: primaryColor + '50',
                      }}
                    >
                      <Briefcase className="w-4 h-4" />
                      {star.userTitle}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* 社交链接 */}
            {star.socialLinks && Object.keys(star.socialLinks).length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4"
              >
                {Object.entries(star.socialLinks).map(([platform, url], index) => {
                  if (!url) return null;
                  const Icon = socialLinkIcons[platform] || ExternalLink;
                  return (
                    <motion.a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + index * 0.05 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="glass-card p-4 rounded-xl border border-foreground/10 hover:border-neon-blue/60 transition-all group flex items-center justify-center gap-3"
                    >
                      <Icon className="w-5 h-5 text-foreground/60 group-hover:text-neon-blue transition-colors" />
                      <span className="text-sm font-medium text-foreground/70 group-hover:text-neon-blue transition-colors capitalize">
                        {platform}
                      </span>
                    </motion.a>
                  );
                })}
              </motion.div>
            )}
          </div>

          {/* 内容区域 */}
          <div className="px-6 sm:px-8 lg:px-10 pb-8 sm:pb-10 space-y-12 sm:space-y-14">
            {/* 分隔线 */}
            <div className="relative h-px">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
            </div>

            {/* 个人简介 */}
            {star.userBio && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <h3 className="text-lg font-display font-semibold text-foreground mb-8 flex items-center gap-3">
                  <div 
                    className="w-1 h-6 rounded-full"
                    style={{
                      background: `linear-gradient(to bottom, ${primaryColor}, #9333ea)`,
                    }}
                  />
                  <Sparkles className="w-5 h-5" style={{ color: primaryColor }} />
                  个人简介
                </h3>
                <p className="text-foreground/80 leading-relaxed text-base pl-6">
                  {star.userBio}
                </p>
              </motion.div>
            )}

            {/* 技能标签 */}
            {star.userSkills && star.userSkills.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <h3 className="text-lg font-display font-semibold text-foreground mb-8 flex items-center gap-3">
                  <div 
                    className="w-1 h-6 rounded-full"
                    style={{
                      background: `linear-gradient(to bottom, #9333ea, #10b981)`,
                    }}
                  />
                  <Code2 className="w-5 h-5 text-neon-purple" />
                  技能专长
                </h3>
                <div className="flex flex-wrap gap-4 pl-6">
                  {star.userSkills.map((skill, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.9 + index * 0.05 }}
                      whileHover={{ scale: 1.1, y: -2 }}
                      className="px-5 py-2.5 rounded-lg text-sm font-medium border-2 transition-all cursor-pointer"
                      style={{
                        borderColor: primaryColor + '40',
                        color: primaryColor,
                        backgroundColor: primaryColor + '10',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = primaryColor + '20';
                        e.currentTarget.style.borderColor = primaryColor + '60';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = primaryColor + '10';
                        e.currentTarget.style.borderColor = primaryColor + '40';
                      }}
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 成就徽章 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="glass-card p-6 rounded-xl border border-foreground/10"
            >
              <div className="flex items-center gap-6">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: primaryColor + '20',
                    boxShadow: `0 0 20px ${primaryColor}40`,
                  }}
                >
                  <Award className="w-8 h-8" style={{ color: primaryColor }} />
                </div>
                <div>
                  <div className="text-xl font-bold mb-1" style={{ color: primaryColor }}>
                    星系创建者
                  </div>
                  <div className="text-sm text-foreground/60">
                    已在AI宇宙中建立了自己的星系
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 操作按钮 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              {star.socialLinks?.website && (
                <motion.a
                  href={star.socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 relative group overflow-hidden rounded-xl py-4 px-6 font-semibold transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}40, ${primaryColor}20)`,
                    border: `2px solid ${primaryColor}60`,
                    boxShadow: `0 0 20px ${primaryColor}40`,
                  }}
                >
                  <div className="relative z-10 flex items-center justify-center gap-2.5 text-white">
                    <ExternalLink className="w-5 h-5" />
                    <span>访问个人网站</span>
                  </div>
                  <div 
                    className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}80)`,
                    }}
                  />
                </motion.a>
              )}

              {star.socialLinks?.github && (
                <motion.a
                  href={star.socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 glass-card border-2 border-foreground/20 hover:border-neon-blue/60 px-6 py-4 rounded-xl transition-all flex items-center justify-center gap-2.5 font-semibold group"
                >
                  <Github className="w-5 h-5 group-hover:text-neon-blue transition-colors" />
                  <span className="group-hover:text-neon-blue transition-colors">GitHub主页</span>
                </motion.a>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

