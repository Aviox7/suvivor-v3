/**
 * @fileoverview 对象池系统 - 优化内存分配和垃圾回收
 * @author Qoder Team
 * @version 2.0.0
 */

import eventBus from '../core/event-bus.js';

/**
 * @typedef {Function} CreateFunction
 * @returns {Object} 新创建的对象
 */

/**
 * @typedef {Function} ResetFunction
 * @param {Object} obj - 要重置的对象
 */

/**
 * @typedef {Function} ValidateFunction
 * @param {Object} obj - 要验证的对象
 * @returns {boolean} 对象是否有效
 */

/**
 * 对象池类 - 减少对象创建和垃圾回收开销
 */
class ObjectPool {
  /**
   * @param {CreateFunction} createFn - 对象创建函数
   * @param {ResetFunction} resetFn - 对象重置函数
   * @param {Object} options - 配置选项
   */
  constructor(createFn, resetFn, options = {}) {
    if (typeof createFn !== 'function') {
      throw new Error('Create function is required');
    }
    if (typeof resetFn !== 'function') {
      throw new Error('Reset function is required');
    }

    this.createFn = createFn;
    this.resetFn = resetFn;
    this.validateFn = options.validateFn || (() => true);
    
    this.options = {
      initialSize: options.initialSize || 10,
      maxSize: options.maxSize || 1000,
      growthFactor: options.growthFactor || 1.5,
      shrinkThreshold: options.shrinkThreshold || 0.25,
      autoShrink: options.autoShrink ?? true,
      debug: options.debug ?? (process.env.NODE_ENV === 'development'),
      ...options
    };

    /** @type {Object[]} */
    this.pool = [];
    /** @type {Set<Object>} */
    this.active = new Set();
    /** @type {number} */
    this.totalCreated = 0;
    /** @type {number} */
    this.totalAcquired = 0;
    /** @type {number} */
    this.totalReleased = 0;
    /** @type {number} */
    this.peakActive = 0;

    // 预创建初始对象
    this.preAllocate(this.options.initialSize);

    // 自动收缩定时器
    if (this.options.autoShrink) {
      this.shrinkTimer = setInterval(() => {
        this.autoShrink();
      }, 30000); // 每30秒检查一次
    }

    if (this.options.debug) {
      console.log(`[ObjectPool] 创建对象池，初始大小: ${this.options.initialSize}`);
    }
  }

  /**
   * 预分配对象
   * @param {number} count - 预分配数量
   */
  preAllocate(count) {
    for (let i = 0; i < count; i++) {
      try {
        const obj = this.createFn();
        this.pool.push(obj);
        this.totalCreated++;
      } catch (error) {
        console.error('[ObjectPool] 预分配对象失败:', error);
        break;
      }
    }
  }

  /**
   * 获取对象
   * @returns {Object} 对象实例
   */
  acquire() {
    let obj = this.pool.pop();
    
    if (!obj) {
      // 池中没有可用对象，创建新对象
      if (this.active.size >= this.options.maxSize) {
        console.warn('[ObjectPool] 达到最大对象数限制');
        return null;
      }
      
      try {
        obj = this.createFn();
        this.totalCreated++;
        
        if (this.options.debug) {
          console.log(`[ObjectPool] 创建新对象，总创建数: ${this.totalCreated}`);
        }
      } catch (error) {
        console.error('[ObjectPool] 创建对象失败:', error);
        return null;
      }
    }

    // 验证对象
    if (!this.validateFn(obj)) {
      if (this.options.debug) {
        console.warn('[ObjectPool] 对象验证失败，创建新对象');
      }
      try {
        obj = this.createFn();
        this.totalCreated++;
      } catch (error) {
        console.error('[ObjectPool] 创建替换对象失败:', error);
        return null;
      }
    }

    this.active.add(obj);
    this.totalAcquired++;

    // 更新峰值
    if (this.active.size > this.peakActive) {
      this.peakActive = this.active.size;
    }

    // 发布获取事件
    eventBus.emit('objectPool:acquire', {
      pool: this,
      activeCount: this.active.size,
      poolCount: this.pool.length
    });

    return obj;
  }

