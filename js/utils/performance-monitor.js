/**
 * @fileoverview 性能监控系统 - 实时监控游戏性能指标
 * @author Qoder Team
 * @version 2.0.0
 */

import eventBus from '../core/event-bus.js';

/**
 * @typedef {Object} PerformanceMetrics
 * @property {number} fps - 帧率
 * @property {number} frameTime - 帧时间(ms)
 * @property {number} renderTime - 渲染时间(ms)
 * @property {number} updateTime - 更新时间(ms)
 * @property {number} memoryUsage - 内存使用量(MB)
 * @property {number} drawCalls - 绘制调用次数
 * @property {number} objectCount - 对象数量
 */

/**
 * 性能监控器类
 */
class PerformanceMonitor {
  constructor(options = {}) {
    this.options = {
      sampleSize: options.sampleSize || 60, // 采样大小
      warningThresholds: {
        fps: options.warningThresholds?.fps || 45,
        frameTime: options.warningThresholds?.frameTime || 20,
        memoryUsage: options.warningThresholds?.memoryUsage || 100
      },
      enableDetailedProfiling: options.enableDetailedProfiling ?? true,
      ...options
    };

    /** @type {PerformanceMetrics} */
    this.metrics = {
      fps: 0,
      frameTime: 0,
      renderTime: 0,
      updateTime: 0,
      memoryUsage: 0,
      drawCalls: 0,
      objectCount: 0
    };

    /** @type {number[]} */
    this.frameTimes = [];
    /** @type {number} */
    this.lastTime = performance.now();
    /** @type {number} */
    this.frameCount = 0;
    /** @type {number} */
    this.lastFpsUpdate = 0;

    /** @type {Map<string, number>} */
    this.profileData = new Map();
    /** @type {Map<string, number>} */
    this.activeProfiles = new Map();

    /** @type {boolean} */
    this.enabled = true;
    /** @type {boolean} */
    this.debug = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development';

    // 警告统计
    this.warnings = {
      lowFps: 0,
      highFrameTime: 0,
      highMemory: 0
    };

    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 监听游戏状态变化
    eventBus.on('game:frame:start', () => this.startFrame());
    eventBus.on('game:frame:end', () => this.endFrame());
    eventBus.on('game:render:start', () => this.startProfile('render'));
    eventBus.on('game:render:end', () => this.endProfile('render'));
    eventBus.on('game:update:start', () => this.startProfile('update'));
    eventBus.on('game:update:end', () => this.endProfile('update'));
  }

  /**
   * 开始帧测量
   */
  startFrame() {
    if (!this.enabled) return;

    this.frameStartTime = performance.now();
    this.frameCount++;
  }

  /**
   * 结束帧测量
   */
  endFrame() {
    if (!this.enabled) return;

    const now = performance.now();
    const frameTime = now - this.frameStartTime;
    
    // 更新帧时间
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > this.options.sampleSize) {
      this.frameTimes.shift();
    }

    // 计算平均帧时间和FPS
    this.metrics.frameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.metrics.fps = 1000 / this.metrics.frameTime;

    // 更新其他指标
    this.updateMemoryUsage();
    this.checkWarnings();

    // 发布性能事件
    if (now - this.lastFpsUpdate > 1000) { // 每秒更新一次
      eventBus.emit('performance:update', { ...this.metrics });
      this.lastFpsUpdate = now;
    }

