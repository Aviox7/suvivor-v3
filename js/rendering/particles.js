/**
 * Particles module - 粒子系统
 * @module Particles
 */

/**
 * @typedef {Object} ParticleConfig
 * @property {number} x - 初始X坐标
 * @property {number} y - 初始Y坐标
 * @property {number} [vx] - X方向速度
 * @property {number} [vy] - Y方向速度
 * @property {number} [life] - 生命周期
 * @property {number} [size] - 粒子大小
 * @property {string} [color] - 粒子颜色
 * @property {number} [alpha] - 透明度
 * @property {string} [type] - 粒子类型
 */

/**
 * @typedef {Object} EmitterConfig
 * @property {number} x - 发射器X坐标
 * @property {number} y - 发射器Y坐标
 * @property {number} rate - 发射速率
 * @property {number} [angle] - 发射角度
 * @property {number} [spread] - 发射扩散角度
 * @property {number} [speed] - 粒子速度
 * @property {number} [life] - 粒子生命周期
 * @property {string} [type] - 粒子类型
 */

/**
 * 粒子类
 */
export class Particle {
  constructor(config = {}) {
    // 位置
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.startX = this.x;
    this.startY = this.y;
        
    // 速度
    this.vx = config.vx || 0;
    this.vy = config.vy || 0;
    this.startVx = this.vx;
    this.startVy = this.vy;
        
    // 加速度
    this.ax = config.ax || 0;
    this.ay = config.ay || 0;
        
    // 生命周期
    this.life = config.life || 1000;
    this.maxLife = this.life;
    this.age = 0;
        
    // 外观
    this.size = config.size || 2;
    this.startSize = this.size;
    this.endSize = config.endSize !== undefined ? config.endSize : this.size;
        
    this.color = config.color || '#ffffff';
    this.startColor = this.color;
    this.endColor = config.endColor || this.color;
        
    this.alpha = config.alpha !== undefined ? config.alpha : 1;
    this.startAlpha = this.alpha;
    this.endAlpha = config.endAlpha !== undefined ? config.endAlpha : 0;
        
    // 旋转
    this.rotation = config.rotation || 0;
    this.rotationSpeed = config.rotationSpeed || 0;
        
    // 缩放
    this.scaleX = config.scaleX || 1;
    this.scaleY = config.scaleY || 1;
        
    // 类型和行为
    this.type = config.type || 'default';
    this.gravity = config.gravity !== undefined ? config.gravity : 0;
    this.friction = config.friction !== undefined ? config.friction : 1;
    this.bounce = config.bounce !== undefined ? config.bounce : 0;
        
    // 状态
    this.active = true;
    this.visible = true;
        
    // 自定义属性
    this.userData = config.userData || {};
  }

  /**
     * 更新粒子
     * @param {number} deltaTime - 帧时间间隔
     */
  update(deltaTime) {
    if (!this.active) return;
        
    // 更新年龄
    this.age += deltaTime;
        
    // 检查生命周期
    if (this.age >= this.life) {
      this.active = false;
      return;
    }
        
    // 计算生命周期进度
    const progress = this.age / this.life;
    const easeProgress = this.easeInOut(progress);
        
    // 更新速度
    this.vx += this.ax * deltaTime;
    this.vy += this.ay * deltaTime + this.gravity * deltaTime;
        
    // 应用摩擦力
    this.vx *= this.friction;
    this.vy *= this.friction;
        
    // 更新位置
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
        
    // 更新旋转
    this.rotation += this.rotationSpeed * deltaTime;
        
    // 插值属性
    this.size = this.lerp(this.startSize, this.endSize, easeProgress);
    this.alpha = this.lerp(this.startAlpha, this.endAlpha, easeProgress);
        
    // 颜色插值（如果需要）
    if (this.startColor !== this.endColor) {
      this.color = this.lerpColor(this.startColor, this.endColor, easeProgress);
    }
        
    // 类型特定更新
    this.updateByType(deltaTime, progress);
  }

