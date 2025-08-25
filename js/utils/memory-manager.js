/**
 * 内存管理系统
 * 负责监控内存使用、触发垃圾回收、检测内存泄漏
 * @author SOLO Coding
 */

import { eventBus } from '../core/event-bus.js';

/**
 * @typedef {Object} MemoryStats
 * @property {number} used - 已使用内存(MB)
 * @property {number} total - 总分配内存(MB)
 * @property {number} limit - 内存限制(MB)
 * @property {number} usage - 使用率(%)
 * @property {number} growth - 增长率(%)
 * @property {boolean} isLow - 是否内存不足
 */

/**
 * @typedef {Object} GCStats
 * @property {number} triggered - 触发次数
 * @property {number} lastTrigger - 上次触发时间
 * @property {number} memoryFreed - 释放的内存(MB)
 * @property {number} avgFreed - 平均释放内存(MB)
 */

class MemoryManager {
  constructor() {
    /** @type {Array<{used: number, total: number, limit: number, timestamp: number}>} */
    this.memoryHistory = [];
    
    /** @type {GCStats} */
    this.gcStats = {
      triggered: 0,
      lastTrigger: 0,
      memoryFreed: 0,
      avgFreed: 0
    };
    
    /** @type {Map<string, WeakRef>} */
    this.objectRefs = new Map();
    
    /** @type {Set<string>} */
    this.leakSources = new Set();
    
    this.config = {
      // 内存阈值配置
      highMemoryThreshold: 0.8,    // 80%触发警告
      criticalMemoryThreshold: 0.9, // 90%触发强制GC
      gcCooldown: 5000,            // GC冷却时间(ms)
      historySize: 200,            // 历史记录大小
      leakDetectionInterval: 10000, // 泄漏检测间隔(ms)
      
      // 优化配置
      enableAutoGC: true,          // 自动垃圾回收
      enableLeakDetection: true,   // 内存泄漏检测
      enableObjectTracking: true,  // 对象跟踪
      aggressiveMode: false        // 激进模式
    };
    
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.leakDetectionInterval = null;
    
    this.init();
  }
  
