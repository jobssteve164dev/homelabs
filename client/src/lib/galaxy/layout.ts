/**
 * 星系布局算法工具函数
 * 用于计算星系在3D空间中的位置和行星的公转轨道
 */

/**
 * 计算用户星系的3D坐标
 * 基于用户索引，使用阿基米德螺旋线在3D球面上分布
 * 
 * @param userIndex 用户索引（从0开始）
 * @returns 星系中心的3D坐标 {x, y, z}
 */
export function calculateGalaxyPosition(userIndex: number): { x: number; y: number; z: number } {
  const baseRadius = 20  // 基础半径
  const spiralGrowth = 3 // 螺旋增长系数
  const verticalSpread = 10 // 垂直分布范围
  
  // 阿基米德螺旋: r = a + b * θ
  const theta = userIndex * (Math.PI * 2 / 5) // 每5个用户转一圈
  const radius = baseRadius + spiralGrowth * userIndex
  
  // 3D坐标
  const x = radius * Math.cos(theta)
  const z = radius * Math.sin(theta)
  const y = (userIndex % 3 - 1) * verticalSpread // 三层垂直分布
  
  return { x, y, z }
}

/**
 * 检查两个星系是否重叠
 * 
 * @param pos1 第一个星系的位置
 * @param pos2 第二个星系的位置
 * @param minDistance 最小安全距离（默认15）
 * @returns 是否重叠
 */
export function checkGalaxyOverlap(
  pos1: { x: number; y: number; z: number },
  pos2: { x: number; y: number; z: number },
  minDistance: number = 15
): boolean {
  const distance = Math.sqrt(
    Math.pow(pos2.x - pos1.x, 2) + 
    Math.pow(pos2.y - pos1.y, 2) + 
    Math.pow(pos2.z - pos1.z, 2)
  )
  return distance < minDistance
}

/**
 * 计算行星的轨道参数
 * 确保每个行星都在独立的轨道上，不会重叠，并且通过智能速度分配避免碰撞
 * 
 * @param planetIndex 行星在该星系中的索引（0, 1, 2...）
 * @param existingOrbits 已使用的轨道半径数组
 * @param galaxyOffset 星系的角度偏移（用于让不同星系的行星初始角度不同）
 * @returns 轨道参数 {radius, angle, speed}
 */
export function calculatePlanetOrbit(
  planetIndex: number, 
  existingOrbits: number[] = [], 
  galaxyOffset: number = 0
) {
  const baseOrbitRadius = 4   // 第一个行星的轨道半径（增加基础距离）
  const orbitGap = 3.0         // 轨道间距（从1.5增加到3.0，确保足够安全距离）
  
  // 计算候选轨道半径
  let radius = baseOrbitRadius + planetIndex * orbitGap
  
  // 确保轨道半径唯一（不与现有轨道冲突）
  const tolerance = 0.5 // 轨道半径容差（从0.1增加到0.5，防止轨道重叠）
  let attempts = 0
  while (attempts < 50) {
    const hasConflict = existingOrbits.some(existingRadius => 
      Math.abs(existingRadius - radius) < tolerance
    )
    
    if (!hasConflict) {
      break
    }
    
    // 如果有冲突，尝试下一个轨道
    attempts++
    radius = baseOrbitRadius + (planetIndex + attempts) * orbitGap
  }
  
  // 智能角度分配：使用改进的黄金角分布，确保初始相位差
  const goldenAngle = 137.508 // 黄金角（度）
  const planetAngle = (planetIndex * goldenAngle) % 360
  const totalAngle = (planetAngle + galaxyOffset) % 360
  const angle = totalAngle * (Math.PI / 180) // 转换为弧度
  
  // 智能公转速度：基于轨道半径和碰撞避免算法
  const speed = calculateCollisionAvoidingSpeed(radius, planetIndex, existingOrbits)
  
  return {
    radius,
    angle,
    speed
  }
}

/**
 * 计算避免碰撞的公转速度
 * 通过精心选择速度比例，确保行星间保持安全的相位差
 * 
 * @param radius 当前行星的轨道半径
 * @param planetIndex 行星索引
 * @param existingOrbits 现有轨道半径数组
 * @returns 优化的公转速度
 */
