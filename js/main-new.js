/**
 * @fileoverview 游戏主入口 - 模块化重构版本
 * @author Qoder Team
 * @version 2.0.0
 */

import eventBus from './core/event-bus.js';
import stateManager from './systems/state-manager.js';
import performanceMonitor from './utils/performance-monitor.js';
import poolManager from './utils/object-pool.js';

/**
 * 游戏主应用类
 */
class GameApp {
  constructor() {
    /** @type {HTMLCanvasElement} */
    this.canvas = null;
    /** @type {CanvasRenderingContext2D} */
    this.ctx = null;
    
    /** @type {Object} */
    this.VIEW = { w: 0, h: 0 };
    
    /** @type {boolean} */
    this.initialized = false;
    /** @type {boolean} */
    this.running = false;
    /** @type {number} */
    this.lastTime = 0;
    /** @type {number} */
    this.animationId = null;
    
    // 绑定事件总线和状态管理器
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.performanceMonitor = performanceMonitor;
    this.poolManager = poolManager;
    
    // 游戏模块引用
    this.modules = new Map();
    
    this.setupEventListeners();
  }

  /**
   * 初始化游戏
   */
  async init() {
    try {
      console.log('[GameApp] 开始初始化游戏...');
      
      // 初始化Canvas
      this.initCanvas();
      
      // 注册状态处理器
      this.registerStateReducers();
      
      // 加载游戏模块 (目前先使用临时实现)
      await this.loadGameModules();
      
      // 初始化UI系统
      this.initUI();
      
      // 设置输入处理
      this.setupInput();
      
      // 初始化完成
      this.initialized = true;
      
      console.log('[GameApp] 游戏初始化完成');
      
      // 发布初始化完成事件
      this.eventBus.emit('game:initialized');
      
      // 显示关卡选择界面
      this.showLevelSelect();
      
    } catch (error) {
      console.error('[GameApp] 游戏初始化失败:', error);
      this.showError('游戏初始化失败，请刷新页面重试');
    }
  }

  /**
   * 初始化Canvas
   */
  initCanvas() {
    this.canvas = document.getElementById('game');
    if (!this.canvas) {
      throw new Error('游戏Canvas元素未找到');
    }
    
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('无法获取2D渲染上下文');
    }
    
    // 设置Canvas响应式
    this.fitCanvas();
    window.addEventListener('resize', () => this.fitCanvas());
    