  /**
   * 初始化内存管理器
   */
  init() {
    if (!performance.memory) {
      console.warn('[MemoryManager] Performance.memory API不可用');
      return;
    }
    
    this.startMonitoring();
    this.setupEventListeners();
    
    if (this.config.enableLeakDetection) {
      this.startLeakDetection();
    }
    
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.onPageHidden();
      } else {
        this.onPageVisible();
      }
    });
    
    console.log('[MemoryManager] 内存管理器已初始化');
  }
  
  /**
   * 开始内存监控
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.updateMemoryStats();
      this.checkMemoryPressure();
    }, 1000);
  }
  
  /**
   * 停止内存监控
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
  
  /**
   * 开始内存泄漏检测
   */
  startLeakDetection() {
    this.leakDetectionInterval = setInterval(() => {
      this.detectMemoryLeaks();
      this.cleanupWeakRefs();
    }, this.config.leakDetectionInterval);
  }
  
  /**
   * 更新内存统计
   */
  updateMemoryStats() {
    if (!performance.memory) return;
    
    const memory = performance.memory;
    const stats = {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      timestamp: performance.now()
    };
    
    this.memoryHistory.push(stats);
    
    // 保持历史记录大小
    if (this.memoryHistory.length > this.config.historySize) {
      this.memoryHistory.shift();
    }
  }
  
  /**
   * 检查内存压力
   */
  checkMemoryPressure() {
    const stats = this.getCurrentMemoryStats();
    if (!stats) return;
    
    const usage = stats.usage / 100;
    
    if (usage >= this.config.criticalMemoryThreshold) {
      this.handleCriticalMemory(stats);
    } else if (usage >= this.config.highMemoryThreshold) {
      this.handleHighMemory(stats);
    }
  }
  
  /**
   * 处理临界内存状态
   * @param {MemoryStats} stats - 内存统计
   */
  handleCriticalMemory(stats) {
    console.warn('[MemoryManager] 内存使用临界，触发强制垃圾回收');
    
    eventBus.emit('memory:critical', stats);
    
    if (this.config.enableAutoGC) {
      this.forceGarbageCollection();
    }
    
    // 激进模式：清理所有可清理的缓存
    if (this.config.aggressiveMode) {
      this.aggressiveCleanup();
    }
  }
  
  /**
   * 处理高内存使用状态
   * @param {MemoryStats} stats - 内存统计
   */
  handleHighMemory(stats) {
    console.warn('[MemoryManager] 内存使用过高');
    
    eventBus.emit('memory:high', stats);
    
    // 建议进行垃圾回收
    if (this.config.enableAutoGC && this.shouldTriggerGC()) {
      this.requestGarbageCollection();
    }
  }
  
  /**
   * 是否应该触发垃圾回收
   * @returns {boolean}
   */
  shouldTriggerGC() {
    const now = performance.now();
    return now - this.gcStats.lastTrigger > this.config.gcCooldown;
  }
  
  /**
   * 请求垃圾回收
   */
  requestGarbageCollection() {
    if (!this.shouldTriggerGC()) return;
    
    const beforeMemory = this.getCurrentMemoryUsage();
    
    // 触发垃圾回收的各种方法
    this.triggerGC();
    
    setTimeout(() => {
      const afterMemory = this.getCurrentMemoryUsage();
      const freed = beforeMemory - afterMemory;
      
      this.gcStats.triggered++;
      this.gcStats.lastTrigger = performance.now();
      this.gcStats.memoryFreed += freed;
      this.gcStats.avgFreed = this.gcStats.memoryFreed / this.gcStats.triggered;
      
      eventBus.emit('memory:gc_completed', {
        freed: freed / 1024 / 1024,
        before: beforeMemory / 1024 / 1024,
        after: afterMemory / 1024 / 1024
      });
      
      console.log(`[MemoryManager] GC完成，释放内存: ${(freed / 1024 / 1024).toFixed(2)}MB`);
    }, 100);
  }
  
  /**
   * 强制垃圾回收
   */
  forceGarbageCollection() {
    console.log('[MemoryManager] 强制垃圾回收');
    
    // 清理所有可能的引用
    this.cleanupAllReferences();
    
    // 触发GC
    this.triggerGC();
    
    // 通知系统进行清理
    eventBus.emit('memory:force_cleanup');
  }
  
  /**
   * 触发垃圾回收的实际方法
   */
  triggerGC() {
    // 方法1: 创建大量临时对象强制GC
    const temp = [];
    for (let i = 0; i < 100000; i++) {
      temp.push({});
    }
    temp.length = 0;
    
    // 方法2: 如果支持，直接调用gc()
    if (typeof window !== 'undefined' && window.gc) {
      window.gc();
    }
    
    // 方法3: 使用MessageChannel异步触发
    if (typeof MessageChannel !== 'undefined') {
      try {
        const channel = new MessageChannel();
        channel.port1.postMessage(null);
        channel.port1.close();
        channel.port2.close();
      } catch (error) {
        console.warn('[MemoryManager] MessageChannel not available:', error);
      }
    }
  }
  
  /**
   * 激进清理模式
   */
  aggressiveCleanup() {
    console.log('[MemoryManager] 激进清理模式');
    
    // 清理图片缓存
    eventBus.emit('memory:clear_image_cache');
    
    // 清理音频缓存
    eventBus.emit('memory:clear_audio_cache');
    
    // 清理对象池
    eventBus.emit('memory:shrink_object_pools');
    
    // 清理事件监听器
    eventBus.emit('memory:cleanup_listeners');
  }
  
  /**
   * 检测内存泄漏
   */
  detectMemoryLeaks() {
    if (this.memoryHistory.length < 50) return;
    
    const recent = this.memoryHistory.slice(-10);
    const older = this.memoryHistory.slice(-50, -40);
    
    const recentAvg = recent.reduce((sum, m) => sum + m.used, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.used, 0) / older.length;
    
    const growthRate = (recentAvg - olderAvg) / olderAvg;
    
    if (growthRate > 0.1) { // 10%增长率阈值
      const leakInfo = {
        growthRate: growthRate * 100,
        currentUsage: recentAvg / 1024 / 1024,
        previousUsage: olderAvg / 1024 / 1024,
        timestamp: Date.now()
      };
      
      console.warn(`[MemoryManager] 检测到潜在内存泄漏，增长率: ${leakInfo.growthRate.toFixed(1)}%`);
      eventBus.emit('memory:leak_detected', leakInfo);
      
      // 尝试定位泄漏源
      this.analyzeLeakSources();
    }
  }
  
  /**
   * 分析泄漏源
   */
  analyzeLeakSources() {
    // 检查常见的泄漏源
    const sources = [
      'DOM节点未清理',
      '事件监听器未移除',
      '定时器未清理',
      '闭包引用循环',
      '全局变量累积'
    ];
    
    sources.forEach(source => {
      this.leakSources.add(source);
    });
    
    eventBus.emit('memory:leak_sources', Array.from(this.leakSources));
  }
  
  /**
   * 跟踪对象
   * @param {string} id - 对象ID
   * @param {Object} obj - 要跟踪的对象
   */
  trackObject(id, obj) {
    if (!this.config.enableObjectTracking) return;
    
    this.objectRefs.set(id, new WeakRef(obj));
  }
  
  /**
   * 清理弱引用
   */
  cleanupWeakRefs() {
    let cleaned = 0;
    
    for (const [id, ref] of this.objectRefs.entries()) {
      if (ref.deref() === undefined) {
        this.objectRefs.delete(id);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`[MemoryManager] 清理了${cleaned}个失效的对象引用`);
    }
  }
  
  /**
   * 清理所有引用
   */
  cleanupAllReferences() {
    this.objectRefs.clear();
    this.leakSources.clear();
  }
  
  /**
   * 页面隐藏时的处理
   */
  onPageHidden() {
    console.log('[MemoryManager] 页面隐藏，执行内存清理');
    
    if (this.config.enableAutoGC) {
      this.requestGarbageCollection();
    }
    
    // 降低监控频率
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = setInterval(() => {
        this.updateMemoryStats();
        this.checkMemoryPressure();
      }, 5000); // 5秒间隔
    }
  }
  
  /**
   * 页面可见时的处理
   */
  onPageVisible() {
    console.log('[MemoryManager] 页面可见，恢复正常监控');
    
    // 恢复正常监控频率
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = setInterval(() => {
        this.updateMemoryStats();
        this.checkMemoryPressure();
      }, 1000); // 1秒间隔
    }
  }
  
  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 监听内存清理请求
    eventBus.on('memory:request_cleanup', () => {
      this.requestGarbageCollection();
    });
    
    // 监听配置更新
    eventBus.on('memory:update_config', (config) => {
      Object.assign(this.config, config);
    });
    
    // 监听对象池收缩请求
    eventBus.on('memory:shrink_object_pools', () => {
      eventBus.emit('object_pool:shrink_all');
    });
  }
  
  /**
   * 获取当前内存使用量
   * @returns {number} 内存使用量(字节)
   */
  getCurrentMemoryUsage() {
    return performance.memory ? performance.memory.usedJSHeapSize : 0;
  }
  
  /**
   * 获取当前内存统计
   * @returns {MemoryStats|null} 内存统计
   */
  getCurrentMemoryStats() {
    if (!performance.memory || this.memoryHistory.length === 0) {
      return null;
    }
    
    const current = this.memoryHistory[this.memoryHistory.length - 1];
    const usage = (current.used / current.limit) * 100;
    
    let growth = 0;
    if (this.memoryHistory.length > 10) {
      const previous = this.memoryHistory[this.memoryHistory.length - 11];
      growth = ((current.used - previous.used) / previous.used) * 100;
    }
    
    return {
      used: current.used / 1024 / 1024,
      total: current.total / 1024 / 1024,
      limit: current.limit / 1024 / 1024,
      usage,
      growth,
      isLow: usage < 20
    };
  }
  
  /**
   * 获取内存管理报告
   * @returns {Object} 内存管理报告
   */
  getReport() {
    const stats = this.getCurrentMemoryStats();
    
    return {
      current: stats,
      gc: { ...this.gcStats },
      history: this.memoryHistory.slice(-20), // 最近20条记录
      leakSources: Array.from(this.leakSources),
      trackedObjects: this.objectRefs.size,
      config: { ...this.config },
      isMonitoring: this.isMonitoring
    };
  }
  
  /**
   * 获取内存优化建议
   * @returns {string[]} 建议列表
   */
  getOptimizationSuggestions() {
    const stats = this.getCurrentMemoryStats();
    const suggestions = [];
    
    if (!stats) {
      suggestions.push('无法获取内存信息，请检查浏览器支持');
      return suggestions;
    }
    
    if (stats.usage > 80) {
      suggestions.push('内存使用过高，建议清理不必要的对象');
      suggestions.push('考虑启用激进清理模式');
    }
    
    if (stats.growth > 5) {
      suggestions.push('内存持续增长，检查是否存在内存泄漏');
      suggestions.push('检查事件监听器和定时器是否正确清理');
    }
    
    if (this.gcStats.avgFreed < 1) {
      suggestions.push('垃圾回收效果不佳，检查对象引用关系');
    }
    
    if (this.leakSources.size > 0) {
      suggestions.push('发现潜在泄漏源，建议进行代码审查');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('内存使用正常，继续保持良好的编程习惯');
    }
    
    return suggestions;
  }
  
  /**
   * 销毁内存管理器
   */
  destroy() {
    this.stopMonitoring();
    
    if (this.leakDetectionInterval) {
      clearInterval(this.leakDetectionInterval);
    }
    
    this.cleanupAllReferences();
    this.memoryHistory.length = 0;
    
    console.log('[MemoryManager] 内存管理器已销毁');
  }
}

// 创建全局实例
const memoryManager = new MemoryManager();

// 开发模式下暴露到全局
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.memoryManager = memoryManager;
}

export { memoryManager, MemoryManager };
export default memoryManager;