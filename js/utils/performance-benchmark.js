/**
 * 性能基准测试系统
 * 用于测试和验证游戏性能优化效果
 * @author SOLO Coding
 */

import { eventBus } from '../core/event-bus.js';
import { performanceMonitor } from './performance-monitor.js';
import { memoryManager } from './memory-manager.js';

/**
 * @typedef {Object} BenchmarkResult
 * @property {string} name - 测试名称
 * @property {number} duration - 测试持续时间(ms)
 * @property {Object} metrics - 性能指标
 * @property {boolean} passed - 是否通过
 * @property {string[]} issues - 发现的问题
 */

/**
 * @typedef {Object} BenchmarkSuite
 * @property {string} name - 测试套件名称
 * @property {BenchmarkResult[]} results - 测试结果
 * @property {Object} summary - 汇总信息
 */

class PerformanceBenchmark {
  constructor() {
    this.isRunning = false;
    this.currentSuite = null;
    this.results = new Map();
    
    // 性能目标配置
    this.targets = {
      fps: {
        min: 55,      // 最低FPS
        avg: 60,      // 平均FPS
        stability: 90  // 稳定性百分比
      },
      memory: {
        maxUsage: 100,    // 最大内存使用(MB)
        maxGrowth: 5,     // 最大增长率(%)
        gcEfficiency: 80  // GC效率百分比
      },
      rendering: {
        maxFrameTime: 16.67,  // 最大帧时间(ms)
        maxRenderTime: 10,    // 最大渲染时间(ms)
        maxDrawCalls: 100     // 最大绘制调用数
      },
      responsiveness: {
        maxInputLag: 50,      // 最大输入延迟(ms)
        maxUpdateTime: 5      // 最大更新时间(ms)
      }
    };
    
    // 测试场景配置
    this.scenarios = {
      idle: {
        name: '空闲状态',
        duration: 5000,
        setup: () => this.setupIdleScenario(),
        cleanup: () => this.cleanupScenario()
      },
      light: {
        name: '轻度负载',
        duration: 10000,
        setup: () => this.setupLightScenario(),
        cleanup: () => this.cleanupScenario()
      },
      medium: {
        name: '中度负载',
        duration: 15000,
        setup: () => this.setupMediumScenario(),
        cleanup: () => this.cleanupScenario()
      },
      heavy: {
        name: '重度负载',
        duration: 20000,
        setup: () => this.setupHeavyScenario(),
        cleanup: () => this.cleanupScenario()
      },
      stress: {
        name: '压力测试',
        duration: 30000,
        setup: () => this.setupStressScenario(),
        cleanup: () => this.cleanupScenario()
      }
    };
    
    this.init();
  }
  
  /**
   * 初始化基准测试系统
   */
  init() {
    this.setupEventListeners();
    console.log('[PerformanceBenchmark] 性能基准测试系统已初始化');
  }
  
