/**
 * 简化版游戏入口 - 解决白屏问题
 */

// 简单的事件总线
class SimpleEventBus {
  constructor() {
    this.events = new Map();
  }
  
  on(eventName, callback) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName).push(callback);
  }
  
  emit(eventName, data) {
    const handlers = this.events.get(eventName) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('Event handler error:', error);
      }
    });
  }
}

// 简单的状态管理
class SimpleStateManager {
  constructor(initialState) {
    this.state = initialState;
    this.subscribers = [];
  }
  
  getState() {
    return this.state;
  }
  
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.subscribers.forEach(callback => callback(this.state));
  }
  
  subscribe(callback) {
    this.subscribers.push(callback);
  }
}

// 游戏主应用
class SimpleGameApp {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.VIEW = { w: 0, h: 0 };
    this.running = false;
    this.lastTime = 0;
    
    this.eventBus = new SimpleEventBus();
    this.stateManager = new SimpleStateManager({
      gameStatus: 'menu',
      player: {
        x: 400,
        y: 300,
        hp: 100,
        maxHp: 100,
        level: 1,
        exp: 0,
        expToNext: 100
      },
      world: {
        timer: 0,
        kills: 0
      }
    });
    
    this.input = {
      up: false,
      down: false,
      left: false,
      right: false
    };
    