function calculateCollisionAvoidingSpeed(
  radius: number, 
  planetIndex: number, 
  existingOrbits: number[]
): number {
  // 基础速度：遵循开普勒第三定律（内圈快，外圈慢）
  const baseSpeed = 0.2 / Math.sqrt(radius)
  
  // 如果这是第一个行星，使用基础速度
  if (planetIndex === 0) {
    return baseSpeed
  }
  
  // 为后续行星计算避免碰撞的速度
  // 使用无理数比例确保行星间不会形成简单的整数比例关系
  const irrationalMultipliers = [
    1.0,           // 第1个行星：基础速度
    1.6180339887,  // 第2个行星：黄金比例
    2.4142135623,  // 第3个行星：√2 + 1
    3.1415926535,  // 第4个行星：π
    4.2360679774,  // 第5个行星：2 + √5
    5.8284271247,  // 第6个行星：3 + 2√2
    7.4641016151,  // 第7个行星：4 + 2√3
    9.1622776601,  // 第8个行星：5 + 2√5
  ]
  
  // 选择对应的无理数乘数
  const multiplier = irrationalMultipliers[planetIndex] || (planetIndex * 1.4142135623)
  
  // 计算最终速度，确保与内圈行星保持安全相位差
  let finalSpeed = baseSpeed * multiplier
  
  // 速度限制：确保不会太快或太慢
  const minSpeed = 0.01  // 最小速度
  const maxSpeed = 0.5   // 最大速度
  
  finalSpeed = Math.max(minSpeed, Math.min(maxSpeed, finalSpeed))
  
  return finalSpeed
}

/**
 * 检查两个轨道是否满足最小安全距离要求
 * 考虑行星的实际大小和轨道半径差异
 * 
 * @param radius1 第一个轨道的半径
 * @param radius2 第二个轨道的半径
 * @param minDistance 最小安全距离（默认2.0）
 * @returns 是否满足安全距离要求
 */
export function checkOrbitSafety(
  radius1: number, 
  radius2: number, 
  minDistance: number = 2.0
): boolean {
  const radiusDiff = Math.abs(radius1 - radius2);
  return radiusDiff >= minDistance;
}

/**
 * 实时碰撞检测和动态速度调整
 * 在运行时检测行星间的最小距离，如果过近则动态调整速度
 * 
 * @param planets 当前所有行星的轨道参数
 * @param elapsedTime 已过时间
 * @returns 调整后的行星轨道参数
 */
export function detectAndAvoidCollisions(
  planets: Array<{
    id: string;
    radius: number;
    angle: number;
    speed: number;
  }>,
  elapsedTime: number
): Array<{
  id: string;
  radius: number;
  angle: number;
  speed: number;
}> {
  const minSafeDistance = 2.5; // 最小安全距离
  const adjustedPlanets = [...planets];
  
  // 检查每对行星的当前距离
  for (let i = 0; i < adjustedPlanets.length; i++) {
    for (let j = i + 1; j < adjustedPlanets.length; j++) {
      const planet1 = adjustedPlanets[i];
      const planet2 = adjustedPlanets[j];
      
      // 计算当前时刻两行星的位置
      const angle1 = planet1.angle + planet1.speed * elapsedTime;
      const angle2 = planet2.angle + planet2.speed * elapsedTime;
      
      // 计算两行星在3D空间中的距离
      const x1 = planet1.radius * Math.cos(angle1);
      const z1 = planet1.radius * Math.sin(angle1);
      const x2 = planet2.radius * Math.cos(angle2);
      const z2 = planet2.radius * Math.sin(angle2);
      
      const distance = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
      
      // 如果距离过近，调整速度
      if (distance < minSafeDistance) {
        // 为外圈行星减速，为内圈行星加速，增加相位差
        if (planet1.radius > planet2.radius) {
          // planet1是外圈，减速
          adjustedPlanets[i].speed *= 0.95;
        } else {
          // planet2是外圈，减速
          adjustedPlanets[j].speed *= 0.95;
        }
      }
    }
  }
  
  return adjustedPlanets;
}

/**
 * 预测未来碰撞风险
 * 分析行星在接下来一段时间内的运动轨迹，预测可能的碰撞点
 * 
 * @param planets 行星轨道参数
 * @param timeHorizon 预测时间范围（秒）
 * @returns 碰撞风险评估结果
 */