  /**
   * 运行完整的基准测试套件
   * @param {string[]} scenarioNames - 要运行的场景名称
   * @returns {Promise<BenchmarkSuite>} 测试结果
   */
  async runBenchmarkSuite(scenarioNames = Object.keys(this.scenarios)) {
    if (this.isRunning) {
      throw new Error('基准测试正在运行中');
    }
    
    this.isRunning = true;
    const suiteName = `性能基准测试 - ${new Date().toLocaleString()}`;
    
    console.log(`[PerformanceBenchmark] 开始运行基准测试套件: ${suiteName}`);
    eventBus.emit('benchmark:suite_started', { name: suiteName, scenarios: scenarioNames });
    
    const results = [];
    
    try {
      // 预热阶段
      await this.warmup();
      
      // 运行各个测试场景
      for (const scenarioName of scenarioNames) {
        if (!this.scenarios[scenarioName]) {
          console.warn(`[PerformanceBenchmark] 未知的测试场景: ${scenarioName}`);
          continue;
        }
        
        console.log(`[PerformanceBenchmark] 运行场景: ${this.scenarios[scenarioName].name}`);
        const result = await this.runScenario(scenarioName);
        results.push(result);
        
        // 场景间休息
        await this.rest(2000);
      }
      
      // 生成测试套件结果
      const suite = this.generateSuiteReport(suiteName, results);
      this.results.set(suiteName, suite);
      
      eventBus.emit('benchmark:suite_completed', suite);
      console.log('[PerformanceBenchmark] 基准测试套件完成');
      
      return suite;
      
    } catch (error) {
      console.error('[PerformanceBenchmark] 基准测试失败:', error);
      eventBus.emit('benchmark:suite_failed', { error: error.message });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }
  
  /**
   * 运行单个测试场景
   * @param {string} scenarioName - 场景名称
   * @returns {Promise<BenchmarkResult>} 测试结果
   */
  async runScenario(scenarioName) {
    const scenario = this.scenarios[scenarioName];
    if (!scenario) {
      throw new Error(`未知的测试场景: ${scenarioName}`);
    }
    
    const startTime = performance.now();
    
    // 重置性能监控
    performanceMonitor.reset();
    memoryManager.gcStats.triggered = 0;
    
    // 设置测试场景
    await scenario.setup();
    
    // 收集基线数据
    const baselineMetrics = this.collectMetrics();
    
    // 运行测试
    eventBus.emit('benchmark:scenario_started', { name: scenario.name });
    
    await new Promise(resolve => {
      setTimeout(resolve, scenario.duration);
    });
    
    // 收集结果数据
    const finalMetrics = this.collectMetrics();
    
    // 清理测试场景
    await scenario.cleanup();
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // 分析结果
    const result = this.analyzeScenarioResult({
      name: scenario.name,
      duration,
      baseline: baselineMetrics,
      final: finalMetrics
    });
    
    eventBus.emit('benchmark:scenario_completed', result);
    
    return result;
  }
  
  /**
   * 预热阶段
   * @returns {Promise<void>}
   */
  async warmup() {
    console.log('[PerformanceBenchmark] 预热阶段开始');
    
    // 触发一次垃圾回收
    memoryManager.requestGarbageCollection();
    
    // 等待系统稳定
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('[PerformanceBenchmark] 预热阶段完成');
  }
  
  /**
   * 休息阶段
   * @param {number} duration - 休息时间(ms)
   * @returns {Promise<void>}
   */
  async rest(duration) {
    console.log(`[PerformanceBenchmark] 休息 ${duration}ms`);
    
    // 触发垃圾回收
    memoryManager.requestGarbageCollection();
    
    await new Promise(resolve => setTimeout(resolve, duration));
  }
  
  /**
   * 设置空闲场景
   */
  setupIdleScenario() {
    // 暂停游戏更新
    eventBus.emit('game:pause');
  }
  
  /**
   * 设置轻度负载场景
   */
  setupLightScenario() {
    eventBus.emit('game:resume');
    
    // 生成少量敌人
    eventBus.emit('benchmark:spawn_enemies', { count: 10 });
    
    // 模拟玩家移动
    this.simulatePlayerMovement(0.3);
  }
  
  /**
   * 设置中度负载场景
   */
  setupMediumScenario() {
    eventBus.emit('game:resume');
    
    // 生成中等数量敌人
    eventBus.emit('benchmark:spawn_enemies', { count: 50 });
    
    // 生成子弹
    eventBus.emit('benchmark:spawn_bullets', { count: 20 });
    
    // 模拟玩家移动和射击
    this.simulatePlayerMovement(0.6);
    this.simulatePlayerShooting(0.4);
  }
  
  /**
   * 设置重度负载场景
   */
  setupHeavyScenario() {
    eventBus.emit('game:resume');
    
    // 生成大量敌人
    eventBus.emit('benchmark:spawn_enemies', { count: 100 });
    
    // 生成大量子弹
    eventBus.emit('benchmark:spawn_bullets', { count: 50 });
    
    // 生成粒子效果
    eventBus.emit('benchmark:spawn_particles', { count: 200 });
    
    // 高强度模拟
    this.simulatePlayerMovement(0.8);
    this.simulatePlayerShooting(0.7);
  }
  
  /**
   * 设置压力测试场景
   */
  setupStressScenario() {
    eventBus.emit('game:resume');
    
    // 极限数量的游戏对象
    eventBus.emit('benchmark:spawn_enemies', { count: 200 });
    eventBus.emit('benchmark:spawn_bullets', { count: 100 });
    eventBus.emit('benchmark:spawn_particles', { count: 500 });
    
    // 最高强度模拟
    this.simulatePlayerMovement(1.0);
    this.simulatePlayerShooting(1.0);
    
    // 额外的视觉效果
    eventBus.emit('benchmark:enable_effects', { 
      explosions: true,
      trails: true,
      screen_shake: true
    });
  }
  
  /**
   * 清理测试场景
   */
  cleanupScenario() {
    // 停止所有模拟
    this.stopAllSimulations();
    
    // 清理游戏对象
    eventBus.emit('benchmark:cleanup_objects');
    
    // 禁用特效
    eventBus.emit('benchmark:disable_effects');
    
    // 暂停游戏
    eventBus.emit('game:pause');
  }
  
  /**
   * 模拟玩家移动
   * @param {number} intensity - 强度(0-1)
   */
  simulatePlayerMovement(intensity) {
    const interval = Math.max(50, 200 - intensity * 150);
    
    this.movementSimulation = setInterval(() => {
      const direction = Math.random() * Math.PI * 2;
      const distance = intensity * 100;
      
      eventBus.emit('benchmark:simulate_movement', {
        direction,
        distance
      });
    }, interval);
  }
  
  /**
   * 模拟玩家射击
   * @param {number} intensity - 强度(0-1)
   */
  simulatePlayerShooting(intensity) {
    const interval = Math.max(100, 500 - intensity * 400);
    
    this.shootingSimulation = setInterval(() => {
      eventBus.emit('benchmark:simulate_shooting');
    }, interval);
  }
  
  /**
   * 停止所有模拟
   */
  stopAllSimulations() {
    if (this.movementSimulation) {
      clearInterval(this.movementSimulation);
      this.movementSimulation = null;
    }
    
    if (this.shootingSimulation) {
      clearInterval(this.shootingSimulation);
      this.shootingSimulation = null;
    }
  }
  
  /**
   * 收集性能指标
   * @returns {Object} 性能指标
   */
  collectMetrics() {
    const performanceReport = performanceMonitor.getReport();
    const memoryReport = memoryManager.getReport();
    
    return {
      timestamp: performance.now(),
      fps: performanceReport.fps,
      memory: memoryReport.current,
      rendering: {
        frameTime: performanceReport.current.frameTime,
        renderTime: performanceReport.current.renderTime,
        updateTime: performanceReport.current.updateTime,
        drawCalls: performanceReport.current.drawCalls
      },
      objects: {
        count: performanceReport.current.objectCount
      },
      gc: memoryReport.gc
    };
  }
  
  /**
   * 分析场景测试结果
   * @param {Object} data - 测试数据
   * @returns {BenchmarkResult} 分析结果
   */
  analyzeScenarioResult(data) {
    const { name, duration, baseline, final } = data;
    const issues = [];
    let passed = true;
    
    // 分析FPS性能
    if (final.fps.avg < this.targets.fps.avg) {
      issues.push(`平均FPS过低: ${final.fps.avg.toFixed(1)} < ${this.targets.fps.avg}`);
      passed = false;
    }
    
    if (final.fps.min < this.targets.fps.min) {
      issues.push(`最低FPS过低: ${final.fps.min.toFixed(1)} < ${this.targets.fps.min}`);
      passed = false;
    }
    
    if (final.fps.stability < this.targets.fps.stability) {
      issues.push(`FPS稳定性不足: ${final.fps.stability.toFixed(1)}% < ${this.targets.fps.stability}%`);
      passed = false;
    }
    
    // 分析内存性能
    if (final.memory.current > this.targets.memory.maxUsage) {
      issues.push(`内存使用过高: ${final.memory.current.toFixed(1)}MB > ${this.targets.memory.maxUsage}MB`);
      passed = false;
    }
    
    if (final.memory.growth > this.targets.memory.maxGrowth) {
      issues.push(`内存增长过快: ${final.memory.growth.toFixed(1)}% > ${this.targets.memory.maxGrowth}%`);
      passed = false;
    }
    
    // 分析渲染性能
    if (final.rendering.frameTime > this.targets.rendering.maxFrameTime) {
      issues.push(`帧时间过长: ${final.rendering.frameTime.toFixed(1)}ms > ${this.targets.rendering.maxFrameTime}ms`);
      passed = false;
    }
    
    if (final.rendering.renderTime > this.targets.rendering.maxRenderTime) {
      issues.push(`渲染时间过长: ${final.rendering.renderTime.toFixed(1)}ms > ${this.targets.rendering.maxRenderTime}ms`);
      passed = false;
    }
    
    if (final.rendering.drawCalls > this.targets.rendering.maxDrawCalls) {
      issues.push(`绘制调用过多: ${final.rendering.drawCalls} > ${this.targets.rendering.maxDrawCalls}`);
      passed = false;
    }
    
    // 分析响应性能
    if (final.rendering.updateTime > this.targets.responsiveness.maxUpdateTime) {
      issues.push(`更新时间过长: ${final.rendering.updateTime.toFixed(1)}ms > ${this.targets.responsiveness.maxUpdateTime}ms`);
      passed = false;
    }
    
    return {
      name,
      duration,
      metrics: final,
      baseline,
      passed,
      issues,
      score: this.calculateScore(final, issues.length)
    };
  }
  
  /**
   * 计算性能得分
   * @param {Object} metrics - 性能指标
   * @param {number} issueCount - 问题数量
   * @returns {number} 得分(0-100)
   */
  calculateScore(metrics, issueCount) {
    let score = 100;
    
    // FPS得分
    const fpsScore = Math.min(100, (metrics.fps.avg / this.targets.fps.avg) * 40);
    
    // 内存得分
    const memoryScore = Math.max(0, 30 - (metrics.memory.current / this.targets.memory.maxUsage) * 30);
    
    // 渲染得分
    const renderScore = Math.max(0, 20 - (metrics.rendering.frameTime / this.targets.rendering.maxFrameTime) * 20);
    
    // 稳定性得分
    const stabilityScore = (metrics.fps.stability / 100) * 10;
    
    score = fpsScore + memoryScore + renderScore + stabilityScore;
    
    // 问题惩罚
    score -= issueCount * 5;
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * 生成测试套件报告
   * @param {string} suiteName - 套件名称
   * @param {BenchmarkResult[]} results - 测试结果
   * @returns {BenchmarkSuite} 套件报告
   */
  generateSuiteReport(suiteName, results) {
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const passedCount = results.filter(r => r.passed).length;
    
    const summary = {
      totalTests: results.length,
      passedTests: passedCount,
      failedTests: results.length - passedCount,
      totalIssues,
      averageScore: avgScore,
      grade: this.getGrade(avgScore),
      recommendations: this.generateRecommendations(results)
    };
    
    return {
      name: suiteName,
      timestamp: Date.now(),
      results,
      summary
    };
  }
  
  /**
   * 获取性能等级
   * @param {number} score - 得分
   * @returns {string} 等级
   */
  getGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C+';
    if (score >= 40) return 'C';
    return 'D';
  }
  
  /**
   * 生成优化建议
   * @param {BenchmarkResult[]} results - 测试结果
   * @returns {string[]} 建议列表
   */
  generateRecommendations(results) {
    const recommendations = new Set();
    
    results.forEach(result => {
      result.issues.forEach(issue => {
        if (issue.includes('FPS')) {
          recommendations.add('优化渲染管线，减少绘制调用');
          recommendations.add('实现更高效的视锥剔除算法');
        }
        
        if (issue.includes('内存')) {
          recommendations.add('优化内存管理，减少对象创建');
          recommendations.add('完善对象池系统');
        }
        
        if (issue.includes('帧时间') || issue.includes('渲染时间')) {
          recommendations.add('优化渲染算法，使用批量渲染');
          recommendations.add('减少Canvas状态切换');
        }
        
        if (issue.includes('绘制调用')) {
          recommendations.add('合并绘制调用，使用精灵图集');
          recommendations.add('实现分层渲染系统');
        }
      });
    });
    
    return Array.from(recommendations);
  }
  
  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 监听基准测试请求
    eventBus.on('benchmark:run', async (config) => {
      try {
        const result = await this.runBenchmarkSuite(config.scenarios);
        eventBus.emit('benchmark:result', result);
      } catch (error) {
        eventBus.emit('benchmark:error', error);
      }
    });
    
    // 监听快速测试请求
    eventBus.on('benchmark:quick_test', async () => {
      try {
        const result = await this.runBenchmarkSuite(['light', 'medium']);
        eventBus.emit('benchmark:result', result);
      } catch (error) {
        eventBus.emit('benchmark:error', error);
      }
    });
  }
  