  /**
   * 释放对象
   * @param {Object} obj - 要释放的对象
   * @returns {boolean} 是否成功释放
   */
  release(obj) {
    if (!obj) {
      if (this.options.debug) {
        console.warn('[ObjectPool] 尝试释放空对象');
      }
      return false;
    }

    if (!this.active.has(obj)) {
      if (this.options.debug) {
        console.warn('[ObjectPool] 尝试释放未激活的对象');
      }
      return false;
    }

    try {
      // 重置对象状态
      this.resetFn(obj);
      
      // 从活跃集合中移除
      this.active.delete(obj);
      
      // 放回对象池
      this.pool.push(obj);
      this.totalReleased++;

      // 发布释放事件
      eventBus.emit('objectPool:release', {
        pool: this,
        activeCount: this.active.size,
        poolCount: this.pool.length
      });

      return true;
    } catch (error) {
      console.error('[ObjectPool] 释放对象失败:', error);
      // 即使重置失败，也要从活跃集合中移除
      this.active.delete(obj);
      return false;
    }
  }

  /**
   * 批量释放对象
   * @param {Object[]} objects - 要释放的对象数组
   * @returns {number} 成功释放的对象数量
   */
  releaseAll(objects) {
    let releasedCount = 0;
    for (const obj of objects) {
      if (this.release(obj)) {
        releasedCount++;
      }
    }
    return releasedCount;
  }

  /**
   * 自动收缩池大小
   */
  autoShrink() {
    const totalSize = this.pool.length + this.active.size;
    const usage = this.active.size / totalSize;
    
    // 如果使用率低于阈值，收缩池
    if (usage < this.options.shrinkThreshold && this.pool.length > this.options.initialSize) {
      const targetSize = Math.max(
        this.options.initialSize,
        Math.ceil(this.active.size / this.options.shrinkThreshold)
      );
      const toRemove = this.pool.length - targetSize;
      
      if (toRemove > 0) {
        this.pool.splice(0, toRemove);
        
        if (this.options.debug) {
          console.log(`[ObjectPool] 自动收缩池，移除 ${toRemove} 个对象`);
        }

        eventBus.emit('objectPool:shrink', {
          pool: this,
          removedCount: toRemove,
          newSize: this.pool.length
        });
      }
    }
  }

  /**
   * 手动收缩池到指定大小
   * @param {number} targetSize - 目标大小
   */
  shrink(targetSize = this.options.initialSize) {
    if (targetSize < 0) targetSize = 0;
    
    const toRemove = Math.max(0, this.pool.length - targetSize);
    if (toRemove > 0) {
      this.pool.splice(0, toRemove);
      
      if (this.options.debug) {
        console.log(`[ObjectPool] 手动收缩池，移除 ${toRemove} 个对象`);
      }

      eventBus.emit('objectPool:shrink', {
        pool: this,
        removedCount: toRemove,
        newSize: this.pool.length
      });
    }
  }

  /**
   * 扩展池大小
   * @param {number} count - 扩展数量
   */
  grow(count) {
    if (count <= 0) return;
    
    const newTotal = this.pool.length + this.active.size + count;
    if (newTotal > this.options.maxSize) {
      count = this.options.maxSize - (this.pool.length + this.active.size);
    }
    
    if (count > 0) {
      this.preAllocate(count);
      
      if (this.options.debug) {
        console.log(`[ObjectPool] 扩展池，新增 ${count} 个对象`);
      }

      eventBus.emit('objectPool:grow', {
        pool: this,
        addedCount: count,
        newSize: this.pool.length
      });
    }
  }

  /**
   * 清空对象池
   */
  clear() {
    // 强制释放所有活跃对象
    for (const obj of this.active) {
      try {
        this.resetFn(obj);
      } catch (error) {
        console.error('[ObjectPool] 清空时重置对象失败:', error);
      }
    }
    
    this.pool = [];
    this.active.clear();
    
    if (this.options.debug) {
      console.log('[ObjectPool] 已清空对象池');
    }

    eventBus.emit('objectPool:clear', { pool: this });
  }

