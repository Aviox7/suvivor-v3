/**
 * Renderer module - 主渲染器
 * @module Renderer
 */

/**
 * @typedef {Object} RenderContext
 * @property {CanvasRenderingContext2D} ctx - Canvas 2D上下文
 * @property {number} width - 画布宽度
 * @property {number} height - 画布高度
 * @property {number} deltaTime - 帧时间间隔
 * @property {Object} camera - 摄像机对象
 */

/**
 * @typedef {Object} RenderLayer
 * @property {string} name - 图层名称
 * @property {number} zIndex - 渲染层级
 * @property {boolean} visible - 是否可见
 * @property {number} alpha - 透明度
 * @property {Function} render - 渲染函数
 */

/**
 * @typedef {Object} RenderStats
 * @property {number} fps - 帧率
 * @property {number} frameTime - 帧时间
 * @property {number} drawCalls - 绘制调用次数
 * @property {number} objectsRendered - 渲染对象数量
 */

/**
 * 主渲染器类
 */
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
        
    // 渲染配置
    this.width = canvas.width;
    this.height = canvas.height;
    this.pixelRatio = window.devicePixelRatio || 1;
        
    // 渲染层管理
    this.layers = new Map();
    this.layerOrder = [];
        
    // 渲染统计
    this.stats = {
      fps: 0,
      frameTime: 0,
      drawCalls: 0,
      objectsRendered: 0,
      lastFrameTime: 0,
      frameCount: 0,
      fpsUpdateTime: 0
    };
        
    // 渲染选项
    this.options = {
      antialias: true,
      vsync: true,
      showStats: false,
      showBounds: false,
      showGrid: false,
      backgroundColor: '#000000',
      clearBeforeRender: true
    };
        
    // 缓存和优化
    this.imageCache = new Map();
    this.pathCache = new Map();
    this.gradientCache = new Map();
        
    // 视口裁剪
    this.viewportCulling = true;
    this.cullingMargin = 50;
        
    // 初始化渲染器
    this.initialize();
  }

  /**
     * 初始化渲染器
     */
  initialize() {
    // 设置高DPI支持
    this.setupHighDPI();
        
    // 设置默认渲染状态
    this.ctx.imageSmoothingEnabled = this.options.antialias;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
        
    // 添加默认渲染层
    this.addLayer('background', -1000);
    this.addLayer('game', 0);
    this.addLayer('effects', 100);
    this.addLayer('ui', 1000);
    this.addLayer('debug', 2000);
  }

  /**
     * 设置高DPI支持
     */
  setupHighDPI() {
    const rect = this.canvas.getBoundingClientRect();
        
    // 设置实际像素大小
    this.canvas.width = rect.width * this.pixelRatio;
    this.canvas.height = rect.height * this.pixelRatio;
        
    // 缩放上下文以匹配设备像素比
    this.ctx.scale(this.pixelRatio, this.pixelRatio);
        
    // 设置CSS大小
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
        
    this.width = rect.width;
    this.height = rect.height;
  }

  /**
     * 添加渲染层
     * @param {string} name - 层名称
     * @param {number} zIndex - 层级
     * @param {Function} renderFunc - 渲染函数
     */
  addLayer(name, zIndex, renderFunc = null) {
    const layer = {
      name,
      zIndex,
      visible: true,
      alpha: 1.0,
      render: renderFunc,
      objects: []
    };
        
    this.layers.set(name, layer);
        
    // 重新排序层级
    this.updateLayerOrder();
  }

  /**
     * 移除渲染层
     * @param {string} name - 层名称
     */
  removeLayer(name) {
    this.layers.delete(name);
    this.updateLayerOrder();
  }

  /**
     * 更新层级排序
     */
  updateLayerOrder() {
    this.layerOrder = Array.from(this.layers.values())
      .sort((a, b) => a.zIndex - b.zIndex)
      .map(layer => layer.name);
  }

  /**
     * 设置层可见性
     * @param {string} name - 层名称
     * @param {boolean} visible - 是否可见
     */
  setLayerVisible(name, visible) {
    const layer = this.layers.get(name);
    if (layer) {
      layer.visible = visible;
    }
  }

  /**
     * 设置层透明度
     * @param {string} name - 层名称
     * @param {number} alpha - 透明度 (0-1)
     */
  setLayerAlpha(name, alpha) {
    const layer = this.layers.get(name);
    if (layer) {
      layer.alpha = Math.max(0, Math.min(1, alpha));
    }
  }

  /**
     * 开始渲染帧
     * @param {number} deltaTime - 帧时间间隔
     * @param {Object} camera - 摄像机对象
     */
  beginFrame(deltaTime, camera = null) {
    const frameStart = performance.now();
        
    // 更新统计信息
    this.updateStats(frameStart, deltaTime);
        
    // 清空画布
    if (this.options.clearBeforeRender) {
      this.clear();
    }
        
    // 设置摄像机变换
    if (camera) {
      this.applyCameraTransform(camera);
    }
        
    // 重置绘制统计
    this.stats.drawCalls = 0;
    this.stats.objectsRendered = 0;
  }

  /**
     * 结束渲染帧
     */
  endFrame() {
    // 渲染调试信息
    if (this.options.showStats) {
      this.renderStats();
    }
        
    if (this.options.showGrid) {
      this.renderGrid();
    }
        
    // 记录帧时间
    this.stats.frameTime = performance.now() - this.stats.lastFrameTime;
  }

  /**
     * 渲染所有层
     * @param {RenderContext} context - 渲染上下文
     */
  renderLayers(context) {
    this.ctx.save();
        
    for (const layerName of this.layerOrder) {
      const layer = this.layers.get(layerName);
            
      if (!layer || !layer.visible) {
        continue;
      }
            
      // 设置层透明度
      if (layer.alpha < 1.0) {
        this.ctx.globalAlpha = layer.alpha;
      }
            
      // 渲染层内容
      if (layer.render) {
        layer.render(context);
      }
            
      // 渲染层中的对象
      this.renderLayerObjects(layer, context);
            
      // 恢复透明度
      if (layer.alpha < 1.0) {
        this.ctx.globalAlpha = 1.0;
      }
    }
        
    this.ctx.restore();
  }

  /**
     * 渲染层中的对象
     * @param {RenderLayer} layer - 渲染层
     * @param {RenderContext} context - 渲染上下文
     */
  renderLayerObjects(layer, context) {
    for (const obj of layer.objects) {
      if (this.shouldRenderObject(obj, context.camera)) {
        this.renderObject(obj, context);
        this.stats.objectsRendered++;
      }
    }
  }

  /**
     * 判断对象是否需要渲染（视口裁剪）
     * @param {Object} obj - 渲染对象
     * @param {Object} camera - 摄像机
     * @returns {boolean} 是否需要渲染
     */
  shouldRenderObject(obj, camera) {
    if (!this.viewportCulling || !camera || !obj.x || !obj.y) {
      return true;
    }
        
    const margin = this.cullingMargin;
    const objSize = obj.size || obj.radius || 20;
        
    return obj.x + objSize >= camera.x - this.width / 2 - margin &&
               obj.x - objSize <= camera.x + this.width / 2 + margin &&
               obj.y + objSize >= camera.y - this.height / 2 - margin &&
               obj.y - objSize <= camera.y + this.height / 2 + margin;
  }

  /**
     * 渲染单个对象
     * @param {Object} obj - 渲染对象
     * @param {RenderContext} context - 渲染上下文
     */
  renderObject(obj, context) {
    if (!obj.render && !obj.draw) {
      return;
    }
        
    this.ctx.save();
        
    // 应用对象变换
    if (obj.x !== undefined && obj.y !== undefined) {
      this.ctx.translate(obj.x, obj.y);
    }
        
    if (obj.rotation) {
      this.ctx.rotate(obj.rotation);
    }
        
    if (obj.scaleX !== undefined || obj.scaleY !== undefined) {
      this.ctx.scale(obj.scaleX || 1, obj.scaleY || 1);
    }
        
    // 设置对象透明度
    if (obj.alpha !== undefined && obj.alpha < 1) {
      this.ctx.globalAlpha = obj.alpha;
    }
        
    // 调用对象的渲染方法
    if (obj.render) {
      obj.render(this.ctx, context);
    } else if (obj.draw) {
      obj.draw(this.ctx);
    }
        
    // 渲染边界框（调试用）
    if (this.options.showBounds && obj.getBounds) {
      this.renderBounds(obj.getBounds());
    }
        
    this.ctx.restore();
    this.stats.drawCalls++;
  }

  /**
     * 添加对象到渲染层
     * @param {string} layerName - 层名称
     * @param {Object} obj - 渲染对象
     */
  addToLayer(layerName, obj) {
    const layer = this.layers.get(layerName);
    if (layer && !layer.objects.includes(obj)) {
      layer.objects.push(obj);
    }
  }

  /**
     * 从渲染层移除对象
     * @param {string} layerName - 层名称
     * @param {Object} obj - 渲染对象
     */
  removeFromLayer(layerName, obj) {
    const layer = this.layers.get(layerName);
    if (layer) {
      const index = layer.objects.indexOf(obj);
      if (index !== -1) {
        layer.objects.splice(index, 1);
      }
    }
  }

  /**
     * 清空渲染层
     * @param {string} layerName - 层名称
     */
  clearLayer(layerName) {
    const layer = this.layers.get(layerName);
    if (layer) {
      layer.objects = [];
    }
  }

  /**
     * 应用摄像机变换
     * @param {Object} camera - 摄像机对象
     */
  applyCameraTransform(camera) {
    this.ctx.save();
        
    // 移动到画布中心
    this.ctx.translate(this.width / 2, this.height / 2);
        
    // 应用缩放
    if (camera.zoom) {
      this.ctx.scale(camera.zoom, camera.zoom);
    }
        
    // 应用旋转
    if (camera.rotation) {
      this.ctx.rotate(camera.rotation);
    }
        
    // 应用摄像机位置
    this.ctx.translate(-camera.x, -camera.y);
  }

  /**
     * 清空画布
     */
  clear() {
    this.ctx.fillStyle = this.options.backgroundColor;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
     * 绘制圆形
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} radius - 半径
     * @param {string} fillColor - 填充颜色
     * @param {string} strokeColor - 描边颜色
     * @param {number} lineWidth - 线宽
     */
  drawCircle(x, y, radius, fillColor = null, strokeColor = null, lineWidth = 1) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        
    if (fillColor) {
      this.ctx.fillStyle = fillColor;
      this.ctx.fill();
    }
        
    if (strokeColor) {
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = lineWidth;
      this.ctx.stroke();
    }
        
    this.stats.drawCalls++;
  }

  /**
     * 绘制矩形
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @param {string} fillColor - 填充颜色
     * @param {string} strokeColor - 描边颜色
     * @param {number} lineWidth - 线宽
     */
  drawRect(x, y, width, height, fillColor = null, strokeColor = null, lineWidth = 1) {
    if (fillColor) {
      this.ctx.fillStyle = fillColor;
      this.ctx.fillRect(x, y, width, height);
    }
        
    if (strokeColor) {
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = lineWidth;
      this.ctx.strokeRect(x, y, width, height);
    }
        
    this.stats.drawCalls++;
  }

  /**
     * 绘制文本
     * @param {string} text - 文本内容
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {string} font - 字体
     * @param {string} fillColor - 填充颜色
     * @param {string} strokeColor - 描边颜色
     * @param {number} lineWidth - 线宽
     */
  drawText(text, x, y, font = '16px Arial', fillColor = '#ffffff', strokeColor = null, lineWidth = 1) {
    this.ctx.font = font;
        
    if (fillColor) {
      this.ctx.fillStyle = fillColor;
      this.ctx.fillText(text, x, y);
    }
        
    if (strokeColor) {
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = lineWidth;
      this.ctx.strokeText(text, x, y);
    }
        
    this.stats.drawCalls++;
  }

  /**
     * 绘制线条
     * @param {number} x1 - 起点X坐标
     * @param {number} y1 - 起点Y坐标
     * @param {number} x2 - 终点X坐标
     * @param {number} y2 - 终点Y坐标
     * @param {string} color - 颜色
     * @param {number} lineWidth - 线宽
     */
  drawLine(x1, y1, x2, y2, color = '#ffffff', lineWidth = 1) {
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.stroke();
        
    this.stats.drawCalls++;
  }

  /**
     * 渲染边界框
     * @param {Object} bounds - 边界框对象
     */
  renderBounds(bounds) {
    this.ctx.strokeStyle = '#ff0000';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  }

  /**
     * 渲染网格
     */
  renderGrid() {
    const gridSize = 50;
    const startX = Math.floor(-this.width / 2 / gridSize) * gridSize;
    const endX = Math.ceil(this.width / 2 / gridSize) * gridSize;
    const startY = Math.floor(-this.height / 2 / gridSize) * gridSize;
    const endY = Math.ceil(this.height / 2 / gridSize) * gridSize;
        
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;
        
    // 绘制垂直线
    for (let x = startX; x <= endX; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, startY);
      this.ctx.lineTo(x, endY);
      this.ctx.stroke();
    }
        
    // 绘制水平线
    for (let y = startY; y <= endY; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(startX, y);
      this.ctx.lineTo(endX, y);
      this.ctx.stroke();
    }
  }

  /**
     * 渲染统计信息
     */
  renderStats() {
    const stats = [
      `FPS: ${this.stats.fps}`,
      `Frame Time: ${this.stats.frameTime.toFixed(2)}ms`,
      `Draw Calls: ${this.stats.drawCalls}`,
      `Objects: ${this.stats.objectsRendered}`
    ];
        
    this.ctx.save();
    this.ctx.resetTransform();
        
    // 绘制背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, 10, 200, stats.length * 20 + 10);
        
    // 绘制文本
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '14px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
        
    stats.forEach((stat, index) => {
      this.ctx.fillText(stat, 15, 15 + index * 20);
    });
        
    this.ctx.restore();
  }

  /**
     * 更新统计信息
     * @param {number} currentTime - 当前时间
     * @param {number} deltaTime - 帧时间间隔
     */
  updateStats(currentTime, deltaTime) {
    this.stats.frameCount++;
        
    // 每秒更新一次FPS
    if (currentTime - this.stats.fpsUpdateTime >= 1000) {
      this.stats.fps = Math.round(this.stats.frameCount * 1000 / (currentTime - this.stats.fpsUpdateTime));
      this.stats.frameCount = 0;
      this.stats.fpsUpdateTime = currentTime;
    }
        
    this.stats.lastFrameTime = currentTime;
  }

  /**
     * 调整画布大小
     * @param {number} width - 新宽度
     * @param {number} height - 新高度
     */
  resize(width, height) {
    this.canvas.width = width * this.pixelRatio;
    this.canvas.height = height * this.pixelRatio;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
        
    this.width = width;
    this.height = height;
        
    this.ctx.scale(this.pixelRatio, this.pixelRatio);
    this.ctx.imageSmoothingEnabled = this.options.antialias;
  }

  /**
     * 获取渲染统计信息
     * @returns {RenderStats} 统计信息
     */
  getStats() {
    return { ...this.stats };
  }

  /**
     * 设置渲染选项
     * @param {Object} options - 选项对象
     */
  setOptions(options) {
    Object.assign(this.options, options);
        
    // 应用抗锯齿设置
    if (options.antialias !== undefined) {
      this.ctx.imageSmoothingEnabled = options.antialias;
    }
  }

  /**
     * 截图
     * @param {string} format - 图片格式
     * @param {number} quality - 图片质量
     * @returns {string} 图片数据URL
     */
  screenshot(format = 'image/png', quality = 1.0) {
    return this.canvas.toDataURL(format, quality);
  }
}

/**
 * 默认导出渲染器类
 */
export default Renderer;