    this.lastTime = now;
  }

  /**
   * 开始性能分析
   * @param {string} label - 分析标签
   */
  startProfile(label) {
    if (!this.enabled || !this.options.enableDetailedProfiling) return;
    
    this.activeProfiles.set(label, performance.now());
  }

  /**
   * 结束性能分析
   * @param {string} label - 分析标签
   */
  endProfile(label) {
    if (!this.enabled || !this.options.enableDetailedProfiling) return;
    
    const startTime = this.activeProfiles.get(label);
    if (startTime !== undefined) {
      const duration = performance.now() - startTime;
      this.profileData.set(label, duration);
      this.activeProfiles.delete(label);

      // 更新相应的指标
      if (label === 'render') {
        this.metrics.renderTime = duration;
      } else if (label === 'update') {
        this.metrics.updateTime = duration;
      }

      // 检查是否有性能问题
      this.checkProfileWarning(label, duration);
    }
  }

  /**
   * 更新内存使用情况
   */
  updateMemoryUsage() {
    if (performance.memory) {
      const memory = performance.memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
      
      // 记录内存历史用于泄漏检测
      if (!this.memoryHistory) {
        this.memoryHistory = [];
      }
      
      this.memoryHistory.push({
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        timestamp: performance.now()
      });
      
      // 保持最近100个记录
      if (this.memoryHistory.length > 100) {
        this.memoryHistory.shift();
      }
      
      // 检测内存泄漏
      this.detectMemoryLeak();
    }
  }

  /**
   * 检测内存泄漏
   */
  detectMemoryLeak() {
    if (!this.memoryHistory || this.memoryHistory.length < 50) return;
    
    const recent = this.memoryHistory.slice(-10);
    const older = this.memoryHistory.slice(-50, -40);
    
    const recentAvg = recent.reduce((sum, m) => sum + m.used, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.used, 0) / older.length;
    
    const growthRate = (recentAvg - olderAvg) / olderAvg;
    
    if (growthRate > 0.1) { // 10%增长率阈值
      eventBus.emit('performance:memory_leak_detected', {
        growthRate,
        currentUsage: recentAvg / 1024 / 1024,
        previousUsage: olderAvg / 1024 / 1024
      });
      
      if (this.debug) {
        console.warn(`[PerformanceMonitor] 检测到潜在内存泄漏，增长率: ${(growthRate * 100).toFixed(1)}%`);
      }
    }
  }

  /**
   * 检查性能警告
   */
  checkWarnings() {
    const { warningThresholds } = this.options;

    // FPS警告
    if (this.metrics.fps < warningThresholds.fps) {
      this.warnings.lowFps++;
      if (this.debug && this.warnings.lowFps % 60 === 1) { // 避免刷屏
        console.warn(`[PerformanceMonitor] 低FPS警告: ${this.metrics.fps.toFixed(1)}`);
      }
      eventBus.emit('performance:warning', {
        type: 'low_fps',
        value: this.metrics.fps,
        threshold: warningThresholds.fps
      });
    }

    // 帧时间警告
    if (this.metrics.frameTime > warningThresholds.frameTime) {
      this.warnings.highFrameTime++;
      if (this.debug && this.warnings.highFrameTime % 60 === 1) {
        console.warn(`[PerformanceMonitor] 高帧时间警告: ${this.metrics.frameTime.toFixed(1)}ms`);
      }
      eventBus.emit('performance:warning', {
        type: 'high_frame_time',
        value: this.metrics.frameTime,
        threshold: warningThresholds.frameTime
      });
    }

    // 内存警告
    if (this.metrics.memoryUsage > warningThresholds.memoryUsage) {
      this.warnings.highMemory++;
      if (this.debug && this.warnings.highMemory % 60 === 1) {
        console.warn(`[PerformanceMonitor] 高内存使用警告: ${this.metrics.memoryUsage.toFixed(1)}MB`);
      }
      eventBus.emit('performance:warning', {
        type: 'high_memory',
        value: this.metrics.memoryUsage,
        threshold: warningThresholds.memoryUsage
      });
    }
  }

  /**
   * 检查分析警告
   * @param {string} label - 分析标签
   * @param {number} duration - 持续时间
   */
  checkProfileWarning(label, duration) {
    const thresholds = {
      render: 10, // 渲染不应超过10ms
      update: 5,  // 更新不应超过5ms
      collision: 3, // 碰撞检测不应超过3ms
      ai: 2       // AI计算不应超过2ms
    };

    const threshold = thresholds[label];
    if (threshold && duration > threshold) {
      if (this.debug) {
        console.warn(`[PerformanceMonitor] ${label} 性能警告: ${duration.toFixed(2)}ms`);
      }
      eventBus.emit('performance:profile_warning', {
        label,
        duration,
        threshold
      });
    }
  }

  /**
   * 记录绘制调用
   * @param {number} count - 调用次数
   */
  recordDrawCalls(count = 1) {
    this.metrics.drawCalls += count;
  }

  /**
   * 记录对象数量
   * @param {number} count - 对象数量
   */
  recordObjectCount(count) {
    this.metrics.objectCount = count;
  }

  /**
   * 获取当前性能报告
   * @returns {Object} 性能报告
   */
  getReport() {
    const fpsStats = this.calculateFPSStats();
    const memoryStats = this.calculateMemoryStats();
    
    return {
      current: { ...this.metrics },
      averages: {
        fps: this.frameTimes.length > 0 ? 
          1000 / (this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length) : 0,
        frameTime: this.metrics.frameTime
      },
      fps: fpsStats,
      memory: memoryStats,
      warnings: { ...this.warnings },
      profiles: Object.fromEntries(this.profileData),
      gpu: this.getGPUInfo(),
      timestamp: Date.now()
    };
  }

  /**
   * 计算FPS统计信息
   * @returns {Object} FPS统计
   */
  calculateFPSStats() {
    if (this.frameTimes.length === 0) {
      return { min: 0, max: 0, avg: 0, p95: 0, p99: 0, stability: 0 };
    }
    
    const fps = this.frameTimes.map(ft => 1000 / ft).sort((a, b) => a - b);
    const len = fps.length;
    
    const min = fps[0];
    const max = fps[len - 1];
    const avg = fps.reduce((a, b) => a + b, 0) / len;
    const p95 = fps[Math.floor(len * 0.95)];
    const p99 = fps[Math.floor(len * 0.99)];
    
    // 计算稳定性（标准差的倒数）
    const variance = fps.reduce((sum, f) => sum + Math.pow(f - avg, 2), 0) / len;
    const stability = avg > 0 ? Math.max(0, 100 - Math.sqrt(variance)) : 0;
    
    return { min, max, avg, p95, p99, stability };
  }

  /**
   * 计算内存统计信息
   * @returns {Object} 内存统计
   */
  calculateMemoryStats() {
    if (!this.memoryHistory || this.memoryHistory.length === 0) {
      return { current: 0, peak: 0, growth: 0, efficiency: 100 };
    }
    
    const current = this.memoryHistory[this.memoryHistory.length - 1];
    const peak = Math.max(...this.memoryHistory.map(m => m.used));
    
    let growth = 0;
    if (this.memoryHistory.length > 10) {
      const recent = this.memoryHistory.slice(-5);
      const older = this.memoryHistory.slice(-15, -10);
      const recentAvg = recent.reduce((sum, m) => sum + m.used, 0) / recent.length;
      const olderAvg = older.reduce((sum, m) => sum + m.used, 0) / older.length;
      growth = ((recentAvg - olderAvg) / olderAvg) * 100;
    }
    
    const efficiency = current.total > 0 ? (current.used / current.total) * 100 : 100;
    
    return {
      current: current.used / 1024 / 1024,
      peak: peak / 1024 / 1024,
      total: current.total / 1024 / 1024,
      limit: current.limit / 1024 / 1024,
      growth,
      efficiency
    };
  }

  /**
   * 获取GPU信息
   * @returns {Object} GPU信息
   */
  getGPUInfo() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      return { supported: false };
    }
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const info = {
      supported: true,
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),
      version: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS)
    };
    
    if (debugInfo) {
      info.unmaskedVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      info.unmaskedRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    }
    
    return info;
  }

  /**
   * 获取性能建议
   * @returns {string[]} 建议列表
   */
  getOptimizationSuggestions() {
    const suggestions = [];
    const { metrics } = this;

    if (metrics.fps < 30) {
      suggestions.push('FPS过低，考虑减少粒子效果或降低渲染质量');
    } else if (metrics.fps < 45) {
      suggestions.push('FPS较低，建议优化渲染性能');
    }

    if (metrics.frameTime > 20) {
      suggestions.push('帧时间过长，检查主循环中的性能瓶颈');
    }

    if (metrics.renderTime > 10) {
      suggestions.push('渲染时间过长，考虑使用批量渲染或视锥剔除');
    }

    if (metrics.updateTime > 5) {
      suggestions.push('更新逻辑耗时过长，优化游戏逻辑代码');
    }

    if (metrics.memoryUsage > 100) {
      suggestions.push('内存使用过高，检查是否有内存泄漏');
    }

    if (metrics.drawCalls > 1000) {
      suggestions.push('绘制调用过多，考虑合并绘制操作');
    }

    if (metrics.objectCount > 5000) {
      suggestions.push('对象数量过多，考虑使用对象池优化');
    }

    return suggestions;
  }

  /**
   * 重置统计数据
   */
  reset() {
    this.frameTimes = [];
    this.metrics = {
      fps: 0,
      frameTime: 0,
      renderTime: 0,
      updateTime: 0,
      memoryUsage: 0,
      drawCalls: 0,
      objectCount: 0
    };
    this.warnings = {
      lowFps: 0,
      highFrameTime: 0,
      highMemory: 0
    };
    this.profileData.clear();
    this.frameCount = 0;
  }

  /**
   * 启用/禁用监控
   * @param {boolean} enabled - 是否启用
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (this.debug) {
      console.log(`[PerformanceMonitor] ${enabled ? '启用' : '禁用'}性能监控`);
    }
  }

  /**
   * 创建性能监控面板的HTML
   * @returns {string} HTML字符串
   */
  createDebugPanel() {
    const { metrics } = this;
    const fpsStats = this.calculateFPSStats();
    const memoryStats = this.calculateMemoryStats();
    
    const fpsColor = metrics.fps >= 55 ? '#00ff00' : metrics.fps >= 30 ? '#ffff00' : '#ff0000';
    const memoryColor = memoryStats.growth < 5 ? '#00ff00' : memoryStats.growth < 15 ? '#ffff00' : '#ff0000';
    
    return `
      <div id="performance-panel" style="
        position: fixed; top: 10px; right: 10px;
        background: rgba(0,0,0,0.9); color: #ffffff;
        padding: 12px; border-radius: 8px;
        font-family: 'Courier New', monospace; font-size: 11px;
        z-index: 9999; line-height: 1.3;
        min-width: 280px; max-width: 350px;
        border: 1px solid rgba(255,255,255,0.2);
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      ">
        <div style="color: #00ccff; font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">🎮 性能监控面板</div>
        
        <div style="margin-bottom: 6px;">
          <div style="color: ${fpsColor}; font-weight: bold;">📊 FPS: ${metrics.fps.toFixed(1)} (${fpsStats.min.toFixed(0)}-${fpsStats.max.toFixed(0)})</div>
          <div style="color: #cccccc; font-size: 10px;">稳定性: ${fpsStats.stability.toFixed(1)}%</div>
        </div>
        
        <div style="margin-bottom: 6px;">
          <div>⏱️ 帧时间: ${metrics.frameTime.toFixed(1)}ms</div>
          <div style="color: #aaaaaa; font-size: 10px;">渲染: ${metrics.renderTime.toFixed(1)}ms | 更新: ${metrics.updateTime.toFixed(1)}ms</div>
        </div>
        
        <div style="margin-bottom: 6px;">
          <div style="color: ${memoryColor};">💾 内存: ${memoryStats.current.toFixed(1)}MB</div>
          <div style="color: #aaaaaa; font-size: 10px;">峰值: ${memoryStats.peak.toFixed(1)}MB | 增长: ${memoryStats.growth >= 0 ? '+' : ''}${memoryStats.growth.toFixed(1)}%</div>
        </div>
        
        <div style="margin-bottom: 6px;">
          <div>🎨 绘制调用: ${metrics.drawCalls}</div>
          <div>📦 活跃对象: ${metrics.objectCount}</div>
        </div>
        
        <div style="color: #888888; font-size: 10px; margin-top: 8px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.1);">
          按F11切换显示 | 帧数: ${this.frameCount}
        </div>
      </div>
    `;
  }

  /**
   * 更新调试面板显示
   */
  updateDebugPanel() {
    const panel = document.getElementById('performance-panel');
    if (panel) {
      panel.outerHTML = this.createDebugPanel();
    }
  }
}

// 创建全局性能监控实例
const performanceMonitor = new PerformanceMonitor({
  sampleSize: 60,
  warningThresholds: {
    fps: 45,
    frameTime: 20,
    memoryUsage: 100
  },
  enableDetailedProfiling: true
});

// 开发模式下显示调试面板
if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
  // 创建调试面板
  document.addEventListener('DOMContentLoaded', () => {
    document.body.insertAdjacentHTML('beforeend', performanceMonitor.createDebugPanel());
    
    // 每秒更新一次面板
    setInterval(() => {
      performanceMonitor.updateDebugPanel();
    }, 1000);
  });

  // 添加键盘快捷键
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F11') {
      e.preventDefault();
      const panel = document.getElementById('performance-panel');
      if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      }
    }
  });
}

export { PerformanceMonitor };
export default performanceMonitor;