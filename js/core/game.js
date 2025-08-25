/**
 * Game module - 游戏核心控制器
 * @module Game
 */

import { player } from './player.js';
import { enemyManager } from './enemy.js';
import { projectileManager } from './projectile.js';
import { collisionManager } from './collision.js';

/**
 * @typedef {Object} GameState
 * @property {string} current - 当前状态 ('menu'|'playing'|'paused'|'gameOver')
 * @property {number} score - 分数
 * @property {number} time - 游戏时间（毫秒）
 * @property {number} wave - 当前波数
 * @property {boolean} paused - 是否暂停
 * @property {boolean} gameOver - 是否游戏结束
 */

/**
 * @typedef {Object} GameStats
 * @property {number} enemiesKilled - 击杀敌人数
 * @property {number} damageDealt - 造成伤害总量
 * @property {number} damageTaken - 受到伤害总量
 * @property {number} projectilesFired - 发射投射物总数
 * @property {number} survivalTime - 生存时间（毫秒）
 */

/**
 * @typedef {Object} GameConfig
 * @property {number} targetFPS - 目标帧率
 * @property {boolean} autoFire - 是否自动射击
 * @property {number} difficulty - 难度系数
 * @property {boolean} soundEnabled - 是否启用音效
 * @property {boolean} musicEnabled - 是否启用音乐
 */

/**
 * @typedef {Object} GameOverData
 * @property {number} score - 最终分数
 * @property {GameStats} stats - 游戏统计数据
 * @property {number} wave - 到达波数
 */

/**
 * 游戏核心控制器类
 * 负责管理游戏状态、循环、事件处理和各模块协调
 */
export class Game {
  /**
     * 游戏构造函数
     * 初始化游戏状态、统计数据、配置和事件监听器
     */
  constructor() {
    /**
         * 游戏状态对象
         * @type {GameState}
         */
    this.state = {
      current: 'menu',
      score: 0,
      time: 0,
      wave: 1,
      paused: false,
      gameOver: false
    };
        
    /**
         * 游戏统计数据
         * @type {GameStats}
         */
    this.stats = {
      enemiesKilled: 0,
      damageDealt: 0,
      damageTaken: 0,
      projectilesFired: 0,
      survivalTime: 0
    };
        
    /**
         * 上一帧时间戳
         * @type {number}
         */
    this.lastTime = 0;
        
    /**
         * 事件监听器映射
         * @type {Map<string, Function[]>}
         */
    this.eventListeners = new Map();
        
    /**
         * 游戏配置
         * @type {GameConfig}
         */
    this.config = {
      targetFPS: 60,
      autoFire: true,
      difficulty: 1.0,
      soundEnabled: true,
      musicEnabled: true
    };
        
    this.bindEvents();
  }

