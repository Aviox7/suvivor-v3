/**
 * Camera module - 摄像机系统
 * @module Camera
 */

/**
 * @typedef {Object} CameraTarget
 * @property {number} x - 目标X坐标
 * @property {number} y - 目标Y坐标
 * @property {number} [priority] - 目标优先级
 */

/**
 * @typedef {Object} CameraBounds
 * @property {number} minX - 最小X坐标
 * @property {number} maxX - 最大X坐标
 * @property {number} minY - 最小Y坐标
 * @property {number} maxY - 最大Y坐标
 */

/**
 * @typedef {Object} CameraShake
 * @property {number} intensity - 震动强度
 * @property {number} duration - 震动持续时间
 * @property {number} frequency - 震动频率
 * @property {string} type - 震动类型
 */

/**
 * 摄像机类
 */
export class Camera {
  constructor(x = 0, y = 0, zoom = 1) {
    // 摄像机位置
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
        
    // 缩放
    this.zoom = zoom;
    this.targetZoom = zoom;
    this.minZoom = 0.1;
    this.maxZoom = 5.0;
        
    // 旋转
    this.rotation = 0;
    this.targetRotation = 0;
        
    // 跟随目标
    this.target = null;
    this.followSpeed = 0.1;
    this.followOffset = { x: 0, y: 0 };
    this.followDeadZone = { width: 100, height: 100 };
        
    // 平滑移动
    this.smoothing = true;
    this.smoothFactor = 0.1;
    this.zoomSmoothFactor = 0.05;
    this.rotationSmoothFactor = 0.1;
        
    // 边界限制
    this.bounds = null;
    this.boundsPadding = 50;
        
    // 震动效果
    this.shake = {
      active: false,
      intensity: 0,
      duration: 0,
      elapsed: 0,
      frequency: 10,
      type: 'random', // 'random', 'horizontal', 'vertical', 'circular'
      offsetX: 0,
      offsetY: 0,
      phase: 0
    };
        
    // 视口信息
    this.viewport = {
      width: 800,
      height: 600,
      worldWidth: 0,
      worldHeight: 0
    };
        
    // 预设配置
    this.presets = {
      follow: { smoothFactor: 0.1, followSpeed: 0.15 },
      cinematic: { smoothFactor: 0.02, followSpeed: 0.05 },
      responsive: { smoothFactor: 0.3, followSpeed: 0.5 },
      fixed: { smoothFactor: 1.0, followSpeed: 1.0 }
    };
        
    // 多目标跟随
    this.targets = [];
    this.multiTargetMode = false;
    this.multiTargetMargin = 100;
  }

  /**
     * 更新摄像机
     * @param {number} deltaTime - 帧时间间隔
     */
  update(deltaTime) {
    // 更新跟随逻辑
    this.updateFollow(deltaTime);
        
    // 更新平滑移动
    if (this.smoothing) {
      this.updateSmoothing(deltaTime);
    } else {
      this.x = this.targetX;
      this.y = this.targetY;
      this.zoom = this.targetZoom;
      this.rotation = this.targetRotation;
    }
        
    // 应用边界限制
    this.applyBounds();
        
    // 更新震动效果
    this.updateShake(deltaTime);
        
    // 更新视口信息
    this.updateViewport();
  }

  /**
     * 更新跟随逻辑
     * @param {number} deltaTime - 帧时间间隔
     */
  updateFollow(deltaTime) {
    if (this.multiTargetMode && this.targets.length > 0) {
      this.updateMultiTargetFollow();
    } else if (this.target) {
      this.updateSingleTargetFollow();
    }
  }

  /**
     * 更新单目标跟随
     */
  updateSingleTargetFollow() {
    const targetX = this.target.x + this.followOffset.x;
    const targetY = this.target.y + this.followOffset.y;
        
    // 死区检测
    const deltaX = targetX - this.x;
    const deltaY = targetY - this.y;
        
    const deadZoneHalfWidth = this.followDeadZone.width / 2;
    const deadZoneHalfHeight = this.followDeadZone.height / 2;
        
    if (Math.abs(deltaX) > deadZoneHalfWidth) {
      this.targetX = targetX - Math.sign(deltaX) * deadZoneHalfWidth;
    }
        
    if (Math.abs(deltaY) > deadZoneHalfHeight) {
      this.targetY = targetY - Math.sign(deltaY) * deadZoneHalfHeight;
    }
  }

