/**
 * 统一输入验证模块
 * 使用Zod进行类型安全的输入验证
 */

import { z } from 'zod';

// ========== 认证相关验证 ==========

/**
 * 密码验证Schema
 * 要求: 8-100位, 包含大小写字母和数字
 */
export const passwordSchema = z.string()
  .min(8, "密码至少8位")
  .max(100, "密码最多100位")
  .regex(/[A-Z]/, "密码必须包含大写字母")
  .regex(/[a-z]/, "密码必须包含小写字母")
  .regex(/[0-9]/, "密码必须包含数字")
  .regex(/^\S*$/, "密码不能包含空格");

/**
 * 邮箱验证Schema
 * 要求: 标准邮箱格式, 最大255字符
 */
export const emailSchema = z.string()
  .email("邮箱格式不正确")
  .max(255, "邮箱地址过长")
  .toLowerCase()
  .trim();

/**
 * 用户名验证Schema
 * 要求: 1-100字符
 */
export const nameSchema = z.string()
  .min(1, "姓名不能为空")
  .max(100, "姓名最多100个字符")
  .trim();

/**
 * 注册请求验证Schema
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
});

/**
 * 账户更新Schema（名称可选，密码修改需提供当前密码）
 */
export const accountUpdateSchema = z.object({
  name: nameSchema.optional(),
  currentPassword: z.string().min(1, "当前密码不能为空").optional(),
  newPassword: passwordSchema.optional(),
}).refine((data) => {
  // 如果提供 newPassword，必须同时提供 currentPassword
  if (data.newPassword && !data.currentPassword) return false;
  return true;
}, { message: "修改密码需要提供当前密码", path: ["currentPassword"] });

/**
 * 登录请求验证Schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "密码不能为空"), // 登录时不验证强度
});

// ========== 项目相关验证 ==========

/**
 * URL验证Schema (可选)
 */
export const urlSchema = z.string()
  .url("URL格式不正确")
  .max(500, "URL过长")
  .optional()
  .or(z.literal(''));

/**
 * 项目标题验证Schema
 */
export const projectTitleSchema = z.string()
  .min(1, "标题不能为空")
  .max(100, "标题最多100个字符")
  .trim();

/**
 * 项目描述验证Schema
 */
export const projectDescriptionSchema = z.string()
  .min(1, "描述不能为空")
  .max(5000, "描述最多5000个字符")
  .trim();

/**
 * 项目分类验证Schema
 */
export const projectCategorySchema = z.string()
  .min(1, "分类不能为空")
  .max(50, "分类名称过长");

/**
 * 项目标签验证Schema
 */
export const projectTagsSchema = z.array(
  z.string().max(30, "单个标签最多30个字符")
).max(10, "最多10个标签");

/**
 * 项目创建请求验证Schema
 */
export const createProjectSchema = z.object({
  title: projectTitleSchema,
  description: projectDescriptionSchema,
  category: projectCategorySchema,
  tags: projectTagsSchema.optional(),
  demoUrl: urlSchema,
  githubUrl: urlSchema,
  imageUrl: urlSchema,
});

/**
 * 项目更新请求验证Schema (所有字段可选)
 */
export const updateProjectSchema = z.object({
  title: projectTitleSchema.optional(),
  description: projectDescriptionSchema.optional(),
  category: projectCategorySchema.optional(),
  tags: projectTagsSchema.optional(),
  demoUrl: urlSchema,
  githubUrl: urlSchema,
  imageUrl: urlSchema,
  isActive: z.boolean().optional(),
});

// ========== 恒星项目相关验证 ==========

/**
 * 用户简介验证Schema
 */
export const userBioSchema = z.string()
  .max(500, "简介最多500个字符")
  .optional();

/**
 * 用户头衔验证Schema
 */
export const userTitleSchema = z.string()
  .max(100, "头衔最多100个字符")
  .optional();

/**
 * 用户技能验证Schema
 */
export const userSkillsSchema = z.array(
  z.string().max(50, "单个技能最多50个字符")
).max(20, "最多20个技能标签").optional();

/**
 * 社交链接验证Schema
 */
export const socialLinksSchema = z.record(
  z.string(),
  urlSchema
).optional();

/**
 * 恒星项目创建请求验证Schema
 */
export const createStarProjectSchema = z.object({
  title: projectTitleSchema,
  description: projectDescriptionSchema,
  userBio: userBioSchema,
  userTitle: userTitleSchema,
  userSkills: userSkillsSchema,
  socialLinks: socialLinksSchema,
  imageUrl: urlSchema,
});

// ========== 工具函数 ==========

/**
 * 验证并解析请求体
 * @param schema Zod验证Schema
 * @param data 待验证数据
 * @returns 解析后的数据或错误信息
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // 提取第一个错误信息
      const firstError = error.issues[0];
      return { 
        success: false, 
        error: firstError?.message || "验证失败"
      };
    }
    return { 
      success: false, 
      error: "数据验证失败" 
    };
  }
}

/**
 * 检查密码强度 (用于实时反馈)
 * @param password 密码
 * @returns 强度等级 weak/medium/strong
 */
export function checkPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length < 8) return 'weak';
  
  let score = 0;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;
  
  if (score <= 2) return 'weak';
  if (score <= 3) return 'medium';
  return 'strong';
}