  /**
     * 绑定DOM事件监听器
     * 设置键盘和鼠标事件的处理函数
     * @private
     */
  bindEvents() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    document.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
  }

  /**
     * 初始化游戏系统
     * 初始化所有游戏管理器并设置初始状态
     * @returns {void}
     */
  init() {
    // 初始化各个管理器
    player.init();
    enemyManager.init();
    projectileManager.init();
    collisionManager.init();
        
    this.state.current = 'menu';
    this.emit('gameInit');
  }

  /**
     * 开始新游戏
     * 重置游戏状态和统计数据，启动游戏循环
     * @returns {void}
     */
  start() {
    if (this.state.current !== 'menu' && this.state.current !== 'gameOver') {
      return;
    }
        
    this.resetStats();
    this.state = {
      current: 'playing',
      score: 0,
      time: 0,
      wave: 1,
      paused: false,
      gameOver: false
    };
        
    // 重置各个管理器
    player.reset();
    enemyManager.reset();
    projectileManager.reset();
        
    this.lastTime = performance.now();
    this.gameLoop();
        
    this.emit('gameStart');
  }

  /**
     * 暂停游戏
     * 将游戏状态设置为暂停并触发暂停事件
     * @returns {void}
     */
  pause() {
    if (this.state.current === 'playing') {
      this.state.paused = true;
      this.emit('gamePause');
    }
  }

  /**
     * 恢复游戏
     * 从暂停状态恢复游戏并重新启动游戏循环
     * @returns {void}
     */
  resume() {
    if (this.state.current === 'playing' && this.state.paused) {
      this.state.paused = false;
      this.lastTime = performance.now();
      this.gameLoop();
      this.emit('gameResume');
    }
  }

  /**
     * 结束游戏
     * 设置游戏结束状态并触发游戏结束事件
     * @returns {void}
     */
  end() {
    this.state.current = 'gameOver';
    this.state.gameOver = true;
    this.stats.survivalTime = this.state.time;
        
    /**
         * @type {GameOverData}
         */
    const gameOverData = {
      score: this.state.score,
      stats: this.getStats(),
      wave: this.state.wave
    };
        
    this.emit('gameOver', gameOverData);
  }

  /**
     * 重新开始游戏
     * 重置并开始新的游戏会话
     * @returns {void}
     */
  restart() {
    this.start();
  }

  /**
     * 游戏主循环
     * 处理帧率控制和游戏状态更新的核心循环
     * @returns {void}
     */
  gameLoop() {
    if (this.state.current !== 'playing') return;
        
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
        
    if (!this.state.paused) {
      this.update(deltaTime);
    }
        
    // 继续循环
    requestAnimationFrame(() => this.gameLoop());
  }

  /**
     * 更新游戏状态
     * 更新所有游戏对象、处理逻辑和碰撞检测
     * @param {number} deltaTime - 自上一帧以来的时间差（毫秒）
     * @returns {void}
     */
  update(deltaTime) {
    // 更新游戏时间
    this.state.time += deltaTime;
        
    // 更新玩家
    player.update(deltaTime);
        
    // 检查玩家是否死亡
    if (player.isDead && !this.state.gameOver) {
      this.end();
      return;
    }
        
    // 更新敌人
    enemyManager.update(deltaTime, player);
        
    // 自动射击
    if (this.config.autoFire) {
      const enemies = enemyManager.getAliveEnemies();
      if (projectileManager.autoFire(player.x, player.y, enemies)) {
        this.stats.projectilesFired++;
      }
    }
        
    // 更新投射物
    projectileManager.update(deltaTime, enemyManager.getAliveEnemies());
        
    // 碰撞检测
    this.handleCollisions();
        
    // 更新分数
    this.updateScore();
  }

  /**
     * 处理游戏中的碰撞检测
     * 检测投射物与敌人、敌人与玩家之间的碰撞并处理相应逻辑
     * @returns {void}
     * @private
     */
  handleCollisions() {
    const enemies = enemyManager.getAliveEnemies();
    const projectiles = projectileManager.getActiveProjectiles();
        
    // 投射物与敌人的碰撞
    projectiles.forEach(projectile => {
      enemies.forEach(enemy => {
        if (projectile.checkCollision(enemy)) {
          const damaged = projectile.onHit(enemy);
          if (damaged) {
            this.stats.damageDealt += projectile.damage;
                        
            // 检查敌人是否死亡
            if (enemy.isDead) {
              this.stats.enemiesKilled++;
              player.addExp(enemy.expValue);
              this.state.score += enemy.expValue * 10;
            }
          }
        }
      });
    });
        
    // 敌人与玩家的碰撞
    enemies.forEach(enemy => {
      const distance = enemy.getDistanceToPlayer(player);
      if (distance < (enemy.size + 20)) { // 玩家碰撞半径
        if (enemy.checkAttack(player)) {
          this.stats.damageTaken += enemy.damage;
        }
      }
    });
  }

  /**
     * 更新游戏分数
     * 基于生存时间和其他因素计算分数
     * @returns {void}
     * @private
     */
  updateScore() {
    // 基于生存时间的分数
    this.state.score += Math.floor(this.state.time / 1000);
  }

  /**
     * 进入下一波敌人
     * 增加游戏难度并生成新的敌人波次
     * @returns {void}
     */
  nextWave() {
    this.state.wave++;
    this.config.difficulty += 0.1;
        
    // 增加敌人生成速度
    enemyManager.spawnInterval = Math.max(500, enemyManager.spawnInterval - 100);
    enemyManager.maxEnemies = Math.min(100, enemyManager.maxEnemies + 5);
        
    // 每5波生成一个BOSS
    if (this.state.wave % 5 === 0) {
      enemyManager.spawnBoss();
    }
        
    this.emit('waveStart', this.state.wave);
  }

  /**
     * 处理键盘按下事件
     * 处理游戏控制键（暂停、重启等）并转发事件
     * @param {KeyboardEvent} event - 键盘事件对象
     * @returns {void}
     */
  handleKeyDown(event) {
    if (this.state.current !== 'playing') return;
        
    switch (event.code) {
    case 'KeyP':
    case 'Escape':
      this.state.paused ? this.resume() : this.pause();
      break;
    case 'KeyR':
      if (this.state.gameOver) {
        this.restart();
      }
      break;
    }
        
    this.emit('keyDown', event);
  }

  /**
     * 处理键盘释放事件
     * 转发键盘释放事件给其他系统
     * @param {KeyboardEvent} event - 键盘事件对象
     * @returns {void}
     */
  handleKeyUp(event) {
    this.emit('keyUp', event);
  }

  /**
     * 处理鼠标按下事件
     * 转发鼠标按下事件给其他系统
     * @param {MouseEvent} event - 鼠标事件对象
     * @returns {void}
     */
  handleMouseDown(event) {
    this.emit('mouseDown', event);
  }

  /**
     * 处理鼠标释放事件
     * 转发鼠标释放事件给其他系统
     * @param {MouseEvent} event - 鼠标事件对象
     * @returns {void}
     */
  handleMouseUp(event) {
    this.emit('mouseUp', event);
  }

  /**
     * 处理鼠标移动事件
     * 转发鼠标移动事件给其他系统
     * @param {MouseEvent} event - 鼠标事件对象
     * @returns {void}
     */
  handleMouseMove(event) {
    this.emit('mouseMove', event);
  }

  /**
     * 重置游戏统计数据
     * 将所有统计数据重置为初始值
     * @returns {void}
     * @private
     */
  resetStats() {
    this.stats = {
      enemiesKilled: 0,
      damageDealt: 0,
      damageTaken: 0,
      projectilesFired: 0,
      survivalTime: 0
    };
  }

  /**
     * 获取游戏状态的副本
     * @returns {GameState} 游戏状态对象的深拷贝
     */
  getState() {
    return { ...this.state };
  }

  /**
     * 获取游戏统计数据的副本
     * @returns {GameStats} 游戏统计对象的深拷贝
     */
  getStats() {
    return { ...this.stats };
  }

  /**
     * 设置游戏配置
     * 合并新配置到现有配置中
     * @param {Partial<GameConfig>} config - 要更新的配置对象
     * @returns {void}
     */
  setConfig(config) {
    this.config = { ...this.config, ...config };
  }

  /**
     * 添加事件监听器
     * 为指定事件注册回调函数
     * @param {string} event - 事件名称（如 'gameStart', 'gameOver', 'keyDown' 等）
     * @param {Function} callback - 事件触发时调用的回调函数
     * @returns {void}
     */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
     * 移除事件监听器
     * 从指定事件中移除特定的回调函数
     * @param {string} event - 事件名称
     * @param {Function} callback - 要移除的回调函数
     * @returns {void}
     */
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
     * 触发事件
     * 调用指定事件的所有监听器，并传递数据
     * @param {string} event - 要触发的事件名称
     * @param {*} [data] - 传递给事件监听器的数据
     * @returns {void}
     */
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
}

/**
 * 游戏实例
 * 全局单例游戏对象，用于管理整个游戏的生命周期
 * @type {Game}
 * @example
 * // 初始化游戏
 * game.init();
 * 
 * // 开始游戏
 * game.start();
 * 
 * // 监听游戏事件
 * game.on('gameOver', (data) => {
 *   console.log('Game Over! Score:', data.score);
 * });
 */
export const game = new Game();