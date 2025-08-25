/**
 * Analytics utilities module - 游戏数据分析模块
 * @module Analytics
 */

/**
 * @typedef {Object} GameSession
 * @property {string} sessionId - 会话ID
 * @property {number} startTime - 开始时间戳
 * @property {number} endTime - 结束时间戳
 * @property {number} duration - 游戏时长（毫秒）
 * @property {number} level - 达到的等级
 * @property {number} score - 最终分数
 * @property {number} enemiesKilled - 击杀敌人数量
 * @property {number} damageDealt - 造成伤害
 * @property {number} damageTaken - 受到伤害
 * @property {number} itemsCollected - 收集物品数量
 * @property {Array<string>} skillsUsed - 使用的技能
 * @property {Array<string>} equipmentUsed - 使用的装备
 * @property {string} deathReason - 死亡原因
 * @property {Object} playerStats - 玩家统计数据
 */

/**
 * @typedef {Object} PlayerStats
 * @property {number} totalPlayTime - 总游戏时间
 * @property {number} totalSessions - 总会话数
 * @property {number} highestLevel - 最高等级
 * @property {number} highestScore - 最高分数
 * @property {number} totalEnemiesKilled - 总击杀数
 * @property {number} totalDamageDealt - 总伤害输出
 * @property {number} totalItemsCollected - 总收集物品数
 * @property {Object<string, number>} skillUsageStats - 技能使用统计
 * @property {Object<string, number>} equipmentUsageStats - 装备使用统计
 * @property {Object<string, number>} deathReasons - 死亡原因统计
 */

/**
 * @typedef {Object} PerformanceMetrics
 * @property {number} fps - 帧率
 * @property {number} frameTime - 帧时间
 * @property {number} memoryUsage - 内存使用量
 * @property {number} renderTime - 渲染时间
 * @property {number} updateTime - 更新时间
 * @property {number} entityCount - 实体数量
 * @property {number} particleCount - 粒子数量
 */

/**
 * 游戏分析系统
 */
export class GameAnalytics {
  /**
     * 构造函数
     */
  constructor() {
    /** @type {GameSession|null} */
    this.currentSession = null;
        
    /** @type {Array<GameSession>} */
    this.sessionHistory = [];
        
    /** @type {PlayerStats} */
    this.playerStats = this.initializePlayerStats();
        
    /** @type {Array<PerformanceMetrics>} */
    this.performanceHistory = [];
        
    /** @type {Map<string, any>} */
    this.customEvents = new Map();
        
    /** @type {boolean} */
    this.enabled = true;
        
    /** @type {number} */
    this.maxHistorySize = 100;
        
    this.loadData();
  }

  /**
     * 初始化玩家统计数据
     * @returns {PlayerStats} 初始化的统计数据
     */
  initializePlayerStats() {
    return {
      totalPlayTime: 0,
      totalSessions: 0,
      highestLevel: 0,
      highestScore: 0,
      totalEnemiesKilled: 0,
      totalDamageDealt: 0,
      totalItemsCollected: 0,
      skillUsageStats: {},
      equipmentUsageStats: {},
      deathReasons: {},
      achievements: [],
      firstPlayDate: Date.now(),
      lastPlayDate: Date.now()
    };
  }

  /**
     * 开始新的游戏会话
     * @param {Object} gameConfig - 游戏配置
     */
  startSession(gameConfig = {}) {
    if (!this.enabled) return;
        
    this.currentSession = {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      endTime: null,
      duration: 0,
      level: 1,
      score: 0,
      enemiesKilled: 0,
      damageDealt: 0,
      damageTaken: 0,
      itemsCollected: 0,
      skillsUsed: [],
      equipmentUsed: [],
      deathReason: null,
      gameConfig: { ...gameConfig },
      events: [],
      playerStats: {
        maxHealth: 0,
        maxMana: 0,
        attackPower: 0,
        defense: 0,
        speed: 0
      }
    };
        
    this.trackEvent('session_start', {
      sessionId: this.currentSession.sessionId,
      timestamp: this.currentSession.startTime
    });
  }

