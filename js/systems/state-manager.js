/**
 * @fileoverview 状态管理系统 - 提供集中式状态管理和数据流控制
 * @author Qoder Team
 * @version 2.0.0
 */

import eventBus from './event-bus.js';

/**
 * @typedef {Object} Action
 * @property {string} type - 动作类型
 * @property {any} payload - 负载数据
 * @property {string} [meta] - 元数据
 */

/**
 * @typedef {Function} Reducer
 * @param {Object} state - 当前状态
 * @param {Action} action - 动作对象
 * @returns {Object} 新状态
 */

/**
 * @typedef {Function} Middleware
 * @param {Action} action - 动作对象
 * @param {Object} state - 当前状态
 * @returns {Action} 处理后的动作
 */

/**
 * 状态管理器类 - 实现类似Redux的状态管理
 */
class StateManager {
  constructor(initialState = {}) {
    /** @type {Object} */
    this.state = { ...initialState };
    /** @type {Map<string, Reducer>} */
    this.reducers = new Map();
    /** @type {Middleware[]} */
    this.middlewares = [];
    /** @type {Function[]} */
    this.subscribers = [];
    /** @type {Object[]} */
    this.history = [];
    /** @type {boolean} */
    this.debug = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development';
    /** @type {number} */
    this.maxHistorySize = 50;

    // 绑定事件总线
    this.eventBus = eventBus;
  }

  /**
   * 注册状态处理器
   * @param {string} actionType - 动作类型
   * @param {Reducer} reducer - 状态处理函数
   */
  registerReducer(actionType, reducer) {
    if (typeof actionType !== 'string' || !actionType.trim()) {
      throw new Error('Action type must be a non-empty string');
    }
    if (typeof reducer !== 'function') {
      throw new Error('Reducer must be a function');
    }

    this.reducers.set(actionType, reducer);

    if (this.debug) {
      console.log(`[StateManager] 注册 Reducer: ${actionType}`);
    }
  }

  /**
   * 添加中间件
   * @param {Middleware} middleware - 中间件函数
   */
  use(middleware) {
    if (typeof middleware !== 'function') {
      throw new Error('Middleware must be a function');
    }
    this.middlewares.push(middleware);
  }

  /**
   * 派发动作
   * @param {Action} action - 动作对象
   * @returns {boolean} 是否处理成功
   */
  dispatch(action) {
    if (!action || typeof action.type !== 'string') {
      console.error('[StateManager] 无效的动作对象:', action);
      return false;
    }

    // 记录动作历史
    if (this.history.length >= this.maxHistorySize) {
      this.history.shift();
    }
    this.history.push({
      action: { ...action },
      timestamp: Date.now(),
      previousState: { ...this.state }
    });

    try {
      // 执行中间件
      let processedAction = { ...action };
      for (const middleware of this.middlewares) {
        processedAction = middleware(processedAction, this.state);
        if (!processedAction) {
          if (this.debug) {
            console.log(`[StateManager] 中间件中止了动作: ${action.type}`);
          }
          return false;
        }
      }

      // 查找对应的 Reducer
      const reducer = this.reducers.get(processedAction.type);
      if (!reducer) {
        if (this.debug) {
          console.warn(`[StateManager] 没有找到 Reducer: ${processedAction.type}`);
        }
        return false;
      }

      // 执行状态更新
      const previousState = { ...this.state };
      const newState = reducer(this.state, processedAction);

      if (newState && typeof newState === 'object') {
        this.setState(newState, processedAction.type);
        
        // 发布状态变更事件
        this.eventBus.emit('state:changed', {
          actionType: processedAction.type,
          previousState,
          newState: this.state,
          action: processedAction
        });

        if (this.debug) {
          console.log(`[StateManager] 状态已更新: ${processedAction.type}`, {
            action: processedAction,
            previousState,
            newState: this.state
          });
        }

        return true;
      } else {
        console.error(`[StateManager] Reducer 返回了无效状态: ${processedAction.type}`);
        return false;
      }

    } catch (error) {
      console.error(`[StateManager] 处理动作时出错 (${action.type}):`, error);
      
      // 发布错误事件
      this.eventBus.emit('state:error', {
        actionType: action.type,
        action,
        error,
        state: this.state
      });

      return false;
    }
  }

  /**
   * 直接设置状态 (内部使用)
   * @param {Object} newState - 新状态
   * @param {string} source - 状态变更源
   */
  setState(newState, source = 'manual') {
    const previousState = { ...this.state };
    this.state = { ...this.state, ...newState };
    
    // 通知所有订阅者
    this.notifySubscribers(previousState, source);
  }

