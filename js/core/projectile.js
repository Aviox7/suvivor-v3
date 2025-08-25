/**
 * Projectile module - 投射物核心逻辑
 * 提供投射物的创建、更新、碰撞检测和管理功能
 * @module Projectile
 */

/**
 * 投射物类型枚举
 * @typedef {'basic'|'piercing'|'explosive'|'magic'} ProjectileType
 */

/**
 * 投射物配置对象
 * @typedef {Object} ProjectileConfig
 * @property {number} damage - 伤害值
 * @property {number} speed - 移动速度
 * @property {number} size - 碰撞体积大小
 * @property {number} maxLifeTime - 最大生存时间（毫秒）
 * @property {boolean} piercing - 是否具有穿透能力
 * @property {number} maxPierceCount - 最大穿透次数
 */

/**
 * 投射物位置信息
 * @typedef {Object} ProjectilePosition
 * @property {number} x - X坐标
 * @property {number} y - Y坐标
 */

/**
 * 投射物速度信息
 * @typedef {Object} ProjectileVelocity
 * @property {number} vx - X方向速度
 * @property {number} vy - Y方向速度
 */

/**
 * 投射物状态信息
 * @typedef {Object} ProjectileStatus
 * @property {ProjectilePosition} position - 位置信息
 * @property {ProjectileVelocity} velocity - 速度信息
 * @property {number} damage - 当前伤害值
 * @property {number} size - 当前大小
 * @property {ProjectileType} type - 投射物类型
 * @property {boolean} isActive - 是否处于激活状态
 * @property {number} lifeTime - 已存活时间（毫秒）
 * @property {number} pierceCount - 已穿透次数
 */

/**
 * 投射物统计信息
 * @typedef {Object} ProjectileStats
 * @property {number} totalFired - 总发射数量
 * @property {number} totalHits - 总命中数量
 * @property {number} totalDamage - 总伤害输出
 * @property {number} activeCount - 当前活跃数量
 */

/**
 * 投射物基类
 * 表示游戏中的投射物实体，包含位置、速度、伤害等属性和行为
 */
export class Projectile {
  /**
     * 创建投射物实例
     * 根据起始位置、目标位置和类型创建投射物，并计算其运动轨迹
     * @param {number} x - 初始X坐标（像素）
     * @param {number} y - 初始Y坐标（像素）
     * @param {number} targetX - 目标X坐标（像素）
     * @param {number} targetY - 目标Y坐标（像素）
     * @param {ProjectileType} [type='basic'] - 投射物类型，默认为基础类型
     * @example
     * // 创建一个从玩家位置射向敌人的基础投射物
     * const projectile = new Projectile(playerX, playerY, enemyX, enemyY, 'basic');
     * 
     * // 创建一个穿透型投射物
     * const piercingProjectile = new Projectile(100, 100, 200, 200, 'piercing');
     */
  constructor(x, y, targetX, targetY, type = 'basic') {
    /** @type {number} X坐标位置 */
    this.x = x;
    /** @type {number} Y坐标位置 */
    this.y = y;
    /** @type {ProjectileType} 投射物类型 */
    this.type = type;
    /** @type {boolean} 是否处于激活状态 */
    this.isActive = true;
    /** @type {number} 已存活时间（毫秒） */
    this.lifeTime = 0;
    /** @type {number} 已穿透次数 */
    this.pierceCount = 0;
        
    // 根据类型初始化属性
    this.initializeByType(type);
        
    // 计算速度向量
    this.calculateVelocity(targetX, targetY);
  }

  /**
     * 根据类型初始化投射物属性
     * 根据投射物类型设置伤害、速度、大小等基础属性
     * @param {ProjectileType} type - 投射物类型
     * @example
     * // 初始化为爆炸型投射物
     * projectile.initializeByType('explosive');
     */
  initializeByType(type) {
    const projectileTypes = {
      basic: {
        damage: 25,
        speed: 8,
        size: 3,
        maxLifeTime: 2000,
        piercing: false,
        maxPierceCount: 0
      },
      piercing: {
        damage: 20,
        speed: 10,
        size: 4,
        maxLifeTime: 3000,
        piercing: true,
        maxPierceCount: 3
      },
      explosive: {
        damage: 40,
        speed: 6,
        size: 5,
        maxLifeTime: 1500,
        piercing: false,
        maxPierceCount: 0
      },
      magic: {
        damage: 35,
        speed: 12,
        size: 6,
        maxLifeTime: 2500,
        piercing: true,
        maxPierceCount: 2
      }
    };
        
    const config = projectileTypes[type] || projectileTypes.basic;
        
    /** @type {number} 伤害值 */
    this.damage = config.damage;
    /** @type {number} 移动速度 */
    this.speed = config.speed;
    /** @type {number} 碰撞体积大小 */
    this.size = config.size;
    /** @type {number} 最大生存时间（毫秒） */
    this.maxLifeTime = config.maxLifeTime;
    /** @type {boolean} 是否具有穿透能力 */
    this.piercing = config.piercing;
    /** @type {number} 最大穿透次数 */
    this.maxPierceCount = config.maxPierceCount;
  }