  /**
     * 更新多目标跟随
     */
  updateMultiTargetFollow() {
    if (this.targets.length === 0) return;
        
    // 计算所有目标的边界框
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
        
    for (const target of this.targets) {
      minX = Math.min(minX, target.x);
      maxX = Math.max(maxX, target.x);
      minY = Math.min(minY, target.y);
      maxY = Math.max(maxY, target.y);
    }
        
    // 计算中心点
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
        
    // 计算所需缩放以包含所有目标
    const targetWidth = maxX - minX + this.multiTargetMargin * 2;
    const targetHeight = maxY - minY + this.multiTargetMargin * 2;
        
    const zoomX = this.viewport.width / targetWidth;
    const zoomY = this.viewport.height / targetHeight;
    const optimalZoom = Math.min(zoomX, zoomY, this.maxZoom);
        
    // 设置目标位置和缩放
    this.targetX = centerX;
    this.targetY = centerY;
    this.targetZoom = Math.max(optimalZoom, this.minZoom);
  }

  /**
     * 更新平滑移动
     * @param {number} deltaTime - 帧时间间隔
     */
  updateSmoothing(deltaTime) {
    const smoothFactor = Math.min(1, this.smoothFactor * deltaTime * 60);
    const zoomSmoothFactor = Math.min(1, this.zoomSmoothFactor * deltaTime * 60);
    const rotationSmoothFactor = Math.min(1, this.rotationSmoothFactor * deltaTime * 60);
        
    // 位置平滑
    this.x += (this.targetX - this.x) * smoothFactor;
    this.y += (this.targetY - this.y) * smoothFactor;
        
    // 缩放平滑
    this.zoom += (this.targetZoom - this.zoom) * zoomSmoothFactor;
        
    // 旋转平滑
    let rotationDiff = this.targetRotation - this.rotation;
        
    // 处理角度环绕
    if (rotationDiff > Math.PI) {
      rotationDiff -= Math.PI * 2;
    } else if (rotationDiff < -Math.PI) {
      rotationDiff += Math.PI * 2;
    }
        
    this.rotation += rotationDiff * rotationSmoothFactor;
  }

  /**
     * 应用边界限制
     */
  applyBounds() {
    if (!this.bounds) return;
        
    const halfViewWidth = (this.viewport.width / this.zoom) / 2;
    const halfViewHeight = (this.viewport.height / this.zoom) / 2;
        
    const minX = this.bounds.minX + halfViewWidth + this.boundsPadding;
    const maxX = this.bounds.maxX - halfViewWidth - this.boundsPadding;
    const minY = this.bounds.minY + halfViewHeight + this.boundsPadding;
    const maxY = this.bounds.maxY - halfViewHeight - this.boundsPadding;
        
    this.x = Math.max(minX, Math.min(maxX, this.x));
    this.y = Math.max(minY, Math.min(maxY, this.y));
        
    this.targetX = Math.max(minX, Math.min(maxX, this.targetX));
    this.targetY = Math.max(minY, Math.min(maxY, this.targetY));
  }

  /**
     * 更新震动效果
     * @param {number} deltaTime - 帧时间间隔
     */
  updateShake(deltaTime) {
    if (!this.shake.active) {
      this.shake.offsetX = 0;
      this.shake.offsetY = 0;
      return;
    }
        
    this.shake.elapsed += deltaTime;
        
    if (this.shake.elapsed >= this.shake.duration) {
      this.shake.active = false;
      this.shake.offsetX = 0;
      this.shake.offsetY = 0;
      return;
    }
        
    // 计算震动强度衰减
    const progress = this.shake.elapsed / this.shake.duration;
    const intensity = this.shake.intensity * (1 - progress);
        
    // 根据震动类型计算偏移
    this.shake.phase += this.shake.frequency * deltaTime;
        
    switch (this.shake.type) {
    case 'horizontal':
      this.shake.offsetX = Math.sin(this.shake.phase) * intensity;
      this.shake.offsetY = 0;
      break;
                
    case 'vertical':
      this.shake.offsetX = 0;
      this.shake.offsetY = Math.sin(this.shake.phase) * intensity;
      break;
                
    case 'circular':
      this.shake.offsetX = Math.cos(this.shake.phase) * intensity;
      this.shake.offsetY = Math.sin(this.shake.phase) * intensity;
      break;
                
    case 'random':
    default:
      this.shake.offsetX = (Math.random() - 0.5) * 2 * intensity;
      this.shake.offsetY = (Math.random() - 0.5) * 2 * intensity;
      break;
    }
  }

