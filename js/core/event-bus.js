/**
 * @fileoverview 事件总线系统 - 提供模块间解耦通信
 * @author Qoder Team
 * @version 2.0.0
 */

/**
 * @typedef {Object} EventHandler
 * @property {Function} callback - 事件处理函数
 * @property {boolean} once - 是否只执行一次
 * @property {Object} context - 执行上下文
 */

/**
 * 事件总线类 - 实现发布订阅模式
 * 用于模块间解耦通信，避免直接依赖
 */
class EventBus {
  constructor() {
    /** @type {Map<string, EventHandler[]>} */
    this.events = new Map();
    /** @type {Function[]} */
    this.middlewares = [];
    /** @type {boolean} */
    this.debug = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development';
  }

  /**
   * 添加事件中间件
   * @param {Function} middleware - 中间件函数 (eventName, data) => data
   */
  use(middleware) {
    if (typeof middleware !== 'function') {
      throw new Error('Middleware must be a function');
    }
    this.middlewares.push(middleware);
  }

  /**
   * 监听事件
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   * @param {Object} options - 选项
   * @param {boolean} options.once - 是否只执行一次
   * @param {Object} options.context - 执行上下文
   * @returns {Function} 取消监听的函数
   */
  on(eventName, callback, options = {}) {
    if (typeof eventName !== 'string' || !eventName.trim()) {
      throw new Error('Event name must be a non-empty string');
    }
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    const handler = {
      callback,
      once: options.once || false,
      context: options.context || null
    };

    this.events.get(eventName).push(handler);

    if (this.debug) {
      console.log(`[EventBus] 注册事件监听器: ${eventName}`);
    }

    // 返回取消监听的函数
    return () => this.off(eventName, callback);
  }

  /**
   * 监听事件 (只执行一次)
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   * @param {Object} context - 执行上下文
   * @returns {Function} 取消监听的函数
   */
  once(eventName, callback, context = null) {
    return this.on(eventName, callback, { once: true, context });
  }

  /**
   * 取消事件监听
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 要移除的回调函数
   */
  off(eventName, callback) {
    const handlers = this.events.get(eventName);
    if (!handlers) return;

    const index = handlers.findIndex(handler => handler.callback === callback);
    if (index > -1) {
      handlers.splice(index, 1);
      
      // 如果没有监听器了，删除事件
      if (handlers.length === 0) {
        this.events.delete(eventName);
      }

      if (this.debug) {
        console.log(`[EventBus] 移除事件监听器: ${eventName}`);
      }
    }
  }

  /**
   * 发布事件
   * @param {string} eventName - 事件名称
   * @param {any} data - 事件数据
   * @returns {boolean} 是否有监听器处理了事件
   */
  emit(eventName, data = null) {
    const handlers = this.events.get(eventName);
    if (!handlers || handlers.length === 0) {
      if (this.debug) {
        console.warn(`[EventBus] 没有监听器处理事件: ${eventName}`);
      }
      return false;
    }

    // 执行中间件链
    let processedData = data;
    try {
      for (const middleware of this.middlewares) {
        processedData = middleware(eventName, processedData);
      }
    } catch (error) {
      console.error('[EventBus] 中间件执行错误:', error);
      return false;
    }

    // 执行事件处理器
    const handlersToRemove = [];
    let handledCount = 0;

    for (let i = 0; i < handlers.length; i++) {
      const handler = handlers[i];
      
      try {
        if (handler.context) {
          handler.callback.call(handler.context, processedData);
        } else {
          handler.callback(processedData);
        }
        
        handledCount++;

        // 标记需要移除的一次性监听器
        if (handler.once) {
          handlersToRemove.push(handler);
        }
      } catch (error) {
        console.error(`[EventBus] 事件处理器执行错误 (${eventName}):`, error);
      }
    }

    // 移除一次性监听器
    for (const handler of handlersToRemove) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }

    // 如果没有监听器了，删除事件
    if (handlers.length === 0) {
      this.events.delete(eventName);
    }

    if (this.debug && handledCount > 0) {
      console.log(`[EventBus] 事件已处理: ${eventName} (${handledCount}个监听器)`);
    }

    return handledCount > 0;
  }

  /**
   * 移除所有事件监听器
   * @param {string} eventName - 可选，只移除指定事件的监听器
   */
  clear(eventName = null) {
    if (eventName) {
      this.events.delete(eventName);
      if (this.debug) {
        console.log(`[EventBus] 清除事件监听器: ${eventName}`);
      }
    } else {
      this.events.clear();
      if (this.debug) {
        console.log('[EventBus] 清除所有事件监听器');
      }
    }
  }

  /**
   * 获取事件统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const stats = {
      totalEvents: this.events.size,
      totalListeners: 0,
      events: {}
    };

    for (const [eventName, handlers] of this.events) {
      stats.totalListeners += handlers.length;
      stats.events[eventName] = {
        listeners: handlers.length,
        hasOnceListeners: handlers.some(h => h.once)
      };
    }

    return stats;
  }

  /**
   * 等待事件触发 (Promise化)
   * @param {string} eventName - 事件名称
   * @param {number} timeout - 超时时间(毫秒)，默认5000ms
   * @returns {Promise} Promise对象
   */
  waitFor(eventName, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(eventName, handler);
        reject(new Error(`等待事件超时: ${eventName}`));
      }, timeout);

      const handler = (data) => {
        clearTimeout(timer);
        resolve(data);
      };

      this.once(eventName, handler);
    });
  }
}

// 创建全局事件总线实例
const eventBus = new EventBus();

// 添加性能监控中间件
if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
  eventBus.use((eventName, data) => {
    const startTime = performance.now();
    // 在下一个事件循环中记录执行时间
    setTimeout(() => {
      const duration = performance.now() - startTime;
      if (duration > 10) { // 只记录耗时超过10ms的事件
        console.warn(`[EventBus] 事件处理耗时: ${eventName} - ${duration.toFixed(2)}ms`);
      }
    }, 0);
    return data;
  });
}

export { EventBus };
export default eventBus;