    console.log('[GameApp] Canvas初始化完成');
  }

  /**
   * 调整Canvas尺寸
   */
  fitCanvas() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const rect = this.canvas.getBoundingClientRect();
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    // 更新视图尺寸
    this.VIEW.w = rect.width;
    this.VIEW.h = rect.height;
    
    // 发布尺寸变化事件
    this.eventBus.emit('canvas:resize', {
      width: rect.width,
      height: rect.height,
      dpr
    });
  }

  /**
   * 注册状态处理器
   */
  registerStateReducers() {
    // 游戏状态管理
    this.stateManager.registerReducer('game:start', (state, action) => ({
      ...state,
      gameStatus: 'playing',
      world: {
        ...state.world,
        timer: 0,
        currentWave: 1,
        enemyCount: 0,
        kills: 0
      }
    }));

    this.stateManager.registerReducer('game:pause', (state, action) => ({
      ...state,
      gameStatus: state.gameStatus === 'paused' ? 'playing' : 'paused'
    }));

    this.stateManager.registerReducer('game:over', (state, action) => ({
      ...state,
      gameStatus: 'gameOver',
      ui: {
        ...state.ui,
        showGameOverModal: true
      }
    }));

    // 玩家状态管理
    this.stateManager.registerReducer('player:takeDamage', (state, action) => {
      const { damage } = action.payload;
      const newHp = Math.max(0, state.player.hp - damage);
      
      return {
        ...state,
        player: {
          ...state.player,
          hp: newHp
        }
      };
    });

    this.stateManager.registerReducer('player:gainExp', (state, action) => {
      const { exp } = action.payload;
      let newExp = state.player.exp + exp;
      let newLevel = state.player.level;
      let expToNext = state.player.expToNext;
      
      // 检查是否升级
      while (newExp >= expToNext) {
        newExp -= expToNext;
        newLevel++;
        expToNext = Math.floor(expToNext * 1.2); // 升级所需经验递增
      }
      
      return {
        ...state,
        player: {
          ...state.player,
          exp: newExp,
          level: newLevel,
          expToNext
        },
        ui: {
          ...state.ui,
          showUpgradeModal: newLevel > state.player.level
        }
      };
    });

    console.log('[GameApp] 状态处理器注册完成');
  }

  /**
   * 加载游戏模块 (临时实现，后续会拆分为独立模块)
   */
  async loadGameModules() {
    // 临时游戏对象，保持与原版兼容
    window.G = {
      // 游戏状态
      state: 'menu',
      paused: false,
      
      // 玩家对象
      player: {
        x: 400,
        y: 300,
        hp: 100,
        maxHp: 100,
        level: 1,
        exp: 0,
        expToNext: 100,
        speed: 3,
        damage: 10,
        defense: 0,
        critRate: 0.1,
        critMulti: 1.5
      },
      
      // 游戏世界
      world: { w: 2000, h: 2000 },
      camera: { x: 0, y: 0 },
      
      // 游戏对象数组
      enemies: [],
      projectiles: [],
      particles: [],
      orbs: [],
      
      // 游戏统计
      kills: 0,
      timer: 0,
      
      // 自动系统
      auto: {
        move: false,
        pickup: false,
        upgrade: false
      }
    };
    
    console.log('[GameApp] 游戏模块加载完成 (临时实现)');
  }

  /**
   * 初始化UI系统
   */
  initUI() {
    // 获取UI元素引用
    this.ui = {
      // HUD元素
      hpBar: document.getElementById('hp-bar'),
      hpText: document.getElementById('hp-text'),
      expBar: document.getElementById('exp-bar'),
      levelText: document.getElementById('level-text'),
      coins: document.getElementById('coins'),
      timer: document.getElementById('timer'),
      kills: document.getElementById('kills'),
      
      // 按钮
      pauseBtn: document.getElementById('pauseBtn'),
      
      // 模态框
      levelUpModal: document.getElementById('levelUpModal'),
      gameOverModal: document.getElementById('gameOverModal'),
      levelSelectModal: document.getElementById('levelSelectModal'),
      
      // 面板
      infoPanel: document.getElementById('infoPanel'),
      infoPanelBtn: document.getElementById('infoPanelBtn')
    };

    // 绑定UI事件
    this.setupUIEvents();
    
    console.log('[GameApp] UI系统初始化完成');
  }

  /**
   * 设置UI事件
   */
  setupUIEvents() {
    // 暂停按钮
    this.ui.pauseBtn?.addEventListener('click', () => {
      this.stateManager.dispatch({
        type: 'game:pause',
        payload: {}
      });
    });

    // 信息面板切换
    this.ui.infoPanelBtn?.addEventListener('click', () => {
      this.toggleInfoPanel();
    });

    // 关卡选择
    document.addEventListener('click', (e) => {
      if (e.target.matches('.level-btn') && !e.target.disabled) {
        const levelItem = e.target.closest('.level-item');
        const level = levelItem?.dataset.level;
        if (level) {
          this.startGame(parseInt(level));
        }
      }
    });

    console.log('[GameApp] UI事件绑定完成');
  }

  /**
   * 设置输入处理
   */
  setupInput() {
    // 键盘输入
    this.input = {
      up: false,
      down: false,
      left: false,
      right: false,
      pointer: { x: 0, y: 0, active: false }
    };

    // 键盘事件
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));

    // 鼠标/触摸事件
    this.canvas.addEventListener('pointerdown', (e) => {
      this.input.pointer.active = true;
      this.updatePointer(e);
    });
    
    this.canvas.addEventListener('pointermove', (e) => this.updatePointer(e));
    
    window.addEventListener('pointerup', () => {
      this.input.pointer.active = false;
    });

    console.log('[GameApp] 输入系统初始化完成');
  }

  /**
   * 处理键盘按下
   */
  handleKeyDown(e) {
    switch (e.key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        this.input.up = true;
        break;
      case 's':
      case 'arrowdown':
        this.input.down = true;
        break;
      case 'a':
      case 'arrowleft':
        this.input.left = true;
        break;
      case 'd':
      case 'arrowright':
        this.input.right = true;
        break;
      case 'p':
        this.stateManager.dispatch({ type: 'game:pause', payload: {} });
        break;
    }
  }

  /**
   * 处理键盘释放
   */
  handleKeyUp(e) {
    switch (e.key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        this.input.up = false;
        break;
      case 's':
      case 'arrowdown':
        this.input.down = false;
        break;
      case 'a':
      case 'arrowleft':
        this.input.left = false;
        break;
      case 'd':
      case 'arrowright':
        this.input.right = false;
        break;
    }
  }

  /**
   * 更新指针位置
   */
  updatePointer(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.input.pointer.x = e.clientX - rect.left;
    this.input.pointer.y = e.clientY - rect.top;
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 监听状态变化
    this.stateManager.subscribe((newState, previousState, source) => {
      this.onStateChange(newState, previousState, source);
    });

    // 监听游戏事件
    this.eventBus.on('game:start', () => this.onGameStart());
    this.eventBus.on('game:pause', () => this.onGamePause());
    this.eventBus.on('game:resume', () => this.onGameResume());
    this.eventBus.on('game:over', () => this.onGameOver());

    // 监听性能警告
    this.eventBus.on('performance:warning', (data) => {
      console.warn(`[性能警告] ${data.type}: ${data.value} (阈值: ${data.threshold})`);
    });
  }

  /**
   * 状态变化处理
   */
  onStateChange(newState, previousState, source) {
    // 更新UI显示
    this.updateUI(newState);
    
    // 检查游戏状态变化
    if (newState.gameStatus !== previousState.gameStatus) {
      this.handleGameStatusChange(newState.gameStatus, previousState.gameStatus);
    }
  }

  /**
   * 更新UI显示
   */
  updateUI(state) {
    // 更新HUD
    if (this.ui.hpText) {
      this.ui.hpText.textContent = `${state.player.hp}/${state.player.maxHp}`;
    }
    if (this.ui.hpBar) {
      const hpPercent = (state.player.hp / state.player.maxHp) * 100;
      this.ui.hpBar.style.width = `${hpPercent}%`;
    }
    if (this.ui.levelText) {
      this.ui.levelText.textContent = `Lv. ${state.player.level}`;
    }
    if (this.ui.expBar) {
      const expPercent = (state.player.exp / state.player.expToNext) * 100;
      this.ui.expBar.style.width = `${expPercent}%`;
    }
    if (this.ui.timer) {
      const minutes = Math.floor(state.world.timer / 60);
      const seconds = Math.floor(state.world.timer % 60);
      this.ui.timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    if (this.ui.kills) {
      this.ui.kills.textContent = `Kills ${state.world.kills}`;
    }

    // 更新模态框显示
    if (state.ui.showGameOverModal && this.ui.gameOverModal) {
      this.ui.gameOverModal.classList.remove('hidden');
    } else if (this.ui.gameOverModal) {
      this.ui.gameOverModal.classList.add('hidden');
    }
  }

  /**
   * 处理游戏状态变化
   */
  handleGameStatusChange(newStatus, oldStatus) {
    switch (newStatus) {
      case 'playing':
        if (oldStatus !== 'paused') {
          this.startGameLoop();
        }
        break;
      case 'paused':
        // 暂停处理由游戏循环内部控制
        break;
      case 'gameOver':
        this.stopGameLoop();
        break;
      case 'menu':
        this.stopGameLoop();
        this.showLevelSelect();
        break;
    }
  }

  /**
   * 开始游戏
   */
  startGame(level = 1) {
    console.log(`[GameApp] 开始游戏，关卡: ${level}`);
    
    // 重置游戏状态
    this.stateManager.reset({
      ...this.stateManager.getState(),
      gameStatus: 'playing',
      player: {
        x: this.VIEW.w / 2,
        y: this.VIEW.h / 2,
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
        currentWave: level,
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
      }
    });

    // 隐藏关卡选择界面
    this.hideLevelSelect();
    
    // 发布游戏开始事件
    this.eventBus.emit('game:start', { level });
  }

  /**
   * 开始游戏循环
   */
  startGameLoop() {
    if (this.running) return;
    
    this.running = true;
    this.lastTime = performance.now();
    
    console.log('[GameApp] 游戏循环开始');
    
    this.gameLoop();
  }

  /**
   * 停止游戏循环
   */
  stopGameLoop() {
    if (!this.running) return;
    
    this.running = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    console.log('[GameApp] 游戏循环停止');
  }

  /**
   * 游戏主循环
   */
  gameLoop() {
    if (!this.running) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // 性能监控
    this.performanceMonitor.startFrame();

    const state = this.stateManager.getState();
    
    // 检查暂停状态
    if (state.gameStatus === 'paused') {
      this.animationId = requestAnimationFrame(() => this.gameLoop());
      return;
    }

    try {
      // 更新游戏逻辑
      this.performanceMonitor.startProfile('update');
      this.updateGame(deltaTime / 1000); // 转换为秒
      this.performanceMonitor.endProfile('update');

      // 渲染游戏
      this.performanceMonitor.startProfile('render');
      this.renderGame();
      this.performanceMonitor.endProfile('render');

    } catch (error) {
      console.error('[GameApp] 游戏循环错误:', error);
      this.stateManager.dispatch({
        type: 'game:over',
        payload: { reason: 'error', error }
      });
    }

    // 性能监控
    this.performanceMonitor.endFrame();

    // 继续循环
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  /**
   * 更新游戏逻辑 (临时实现)
   */
  updateGame(dt) {
    const state = this.stateManager.getState();
    
    // 更新计时器
    this.stateManager.dispatch({
      type: 'world:updateTimer',
      payload: { deltaTime: dt }
    });

    // 临时的玩家移动逻辑
    if (this.input.up) window.G.player.y -= window.G.player.speed;
    if (this.input.down) window.G.player.y += window.G.player.speed;
    if (this.input.left) window.G.player.x -= window.G.player.speed;
    if (this.input.right) window.G.player.x += window.G.player.speed;

    // 限制玩家在世界边界内
    window.G.player.x = Math.max(10, Math.min(window.G.world.w - 10, window.G.player.x));
    window.G.player.y = Math.max(10, Math.min(window.G.world.h - 10, window.G.player.y));

    // 更新摄像机
    window.G.camera.x = Math.max(0, Math.min(
      window.G.world.w - this.VIEW.w,
      window.G.player.x - this.VIEW.w / 2
    ));
    window.G.camera.y = Math.max(0, Math.min(
      window.G.world.h - this.VIEW.h,
      window.G.player.y - this.VIEW.h / 2
    ));
  }

  /**
   * 渲染游戏 (临时实现)
   */
  renderGame() {
    // 清空画布
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.VIEW.w, this.VIEW.h);

    // 保存上下文
    this.ctx.save();

    // 应用摄像机变换
    this.ctx.translate(-window.G.camera.x, -window.G.camera.y);

    // 绘制网格 (可选)
    this.drawGrid();

    // 绘制玩家
    this.drawPlayer();

    // 恢复上下文
    this.ctx.restore();

    // 绘制UI (在摄像机变换外)
    this.drawUI();
  }

  /**
   * 绘制网格
   */
  drawGrid() {
    const gridSize = 50;
    const startX = Math.floor(window.G.camera.x / gridSize) * gridSize;
    const startY = Math.floor(window.G.camera.y / gridSize) * gridSize;
    const endX = window.G.camera.x + this.VIEW.w;
    const endY = window.G.camera.y + this.VIEW.h;

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;

    for (let x = startX; x <= endX; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, startY);
      this.ctx.lineTo(x, endY);
      this.ctx.stroke();
    }

    for (let y = startY; y <= endY; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(startX, y);
      this.ctx.lineTo(endX, y);
      this.ctx.stroke();
    }
  }

  /**
   * 绘制玩家
   */
  drawPlayer() {
    const player = window.G.player;
    
    this.ctx.fillStyle = '#00ff88';
    this.ctx.beginPath();
    this.ctx.arc(player.x, player.y, 15, 0, Math.PI * 2);
    this.ctx.fill();
    
    // 绘制方向指示
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(player.x, player.y - 8, 3, 0, Math.PI * 2);
    this.ctx.fill();
  }

  /**
   * 绘制UI
   */
  drawUI() {
    // 绘制调试信息
    if (process.env.NODE_ENV === 'development') {
      const state = this.stateManager.getState();
      const metrics = this.performanceMonitor.getReport();
      
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(10, 10, 200, 100);
      
      this.ctx.fillStyle = '#00ff00';
      this.ctx.font = '12px monospace';
      this.ctx.fillText(`FPS: ${metrics.current.fps.toFixed(1)}`, 15, 25);
      this.ctx.fillText(`Frame: ${metrics.current.frameTime.toFixed(1)}ms`, 15, 40);
      this.ctx.fillText(`Player: ${Math.round(window.G.player.x)}, ${Math.round(window.G.player.y)}`, 15, 55);
      this.ctx.fillText(`Camera: ${Math.round(window.G.camera.x)}, ${Math.round(window.G.camera.y)}`, 15, 70);
      this.ctx.fillText(`Status: ${state.gameStatus}`, 15, 85);
    }
  }

  /**
   * 游戏事件处理器
   */
  onGameStart() {
    console.log('[GameApp] 游戏开始事件');
  }

  onGamePause() {
    console.log('[GameApp] 游戏暂停事件');
  }

  onGameResume() {
    console.log('[GameApp] 游戏恢复事件');
  }

  onGameOver() {
    console.log('[GameApp] 游戏结束事件');
    this.showGameOverModal();
  }

  /**
   * UI 辅助方法
   */
  showLevelSelect() {
    const modal = document.getElementById('levelSelectModal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  hideLevelSelect() {
    const modal = document.getElementById('levelSelectModal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  showGameOverModal() {
    const modal = document.getElementById('gameOverModal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  toggleInfoPanel() {
    const panel = document.getElementById('infoPanel');
    if (panel) {
      panel.classList.toggle('hidden');
    }
  }

  /**
   * 显示错误信息
   */
  showError(message) {
    console.error(message);
    alert(message); // 临时实现，后续可以改为更友好的错误提示
  }
}

// 创建并启动游戏应用
const gameApp = new GameApp();

// 等待DOM加载完成后初始化游戏
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => gameApp.init());
} else {
  gameApp.init();
}

// 导出到全局以便调试
if (process.env.NODE_ENV === 'development') {
  window.GameApp = gameApp;
  window.eventBus = eventBus;
  window.stateManager = stateManager;
  window.performanceMonitor = performanceMonitor;
  window.poolManager = poolManager;
}

export default gameApp;