  /**
     * 更新视口信息
     */
  updateViewport() {
    this.viewport.worldWidth = this.viewport.width / this.zoom;
    this.viewport.worldHeight = this.viewport.height / this.zoom;
  }

  /**
     * 设置跟随目标
     * @param {Object} target - 跟随目标
     * @param {number} [speed] - 跟随速度
     */
  setTarget(target, speed = null) {
    this.target = target;
    this.multiTargetMode = false;
        
    if (speed !== null) {
      this.followSpeed = speed;
    }
  }

  /**
     * 添加多目标跟随
     * @param {Object} target - 目标对象
     */
  addTarget(target) {
    if (!this.targets.includes(target)) {
      this.targets.push(target);
      this.multiTargetMode = this.targets.length > 1;
    }
  }

  /**
     * 移除多目标跟随
     * @param {Object} target - 目标对象
     */
  removeTarget(target) {
    const index = this.targets.indexOf(target);
    if (index !== -1) {
      this.targets.splice(index, 1);
      this.multiTargetMode = this.targets.length > 1;
    }
  }

  /**
     * 清除所有目标
     */
  clearTargets() {
    this.targets = [];
    this.target = null;
    this.multiTargetMode = false;
  }

  /**
     * 移动到指定位置
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {boolean} [immediate] - 是否立即移动
     */
  moveTo(x, y, immediate = false) {
    this.targetX = x;
    this.targetY = y;
        
    if (immediate) {
      this.x = x;
      this.y = y;
    }
  }

  /**
     * 相对移动
     * @param {number} deltaX - X偏移
     * @param {number} deltaY - Y偏移
     * @param {boolean} [immediate] - 是否立即移动
     */
  moveBy(deltaX, deltaY, immediate = false) {
    this.moveTo(this.targetX + deltaX, this.targetY + deltaY, immediate);
  }

  /**
     * 设置缩放
     * @param {number} zoom - 缩放值
     * @param {boolean} [immediate] - 是否立即缩放
     */
  setZoom(zoom, immediate = false) {
    this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
        
    if (immediate) {
      this.zoom = this.targetZoom;
    }
  }

  /**
     * 缩放到指定比例
     * @param {number} factor - 缩放因子
     * @param {boolean} [immediate] - 是否立即缩放
     */
  zoomBy(factor, immediate = false) {
    this.setZoom(this.targetZoom * factor, immediate);
  }

  /**
     * 设置旋转
     * @param {number} rotation - 旋转角度（弧度）
     * @param {boolean} [immediate] - 是否立即旋转
     */
  setRotation(rotation, immediate = false) {
    this.targetRotation = rotation;
        
    if (immediate) {
      this.rotation = rotation;
    }
  }

  /**
     * 相对旋转
     * @param {number} deltaRotation - 旋转偏移（弧度）
     * @param {boolean} [immediate] - 是否立即旋转
     */
  rotateBy(deltaRotation, immediate = false) {
    this.setRotation(this.targetRotation + deltaRotation, immediate);
  }

  /**
     * 开始震动
     * @param {number} intensity - 震动强度
     * @param {number} duration - 持续时间（毫秒）
     * @param {number} [frequency] - 震动频率
     * @param {string} [type] - 震动类型
     */
  startShake(intensity, duration, frequency = 10, type = 'random') {
    this.shake.active = true;
    this.shake.intensity = intensity;
    this.shake.duration = duration;
    this.shake.elapsed = 0;
    this.shake.frequency = frequency;
    this.shake.type = type;
    this.shake.phase = 0;
  }

