/**
 * 统一数据选择器
 * 确保敏感字段不被暴露到API响应中
 */

import { Prisma } from '@prisma/client';

/**
 * 用户公开信息选择器
 * 显式排除password字段,防止敏感信息泄露
 */
export const userSelectPublic = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatar: true,
  galaxyJoinedAt: true,
  galaxyX: true,
  galaxyY: true,
  galaxyZ: true,
  createdAt: true,
  updatedAt: true,
  password: false, // 显式排除密码字段
} satisfies Prisma.UserSelect;

/**
 * 用户基本信息选择器 (用于关联查询)
 * 仅包含最基本的用户信息
 */
export const userSelectBasic = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
} satisfies Prisma.UserSelect;

/**
 * 用户统计信息选择器
 * 用于管理后台展示
 */
export const userSelectWithStats = {
  ...userSelectPublic,
  _count: {
    select: {
      projects: true,
    },
  },
} satisfies Prisma.UserSelect;

/**
 * 项目公开信息选择器
 * 包含所有公开字段
 */
export const projectSelectPublic = {
  id: true,
  title: true,
  description: true,
  category: true,
  tags: true,
  projectType: true,
  userBio: true,
  userTitle: true,
  userSkills: true,
  socialLinks: true,
  orbitRadius: true,
  orbitAngle: true,
  orbitSpeed: true,
  demoUrl: true,
  githubUrl: true,
  imageUrl: true,
  isActive: true,
  viewCount: true,
  likeCount: true,
  createdAt: true,
  updatedAt: true,
  authorId: true,
} satisfies Prisma.ProjectSelect;

/**
 * 项目详情选择器 (包含作者信息)
 * 用于项目详情页面
 */
export const projectSelectWithAuthor = {
  ...projectSelectPublic,
  author: {
    select: userSelectBasic,
  },
} satisfies Prisma.ProjectSelect;

/**
 * 从用户对象中移除密码字段的类型安全函数
 * @param user 包含密码的用户对象
 * @returns 不包含密码的用户对象
 */
export function excludePassword<T extends { password?: string }>(
  user: T
): Omit<T, 'password'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * 批量移除密码字段
 * @param users 用户数组
 * @returns 不包含密码的用户数组
 */
export function excludePasswordBatch<T extends { password?: string }>(
  users: T[]
): Omit<T, 'password'>[] {
  return users.map(excludePassword);
}