export function predictCollisionRisk(
  planets: Array<{
    id: string;
    radius: number;
    angle: number;
    speed: number;
  }>,
  timeHorizon: number = 100
): {
  hasRisk: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  closestApproach: number;
  riskPairs: Array<{planet1: string; planet2: string; minDistance: number; time: number}>;
} {
  let minDistance = Infinity;
  let closestTime = 0;
  const riskPairs: Array<{planet1: string; planet2: string; minDistance: number; time: number}> = [];
  
  // 在时间范围内采样，寻找最小距离
  for (let t = 0; t < timeHorizon; t += 0.1) {
    for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
        const planet1 = planets[i];
        const planet2 = planets[j];
        
        const angle1 = planet1.angle + planet1.speed * t;
        const angle2 = planet2.angle + planet2.speed * t;
        
        const x1 = planet1.radius * Math.cos(angle1);
        const z1 = planet1.radius * Math.sin(angle1);
        const x2 = planet2.radius * Math.cos(angle2);
        const z2 = planet2.radius * Math.sin(angle2);
        
        const distance = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestTime = t;
        }
        
        // 记录风险对
        if (distance < 3.0) {
          riskPairs.push({
            planet1: planet1.id,
            planet2: planet2.id,
            minDistance: distance,
            time: t
          });
        }
      }
    }
  }
  
  // 评估风险等级
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (minDistance < 2.0) {
    riskLevel = 'high';
  } else if (minDistance < 2.5) {
    riskLevel = 'medium';
  }
  
  return {
    hasRisk: minDistance < 3.0,
    riskLevel,
    closestApproach: minDistance,
    riskPairs
  };
}

/**
 * 实时计算行星的3D位置（基于当前时间）
 * 
 * @param galaxyCenter 星系中心坐标
 * @param orbitRadius 轨道半径
 * @param initialAngle 初始角度
 * @param orbitSpeed 公转速度
 * @param elapsedTime 已过时间（秒）
 * @returns 行星的当前3D坐标
 */
export function calculatePlanetPosition(
  galaxyCenter: { x: number; y: number; z: number },
  orbitRadius: number,
  initialAngle: number,
  orbitSpeed: number,
  elapsedTime: number
): [number, number, number] {
  const { x: gx, y: gy, z: gz } = galaxyCenter
  
  // 当前角度 = 初始角度 + 速度 * 时间
  const currentAngle = initialAngle + orbitSpeed * elapsedTime
  
  // 在XZ平面上公转
  const x = gx + orbitRadius * Math.cos(currentAngle)
  const z = gz + orbitRadius * Math.sin(currentAngle)
  const y = gy // Y轴保持不变
  
  return [x, y, z]
}

/**
 * 为新用户分配星系坐标（确保不与现有星系重叠）
 * 
 * @param existingGalaxies 现有星系的坐标列表
 * @param userIndex 用户索引
 * @param maxAttempts 最大尝试次数
 * @returns 新的星系坐标
 */
export function assignGalaxyPosition(
  existingGalaxies: Array<{ x: number; y: number; z: number }>,
  userIndex: number,
  maxAttempts: number = 50
): { x: number; y: number; z: number } {
  let attempts = 0
  let position = calculateGalaxyPosition(userIndex)
  
  // 检查是否与现有星系重叠
  while (attempts < maxAttempts) {
    let hasOverlap = false
    
    for (const existing of existingGalaxies) {
      if (checkGalaxyOverlap(position, existing)) {
        hasOverlap = true
        break
      }
    }
    
    if (!hasOverlap) {
      return position
    }
    
    // 如果重叠，微调位置
    attempts++
    const offset = attempts * 2
    position = {
      x: position.x + offset * Math.cos(attempts),
      y: position.y + (attempts % 3 - 1) * 2,
      z: position.z + offset * Math.sin(attempts),
    }
  }
  
  // 如果仍然无法找到合适位置，返回当前计算的位置
  console.warn(`无法为用户索引 ${userIndex} 找到无重叠的星系位置，返回当前位置`)
  return position
}

/**
 * 为行星分配轨道参数（确保轨道不重叠）
 * 
 * @param planetIndex 行星索引
 * @param existingOrbits 该星系现有的轨道半径列表
 * @returns 轨道参数
 */
export function assignPlanetOrbit(
  planetIndex: number,
  existingOrbits: number[]
): { radius: number; angle: number; speed: number } {
  const baseOrbitRadius = 3
  const orbitGap = 1.5
  
  // 找到第一个未被占用的轨道
  let orbitLevel = 0
  let radius = baseOrbitRadius + orbitLevel * orbitGap
  
  while (existingOrbits.includes(radius)) {
    orbitLevel++
    radius = baseOrbitRadius + orbitLevel * orbitGap
  }
  
  // 在该轨道上随机分配初始角度
  const angle = Math.random() * Math.PI * 2
  
  // 计算公转速度
  const speed = 0.2 / Math.sqrt(radius)
  
  return {
    radius,
    angle,
    speed
  }
}