  /**
     * 计算速度向量
     * 根据目标位置计算投射物的X和Y方向速度分量
     * @param {number} targetX - 目标X坐标（像素）
     * @param {number} targetY - 目标Y坐标（像素）
     * @example
     * // 重新计算投射物朝向新目标的速度
     * projectile.calculateVelocity(newTargetX, newTargetY);
     */
  calculateVelocity(targetX, targetY) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
        
    if (distance > 0) {
      /** @type {number} X方向速度分量 */
      this.vx = (dx / distance) * this.speed;
      /** @type {number} Y方向速度分量 */
      this.vy = (dy / distance) * this.speed;
    } else {
      this.vx = 0;
      this.vy = 0;
    }
  }

  /**
     * 更新投射物状态
     * 更新位置、生存时间，检查边界和生命周期
     * @param {number} deltaTime - 时间间隔（毫秒）
     * @example
     * // 在游戏循环中更新投射物
     * projectile.update(16); // 60fps下约16ms
     */
  update(deltaTime) {
    if (!this.isActive) return;
        
    // 更新位置
    this.x += this.vx;
    this.y += this.vy;
        
    // 更新生存时间
    this.lifeTime += deltaTime;
        
    // 检查是否超出生存时间
    if (this.lifeTime >= this.maxLifeTime) {
      this.isActive = false;
    }
        
    // 检查是否超出屏幕边界
    if (this.x < -50 || this.x > 850 || this.y < -50 || this.y > 650) {
      this.isActive = false;
    }
  }

  /**
     * 检查与敌人的碰撞
     * 使用圆形碰撞检测判断投射物是否与敌人发生碰撞
     * @param {import('./enemy.js').Enemy} enemy - 敌人对象
     * @returns {boolean} 是否发生碰撞
     * @example
     * // 检查投射物是否击中敌人
     * if (projectile.checkCollision(enemy)) {
     *   projectile.onHit(enemy);
     * }
     */
  checkCollision(enemy) {
    if (!this.isActive || !enemy || enemy.isDead) return false;
        
    const dx = this.x - enemy.x;
    const dy = this.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
        
    return distance < (this.size + enemy.size);
  }

  /**
     * 处理碰撞
     * 对敌人造成伤害，处理穿透逻辑，并根据情况销毁投射物
     * @param {import('./enemy.js').Enemy} enemy - 敌人对象
     * @returns {boolean} 是否成功造成伤害
     * @example
     * // 投射物击中敌人时的处理
     * const hit = projectile.onHit(enemy);
     * if (hit) {
     *   console.log(`造成 ${projectile.damage} 点伤害`);
     * }
     */
  onHit(enemy) {
    if (!this.isActive || !enemy || enemy.isDead) return false;
        
    // 造成伤害
    const killed = enemy.takeDamage(this.damage);
        
    // 处理穿透
    if (this.piercing && this.pierceCount < this.maxPierceCount) {
      this.pierceCount++;
    } else {
      this.isActive = false;
    }
        
    return true;
  }

  /**
     * 获取投射物状态信息
     * 返回包含投射物当前状态的完整信息对象
     * @returns {ProjectileStatus} 投射物状态信息对象
     * @example
     * // 获取投射物状态用于调试或UI显示
     * const status = projectile.getStatus();
     * console.log(`位置: (${status.position.x}, ${status.position.y})`);
     * console.log(`伤害: ${status.damage}, 类型: ${status.type}`);
     */
  getStatus() {
    return {
      position: { x: this.x, y: this.y },
      velocity: { vx: this.vx, vy: this.vy },
      damage: this.damage,
      size: this.size,
      type: this.type,
      isActive: this.isActive,
      lifeTime: this.lifeTime,
      pierceCount: this.pierceCount
    };
  }
}

/**
 * 投射物管理器
 * 负责管理所有投射物的创建、更新、碰撞检测和生命周期管理
 */
export class ProjectileManager {
  /**
     * 创建投射物管理器实例
     * 初始化投射物列表和发射控制参数
     */
  constructor() {
    /** @type {Projectile[]} 投射物列表 */
    this.projectiles = [];
    /** @type {number} 上次发射时间戳（毫秒） */
    this.lastFireTime = 0;
    /** @type {number} 发射间隔时间（毫秒） */
    this.fireRate = 300; // 每300ms发射一次
  }

  /**
     * 更新所有投射物
     * 更新投射物状态，处理碰撞检测，移除非激活投射物
     * @param {number} deltaTime - 时间间隔（毫秒）
     * @param {import('./enemy.js').Enemy[]} [enemies=[]] - 敌人数组
     * @example
     * // 在游戏循环中更新投射物管理器
     * projectileManager.update(16, enemyManager.getAliveEnemies());
     */
  update(deltaTime, enemies = []) {
    // 更新所有投射物
    this.projectiles.forEach(projectile => {
      projectile.update(deltaTime);
            
      // 检查与敌人的碰撞
      if (projectile.isActive) {
        enemies.forEach(enemy => {
          if (projectile.checkCollision(enemy)) {
            projectile.onHit(enemy);
          }
        });
      }
    });
        
    // 移除非激活的投射物
    this.projectiles = this.projectiles.filter(projectile => projectile.isActive);
  }