  /**
   * 获取历史测试结果
   * @returns {Map<string, BenchmarkSuite>} 历史结果
   */
  getHistory() {
    return new Map(this.results);
  }
  
  /**
   * 清除历史结果
   */
  clearHistory() {
    this.results.clear();
    console.log('[PerformanceBenchmark] 历史测试结果已清除');
  }
  
  /**
   * 导出测试结果
   * @param {string} suiteName - 套件名称
   * @returns {string} JSON格式的结果
   */
  exportResults(suiteName) {
    const suite = this.results.get(suiteName);
    if (!suite) {
      throw new Error(`未找到测试套件: ${suiteName}`);
    }
    
    return JSON.stringify(suite, null, 2);
  }
  
  /**
   * 销毁基准测试系统
   */
  destroy() {
    this.stopAllSimulations();
    this.results.clear();
    this.isRunning = false;
    
    console.log('[PerformanceBenchmark] 性能基准测试系统已销毁');
  }
}

// 创建全局实例
const performanceBenchmark = new PerformanceBenchmark();

// 开发模式下暴露到全局
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.performanceBenchmark = performanceBenchmark;
  
  // 添加快捷键
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F12' && e.ctrlKey) {
      e.preventDefault();
      performanceBenchmark.runBenchmarkSuite(['quick']);
    }
  });
}

export { performanceBenchmark, PerformanceBenchmark };
export default performanceBenchmark;