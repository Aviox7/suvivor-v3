/**
 * 分层渲染系统
 * 实现Canvas分层、脏矩形更新和渲染优化
 */

import { eventBus } from '../core/event-bus.js';
import { FrustumCulling } from './camera.js';

/**
 * 渲染层定义
 */
export const RenderLayers = {
  BACKGROUND: 0,
  ENVIRONMENT: 1,
  ENEMIES: 2,
  PLAYER: 3,
  BULLETS: 4,
  PARTICLES: 5,
  PICKUPS: 6,
  EFFECTS: 7,
  UI: 8,
  DEBUG: 9
};

/**
 * 脏矩形管理器
 */
class DirtyRectManager {
  constructor() {
    this.dirtyRects = [];
    this.fullRedraw = true;
    this.mergeThreshold = 0.3; // 合并阈值
  }

  /**
   * 添加脏矩形
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   */
  addDirtyRect(x, y, width, height) {
    if (this.fullRedraw) return;

    const rect = {
      x: Math.floor(x),
      y: Math.floor(y),
      width: Math.ceil(width),
      height: Math.ceil(height)
    };

    // 检查是否与现有矩形重叠或相邻
    let merged = false;
    for (let i = 0; i < this.dirtyRects.length; i++) {
      const existing = this.dirtyRects[i];
      if (this.shouldMerge(rect, existing)) {
        this.dirtyRects[i] = this.mergeRects(rect, existing);
        merged = true;
        break;
      }
    }

    if (!merged) {
      this.dirtyRects.push(rect);
    }

    // 如果脏矩形过多，切换到全屏重绘
    if (this.dirtyRects.length > 10) {
      this.setFullRedraw();
    }
  }

  /**
   * 判断是否应该合并两个矩形
   * @param {Object} rect1 - 矩形1
   * @param {Object} rect2 - 矩形2
   * @returns {boolean} 是否合并
   */
  shouldMerge(rect1, rect2) {
    const merged = this.mergeRects(rect1, rect2);
    const totalArea = rect1.width * rect1.height + rect2.width * rect2.height;
    const mergedArea = merged.width * merged.height;
    
    return (mergedArea - totalArea) / totalArea < this.mergeThreshold;
  }

  /**
   * 合并两个矩形
   * @param {Object} rect1 - 矩形1
   * @param {Object} rect2 - 矩形2
   * @returns {Object} 合并后的矩形
   */
  mergeRects(rect1, rect2) {
    const left = Math.min(rect1.x, rect2.x);
    const top = Math.min(rect1.y, rect2.y);
    const right = Math.max(rect1.x + rect1.width, rect2.x + rect2.width);
    const bottom = Math.max(rect1.y + rect1.height, rect2.y + rect2.height);

    return {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top
    };
  }

  /**
   * 设置全屏重绘
   */
  setFullRedraw() {
    this.fullRedraw = true;
    this.dirtyRects.length = 0;
  }

  /**
   * 获取脏矩形列表
   * @returns {Array} 脏矩形数组
   */
  getDirtyRects() {
    if (this.fullRedraw) {
      return [{ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight }];
    }
    return this.dirtyRects;
  }

  /**
   * 清除脏矩形
   */
  clear() {
    this.dirtyRects.length = 0;
    this.fullRedraw = false;
  }
}

/**
 * 分层渲染器
 */
export class LayeredRenderer {
  constructor(canvas, camera) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camera = camera;
    
    // 渲染层
    this.layers = new Map();
    this.layerOrder = Object.values(RenderLayers).sort((a, b) => a - b);
    
    // 脏矩形管理
    this.dirtyRectManager = new DirtyRectManager();
    
    // 渲染统计
    this.stats = {
      frameCount: 0,
      renderTime: 0,
      culledObjects: 0,
      renderedObjects: 0,
      dirtyRects: 0
    };
    
    // Canvas状态缓存
    this.canvasState = {
      fillStyle: null,
      strokeStyle: null,
      lineWidth: null,
      globalAlpha: null,
      font: null,
      textAlign: null,
      textBaseline: null
    };
    