  /**
     * 根据类型更新粒子
     * @param {number} deltaTime - 帧时间间隔
     * @param {number} progress - 生命周期进度
     */
  updateByType(deltaTime, progress) {
    switch (this.type) {
    case 'spark':
      this.updateSpark(deltaTime, progress);
      break;
    case 'smoke':
      this.updateSmoke(deltaTime, progress);
      break;
    case 'fire':
      this.updateFire(deltaTime, progress);
      break;
    case 'explosion':
      this.updateExplosion(deltaTime, progress);
      break;
    case 'trail':
      this.updateTrail(deltaTime, progress);
      break;
    }
  }

  /**
     * 更新火花粒子
     * @param {number} deltaTime - 帧时间间隔
     * @param {number} progress - 生命周期进度
     */
  updateSpark(deltaTime, progress) {
    // 火花会逐渐减速并闪烁
    this.vx *= 0.98;
    this.vy *= 0.98;
        
    // 闪烁效果
    this.alpha = this.startAlpha * (1 - progress) * (0.5 + 0.5 * Math.sin(this.age * 0.01));
  }

  /**
     * 更新烟雾粒子
     * @param {number} deltaTime - 帧时间间隔
     * @param {number} progress - 生命周期进度
     */
  updateSmoke(deltaTime, progress) {
    // 烟雾向上飘散
    this.vy -= 20 * deltaTime;
    this.vx += (Math.random() - 0.5) * 10 * deltaTime;
        
    // 逐渐变大变淡
    this.size = this.startSize * (1 + progress * 2);
    this.alpha = this.startAlpha * (1 - progress);
  }

  /**
     * 更新火焰粒子
     * @param {number} deltaTime - 帧时间间隔
     * @param {number} progress - 生命周期进度
     */
  updateFire(deltaTime, progress) {
    // 火焰向上移动并摇摆
    this.vy -= 50 * deltaTime;
    this.vx += Math.sin(this.age * 0.005) * 20 * deltaTime;
        
    // 颜色从红到黄到透明
    if (progress < 0.5) {
      this.color = this.lerpColor('#ff4444', '#ffaa00', progress * 2);
    } else {
      this.color = this.lerpColor('#ffaa00', '#ffff88', (progress - 0.5) * 2);
    }
  }

  /**
     * 更新爆炸粒子
     * @param {number} deltaTime - 帧时间间隔
     * @param {number} progress - 生命周期进度
     */
  updateExplosion(deltaTime, progress) {
    // 爆炸粒子快速扩散然后减速
    const slowdown = 1 - progress * 0.8;
    this.vx *= slowdown;
    this.vy *= slowdown;
        
    // 颜色从白到红到黑
    if (progress < 0.3) {
      this.color = this.lerpColor('#ffffff', '#ff6600', progress / 0.3);
    } else {
      this.color = this.lerpColor('#ff6600', '#330000', (progress - 0.3) / 0.7);
    }
  }

  /**
     * 更新拖尾粒子
     * @param {number} deltaTime - 帧时间间隔
     * @param {number} progress - 生命周期进度
     */
  updateTrail(deltaTime, progress) {
    // 拖尾粒子保持速度但逐渐消失
    this.alpha = this.startAlpha * (1 - progress);
    this.size = this.startSize * (1 - progress * 0.5);
  }