  /**
     * 结束当前游戏会话
     * @param {string} reason - 结束原因
     */
  endSession(reason = 'normal') {
    if (!this.enabled || !this.currentSession) return;
        
    const endTime = Date.now();
    this.currentSession.endTime = endTime;
    this.currentSession.duration = endTime - this.currentSession.startTime;
    this.currentSession.deathReason = reason;
        
    // 更新玩家统计数据
    this.updatePlayerStats(this.currentSession);
        
    // 添加到历史记录
    this.sessionHistory.push({ ...this.currentSession });
        
    // 限制历史记录大小
    if (this.sessionHistory.length > this.maxHistorySize) {
      this.sessionHistory.shift();
    }
        
    this.trackEvent('session_end', {
      sessionId: this.currentSession.sessionId,
      duration: this.currentSession.duration,
      reason,
      finalStats: {
        level: this.currentSession.level,
        score: this.currentSession.score,
        enemiesKilled: this.currentSession.enemiesKilled
      }
    });
        
    this.currentSession = null;
    this.saveData();
  }

  /**
     * 更新玩家统计数据
     * @param {GameSession} session - 游戏会话
     */
  updatePlayerStats(session) {
    this.playerStats.totalPlayTime += session.duration;
    this.playerStats.totalSessions += 1;
    this.playerStats.highestLevel = Math.max(this.playerStats.highestLevel, session.level);
    this.playerStats.highestScore = Math.max(this.playerStats.highestScore, session.score);
    this.playerStats.totalEnemiesKilled += session.enemiesKilled;
    this.playerStats.totalDamageDealt += session.damageDealt;
    this.playerStats.totalItemsCollected += session.itemsCollected;
    this.playerStats.lastPlayDate = session.endTime;
        
    // 更新技能使用统计
    session.skillsUsed.forEach(skill => {
      this.playerStats.skillUsageStats[skill] = (this.playerStats.skillUsageStats[skill] || 0) + 1;
    });
        
    // 更新装备使用统计
    session.equipmentUsed.forEach(equipment => {
      this.playerStats.equipmentUsageStats[equipment] = (this.playerStats.equipmentUsageStats[equipment] || 0) + 1;
    });
        
    // 更新死亡原因统计
    if (session.deathReason) {
      this.playerStats.deathReasons[session.deathReason] = (this.playerStats.deathReasons[session.deathReason] || 0) + 1;
    }
  }

  /**
     * 跟踪游戏事件
     * @param {string} eventName - 事件名称
     * @param {Object} eventData - 事件数据
     */
  trackEvent(eventName, eventData = {}) {
    if (!this.enabled) return;
        
    const event = {
      name: eventName,
      timestamp: Date.now(),
      sessionId: this.currentSession?.sessionId || null,
      data: { ...eventData }
    };
        
    if (this.currentSession) {
      this.currentSession.events.push(event);
    }
        
    // 存储自定义事件
    if (!this.customEvents.has(eventName)) {
      this.customEvents.set(eventName, []);
    }
        
    const eventList = this.customEvents.get(eventName);
    eventList.push(event);
        
    // 限制事件历史大小
    if (eventList.length > this.maxHistorySize) {
      eventList.shift();
    }
  }

  /**
     * 更新当前会话数据
     * @param {Object} updates - 更新数据
     */
  updateSession(updates) {
    if (!this.enabled || !this.currentSession) return;
        
    Object.assign(this.currentSession, updates);
  }