    this.initializeLayers();
    this.setupEventListeners();
  }

  /**
   * 初始化渲染层
   */
  initializeLayers() {
    for (const layer of this.layerOrder) {
      this.layers.set(layer, {
        objects: [],
        visible: true,
        alpha: 1.0,
        blendMode: 'source-over',
        transform: null,
        dirty: true
      });
    }
  }

  /**
   * 设置事件监听
   */
  setupEventListeners() {
    // 监听对象移动事件
    eventBus.on('object:moved', (data) => {
      this.markObjectDirty(data.object, data.oldBounds, data.newBounds);
    });

    // 监听对象创建/销毁事件
    eventBus.on('object:created', (data) => {
      this.addObjectToLayer(data.object, data.layer);
    });

    eventBus.on('object:destroyed', (data) => {
      this.removeObjectFromLayer(data.object, data.layer);
    });

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      this.dirtyRectManager.setFullRedraw();
    });
  }

  /**
   * 添加对象到渲染层
   * @param {Object} object - 游戏对象
   * @param {number} layerId - 层ID
   */
  addObjectToLayer(object, layerId) {
    const layer = this.layers.get(layerId);
    if (layer && !layer.objects.includes(object)) {
      layer.objects.push(object);
      layer.dirty = true;
      this.markObjectDirty(object);
    }
  }

  /**
   * 从渲染层移除对象
   * @param {Object} object - 游戏对象
   * @param {number} layerId - 层ID
   */
  removeObjectFromLayer(object, layerId) {
    const layer = this.layers.get(layerId);
    if (layer) {
      const index = layer.objects.indexOf(object);
      if (index !== -1) {
        layer.objects.splice(index, 1);
        layer.dirty = true;
        this.markObjectDirty(object);
      }
    }
  }

  /**
   * 标记对象为脏
   * @param {Object} object - 游戏对象
   * @param {Object} oldBounds - 旧边界
   * @param {Object} newBounds - 新边界
   */
  markObjectDirty(object, oldBounds = null, newBounds = null) {
    const bounds = newBounds || this.getObjectBounds(object);
    
    // 添加当前位置的脏矩形
    this.dirtyRectManager.addDirtyRect(
      bounds.x - 5, bounds.y - 5,
      bounds.width + 10, bounds.height + 10
    );

    // 如果有旧边界，也添加为脏矩形
    if (oldBounds) {
      this.dirtyRectManager.addDirtyRect(
        oldBounds.x - 5, oldBounds.y - 5,
        oldBounds.width + 10, oldBounds.height + 10
      );
    }
  }

  /**
   * 获取对象边界
   * @param {Object} object - 游戏对象
   * @returns {Object} 边界信息
   */
  getObjectBounds(object) {
    const size = object.size || object.width || 16;
    return {
      x: object.x - size / 2,
      y: object.y - size / 2,
      width: size,
      height: size
    };
  }

  /**
   * 优化Canvas状态设置
   * @param {string} property - 属性名
   * @param {*} value - 属性值
   */
  setCanvasState(property, value) {
    if (this.canvasState[property] !== value) {
      this.ctx[property] = value;
      this.canvasState[property] = value;
    }
  }

  /**
   * 渲染单个对象
   * @param {Object} object - 游戏对象
   * @param {CanvasRenderingContext2D} ctx - 渲染上下文
   */
  renderObject(object, ctx) {
    if (!object.active || !object.render) return;

    ctx.save();
    
    // 应用变换
    if (object.x !== undefined && object.y !== undefined) {
      ctx.translate(object.x, object.y);
    }
    
    if (object.rotation) {
      ctx.rotate(object.rotation);
    }
    
    if (object.scale && object.scale !== 1) {
      ctx.scale(object.scale, object.scale);
    }

    // 渲染对象
    object.render(ctx);
    
    ctx.restore();
  }

  /**
   * 渲染层
   * @param {number} layerId - 层ID
   * @param {Array} dirtyRects - 脏矩形列表
   */
  renderLayer(layerId, dirtyRects) {
    const layer = this.layers.get(layerId);
    if (!layer || !layer.visible || layer.objects.length === 0) return;

    const startTime = performance.now();
    
    // 应用视锥剔除
    const visibleObjects = this.camera.frustumCull(layer.objects, 100);
    
    this.stats.culledObjects += layer.objects.length - visibleObjects.length;
    this.stats.renderedObjects += visibleObjects.length;

    // 设置层属性
    this.setCanvasState('globalAlpha', layer.alpha);
    this.setCanvasState('globalCompositeOperation', layer.blendMode);

    // 渲染可见对象
    for (const object of visibleObjects) {
      // 检查对象是否在脏矩形内
      if (this.isObjectInDirtyRects(object, dirtyRects)) {
        this.renderObject(object, this.ctx);
      }
    }

    this.stats.renderTime += performance.now() - startTime;
  }

  /**
   * 检查对象是否在脏矩形内
   * @param {Object} object - 游戏对象
   * @param {Array} dirtyRects - 脏矩形列表
   * @returns {boolean} 是否在脏矩形内
   */
  isObjectInDirtyRects(object, dirtyRects) {
    if (dirtyRects.length === 0) return true;

    const objBounds = this.getObjectBounds(object);
    
    for (const rect of dirtyRects) {
      if (objBounds.x < rect.x + rect.width &&
          objBounds.x + objBounds.width > rect.x &&
          objBounds.y < rect.y + rect.height &&
          objBounds.y + objBounds.height > rect.y) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 主渲染方法
   */
  render() {
    const frameStart = performance.now();
    
    // 重置统计
    this.stats.culledObjects = 0;
    this.stats.renderedObjects = 0;
    this.stats.renderTime = 0;
    
    // 获取脏矩形
    const dirtyRects = this.dirtyRectManager.getDirtyRects();
    this.stats.dirtyRects = dirtyRects.length;

    // 清除脏区域
    for (const rect of dirtyRects) {
      this.ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
    }

    // 应用摄像机变换
    this.ctx.save();
    this.camera.applyTransform(this.ctx);

    // 按层级顺序渲染
    for (const layerId of this.layerOrder) {
      this.renderLayer(layerId, dirtyRects);
    }

    this.ctx.restore();

    // 清除脏矩形
    this.dirtyRectManager.clear();
    
    // 更新统计
    this.stats.frameCount++;
    const frameTime = performance.now() - frameStart;
    
    // 发送渲染统计事件
    eventBus.emit('render:stats', {
      frameTime,
      ...this.stats
    });
  }

  /**
   * 设置层可见性
   * @param {number} layerId - 层ID
   * @param {boolean} visible - 是否可见
   */
  setLayerVisible(layerId, visible) {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.visible = visible;
      if (visible) {
        this.dirtyRectManager.setFullRedraw();
      }
    }
  }

  /**
   * 设置层透明度
   * @param {number} layerId - 层ID
   * @param {number} alpha - 透明度
   */
  setLayerAlpha(layerId, alpha) {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.alpha = Math.max(0, Math.min(1, alpha));
      layer.dirty = true;
    }
  }

  /**
   * 获取渲染统计
   * @returns {Object} 统计信息
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * 重置统计
   */
  resetStats() {
    this.stats.frameCount = 0;
    this.stats.renderTime = 0;
    this.stats.culledObjects = 0;
    this.stats.renderedObjects = 0;
    this.stats.dirtyRects = 0;
  }

  /**
   * 销毁渲染器
   */
  destroy() {
    eventBus.off('object:moved');
    eventBus.off('object:created');
    eventBus.off('object:destroyed');
    window.removeEventListener('resize', this.resizeHandler);
    
    this.layers.clear();
    this.dirtyRectManager.clear();
  }
}

export default LayeredRenderer;