  /**
     * 渲染粒子
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
  render(ctx) {
    if (!this.active || !this.visible || this.alpha <= 0) return;
        
    ctx.save();
        
    // 设置透明度
    ctx.globalAlpha = this.alpha;
        
    // 移动到粒子位置
    ctx.translate(this.x, this.y);
        
    // 应用旋转
    if (this.rotation !== 0) {
      ctx.rotate(this.rotation);
    }
        
    // 应用缩放
    if (this.scaleX !== 1 || this.scaleY !== 1) {
      ctx.scale(this.scaleX, this.scaleY);
    }
        
    // 根据类型渲染
    this.renderByType(ctx);
        
    ctx.restore();
  }

  /**
     * 根据类型渲染粒子
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
  renderByType(ctx) {
    switch (this.type) {
    case 'circle':
    case 'default':
      this.renderCircle(ctx);
      break;
    case 'square':
      this.renderSquare(ctx);
      break;
    case 'star':
      this.renderStar(ctx);
      break;
    case 'line':
      this.renderLine(ctx);
      break;
    default:
      this.renderCircle(ctx);
      break;
    }
  }

  /**
     * 渲染圆形粒子
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
  renderCircle(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
     * 渲染方形粒子
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
  renderSquare(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);
  }

  /**
     * 渲染星形粒子
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
  renderStar(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
        
    const spikes = 5;
    const outerRadius = this.size;
    const innerRadius = this.size * 0.5;
        
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i * Math.PI) / spikes;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
            
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
        
    ctx.closePath();
    ctx.fill();
  }

  /**
     * 渲染线条粒子
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
  renderLine(ctx) {
    ctx.strokeStyle = this.color;
    ctx.lineWidth = Math.max(1, this.size * 0.5);
    ctx.beginPath();
    ctx.moveTo(-this.size, 0);
    ctx.lineTo(this.size, 0);
    ctx.stroke();
  }

  /**
     * 线性插值
     * @param {number} start - 起始值
     * @param {number} end - 结束值
     * @param {number} t - 插值参数
     * @returns {number} 插值结果
     */
  lerp(start, end, t) {
    return start + (end - start) * t;
  }

  /**
     * 颜色插值
     * @param {string} startColor - 起始颜色
     * @param {string} endColor - 结束颜色
     * @param {number} t - 插值参数
     * @returns {string} 插值颜色
     */
  lerpColor(startColor, endColor, t) {
    // 简单的RGB插值
    const start = this.hexToRgb(startColor);
    const end = this.hexToRgb(endColor);
        
    if (!start || !end) return startColor;
        
    const r = Math.round(this.lerp(start.r, end.r, t));
    const g = Math.round(this.lerp(start.g, end.g, t));
    const b = Math.round(this.lerp(start.b, end.b, t));
        
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
     * 十六进制颜色转RGB
     * @param {string} hex - 十六进制颜色
     * @returns {Object|null} RGB对象
     */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
     * 缓动函数
     * @param {number} t - 时间参数
     * @returns {number} 缓动值
     */
  easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  /**
     * 重置粒子
     * @param {ParticleConfig} config - 新配置
     */
  reset(config = {}) {
    Object.assign(this, config);
    this.age = 0;
    this.active = true;
    this.startX = this.x;
    this.startY = this.y;
    this.startVx = this.vx;
    this.startVy = this.vy;
    this.startSize = this.size;
    this.startColor = this.color;
    this.startAlpha = this.alpha;
    this.maxLife = this.life;
  }
}

/**
 * 粒子发射器类
 */
export class ParticleEmitter {
  constructor(config = {}) {
    // 位置
    this.x = config.x || 0;
    this.y = config.y || 0;
        
    // 发射参数
    this.rate = config.rate || 10; // 每秒发射数量
    this.burst = config.burst || 0; // 爆发数量
    this.angle = config.angle || 0; // 发射角度
    this.spread = config.spread || Math.PI / 4; // 扩散角度
        
    // 粒子属性
    this.particleConfig = {
      life: config.life || 1000,
      speed: config.speed || 100,
      speedVariation: config.speedVariation || 0.2,
      size: config.size || 3,
      sizeVariation: config.sizeVariation || 0.3,
      color: config.color || '#ffffff',
      alpha: config.alpha || 1,
      type: config.type || 'default',
      gravity: config.gravity || 0,
      friction: config.friction || 1
    };
        
    // 状态
    this.active = true;
    this.emissionTimer = 0;
    this.particles = [];
    this.maxParticles = config.maxParticles || 1000;
        
    // 生命周期
    this.life = config.emitterLife || -1; // -1 表示无限
    this.age = 0;
        
    // 粒子池
    this.particlePool = [];
    this.poolSize = config.poolSize || 100;
    this.initializePool();
  }