  /**
   * 获取当前状态
   * @param {string} path - 状态路径 (可选)，如 'player.hp'
   * @returns {any} 状态值
   */
  getState(path = null) {
    if (!path) {
      return { ...this.state };
    }

    // 支持路径访问，如 'player.hp'
    return path.split('.').reduce((state, key) => {
      return state && state[key] !== undefined ? state[key] : undefined;
    }, this.state);
  }

  /**
   * 订阅状态变化
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消订阅的函数
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    this.subscribers.push(callback);

    if (this.debug) {
      console.log(`[StateManager] 新增订阅者，总数: ${this.subscribers.length}`);
    }

    // 返回取消订阅的函数
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
        if (this.debug) {
          console.log(`[StateManager] 移除订阅者，剩余: ${this.subscribers.length}`);
        }
      }
    };
  }

  /**
   * 通知所有订阅者
   * @param {Object} previousState - 之前的状态
   * @param {string} source - 变更源
   */
  notifySubscribers(previousState, source) {
    for (const subscriber of this.subscribers) {
      try {
        subscriber(this.state, previousState, source);
      } catch (error) {
        console.error('[StateManager] 订阅者执行错误:', error);
      }
    }
  }

  /**
   * 重置状态
   * @param {Object} newState - 新的初始状态
   */
  reset(newState = {}) {
    const previousState = { ...this.state };
    this.state = { ...newState };
    this.history = [];
    
    this.notifySubscribers(previousState, 'reset');
    
    this.eventBus.emit('state:reset', {
      previousState,
      newState: this.state
    });

    if (this.debug) {
      console.log('[StateManager] 状态已重置');
    }
  }

  /**
   * 获取状态历史
   * @param {number} limit - 限制返回的历史条目数
   * @returns {Array} 历史记录
   */
  getHistory(limit = 10) {
    return this.history.slice(-limit);
  }

  /**
   * 时间旅行 - 回到之前的状态
   * @param {number} steps - 回退步数
   * @returns {boolean} 是否成功
   */
  timeTravel(steps = 1) {
    if (steps < 1 || steps >= this.history.length) {
      console.warn('[StateManager] 无效的时间旅行步数');
      return false;
    }

    const targetHistoryIndex = this.history.length - steps - 1;
    const targetEntry = this.history[targetHistoryIndex];
    
    if (targetEntry) {
      const previousState = { ...this.state };
      this.state = { ...targetEntry.previousState };
      
      // 清除被回退的历史
      this.history = this.history.slice(0, targetHistoryIndex + 1);
      
      this.notifySubscribers(previousState, 'timeTravel');
      
      this.eventBus.emit('state:timeTravel', {
        steps,
        previousState,
        newState: this.state
      });

      if (this.debug) {
        console.log(`[StateManager] 时间旅行: 回退 ${steps} 步`);
      }

      return true;
    }

    return false;
  }

  /**
   * 创建动作创建器
   * @param {string} type - 动作类型
   * @returns {Function} 动作创建器函数
   */
  createActionCreator(type) {
    return (payload = null, meta = null) => ({
      type,
      payload,
      meta,
      timestamp: Date.now()
    });
  }

  /**
   * 获取调试信息
   * @returns {Object} 调试信息
   */
  getDebugInfo() {
    return {
      currentState: { ...this.state },
      registeredReducers: Array.from(this.reducers.keys()),
      middlewareCount: this.middlewares.length,
      subscriberCount: this.subscribers.length,
      historySize: this.history.length,
      lastAction: this.history.length > 0 ? 
        this.history[this.history.length - 1].action : null
    };
  }
}

// 游戏状态定义
const initialGameState = {
  gameStatus: 'menu', // menu, playing, paused, gameOver
  player: {
    x: 400,
    y: 300,
    hp: 100,
    maxHp: 100,
    level: 1,
    exp: 0,
    expToNext: 100,
    stats: {
      damage: 10,
      defense: 0,
      speed: 3,
      critRate: 0.1,
      critMulti: 1.5
    }
  },
  world: {
    currentWave: 0,
    enemyCount: 0,
    timer: 0,
    score: 0,
    kills: 0
  },
  ui: {
    showUpgradeModal: false,
    showGameOverModal: false,
    showInfoPanel: false,
    selectedUpgrades: []
  },
  performance: {
    fps: 60,
    frameTime: 16.67,
    renderTime: 0,
    memoryUsage: 0
  }
};

// 创建全局状态管理器
const stateManager = new StateManager(initialGameState);

// 添加日志中间件
if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
  stateManager.use((action, state) => {
    console.log(`[Action] ${action.type}`, action.payload);
    return action;
  });
}

export { StateManager, initialGameState };
export default stateManager;