  /**
     * 停止震动
     */
  stopShake() {
    this.shake.active = false;
    this.shake.offsetX = 0;
    this.shake.offsetY = 0;
  }

  /**
     * 设置边界
     * @param {number} minX - 最小X坐标
     * @param {number} minY - 最小Y坐标
     * @param {number} maxX - 最大X坐标
     * @param {number} maxY - 最大Y坐标
     */
  setBounds(minX, minY, maxX, maxY) {
    this.bounds = { minX, minY, maxX, maxY };
  }

  /**
     * 清除边界
     */
  clearBounds() {
    this.bounds = null;
  }

  /**
     * 设置视口大小
     * @param {number} width - 宽度
     * @param {number} height - 高度
     */
  setViewportSize(width, height) {
    this.viewport.width = width;
    this.viewport.height = height;
    this.updateViewport();
  }

  /**
     * 设置跟随偏移
     * @param {number} x - X偏移
     * @param {number} y - Y偏移
     */
  setFollowOffset(x, y) {
    this.followOffset.x = x;
    this.followOffset.y = y;
  }

  /**
     * 设置死区大小
     * @param {number} width - 死区宽度
     * @param {number} height - 死区高度
     */
  setDeadZone(width, height) {
    this.followDeadZone.width = width;
    this.followDeadZone.height = height;
  }

  /**
     * 应用预设配置
     * @param {string} presetName - 预设名称
     */
  applyPreset(presetName) {
    const preset = this.presets[presetName];
    if (preset) {
      Object.assign(this, preset);
    }
  }

  /**
     * 世界坐标转屏幕坐标
     * @param {number} worldX - 世界X坐标
     * @param {number} worldY - 世界Y坐标
     * @returns {Object} 屏幕坐标
     */
  worldToScreen(worldX, worldY) {
    const screenX = (worldX - this.x + this.shake.offsetX) * this.zoom + this.viewport.width / 2;
    const screenY = (worldY - this.y + this.shake.offsetY) * this.zoom + this.viewport.height / 2;
        
    return { x: screenX, y: screenY };
  }

  /**
     * 屏幕坐标转世界坐标
     * @param {number} screenX - 屏幕X坐标
     * @param {number} screenY - 屏幕Y坐标
     * @returns {Object} 世界坐标
     */
  screenToWorld(screenX, screenY) {
    const worldX = (screenX - this.viewport.width / 2) / this.zoom + this.x - this.shake.offsetX;
    const worldY = (screenY - this.viewport.height / 2) / this.zoom + this.y - this.shake.offsetY;
        
    return { x: worldX, y: worldY };
  }

  /**
     * 检查点是否在视口内
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} [margin] - 边距
     * @returns {boolean} 是否在视口内
     */
  isPointInView(x, y, margin = 0) {
    const halfWidth = this.viewport.worldWidth / 2 + margin;
    const halfHeight = this.viewport.worldHeight / 2 + margin;
        
    return x >= this.x - halfWidth &&
               x <= this.x + halfWidth &&
               y >= this.y - halfHeight &&
               y <= this.y + halfHeight;
  }

  /**
     * 检查矩形是否与视口相交
     * @param {number} x - 矩形X坐标
     * @param {number} y - 矩形Y坐标
     * @param {number} width - 矩形宽度
     * @param {number} height - 矩形高度
     * @param {number} [margin] - 边距
     * @returns {boolean} 是否相交
     */
  isRectInView(x, y, width, height, margin = 0) {
    const halfViewWidth = this.viewport.worldWidth / 2 + margin;
    const halfViewHeight = this.viewport.worldHeight / 2 + margin;
        
    return x + width >= this.x - halfViewWidth &&
               x <= this.x + halfViewWidth &&
               y + height >= this.y - halfViewHeight &&
               y <= this.y + halfViewHeight;
  }