  /**
     * 初始化粒子池
     */
  initializePool() {
    for (let i = 0; i < this.poolSize; i++) {
      this.particlePool.push(new Particle());
    }
  }

  /**
     * 从池中获取粒子
     * @returns {Particle} 粒子对象
     */
  getParticleFromPool() {
    for (const particle of this.particlePool) {
      if (!particle.active) {
        return particle;
      }
    }
        
    // 如果池中没有可用粒子，创建新的
    if (this.particles.length < this.maxParticles) {
      return new Particle();
    }
        
    return null;
  }

  /**
     * 更新发射器
     * @param {number} deltaTime - 帧时间间隔
     */
  update(deltaTime) {
    if (!this.active) return;
        
    // 更新发射器年龄
    this.age += deltaTime;
        
    // 检查发射器生命周期
    if (this.life > 0 && this.age >= this.life) {
      this.active = false;
    }
        
    // 连续发射
    if (this.rate > 0) {
      this.emissionTimer += deltaTime;
      const emissionInterval = 1000 / this.rate;
            
      while (this.emissionTimer >= emissionInterval) {
        this.emitParticle();
        this.emissionTimer -= emissionInterval;
      }
    }
        
    // 更新所有粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.update(deltaTime);
            
      // 移除死亡的粒子
      if (!particle.active) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
     * 发射单个粒子
     */
  emitParticle() {
    const particle = this.getParticleFromPool();
    if (!particle) return;
        
    // 计算发射角度
    const emitAngle = this.angle + (Math.random() - 0.5) * this.spread;
        
    // 计算速度
    const speed = this.particleConfig.speed * (1 + (Math.random() - 0.5) * this.particleConfig.speedVariation);
    const vx = Math.cos(emitAngle) * speed;
    const vy = Math.sin(emitAngle) * speed;
        
    // 计算大小
    const size = this.particleConfig.size * (1 + (Math.random() - 0.5) * this.particleConfig.sizeVariation);
        
    // 重置粒子
    particle.reset({
      x: this.x,
      y: this.y,
      vx,
      vy,
      life: this.particleConfig.life,
      size,
      color: this.particleConfig.color,
      alpha: this.particleConfig.alpha,
      type: this.particleConfig.type,
      gravity: this.particleConfig.gravity,
      friction: this.particleConfig.friction
    });
        
    this.particles.push(particle);
  }

  /**
     * 爆发发射
     * @param {number} count - 发射数量
     */
  burst(count = null) {
    const burstCount = count || this.burst;
    for (let i = 0; i < burstCount; i++) {
      this.emitParticle();
    }
  }

  /**
     * 渲染所有粒子
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
  render(ctx) {
    for (const particle of this.particles) {
      particle.render(ctx);
    }
  }

  /**
     * 设置位置
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
     * 设置发射角度
     * @param {number} angle - 角度（弧度）
     */
  setAngle(angle) {
    this.angle = angle;
  }

  /**
     * 清除所有粒子
     */
  clear() {
    for (const particle of this.particles) {
      particle.active = false;
    }
    this.particles = [];
  }

  /**
     * 停止发射
     */
  stop() {
    this.active = false;
  }

  /**
     * 开始发射
     */
  start() {
    this.active = true;
    this.age = 0;
  }

  /**
     * 获取活跃粒子数量
     * @returns {number} 粒子数量
     */
  getParticleCount() {
    return this.particles.length;
  }
}

/**
 * 粒子系统管理器
 */
export class ParticleSystem {
  constructor() {
    this.emitters = [];
    this.effects = new Map();
        
    // 预定义效果
    this.initializeEffects();
  }

