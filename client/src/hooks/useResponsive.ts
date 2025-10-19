import { useState, useEffect } from 'react';

export interface ResponsiveConfig {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
  pixelRatio: number;
  isTouchDevice: boolean;
}

export function useResponsive(): ResponsiveConfig {
  const [config, setConfig] = useState<ResponsiveConfig>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        width: 1920,
        height: 1080,
        pixelRatio: 1,
        isTouchDevice: false,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    return {
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      width,
      height,
      pixelRatio,
      isTouchDevice,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const pixelRatio = window.devicePixelRatio || 1;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      setConfig({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        width,
        height,
        pixelRatio,
        isTouchDevice,
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return config;
}

// 根据设备类型获取推荐的渲染质量
export function getQualityPreset(config: ResponsiveConfig): {
  starCount: number;
  planetSegments: number;
  textureResolution: number;
  shadowsEnabled: boolean;
  antialias: boolean;
  pixelRatio: number;
} {
  if (config.isMobile) {
    return {
      starCount: 3000,
      planetSegments: 32,
      textureResolution: 512,
      shadowsEnabled: false,
      antialias: false,
      pixelRatio: Math.min(config.pixelRatio, 1.5),
    };
  }

  if (config.isTablet) {
    return {
      starCount: 5000,
      planetSegments: 48,
      textureResolution: 768,
      shadowsEnabled: false,
      antialias: true,
      pixelRatio: Math.min(config.pixelRatio, 2),
    };
  }

  return {
    starCount: 8000,
    planetSegments: 64,
    textureResolution: 1024,
    shadowsEnabled: true,
    antialias: true,
    pixelRatio: Math.min(config.pixelRatio, 2),
  };
}