  /**
     * 发射投射物
     * 在指定位置创建投射物并射向目标，受发射冷却时间限制
     * @param {number} x - 发射起始X坐标（像素）
     * @param {number} y - 发射起始Y坐标（像素）
     * @param {number} targetX - 目标X坐标（像素）
     * @param {number} targetY - 目标Y坐标（像素）
     * @param {ProjectileType} [type='basic'] - 投射物类型，默认为基础类型
     * @returns {boolean} 是否成功发射（false表示在冷却时间内）
     * @example
     * // 从玩家位置向鼠标位置发射基础投射物
     * const fired = projectileManager.fire(playerX, playerY, mouseX, mouseY, 'basic');
     * if (fired) {
     *   console.log('投射物发射成功');
     * }
     */
  fire(x, y, targetX, targetY, type = 'basic') {
    const currentTime = Date.now();
        
    // 检查发射冷却
    if (currentTime - this.lastFireTime < this.fireRate) {
      return false;
    }
        
    const projectile = new Projectile(x, y, targetX, targetY, type);
    this.projectiles.push(projectile);
    this.lastFireTime = currentTime;
        
    return true;
  }

  /**
     * 自动瞄准最近的敌人并发射
     * 自动寻找距离玩家最近的敌人并向其发射投射物
     * @param {number} playerX - 玩家X坐标（像素）
     * @param {number} playerY - 玩家Y坐标（像素）
     * @param {import('./enemy.js').Enemy[]} enemies - 敌人数组
     * @param {ProjectileType} [type='basic'] - 投射物类型，默认为基础类型
     * @returns {boolean} 是否成功发射（false表示无目标或在冷却时间内）
     * @example
     * // 自动向最近的敌人发射穿透投射物
     * const autoFired = projectileManager.autoFire(playerX, playerY, enemies, 'piercing');
     * if (autoFired) {
     *   console.log('自动发射成功');
     * }
     */
  autoFire(playerX, playerY, enemies, type = 'basic') {
    if (!enemies || enemies.length === 0) return false;
        
    // 找到最近的敌人
    let nearestEnemy = null;
    let nearestDistance = Infinity;
        
    enemies.forEach(enemy => {
      if (!enemy.isDead) {
        const dx = enemy.x - playerX;
        const dy = enemy.y - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
                
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestEnemy = enemy;
        }
      }
    });
        
    if (nearestEnemy) {
      return this.fire(playerX, playerY, nearestEnemy.x, nearestEnemy.y, type);
    }
        
    return false;
  }

  /**
     * 设置发射速率
     * 调整投射物发射间隔时间，影响攻击频率
     * @param {number} rate - 发射间隔时间（毫秒），最小值为50ms
     * @example
     * // 设置更快的发射速率（每200ms发射一次）
     * projectileManager.setFireRate(200);
     * 
     * // 设置较慢的发射速率（每500ms发射一次）
     * projectileManager.setFireRate(500);
     */
  setFireRate(rate) {
    this.fireRate = Math.max(50, rate); // 最小50ms间隔
  }

  /**
     * 获取当前活跃投射物数量
     * 返回当前在场景中活跃的投射物总数
     * @returns {number} 活跃投射物数量
     * @example
     * // 检查当前投射物数量
     * const count = projectileManager.getActiveCount();
     * console.log(`当前有 ${count} 个投射物在飞行`);
     */
  getActiveCount() {
    return this.projectiles.length;
  }

  /**
     * 获取所有活跃投射物
     * 返回当前所有活跃投射物的引用数组，用于渲染或其他处理
     * @returns {Projectile[]} 投射物数组
     * @example
     * // 获取所有投射物进行渲染
     * const projectiles = projectileManager.getAllProjectiles();
     * projectiles.forEach(projectile => {
     *   renderer.drawProjectile(projectile);
     * });
     */
  getAllProjectiles() {
    return this.projectiles;
  }

  /**
     * 清除所有投射物
     * 立即移除场景中的所有投射物，通常用于游戏重置或场景切换
     * @example
     * // 游戏结束时清除所有投射物
     * projectileManager.clearAll();
     * console.log('所有投射物已清除');
     */
  clearAll() {
    this.projectiles = [];
  }
}

/**
 * 默认导出的投射物管理器实例
 * 全局单例，用于管理游戏中的所有投射物
 * @type {ProjectileManager}
 * @example
 * // 导入并使用投射物管理器
 * import projectileManager from './projectile.js';
 * 
 * // 发射投射物
 * projectileManager.fire(playerX, playerY, targetX, targetY, 'basic');
 * 
 * // 在游戏循环中更新
 * projectileManager.update(deltaTime, enemies);
 */
export default new ProjectileManager();