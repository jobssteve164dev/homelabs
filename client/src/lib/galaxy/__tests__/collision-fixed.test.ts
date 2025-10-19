/**
 * 修复后的碰撞避免算法测试
 */

import { detectAndAvoidCollisions } from '../layout';

describe('修复后的碰撞避免算法', () => {
  test('算法应该正确调整速度', () => {
    const planets = [
      { id: 'planet-1', radius: 4.0, angle: 0, speed: 0.1 },
      { id: 'planet-2', radius: 4.2, angle: 0.01, speed: 0.1 }, // 非常接近
    ];

    const adjusted = detectAndAvoidCollisions(planets, 0);
    
    console.log('Original speeds:', planets.map(p => p.speed));
    console.log('Adjusted speeds:', adjusted.map(p => p.speed));
    
    // 验证速度确实被调整了
    expect(adjusted[0].speed).not.toBe(0.1);
    expect(adjusted[1].speed).not.toBe(0.1);
    
    // 验证调整后的速度在合理范围内，且变化不会太剧烈
    adjusted.forEach((planet, index) => {
      expect(planet.speed).toBeGreaterThan(0.001);
      expect(planet.speed).toBeLessThan(1.0);
      
      // 验证速度变化不会太剧烈（避免瞬移）
      const originalSpeed = planets[index].speed;
      const speedChange = Math.abs(planet.speed - originalSpeed) / originalSpeed;
      expect(speedChange).toBeLessThan(0.5); // 速度变化不应超过50%
    });
  });

  test('多次调用不应该累积调整', () => {
    const planets = [
      { id: 'planet-1', radius: 4.0, angle: 0, speed: 0.1 },
      { id: 'planet-2', radius: 4.2, angle: 0.01, speed: 0.1 },
    ];

    // 第一次调用
    const adjusted1 = detectAndAvoidCollisions(planets, 0);
    console.log('First call:', adjusted1.map(p => p.speed));
    
    // 第二次调用（使用原始数据）
    const adjusted2 = detectAndAvoidCollisions(planets, 0);
    console.log('Second call:', adjusted2.map(p => p.speed));
    
    // 两次调用的结果应该相同
    expect(adjusted1[0].speed).toBeCloseTo(adjusted2[0].speed, 5);
    expect(adjusted1[1].speed).toBeCloseTo(adjusted2[1].speed, 5);
  });

  test('多个行星时不应该重复调整', () => {
    const planets = [
      { id: 'planet-1', radius: 4.0, angle: 0, speed: 0.1 },
      { id: 'planet-2', radius: 4.2, angle: 0.01, speed: 0.1 }, // 接近planet-1
      { id: 'planet-3', radius: 4.4, angle: 0.02, speed: 0.1 }, // 接近planet-2
    ];

    const adjusted = detectAndAvoidCollisions(planets, 0);
    
    console.log('Original speeds:', planets.map(p => p.speed));
    console.log('Adjusted speeds:', adjusted.map(p => p.speed));
    
    // 验证速度调整是合理的，不会出现极端值
    adjusted.forEach(planet => {
      expect(planet.speed).toBeGreaterThan(0.001);
      expect(planet.speed).toBeLessThan(1.0);
    });
  });

  test('安全距离的行星不应该被调整', () => {
    const planets = [
      { id: 'planet-1', radius: 4.0, angle: 0, speed: 0.1 },
      { id: 'planet-2', radius: 10.0, angle: 0.1, speed: 0.12 }, // 安全距离
    ];

    const adjusted = detectAndAvoidCollisions(planets, 0);
    
    // 安全距离的情况下，速度不应该被调整
    expect(adjusted[0].speed).toBe(0.1);
    expect(adjusted[1].speed).toBe(0.12);
  });
});