  /**
   * 获取池统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      available: this.pool.length,
      active: this.active.size,
      total: this.pool.length + this.active.size,
      totalCreated: this.totalCreated,
      totalAcquired: this.totalAcquired,
      totalReleased: this.totalReleased,
      peakActive: this.peakActive,
      usage: this.active.size / (this.pool.length + this.active.size),
      efficiency: this.totalReleased / Math.max(1, this.totalAcquired)
    };
  }

  /**
   * 获取性能报告
   * @returns {Object} 性能报告
   */
  getPerformanceReport() {
    const stats = this.getStats();
    const suggestions = [];

    if (stats.usage > 0.9) {
      suggestions.push('池使用率过高，考虑增加初始大小');
    }
    
    if (stats.efficiency < 0.8) {
      suggestions.push('对象释放率较低，检查是否有内存泄漏');
    }
    
    if (stats.peakActive > this.options.maxSize * 0.8) {
      suggestions.push('接近最大对象数限制，考虑增加池大小');
    }

    return {
      stats,
      suggestions,
      timestamp: Date.now()
    };
  }

  /**
   * 销毁对象池
   */
  destroy() {
    this.clear();
    
    if (this.shrinkTimer) {
      clearInterval(this.shrinkTimer);
      this.shrinkTimer = null;
    }

    if (this.options.debug) {
      console.log('[ObjectPool] 对象池已销毁');
    }

    eventBus.emit('objectPool:destroy', { pool: this });
  }
}

/**
 * 对象池管理器 - 管理多个对象池
 */
class ObjectPoolManager {
  constructor() {
    /** @type {Map<string, ObjectPool>} */
    this.pools = new Map();
    this.debug = process.env.NODE_ENV === 'development';
  }

  /**
   * 创建对象池
   * @param {string} name - 池名称
   * @param {CreateFunction} createFn - 创建函数
   * @param {ResetFunction} resetFn - 重置函数
   * @param {Object} options - 选项
   * @returns {ObjectPool} 对象池实例
   */
  createPool(name, createFn, resetFn, options = {}) {
    if (this.pools.has(name)) {
      throw new Error(`Pool '${name}' already exists`);
    }

    const pool = new ObjectPool(createFn, resetFn, options);
    this.pools.set(name, pool);

    if (this.debug) {
      console.log(`[ObjectPoolManager] 创建对象池: ${name}`);
    }

    return pool;
  }

  /**
   * 获取对象池
   * @param {string} name - 池名称
   * @returns {ObjectPool} 对象池实例
   */
  getPool(name) {
    return this.pools.get(name);
  }

  /**
   * 删除对象池
   * @param {string} name - 池名称
   * @returns {boolean} 是否成功删除
   */
  deletePool(name) {
    const pool = this.pools.get(name);
    if (pool) {
      pool.destroy();
      this.pools.delete(name);
      
      if (this.debug) {
        console.log(`[ObjectPoolManager] 删除对象池: ${name}`);
      }
      
      return true;
    }
    return false;
  }

  /**
   * 获取所有池的统计信息
   * @returns {Object} 统计信息
   */
  getAllStats() {
    const stats = {};
    for (const [name, pool] of this.pools) {
      stats[name] = pool.getStats();
    }
    return stats;
  }

  /**
   * 清空所有对象池
   */
  clearAll() {
    for (const pool of this.pools.values()) {
      pool.clear();
    }
  }

  /**
   * 销毁所有对象池
   */
  destroyAll() {
    for (const [name, pool] of this.pools) {
      pool.destroy();
    }
    this.pools.clear();
  }
}

// 创建全局对象池管理器
const poolManager = new ObjectPoolManager();