    this.G = {
      player: { x: 400, y: 300, speed: 3 },
      world: { w: 2000, h: 2000 },
      camera: { x: 0, y: 0 }
    };
  }
  
  async init() {
    try {
      console.log('[SimpleGameApp] 初始化游戏...');
      
      this.canvas = document.getElementById('game');
      if (!this.canvas) {
        throw new Error('Canvas元素未找到');
      }
      
      this.ctx = this.canvas.getContext('2d');
      if (!this.ctx) {
        throw new Error('无法获取2D上下文');
      }
      
      this.fitCanvas();
      window.addEventListener('resize', () => this.fitCanvas());
      
      this.setupInput();
      this.setupUI();
      
      console.log('[SimpleGameApp] 初始化完成');
      this.showLevelSelect();
      
    } catch (error) {
      console.error('[SimpleGameApp] 初始化失败:', error);
      alert('游戏初始化失败: ' + error.message);
    }
  }
  
  fitCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.VIEW.w = rect.width;
    this.VIEW.h = rect.height;
    
    // 更新玩家初始位置
    if (this.G.player.x === 400 && this.G.player.y === 300) {
      this.G.player.x = this.VIEW.w / 2;
      this.G.player.y = this.VIEW.h / 2;
    }
  }
  
  setupInput() {
    window.addEventListener('keydown', (e) => {
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
          this.togglePause();
          break;
      }
    });
    
    window.addEventListener('keyup', (e) => {
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
    });
  }
  
  setupUI() {
    // 关卡选择按钮
    document.addEventListener('click', (e) => {
      if (e.target.matches('.level-btn') && !e.target.disabled) {
        const levelItem = e.target.closest('.level-item');
        const level = levelItem?.dataset.level;
        if (level) {
          this.startGame(parseInt(level));
        }
      }
    });
    
    // 暂停按钮
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.togglePause());
    }
  }
  
  startGame(level = 1) {
    console.log('[SimpleGameApp] 开始游戏，关卡:', level);
    
    this.stateManager.setState({
      gameStatus: 'playing',
      player: {
        x: this.VIEW.w / 2,
        y: this.VIEW.h / 2,
        hp: 100,
        maxHp: 100,
        level: 1,
        exp: 0,
        expToNext: 100
      },
      world: {
        timer: 0,
        kills: 0
      }
    });
    
    // 更新游戏对象
    this.G.player.x = this.VIEW.w / 2;
    this.G.player.y = this.VIEW.h / 2;
    
    this.hideLevelSelect();
    this.startGameLoop();
  }
  
  startGameLoop() {
    if (this.running) return;
    
    this.running = true;
    this.lastTime = performance.now();
    console.log('[SimpleGameApp] 游戏循环开始');
    
    this.gameLoop();
  }
  
  gameLoop() {
    if (!this.running) return;
    
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    const state = this.stateManager.getState();
    
    if (state.gameStatus === 'paused') {
      requestAnimationFrame(() => this.gameLoop());
      return;
    }
    
    try {
      this.updateGame(deltaTime / 1000);
      this.renderGame();
    } catch (error) {
      console.error('[SimpleGameApp] 游戏循环错误:', error);
    }
    
    requestAnimationFrame(() => this.gameLoop());
  }
  
  updateGame(dt) {
    // 更新玩家移动
    if (this.input.up) this.G.player.y -= this.G.player.speed;
    if (this.input.down) this.G.player.y += this.G.player.speed;
    if (this.input.left) this.G.player.x -= this.G.player.speed;
    if (this.input.right) this.G.player.x += this.G.player.speed;
    
    // 限制在边界内
    this.G.player.x = Math.max(15, Math.min(this.G.world.w - 15, this.G.player.x));
    this.G.player.y = Math.max(15, Math.min(this.G.world.h - 15, this.G.player.y));
    
    // 更新摄像机
    this.G.camera.x = Math.max(0, Math.min(
      this.G.world.w - this.VIEW.w,
      this.G.player.x - this.VIEW.w / 2
    ));
    this.G.camera.y = Math.max(0, Math.min(
      this.G.world.h - this.VIEW.h,
      this.G.player.y - this.VIEW.h / 2
    ));
    
    // 更新状态
    const state = this.stateManager.getState();
    this.stateManager.setState({
      world: {
        ...state.world,
        timer: state.world.timer + dt
      }
    });
    
    this.updateUI();
  }
  
  renderGame() {
    // 清空画布
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.VIEW.w, this.VIEW.h);
    
    // 保存上下文
    this.ctx.save();
    
    // 应用摄像机变换
    this.ctx.translate(-this.G.camera.x, -this.G.camera.y);
    
    // 绘制网格
    this.drawGrid();
    
    // 绘制玩家
    this.drawPlayer();
    
    // 恢复上下文
    this.ctx.restore();
    
    // 绘制调试信息
    this.drawDebugInfo();
  }
  
  drawGrid() {
    const gridSize = 50;
    const startX = Math.floor(this.G.camera.x / gridSize) * gridSize;
    const startY = Math.floor(this.G.camera.y / gridSize) * gridSize;
    const endX = this.G.camera.x + this.VIEW.w;
    const endY = this.G.camera.y + this.VIEW.h;
    
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
  
  drawPlayer() {
    const player = this.G.player;
    
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
  
  drawDebugInfo() {
    const state = this.stateManager.getState();
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, 10, 300, 120);
    
    this.ctx.fillStyle = '#00ff00';
    this.ctx.font = '14px monospace';
    this.ctx.fillText('🎮 Qoder-S1 重构版', 15, 30);
    this.ctx.fillText(`状态: ${state.gameStatus}`, 15, 50);
    this.ctx.fillText(`玩家: ${Math.round(this.G.player.x)}, ${Math.round(this.G.player.y)}`, 15, 70);
    this.ctx.fillText(`摄像机: ${Math.round(this.G.camera.x)}, ${Math.round(this.G.camera.y)}`, 15, 90);
    this.ctx.fillText(`计时器: ${state.world.timer.toFixed(1)}s`, 15, 110);
  }
  
  updateUI() {
    const state = this.stateManager.getState();
    
    // 更新HUD
    const hpText = document.getElementById('hp-text');
    if (hpText) {
      hpText.textContent = `${state.player.hp}/${state.player.maxHp}`;
    }
    
    const levelText = document.getElementById('level-text');
    if (levelText) {
      levelText.textContent = `Lv. ${state.player.level}`;
    }
    
    const timer = document.getElementById('timer');
    if (timer) {
      const minutes = Math.floor(state.world.timer / 60);
      const seconds = Math.floor(state.world.timer % 60);
      timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    const kills = document.getElementById('kills');
    if (kills) {
      kills.textContent = `Kills ${state.world.kills}`;
    }
  }
  
  togglePause() {
    const state = this.stateManager.getState();
    if (state.gameStatus === 'playing') {
      this.stateManager.setState({ gameStatus: 'paused' });
      console.log('[SimpleGameApp] 游戏暂停');
    } else if (state.gameStatus === 'paused') {
      this.stateManager.setState({ gameStatus: 'playing' });
      console.log('[SimpleGameApp] 游戏恢复');
    }
  }
  
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
}

// 创建并启动游戏
const simpleGameApp = new SimpleGameApp();

// 等待DOM加载完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    simpleGameApp.init();
  });
} else {
  console.log('DOM already loaded, initializing game...');
  simpleGameApp.init();
}

// 导出到全局
window.SimpleGameApp = simpleGameApp;
window.G = simpleGameApp.G;

console.log('简化版游戏脚本加载完成!');