  /**
     * 视锥剔除 - 筛选视野范围内的对象
     * @param {Array} objects - 要筛选的对象数组
     * @param {number} [margin] - 额外边距
     * @returns {Array} 视野内的对象
     */
  frustumCull(objects, margin = 50) {
    if (!objects || objects.length === 0) return [];
        
    const viewBounds = this.getViewBounds();
    const left = viewBounds.left - margin;
    const right = viewBounds.right + margin;
    const top = viewBounds.top - margin;
    const bottom = viewBounds.bottom + margin;
        
    const visibleObjects = [];
        
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      if (!obj || !obj.active) continue;
            
      // 获取对象边界
      const objLeft = obj.x - (obj.width || obj.size || 16) / 2;
      const objRight = obj.x + (obj.width || obj.size || 16) / 2;
      const objTop = obj.y - (obj.height || obj.size || 16) / 2;
      const objBottom = obj.y + (obj.height || obj.size || 16) / 2;
            
      // AABB碰撞检测
      if (objRight >= left && objLeft <= right &&
                objBottom >= top && objTop <= bottom) {
        visibleObjects.push(obj);
      }
    }
        
    return visibleObjects;
  }

  /**
     * 距离剔除 - 根据距离筛选对象
     * @param {Array} objects - 要筛选的对象数组
     * @param {number} maxDistance - 最大距离
     * @returns {Array} 距离内的对象
     */
  distanceCull(objects, maxDistance) {
    if (!objects || objects.length === 0) return [];
        
    const maxDistSq = maxDistance * maxDistance;
    const visibleObjects = [];
        
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      if (!obj || !obj.active) continue;
            
      const dx = obj.x - this.x;
      const dy = obj.y - this.y;
      const distSq = dx * dx + dy * dy;
            
      if (distSq <= maxDistSq) {
        visibleObjects.push(obj);
      }
    }
        
    return visibleObjects;
  }

  /**
     * 组合剔除 - 同时应用视锥和距离剔除
     * @param {Array} objects - 要筛选的对象数组
     * @param {Object} options - 剔除选项
     * @returns {Array} 可见对象
     */
  combinedCull(objects, options = {}) {
    const {
      margin = 50,
      maxDistance = null,
      useDistanceCull = false,
      sortByDistance = false
    } = options;
        
    let visibleObjects = this.frustumCull(objects, margin);
        
    if (useDistanceCull && maxDistance) {
      visibleObjects = this.distanceCull(visibleObjects, maxDistance);
    }
        
    if (sortByDistance) {
      visibleObjects.sort((a, b) => {
        const distA = (a.x - this.x) ** 2 + (a.y - this.y) ** 2;
        const distB = (b.x - this.x) ** 2 + (b.y - this.y) ** 2;
        return distA - distB;
      });
    }
        
    return visibleObjects;
  }

  /**
     * 分层剔除 - 为不同类型对象应用不同剔除策略
     * @param {Object} objectLayers - 分层对象
     * @returns {Object} 分层可见对象
     */
  layeredCull(objectLayers) {
    const visibleLayers = {};
        
    // 背景层 - 较大边距
    if (objectLayers.background) {
      visibleLayers.background = this.frustumCull(objectLayers.background, 200);
    }
        
    // 敌人层 - 标准剔除
    if (objectLayers.enemies) {
      visibleLayers.enemies = this.combinedCull(objectLayers.enemies, {
        margin: 100,
        sortByDistance: true
      });
    }
        
    // 子弹层 - 紧密剔除
    if (objectLayers.bullets) {
      visibleLayers.bullets = this.frustumCull(objectLayers.bullets, 50);
    }
        
    // 粒子层 - 距离剔除
    if (objectLayers.particles) {
      visibleLayers.particles = this.combinedCull(objectLayers.particles, {
        margin: 0,
        maxDistance: this.viewport.worldWidth,
        useDistanceCull: true
      });
    }
        
    // 掉落物层 - 标准剔除
    if (objectLayers.drops) {
      visibleLayers.drops = this.frustumCull(objectLayers.drops, 80);
    }
        
    // UI层 - 不剔除
    if (objectLayers.ui) {
      visibleLayers.ui = objectLayers.ui;
    }
        
    return visibleLayers;
  }

  /**
     * 获取视口边界
     * @returns {Object} 视口边界
     */
  getViewBounds() {
    const halfWidth = this.viewport.worldWidth / 2;
    const halfHeight = this.viewport.worldHeight / 2;
        
    return {
      left: this.x - halfWidth,
      right: this.x + halfWidth,
      top: this.y - halfHeight,
      bottom: this.y + halfHeight,
      width: this.viewport.worldWidth,
      height: this.viewport.worldHeight
    };
  }

  /**
     * 重置摄像机
     */
  reset() {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.zoom = 1;
    this.targetZoom = 1;
    this.rotation = 0;
    this.targetRotation = 0;
    this.target = null;
    this.targets = [];
    this.multiTargetMode = false;
    this.stopShake();
  }

  /**
     * 获取摄像机状态
     * @returns {Object} 摄像机状态
     */
  getState() {
    return {
      x: this.x,
      y: this.y,
      zoom: this.zoom,
      rotation: this.rotation,
      targetX: this.targetX,
      targetY: this.targetY,
      targetZoom: this.targetZoom,
      targetRotation: this.targetRotation,
      shakeActive: this.shake.active,
      hasTarget: !!this.target,
      targetCount: this.targets.length,
      multiTargetMode: this.multiTargetMode,
      viewBounds: this.getViewBounds()
    };
  }

  /**
     * 获取剔除统计信息
     * @param {Object} cullResults - 剔除结果
     * @returns {Object} 统计信息
     */
  getCullStats(cullResults) {
    const stats = {
      totalObjects: 0,
      visibleObjects: 0,
      culledObjects: 0,
      cullRatio: 0,
      layers: {}
    };
        
    for (const [layerName, objects] of Object.entries(cullResults)) {
      const layerStats = {
        visible: Array.isArray(objects) ? objects.length : 0,
        total: 0
      };
            
      stats.layers[layerName] = layerStats;
      stats.visibleObjects += layerStats.visible;
    }
        
    stats.culledObjects = stats.totalObjects - stats.visibleObjects;
    stats.cullRatio = stats.totalObjects > 0 ? stats.culledObjects / stats.totalObjects : 0;
        
    return stats;
  }
}