  /**
     * 初始化预定义效果
     */
  initializeEffects() {
    // 爆炸效果
    this.effects.set('explosion', {
      burst: 30,
      spread: Math.PI * 2,
      speed: 150,
      speedVariation: 0.5,
      life: 800,
      size: 4,
      sizeVariation: 0.4,
      color: '#ff6600',
      type: 'explosion',
      gravity: 50
    });
        
    // 火花效果
    this.effects.set('sparks', {
      burst: 15,
      spread: Math.PI / 3,
      speed: 200,
      speedVariation: 0.3,
      life: 600,
      size: 2,
      color: '#ffff00',
      type: 'spark',
      gravity: 100,
      friction: 0.95
    });
        
    // 烟雾效果
    this.effects.set('smoke', {
      rate: 5,
      spread: Math.PI / 6,
      speed: 30,
      speedVariation: 0.5,
      life: 2000,
      size: 8,
      sizeVariation: 0.3,
      color: '#888888',
      type: 'smoke',
      alpha: 0.6
    });
        
    // 治疗效果
    this.effects.set('heal', {
      burst: 10,
      spread: Math.PI * 2,
      speed: 50,
      speedVariation: 0.3,
      life: 1200,
      size: 3,
      color: '#00ff00',
      type: 'circle',
      gravity: -30
    });
        
    // 拾取效果
    this.effects.set('pickup', {
      burst: 8,
      spread: Math.PI * 2,
      speed: 80,
      speedVariation: 0.4,
      life: 800,
      size: 2,
      color: '#00aaff',
      type: 'star',
      gravity: -20
    });
  }

  /**
     * 创建发射器
     * @param {EmitterConfig} config - 发射器配置
     * @returns {ParticleEmitter} 发射器对象
     */
  createEmitter(config) {
    const emitter = new ParticleEmitter(config);
    this.emitters.push(emitter);
    return emitter;
  }

  /**
     * 创建预定义效果
     * @param {string} effectName - 效果名称
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {Object} [overrides] - 覆盖配置
     * @returns {ParticleEmitter} 发射器对象
     */
  createEffect(effectName, x, y, overrides = {}) {
    const effectConfig = this.effects.get(effectName);
    if (!effectConfig) {
      console.warn(`Unknown effect: ${effectName}`);
      return null;
    }
        
    const config = {
      x,
      y,
      ...effectConfig,
      ...overrides
    };
        
    const emitter = this.createEmitter(config);
        
    // 如果是爆发效果，立即触发
    if (config.burst > 0) {
      emitter.burst();
      // 设置发射器在粒子消失后自动移除
      setTimeout(() => {
        this.removeEmitter(emitter);
      }, config.life + 100);
    }
        
    return emitter;
  }

  /**
     * 移除发射器
     * @param {ParticleEmitter} emitter - 发射器对象
     */
  removeEmitter(emitter) {
    const index = this.emitters.indexOf(emitter);
    if (index !== -1) {
      this.emitters.splice(index, 1);
    }
  }

  /**
     * 更新所有发射器
     * @param {number} deltaTime - 帧时间间隔
     */
  update(deltaTime) {
    for (let i = this.emitters.length - 1; i >= 0; i--) {
      const emitter = this.emitters[i];
      emitter.update(deltaTime);
            
      // 移除非活跃且无粒子的发射器
      if (!emitter.active && emitter.getParticleCount() === 0) {
        this.emitters.splice(i, 1);
      }
    }
  }

  /**
     * 渲染所有粒子
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
  render(ctx) {
    for (const emitter of this.emitters) {
      emitter.render(ctx);
    }
  }

  /**
     * 清除所有粒子
     */
  clear() {
    for (const emitter of this.emitters) {
      emitter.clear();
    }
    this.emitters = [];
  }

  /**
     * 获取总粒子数量
     * @returns {number} 粒子总数
     */
  getTotalParticleCount() {
    return this.emitters.reduce((total, emitter) => total + emitter.getParticleCount(), 0);
  }

  /**
     * 注册自定义效果
     * @param {string} name - 效果名称
     * @param {Object} config - 效果配置
     */
  registerEffect(name, config) {
    this.effects.set(name, config);
  }
}

/**
 * 默认导出粒子系统
 */
export default ParticleSystem;