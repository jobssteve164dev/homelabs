// 科幻未来风主题配置
export const theme = {
  colors: {
    // 主色调 - 霓虹蓝/紫/青色
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9', // 主蓝色
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    secondary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7', // 主紫色
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
    },
    accent: {
      50: '#ecfeff',
      100: '#cffafe',
      200: '#a5f3fc',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#06b6d4', // 主青色
      600: '#0891b2',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
    },
    // 科幻背景色
    background: {
      dark: '#0a0a0a',
      darker: '#050505',
      card: 'rgba(15, 23, 42, 0.8)', // 半透明深蓝
      glass: 'rgba(15, 23, 42, 0.3)', // 玻璃态
    },
    // 霓虹效果色
    neon: {
      blue: '#00ffff',
      purple: '#ff00ff',
      green: '#00ff00',
      pink: '#ff1493',
      orange: '#ff8c00',
    },
    // 状态色
    success: '#00ff88',
    warning: '#ffaa00',
    error: '#ff3366',
    info: '#00aaff',
  },
  gradients: {
    // 科幻渐变
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    accent: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    dark: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%)',
    neon: 'linear-gradient(135deg, #00ffff 0%, #ff00ff 100%)',
  },
  effects: {
    // 发光效果
    glow: {
      blue: '0 0 20px rgba(0, 255, 255, 0.5)',
      purple: '0 0 20px rgba(255, 0, 255, 0.5)',
      green: '0 0 20px rgba(0, 255, 0, 0.5)',
    },
    // 阴影效果
    shadow: {
      dark: '0 10px 25px rgba(0, 0, 0, 0.5)',
      neon: '0 0 30px rgba(0, 255, 255, 0.3)',
      glass: '0 8px 32px rgba(31, 38, 135, 0.37)',
    },
  },
  animations: {
    // 动画持续时间
    duration: {
      fast: '0.2s',
      normal: '0.3s',
      slow: '0.5s',
    },
    // 缓动函数
    easing: {
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },
  },
  typography: {
    // 字体族
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      display: ['Orbitron', 'Inter', 'sans-serif'], // 科幻显示字体
    },
    // 字体大小
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },
  },
  spacing: {
    // 间距系统
    section: '6rem',
    container: '1.5rem',
    card: '1rem',
    element: '0.5rem',
  },
  breakpoints: {
    // 响应式断点
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const

export type Theme = typeof theme
