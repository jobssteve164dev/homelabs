/**
 * Jest测试设置文件
 */

// 设置测试环境
process.env.NODE_ENV = 'test';

// 模拟Three.js环境
global.THREE = {
  Vector3: class {
    constructor(public x = 0, public y = 0, public z = 0) {}
    distanceTo(other: any) {
      return Math.sqrt(
        Math.pow(this.x - other.x, 2) + 
        Math.pow(this.y - other.y, 2) + 
        Math.pow(this.z - other.z, 2)
      );
    }
  },
  Group: class {},
  BackSide: 1,
};

// 模拟性能API
global.performance = {
  now: () => Date.now(),
} as any;
