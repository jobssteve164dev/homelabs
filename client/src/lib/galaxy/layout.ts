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
 * 
 * @param planetIndex 行星索引（从0开始）
 * @param totalPlanets 该星系总行星数
 * @returns 轨道参数 {radius, angle, speed}
 */
export function calculatePlanetOrbit(planetIndex: number, totalPlanets: number) {
  const baseOrbitRadius = 3   // 第一个行星的轨道半径
  const orbitGap = 1.5         // 轨道间距
  
  // 轨道半径：从内到外递增
  const radius = baseOrbitRadius + planetIndex * orbitGap
  
  // 初始角度：均匀分布
  const angle = (planetIndex * 360 / totalPlanets) * (Math.PI / 180)
  
  // 公转速度：内圈快，外圈慢（开普勒第三定律的简化）
  const speed = 0.2 / Math.sqrt(radius)
  
  return {
    radius,
    angle,
    speed
  }
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