/**
 * 视锥剔除工具函数
 */
export const FrustumCulling = {
  /**
   * 快速AABB检测
   * @param {Object} obj - 对象
   * @param {Object} bounds - 边界
   * @returns {boolean} 是否相交
   */
  fastAABB(obj, bounds) {
    const size = obj.width || obj.size || 16;
    const halfSize = size / 2;
        
    return obj.x + halfSize >= bounds.left &&
           obj.x - halfSize <= bounds.right &&
           obj.y + halfSize >= bounds.top &&
           obj.y - halfSize <= bounds.bottom;
  },

  /**
   * 批量剔除
   * @param {Array} objects - 对象数组
   * @param {Object} bounds - 边界
   * @param {number} batchSize - 批处理大小
   * @returns {Array} 可见对象
   */
  batchCull(objects, bounds, batchSize = 100) {
    const visible = [];
    const length = objects.length;
        
    for (let i = 0; i < length; i += batchSize) {
      const end = Math.min(i + batchSize, length);
      for (let j = i; j < end; j++) {
        const obj = objects[j];
        if (obj && obj.active && this.fastAABB(obj, bounds)) {
          visible.push(obj);
        }
      }
    }
        
    return visible;
  },

  /**
   * 空间分区剔除
   * @param {Array} objects - 对象数组
   * @param {Object} bounds - 边界
   * @param {number} gridSize - 网格大小
   * @returns {Array} 可见对象
   */
  spatialCull(objects, bounds, gridSize = 200) {
    // 简化的空间分区实现
    const visible = [];
    const gridLeft = Math.floor(bounds.left / gridSize);
    const gridRight = Math.floor(bounds.right / gridSize);
    const gridTop = Math.floor(bounds.top / gridSize);
    const gridBottom = Math.floor(bounds.bottom / gridSize);
        
    for (const obj of objects) {
      if (!obj || !obj.active) continue;
            
      const objGridX = Math.floor(obj.x / gridSize);
      const objGridY = Math.floor(obj.y / gridSize);
            
      if (objGridX >= gridLeft && objGridX <= gridRight &&
          objGridY >= gridTop && objGridY <= gridBottom) {
        visible.push(obj);
      }
    }
        
    return visible;
  }
};

/**
 * 默认导出摄像机类
 */
export default Camera;