  /**
     * 记录性能指标
     * @param {PerformanceMetrics} metrics - 性能指标
     */
  recordPerformance(metrics) {
    if (!this.enabled) return;
        
    const performanceData = {
      ...metrics,
      timestamp: Date.now(),
      sessionId: this.currentSession?.sessionId || null
    };
        
    this.performanceHistory.push(performanceData);
        
    // 限制性能历史大小
    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory.shift();
    }
  }

  /**
     * 获取游戏统计摘要
     * @returns {Object} 统计摘要
     */
  getStatsSummary() {
    const recentSessions = this.sessionHistory.slice(-10);
    const avgSessionTime = recentSessions.length > 0 
      ? recentSessions.reduce((sum, session) => sum + session.duration, 0) / recentSessions.length
      : 0;
        
    const avgScore = recentSessions.length > 0
      ? recentSessions.reduce((sum, session) => sum + session.score, 0) / recentSessions.length
      : 0;
        
    const avgLevel = recentSessions.length > 0
      ? recentSessions.reduce((sum, session) => sum + session.level, 0) / recentSessions.length
      : 0;
        
    return {
      playerStats: { ...this.playerStats },
      recentPerformance: {
        averageSessionTime: avgSessionTime,
        averageScore: avgScore,
        averageLevel: avgLevel,
        totalSessions: this.playerStats.totalSessions,
        playTimeFormatted: this.formatDuration(this.playerStats.totalPlayTime)
      },
      currentSession: this.currentSession ? {
        duration: Date.now() - this.currentSession.startTime,
        level: this.currentSession.level,
        score: this.currentSession.score,
        enemiesKilled: this.currentSession.enemiesKilled
      } : null
    };
  }

  /**
     * 获取性能分析
     * @returns {Object} 性能分析数据
     */
  getPerformanceAnalysis() {
    if (this.performanceHistory.length === 0) {
      return {
        averageFPS: 0,
        averageFrameTime: 0,
        memoryUsage: 0,
        performanceScore: 0
      };
    }
        
    const recent = this.performanceHistory.slice(-30); // 最近30个样本
        
    const avgFPS = recent.reduce((sum, p) => sum + p.fps, 0) / recent.length;
    const avgFrameTime = recent.reduce((sum, p) => sum + p.frameTime, 0) / recent.length;
    const avgMemory = recent.reduce((sum, p) => sum + (p.memoryUsage || 0), 0) / recent.length;
    const avgEntityCount = recent.reduce((sum, p) => sum + (p.entityCount || 0), 0) / recent.length;
        
    // 计算性能分数 (0-100)
    let performanceScore = 100;
    if (avgFPS < 30) performanceScore -= (30 - avgFPS) * 2;
    if (avgFrameTime > 33) performanceScore -= (avgFrameTime - 33) * 0.5;
    if (avgMemory > 100) performanceScore -= (avgMemory - 100) * 0.1;
        
    performanceScore = Math.max(0, Math.min(100, performanceScore));
        
    return {
      averageFPS: Math.round(avgFPS * 10) / 10,
      averageFrameTime: Math.round(avgFrameTime * 10) / 10,
      memoryUsage: Math.round(avgMemory * 10) / 10,
      averageEntityCount: Math.round(avgEntityCount),
      performanceScore: Math.round(performanceScore),
      sampleCount: recent.length
    };
  }

  /**
     * 获取技能使用分析
     * @returns {Array} 技能使用排行
     */
  getSkillUsageAnalysis() {
    const skillStats = Object.entries(this.playerStats.skillUsageStats)
      .map(([skill, count]) => ({
        skill,
        count,
        percentage: (count / this.playerStats.totalSessions * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);
        
    return skillStats;
  }

  /**
     * 获取死亡原因分析
     * @returns {Array} 死亡原因排行
     */
  getDeathAnalysis() {
    const total = Object.values(this.playerStats.deathReasons).reduce((sum, count) => sum + count, 0);
        
    return Object.entries(this.playerStats.deathReasons)
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: total > 0 ? (count / total * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
     * 获取进度趋势
     * @returns {Object} 进度趋势数据
     */
  getProgressTrends() {
    const recentSessions = this.sessionHistory.slice(-20);
        
    if (recentSessions.length < 2) {
      return {
        scoreTrend: 'stable',
        levelTrend: 'stable',
        survivalTrend: 'stable',
        improvement: 0
      };
    }
        
    const half = Math.floor(recentSessions.length / 2);
    const firstHalf = recentSessions.slice(0, half);
    const secondHalf = recentSessions.slice(half);
        
    const avgScoreFirst = firstHalf.reduce((sum, s) => sum + s.score, 0) / firstHalf.length;
    const avgScoreSecond = secondHalf.reduce((sum, s) => sum + s.score, 0) / secondHalf.length;
        
    const avgLevelFirst = firstHalf.reduce((sum, s) => sum + s.level, 0) / firstHalf.length;
    const avgLevelSecond = secondHalf.reduce((sum, s) => sum + s.level, 0) / secondHalf.length;
        
    const avgSurvivalFirst = firstHalf.reduce((sum, s) => sum + s.duration, 0) / firstHalf.length;
    const avgSurvivalSecond = secondHalf.reduce((sum, s) => sum + s.duration, 0) / secondHalf.length;
        
    const scoreTrend = this.calculateTrend(avgScoreFirst, avgScoreSecond);
    const levelTrend = this.calculateTrend(avgLevelFirst, avgLevelSecond);
    const survivalTrend = this.calculateTrend(avgSurvivalFirst, avgSurvivalSecond);
        
    const improvement = (scoreTrend === 'improving' ? 1 : 0) +
                          (levelTrend === 'improving' ? 1 : 0) +
                          (survivalTrend === 'improving' ? 1 : 0);
        
    return {
      scoreTrend,
      levelTrend,
      survivalTrend,
      improvement: (improvement / 3 * 100).toFixed(0) + '%',
      recentAverage: {
        score: Math.round(avgScoreSecond),
        level: Math.round(avgLevelSecond * 10) / 10,
        survivalTime: this.formatDuration(avgSurvivalSecond)
      }
    };
  }

  /**
     * 计算趋势
     * @param {number} oldValue - 旧值
     * @param {number} newValue - 新值
     * @returns {string} 趋势描述
     */
  calculateTrend(oldValue, newValue) {
    const change = (newValue - oldValue) / oldValue;
        
    if (change > 0.1) return 'improving';
    if (change < -0.1) return 'declining';
    return 'stable';
  }

  /**
     * 生成会话ID
     * @returns {string} 会话ID
     */
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
     * 格式化持续时间
     * @param {number} milliseconds - 毫秒数
     * @returns {string} 格式化的时间字符串
     */
  formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
        
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
     * 导出数据
     * @returns {Object} 导出的数据
     */
  exportData() {
    return {
      playerStats: this.playerStats,
      sessionHistory: this.sessionHistory,
      performanceHistory: this.performanceHistory.slice(-50), // 只导出最近50个性能记录
      exportDate: Date.now(),
      version: '1.0'
    };
  }

  /**
     * 导入数据
     * @param {Object} data - 导入的数据
     */
  importData(data) {
    if (data.playerStats) {
      this.playerStats = { ...this.initializePlayerStats(), ...data.playerStats };
    }
        
    if (data.sessionHistory && Array.isArray(data.sessionHistory)) {
      this.sessionHistory = data.sessionHistory.slice(-this.maxHistorySize);
    }
        
    if (data.performanceHistory && Array.isArray(data.performanceHistory)) {
      this.performanceHistory = data.performanceHistory.slice(-this.maxHistorySize);
    }
        
    this.saveData();
  }

  /**
     * 重置所有数据
     */
  resetData() {
    this.playerStats = this.initializePlayerStats();
    this.sessionHistory = [];
    this.performanceHistory = [];
    this.customEvents.clear();
    this.currentSession = null;
    this.saveData();
  }

  /**
     * 保存数据到本地存储
     */
  saveData() {
    try {
      const data = {
        playerStats: this.playerStats,
        sessionHistory: this.sessionHistory.slice(-50), // 只保存最近50个会话
        lastSaved: Date.now()
      };
            
      localStorage.setItem('gameAnalytics', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save analytics data:', error);
    }
  }

  /**
     * 从本地存储加载数据
     */
  loadData() {
    try {
      const saved = localStorage.getItem('gameAnalytics');
      if (saved) {
        const data = JSON.parse(saved);
                
        if (data.playerStats) {
          this.playerStats = { ...this.initializePlayerStats(), ...data.playerStats };
        }
                
        if (data.sessionHistory && Array.isArray(data.sessionHistory)) {
          this.sessionHistory = data.sessionHistory;
        }
      }
    } catch (error) {
      console.warn('Failed to load analytics data:', error);
      this.playerStats = this.initializePlayerStats();
    }
  }

  /**
     * 启用/禁用分析
     * @param {boolean} enabled - 是否启用
     */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
     * 获取当前会话信息
     * @returns {GameSession|null} 当前会话
     */
  getCurrentSession() {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  /**
     * 获取历史会话
     * @param {number} limit - 限制数量
     * @returns {Array<GameSession>} 历史会话
     */
  getSessionHistory(limit = 10) {
    return this.sessionHistory.slice(-limit).map(session => ({ ...session }));
  }

  /**
     * 获取自定义事件
     * @param {string} eventName - 事件名称
     * @param {number} limit - 限制数量
     * @returns {Array} 事件列表
     */
  getCustomEvents(eventName, limit = 50) {
    const events = this.customEvents.get(eventName) || [];
    return events.slice(-limit);
  }

  /**
     * 清理旧数据
     * @param {number} maxAge - 最大年龄（毫秒）
     */
  cleanupOldData(maxAge = 30 * 24 * 60 * 60 * 1000) { // 默认30天
    const cutoff = Date.now() - maxAge;
        
    // 清理会话历史
    this.sessionHistory = this.sessionHistory.filter(session => session.startTime > cutoff);
        
    // 清理性能历史
    this.performanceHistory = this.performanceHistory.filter(perf => perf.timestamp > cutoff);
        
    // 清理自定义事件
    this.customEvents.forEach((events, eventName) => {
      const filtered = events.filter(event => event.timestamp > cutoff);
      if (filtered.length === 0) {
        this.customEvents.delete(eventName);
      } else {
        this.customEvents.set(eventName, filtered);
      }
    });
        
    this.saveData();
  }
}

/**
 * 成就系统
 */
export class AchievementSystem {
  /**
     * 构造函数
     * @param {GameAnalytics} analytics - 分析系统实例
     */
  constructor(analytics) {
    this.analytics = analytics;
    this.achievements = this.initializeAchievements();
    this.unlockedAchievements = new Set();
    this.loadUnlockedAchievements();
  }

  /**
     * 初始化成就定义
     * @returns {Map} 成就映射
     */
  initializeAchievements() {
    const achievements = new Map();
        
    // 基础成就
    achievements.set('first_kill', {
      id: 'first_kill',
      name: '初次击杀',
      description: '击杀第一个敌人',
      condition: (stats) => stats.totalEnemiesKilled >= 1,
      reward: { experience: 100 }
    });
        
    achievements.set('survivor', {
      id: 'survivor',
      name: '生存者',
      description: '生存超过5分钟',
      condition: (stats, session) => session && (Date.now() - session.startTime) > 5 * 60 * 1000,
      reward: { experience: 500 }
    });
        
    achievements.set('level_10', {
      id: 'level_10',
      name: '十级战士',
      description: '达到10级',
      condition: (stats) => stats.highestLevel >= 10,
      reward: { experience: 1000 }
    });
        
    achievements.set('kill_100', {
      id: 'kill_100',
      name: '百人斩',
      description: '累计击杀100个敌人',
      condition: (stats) => stats.totalEnemiesKilled >= 100,
      reward: { experience: 2000 }
    });
        
    achievements.set('play_1hour', {
      id: 'play_1hour',
      name: '时间管理大师',
      description: '累计游戏时间超过1小时',
      condition: (stats) => stats.totalPlayTime >= 60 * 60 * 1000,
      reward: { experience: 1500 }
    });
        
    achievements.set('high_score', {
      id: 'high_score',
      name: '高分玩家',
      description: '单局得分超过10000',
      condition: (stats) => stats.highestScore >= 10000,
      reward: { experience: 3000 }
    });
        
    return achievements;
  }

  /**
     * 检查成就
     */
  checkAchievements() {
    const stats = this.analytics.playerStats;
    const session = this.analytics.currentSession;
    const newAchievements = [];
        
    this.achievements.forEach((achievement, id) => {
      if (!this.unlockedAchievements.has(id)) {
        if (achievement.condition(stats, session)) {
          this.unlockAchievement(id);
          newAchievements.push(achievement);
        }
      }
    });
        
    return newAchievements;
  }

  /**
     * 解锁成就
     * @param {string} achievementId - 成就ID
     */
  unlockAchievement(achievementId) {
    if (this.unlockedAchievements.has(achievementId)) return;
        
    this.unlockedAchievements.add(achievementId);
    const achievement = this.achievements.get(achievementId);
        
    if (achievement) {
      this.analytics.trackEvent('achievement_unlocked', {
        achievementId,
        name: achievement.name,
        timestamp: Date.now()
      });
            
      // 添加到玩家统计中
      if (!this.analytics.playerStats.achievements) {
        this.analytics.playerStats.achievements = [];
      }
            
      this.analytics.playerStats.achievements.push({
        id: achievementId,
        unlockedAt: Date.now()
      });
    }
        
    this.saveUnlockedAchievements();
  }

  /**
     * 获取已解锁的成就
     * @returns {Array} 已解锁的成就列表
     */
  getUnlockedAchievements() {
    return Array.from(this.unlockedAchievements)
      .map(id => this.achievements.get(id))
      .filter(Boolean);
  }

  /**
     * 获取成就进度
     * @returns {Object} 成就进度
     */
  getAchievementProgress() {
    const total = this.achievements.size;
    const unlocked = this.unlockedAchievements.size;
        
    return {
      total,
      unlocked,
      percentage: total > 0 ? Math.round((unlocked / total) * 100) : 0,
      remaining: total - unlocked
    };
  }

  /**
     * 保存已解锁的成就
     */
  saveUnlockedAchievements() {
    try {
      const data = Array.from(this.unlockedAchievements);
      localStorage.setItem('unlockedAchievements', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save achievements:', error);
    }
  }

  /**
     * 加载已解锁的成就
     */
  loadUnlockedAchievements() {
    try {
      const saved = localStorage.getItem('unlockedAchievements');
      if (saved) {
        const data = JSON.parse(saved);
        this.unlockedAchievements = new Set(data);
      }
    } catch (error) {
      console.warn('Failed to load achievements:', error);
    }
  }
}

/**
 * 默认导出游戏分析系统
 */
export default GameAnalytics;