// 预定义一些常用的对象池
if (typeof window !== 'undefined') {
  // 子弹对象池
  poolManager.createPool(
    'bullets',
    () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      damage: 0,
      speed: 0,
      angle: 0,
      active: false,
      type: 'bullet',
      size: 4,
      color: '#ffff00',
      lifetime: 0,
      maxLifetime: 3000,
      piercing: 0,
      maxPiercing: 1,
      hitTargets: new Set(),
      trail: []
    }),
    (bullet) => {
      bullet.x = 0;
      bullet.y = 0;
      bullet.vx = 0;
      bullet.vy = 0;
      bullet.damage = 0;
      bullet.speed = 0;
      bullet.angle = 0;
      bullet.active = false;
      bullet.type = 'bullet';
      bullet.lifetime = 0;
      bullet.piercing = 0;
      bullet.hitTargets.clear();
      bullet.trail.length = 0;
    },
    { initialSize: 200, maxSize: 500, growthFactor: 1.5 }
  );

  // 粒子对象池
  poolManager.createPool(
    'particles',
    () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 2,
      color: '#ffffff',
      alpha: 1,
      life: 0,
      maxLife: 1000,
      active: false,
      type: 'particle',
      gravity: 0,
      friction: 0.98,
      rotation: 0,
      rotationSpeed: 0,
      scale: 1,
      scaleSpeed: 0
    }),
    (particle) => {
      particle.x = 0;
      particle.y = 0;
      particle.vx = 0;
      particle.vy = 0;
      particle.size = 2;
      particle.color = '#ffffff';
      particle.alpha = 1;
      particle.life = 0;
      particle.maxLife = 0;
      particle.active = false;
      particle.type = 'particle';
      particle.gravity = 0;
      particle.friction = 0.98;
      particle.rotation = 0;
      particle.rotationSpeed = 0;
      particle.scale = 1;
      particle.scaleSpeed = 0;
    },
    { initialSize: 300, maxSize: 800, growthFactor: 2.0 }
  );

  // 敌人对象池
  poolManager.createPool(
    'enemies',
    () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      hp: 100,
      maxHp: 100,
      damage: 10,
      speed: 50,
      size: 20,
      active: false,
      type: 'enemy',
      color: '#ff0000',
      lastDamageTime: 0,
      target: null,
      ai: null,
      attackCooldown: 0,
      stunTime: 0,
      effects: [],
      dropChance: 0.1,
      experience: 10
    }),
    (enemy) => {
      enemy.x = 0;
      enemy.y = 0;
      enemy.vx = 0;
      enemy.vy = 0;
      enemy.hp = 100;
      enemy.maxHp = 100;
      enemy.damage = 10;
      enemy.speed = 50;
      enemy.size = 20;
      enemy.active = false;
      enemy.type = 'enemy';
      enemy.lastDamageTime = 0;
      enemy.target = null;
      enemy.ai = null;
      enemy.attackCooldown = 0;
      enemy.stunTime = 0;
      enemy.effects.length = 0;
      enemy.dropChance = 0.1;
      enemy.experience = 10;
    },
    { initialSize: 100, maxSize: 300, growthFactor: 1.3 }
  );

  // 新增专用对象池
  poolManager.createPool(
    'explosions',
    () => ({
      x: 0,
      y: 0,
      size: 0,
      maxSize: 50,
      damage: 0,
      life: 0,
      maxLife: 500,
      active: false,
      type: 'explosion',
      color: '#ff8800',
      particles: [],
      shockwave: false
    }),
    (explosion) => {
      explosion.x = 0;
      explosion.y = 0;
      explosion.size = 0;
      explosion.damage = 0;
      explosion.life = 0;
      explosion.active = false;
      explosion.particles.length = 0;
      explosion.shockwave = false;
    },
    { initialSize: 20, maxSize: 50 }
  );

  poolManager.createPool(
    'pickups',
    () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      type: 'experience',
      value: 1,
      size: 8,
      color: '#00ff00',
      active: false,
      magnetRange: 100,
      collected: false,
      bobOffset: 0,
      glowIntensity: 1
    }),
    (pickup) => {
      pickup.x = 0;
      pickup.y = 0;
      pickup.vx = 0;
      pickup.vy = 0;
      pickup.type = 'experience';
      pickup.value = 1;
      pickup.size = 8;
      pickup.color = '#00ff00';
      pickup.active = false;
      pickup.collected = false;
      pickup.bobOffset = 0;
      pickup.glowIntensity = 1;
    },
    { initialSize: 50, maxSize: 200 }
  );

  poolManager.createPool(
    'damageNumbers',
    () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: -30,
      damage: 0,
      life: 0,
      maxLife: 1500,
      active: false,
      type: 'damage',
      color: '#ffffff',
      fontSize: 16,
      isCritical: false,
      alpha: 1
    }),
    (damageNumber) => {
      damageNumber.x = 0;
      damageNumber.y = 0;
      damageNumber.vx = 0;
      damageNumber.vy = -30;
      damageNumber.damage = 0;
      damageNumber.life = 0;
      damageNumber.active = false;
      damageNumber.color = '#ffffff';
      damageNumber.fontSize = 16;
      damageNumber.isCritical = false;
      damageNumber.alpha = 1;
    },
    { initialSize: 30, maxSize: 100 }
  );
}

export { ObjectPool, ObjectPoolManager };
export default poolManager;