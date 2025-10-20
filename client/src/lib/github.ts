/**
 * GitHub公开API集成模块
 * 用于获取用户仓库并过滤AI相关项目
 */

// AI相关关键词（用于识别AI项目）
const AI_KEYWORDS = [
  'ai', 'ml', 'gpt', 'llm', 'chatbot', 'neural',
  'deep-learning', 'machine-learning', 'tensorflow',
  'pytorch', 'transformer', 'langchain', 'openai',
  'stable-diffusion', 'diffusion', 'whisper',
  'bert', 'nlp', 'computer-vision', 'reinforcement',
  'agent', 'rag', 'embedding', 'vector', 'semantic'
];

// GitHub仓库接口
export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  created_at: string;
  updated_at: string;
}

// 导入结果接口
export interface ImportResult {
  total: number;
  aiProjects: number;
  projects: {
    title: string;
    description: string;
    githubUrl: string;
    demoUrl?: string;
    tags: string[];
    category: string;
  }[];
}

/**
 * 从GitHub URL提取用户名
 */
export function extractGitHubUsername(githubUrl: string): string | null {
  try {
    const url = new URL(githubUrl);
    if (url.hostname !== 'github.com') {
      return null;
    }
    const username = url.pathname.split('/')[1];
    return username || null;
  } catch {
    return null;
  }
}

/**
 * 检查仓库是否为AI相关项目
 */
export function isAIProject(repo: GitHubRepo): boolean {
  const searchText = [
    repo.name,
    repo.description || '',
    ...(repo.topics || []),
    repo.language || ''
  ].join(' ').toLowerCase();

  return AI_KEYWORDS.some(keyword => searchText.includes(keyword));
}

/**
 * 映射GitHub语言到项目分类
 */
export function mapLanguageToCategory(language: string | null): string {
  if (!language) return 'AI工具';
  
  const categoryMap: Record<string, string> = {
    'Python': 'AI/ML',
    'JavaScript': 'Web开发',
    'TypeScript': 'Web开发',
    'Jupyter Notebook': 'AI/ML',
    'C++': '系统开发',
    'Go': '后端开发',
    'Rust': '系统开发',
    'Java': '企业应用',
  };

  return categoryMap[language] || 'AI工具';
}

/**
 * 获取GitHub用户的所有公开仓库
 */
export async function fetchGitHubRepos(username: string): Promise<GitHubRepo[]> {
  try {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100&sort=updated&type=owner`,
      {
        headers: {
          'User-Agent': 'HomeLabs-AI-Universe',
          'Accept': 'application/vnd.github.v3+json',
        },
        // 5秒超时
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('GitHub用户不存在');
      }
      if (response.status === 403) {
        throw new Error('GitHub API限速，请稍后再试');
      }
      throw new Error(`GitHub API错误: ${response.status}`);
    }

    const repos: GitHubRepo[] = await response.json();
    return repos;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('获取GitHub仓库失败');
  }
}

/**
 * 过滤并转换AI项目
 */
export function filterAndTransformRepos(repos: GitHubRepo[]): ImportResult['projects'] {
  const aiRepos = repos.filter(isAIProject);

  return aiRepos.map(repo => ({
    title: repo.name,
    description: repo.description || '暂无描述',
    githubUrl: repo.html_url,
    demoUrl: repo.homepage || undefined,
    tags: repo.topics || [],
    category: mapLanguageToCategory(repo.language),
  }));
}

/**
 * 完整的GitHub项目导入流程
 */
export async function importGitHubProjects(githubUrl: string): Promise<ImportResult> {
  // 1. 提取用户名
  const username = extractGitHubUsername(githubUrl);
  if (!username) {
    throw new Error('无效的GitHub URL格式');
  }

  // 2. 获取所有仓库
  const repos = await fetchGitHubRepos(username);

  // 3. 过滤AI项目并转换
  const projects = filterAndTransformRepos(repos);

  return {
    total: repos.length,
    aiProjects: projects.length,
    projects,
  };
}

