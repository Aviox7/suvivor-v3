/**
 * HUD (Heads-Up Display) module - 游戏界面显示模块
 * @module HUD
 */

/**
 * @typedef {Object} HUDConfig
 * @property {boolean} showHealth - 显示生命值
 * @property {boolean} showMana - 显示魔法值
 * @property {boolean} showExperience - 显示经验值
 * @property {boolean} showLevel - 显示等级
 * @property {boolean} showScore - 显示分数
 * @property {boolean} showTime - 显示时间
 * @property {boolean} showMinimap - 显示小地图
 * @property {boolean} showSkills - 显示技能栏
 * @property {boolean} showInventory - 显示物品栏
 * @property {boolean} showStats - 显示统计信息
 * @property {string} position - HUD位置
 * @property {number} opacity - 透明度
 * @property {string} theme - 主题
 */

/**
 * @typedef {Object} PlayerStats
 * @property {number} health - 当前生命值
 * @property {number} maxHealth - 最大生命值
 * @property {number} mana - 当前魔法值
 * @property {number} maxMana - 最大魔法值
 * @property {number} experience - 当前经验值
 * @property {number} experienceToNext - 升级所需经验值
 * @property {number} level - 等级
 * @property {number} score - 分数
 * @property {number} kills - 击杀数
 * @property {number} damage - 伤害
 * @property {number} defense - 防御
 * @property {number} speed - 速度
 */

/**
 * @typedef {Object} GameStats
 * @property {number} time - 游戏时间
 * @property {number} wave - 当前波次
 * @property {number} enemiesKilled - 击杀敌人数
 * @property {number} itemsCollected - 收集物品数
 * @property {number} damageDealt - 造成伤害
 * @property {number} damageTaken - 受到伤害
 * @property {number} fps - 帧率
 * @property {number} ping - 延迟
 */

/**
 * @typedef {Object} SkillInfo
 * @property {string} id - 技能ID
 * @property {string} name - 技能名称
 * @property {string} icon - 图标
 * @property {number} level - 等级
 * @property {number} cooldown - 冷却时间
 * @property {number} maxCooldown - 最大冷却时间
 * @property {boolean} available - 是否可用
 * @property {string} hotkey - 快捷键
 */

/**
 * @typedef {Object} ItemInfo
 * @property {string} id - 物品ID
 * @property {string} name - 物品名称
 * @property {string} icon - 图标
 * @property {number} quantity - 数量
 * @property {string} rarity - 稀有度
 * @property {string} description - 描述
 */

/**
 * HUD管理器类
 */
export class HUDManager {
  /**
     * 构造函数
     * @param {HUDConfig} config - HUD配置
     */
  constructor(config = {}) {
    /** @type {HUDConfig} */
    this.config = {
      showHealth: true,
      showMana: true,
      showExperience: true,
      showLevel: true,
      showScore: true,
      showTime: true,
      showMinimap: true,
      showSkills: true,
      showInventory: true,
      showStats: false,
      position: 'default',
      opacity: 0.9,
      theme: 'default',
      ...config
    };
        
    /** @type {PlayerStats} */
    this.playerStats = {
      health: 100,
      maxHealth: 100,
      mana: 50,
      maxMana: 50,
      experience: 0,
      experienceToNext: 100,
      level: 1,
      score: 0,
      kills: 0,
      damage: 10,
      defense: 5,
      speed: 100
    };
        
    /** @type {GameStats} */
    this.gameStats = {
      time: 0,
      wave: 1,
      enemiesKilled: 0,
      itemsCollected: 0,
      damageDealt: 0,
      damageTaken: 0,
      fps: 60,
      ping: 0
    };
        
    /** @type {Array<SkillInfo>} */
    this.skills = [];
        
    /** @type {Array<ItemInfo>} */
    this.inventory = [];
        
    /** @type {Array<string>} */
    this.notifications = [];
        
    /** @type {Array<Object>} */
    this.damageNumbers = [];
        
    /** @type {boolean} */
    this.visible = true;
        
    /** @type {number} */
    this.animationTime = 0;
        
    /** @type {Object} */
    this.layout = {
      padding: 10,
      barHeight: 20,
      barWidth: 200,
      skillSize: 40,
      itemSize: 35,
      fontSize: 14,
      titleFontSize: 16,
      spacing: 5
    };
        
    this.initializeThemes();
    this.calculateLayout();
  }

  /**
     * 初始化主题
     */
  initializeThemes() {
    this.themes = {
      default: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderColor: '#666',
        textColor: '#fff',
        healthColor: '#e74c3c',
        manaColor: '#3498db',
        experienceColor: '#f39c12',
        skillCooldownColor: 'rgba(0, 0, 0, 0.6)',
        notificationColor: 'rgba(255, 255, 255, 0.9)',
        damageColor: '#ff6b6b',
        healColor: '#51cf66',
        criticalColor: '#ffd43b',
        barBorderWidth: 2,
        cornerRadius: 4
      },
      minimal: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderColor: '#333',
        textColor: '#ddd',
        healthColor: '#c0392b',
        manaColor: '#2980b9',
        experienceColor: '#d68910',
        skillCooldownColor: 'rgba(0, 0, 0, 0.4)',
        notificationColor: 'rgba(255, 255, 255, 0.8)',
        damageColor: '#e74c3c',
        healColor: '#27ae60',
        criticalColor: '#f1c40f',
        barBorderWidth: 1,
        cornerRadius: 2
      }
    };
  }

  /**
     * 获取当前主题
     * @returns {Object} 主题配置
     */
  getCurrentTheme() {
    return this.themes[this.config.theme] || this.themes.default;
  }

  /**
     * 计算布局
     */
  calculateLayout() {
    // 根据配置计算各个元素的位置
    this.positions = {
      health: { x: this.layout.padding, y: this.layout.padding },
      mana: { x: this.layout.padding, y: this.layout.padding + this.layout.barHeight + this.layout.spacing },
      experience: { x: this.layout.padding, y: this.layout.padding + (this.layout.barHeight + this.layout.spacing) * 2 },
      level: { x: this.layout.padding + this.layout.barWidth + this.layout.spacing, y: this.layout.padding },
      score: { x: this.layout.padding + this.layout.barWidth + this.layout.spacing, y: this.layout.padding + 25 },
      time: { x: this.layout.padding + this.layout.barWidth + this.layout.spacing, y: this.layout.padding + 50 },
      skills: { x: this.layout.padding, y: 100 },
      inventory: { x: this.layout.padding, y: 150 },
      minimap: { x: 600, y: this.layout.padding },
      stats: { x: 600, y: 200 }
    };
  }

  /**
     * 更新玩家统计信息
     * @param {Partial<PlayerStats>} stats - 统计信息
     */
  updatePlayerStats(stats) {
    Object.assign(this.playerStats, stats);
  }

  /**
     * 更新游戏统计信息
     * @param {Partial<GameStats>} stats - 游戏统计信息
     */
  updateGameStats(stats) {
    Object.assign(this.gameStats, stats);
  }

  /**
     * 更新技能信息
     * @param {Array<SkillInfo>} skills - 技能列表
     */
  updateSkills(skills) {
    this.skills = skills;
  }

  /**
     * 更新物品栏
     * @param {Array<ItemInfo>} items - 物品列表
     */
  updateInventory(items) {
    this.inventory = items;
  }

  /**
     * 添加通知
     * @param {string} message - 通知消息
     * @param {number} duration - 持续时间（毫秒）
     */
  addNotification(message, duration = 3000) {
    const notification = {
      message,
      timestamp: Date.now(),
      duration,
      alpha: 1
    };
        
    this.notifications.push(notification);
        
    // 限制通知数量
    if (this.notifications.length > 5) {
      this.notifications.shift();
    }
  }

  /**
     * 添加伤害数字
     * @param {number} damage - 伤害值
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {string} type - 伤害类型 (damage, heal, critical)
     */
  addDamageNumber(damage, x, y, type = 'damage') {
    const damageNumber = {
      value: Math.round(damage),
      x,
      y,
      startY: y,
      type,
      timestamp: Date.now(),
      duration: 2000,
      alpha: 1
    };
        
    this.damageNumbers.push(damageNumber);
        
    // 限制伤害数字数量
    if (this.damageNumbers.length > 20) {
      this.damageNumbers.shift();
    }
  }

  /**
     * 设置HUD可见性
     * @param {boolean} visible - 是否可见
     */
  setVisible(visible) {
    this.visible = visible;
  }

  /**
     * 切换HUD可见性
     */
  toggleVisible() {
    this.visible = !this.visible;
  }

  /**
     * 更新HUD
     * @param {number} deltaTime - 时间间隔
     */
  update(deltaTime) {
    this.animationTime += deltaTime;
        
    // 更新通知
    this.updateNotifications(deltaTime);
        
    // 更新伤害数字
    this.updateDamageNumbers(deltaTime);
        
    // 更新技能冷却
    this.updateSkillCooldowns(deltaTime);
  }

  /**
     * 更新通知
     * @param {number} deltaTime - 时间间隔
     */
  updateNotifications(deltaTime) {
    const currentTime = Date.now();
        
    this.notifications = this.notifications.filter(notification => {
      const elapsed = currentTime - notification.timestamp;
            
      if (elapsed > notification.duration) {
        return false;
      }
            
      // 淡出效果
      const fadeStart = notification.duration * 0.7;
      if (elapsed > fadeStart) {
        const fadeProgress = (elapsed - fadeStart) / (notification.duration - fadeStart);
        notification.alpha = 1 - fadeProgress;
      }
            
      return true;
    });
  }

  /**
     * 更新伤害数字
     * @param {number} deltaTime - 时间间隔
     */
  updateDamageNumbers(deltaTime) {
    const currentTime = Date.now();
        
    this.damageNumbers = this.damageNumbers.filter(damageNumber => {
      const elapsed = currentTime - damageNumber.timestamp;
            
      if (elapsed > damageNumber.duration) {
        return false;
      }
            
      // 上升和淡出动画
      const progress = elapsed / damageNumber.duration;
      damageNumber.y = damageNumber.startY - progress * 50;
      damageNumber.alpha = 1 - progress;
            
      return true;
    });
  }

  /**
     * 更新技能冷却
     * @param {number} deltaTime - 时间间隔
     */
  updateSkillCooldowns(deltaTime) {
    this.skills.forEach(skill => {
      if (skill.cooldown > 0) {
        skill.cooldown = Math.max(0, skill.cooldown - deltaTime);
        skill.available = skill.cooldown === 0;
      }
    });
  }

  /**
     * 渲染HUD
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
  render(ctx) {
    if (!this.visible) return;
        
    const theme = this.getCurrentTheme();
        
    ctx.save();
    ctx.globalAlpha = this.config.opacity;
        
    // 渲染各个组件
    if (this.config.showHealth) this.renderHealthBar(ctx, theme);
    if (this.config.showMana) this.renderManaBar(ctx, theme);
    if (this.config.showExperience) this.renderExperienceBar(ctx, theme);
    if (this.config.showLevel) this.renderLevel(ctx, theme);
    if (this.config.showScore) this.renderScore(ctx, theme);
    if (this.config.showTime) this.renderTime(ctx, theme);
    if (this.config.showSkills) this.renderSkills(ctx, theme);
    if (this.config.showInventory) this.renderInventory(ctx, theme);
    if (this.config.showMinimap) this.renderMinimap(ctx, theme);
    if (this.config.showStats) this.renderStats(ctx, theme);
        
    // 渲染通知和伤害数字
    this.renderNotifications(ctx, theme);
    this.renderDamageNumbers(ctx, theme);
        
    ctx.restore();
  }

  /**
     * 渲染生命值条
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Object} theme - 主题配置
     */
  renderHealthBar(ctx, theme) {
    const pos = this.positions.health;
    const percentage = this.playerStats.health / this.playerStats.maxHealth;
        
    this.renderBar(
      ctx,
      pos.x,
      pos.y,
      this.layout.barWidth,
      this.layout.barHeight,
      percentage,
      theme.healthColor,
      theme,
      `Health: ${this.playerStats.health}/${this.playerStats.maxHealth}`
    );
  }

  /**
     * 渲染魔法值条
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Object} theme - 主题配置
     */
  renderManaBar(ctx, theme) {
    const pos = this.positions.mana;
    const percentage = this.playerStats.mana / this.playerStats.maxMana;
        
    this.renderBar(
      ctx,
      pos.x,
      pos.y,
      this.layout.barWidth,
      this.layout.barHeight,
      percentage,
      theme.manaColor,
      theme,
      `Mana: ${this.playerStats.mana}/${this.playerStats.maxMana}`
    );
  }

  /**
     * 渲染经验值条
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Object} theme - 主题配置
     */
  renderExperienceBar(ctx, theme) {
    const pos = this.positions.experience;
    const percentage = this.playerStats.experience / this.playerStats.experienceToNext;
        
    this.renderBar(
      ctx,
      pos.x,
      pos.y,
      this.layout.barWidth,
      this.layout.barHeight,
      percentage,
      theme.experienceColor,
      theme,
      `XP: ${this.playerStats.experience}/${this.playerStats.experienceToNext}`
    );
  }

  /**
     * 渲染通用进度条
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @param {number} percentage - 百分比 (0-1)
     * @param {string} fillColor - 填充颜色
     * @param {Object} theme - 主题配置
     * @param {string} text - 显示文本
     */
  renderBar(ctx, x, y, width, height, percentage, fillColor, theme, text) {
    // 绘制背景
    ctx.fillStyle = theme.backgroundColor;
    ctx.fillRect(x, y, width, height);
        
    // 绘制填充
    const fillWidth = width * Math.max(0, Math.min(1, percentage));
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, fillWidth, height);
        
    // 绘制边框
    ctx.strokeStyle = theme.borderColor;
    ctx.lineWidth = theme.barBorderWidth;
    ctx.strokeRect(x, y, width, height);
        
    // 绘制文本
    if (text) {
      ctx.fillStyle = theme.textColor;
      ctx.font = `${this.layout.fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x + width / 2, y + height / 2);
    }
  }

  /**
     * 渲染等级
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Object} theme - 主题配置
     */
  renderLevel(ctx, theme) {
    const pos = this.positions.level;
        
    ctx.fillStyle = theme.textColor;
    ctx.font = `bold ${this.layout.titleFontSize}px Arial, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Level ${this.playerStats.level}`, pos.x, pos.y);
  }

  /**
     * 渲染分数
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Object} theme - 主题配置
     */
  renderScore(ctx, theme) {
    const pos = this.positions.score;
        
    ctx.fillStyle = theme.textColor;
    ctx.font = `${this.layout.fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Score: ${this.formatNumber(this.playerStats.score)}`, pos.x, pos.y);
  }

  /**
     * 渲染时间
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Object} theme - 主题配置
     */
  renderTime(ctx, theme) {
    const pos = this.positions.time;
    const timeString = this.formatTime(this.gameStats.time);
        
    ctx.fillStyle = theme.textColor;
    ctx.font = `${this.layout.fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Time: ${timeString}`, pos.x, pos.y);
  }

  /**
     * 渲染技能栏
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Object} theme - 主题配置
     */
  renderSkills(ctx, theme) {
    const pos = this.positions.skills;
    const skillSize = this.layout.skillSize;
    const spacing = this.layout.spacing;
        
    this.skills.forEach((skill, index) => {
      const x = pos.x + index * (skillSize + spacing);
      const y = pos.y;
            
      // 绘制技能背景
      ctx.fillStyle = skill.available ? theme.backgroundColor : 'rgba(100, 100, 100, 0.5)';
      ctx.fillRect(x, y, skillSize, skillSize);
            
      // 绘制技能边框
      ctx.strokeStyle = theme.borderColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, skillSize, skillSize);
            
      // 绘制技能图标（简化为文本）
      ctx.fillStyle = theme.textColor;
      ctx.font = `${this.layout.fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(skill.name.charAt(0), x + skillSize / 2, y + skillSize / 2);
            
      // 绘制冷却遮罩
      if (skill.cooldown > 0) {
        const cooldownPercentage = skill.cooldown / skill.maxCooldown;
        const maskHeight = skillSize * cooldownPercentage;
                
        ctx.fillStyle = theme.skillCooldownColor;
        ctx.fillRect(x, y + skillSize - maskHeight, skillSize, maskHeight);
                
        // 绘制冷却时间文本
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${this.layout.fontSize - 2}px Arial, sans-serif`;
        ctx.fillText(
          Math.ceil(skill.cooldown / 1000).toString(),
          x + skillSize / 2,
          y + skillSize / 2
        );
      }
            
      // 绘制快捷键
      if (skill.hotkey) {
        ctx.fillStyle = theme.textColor;
        ctx.font = `${this.layout.fontSize - 4}px Arial, sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(skill.hotkey, x + skillSize - 2, y + skillSize - 2);
      }
    });
  }

  /**
     * 渲染物品栏
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Object} theme - 主题配置
     */
  renderInventory(ctx, theme) {
    const pos = this.positions.inventory;
    const itemSize = this.layout.itemSize;
    const spacing = this.layout.spacing;
        
    this.inventory.forEach((item, index) => {
      const x = pos.x + index * (itemSize + spacing);
      const y = pos.y;
            
      // 绘制物品背景
      const rarityColors = {
        common: '#9e9e9e',
        uncommon: '#4caf50',
        rare: '#2196f3',
        epic: '#9c27b0',
        legendary: '#ff9800'
      };
            
      ctx.fillStyle = theme.backgroundColor;
      ctx.fillRect(x, y, itemSize, itemSize);
            
      // 绘制稀有度边框
      ctx.strokeStyle = rarityColors[item.rarity] || rarityColors.common;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, itemSize, itemSize);
            
      // 绘制物品图标（简化为文本）
      ctx.fillStyle = theme.textColor;
      ctx.font = `${this.layout.fontSize - 2}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.name.charAt(0), x + itemSize / 2, y + itemSize / 2);
            
      // 绘制数量
      if (item.quantity > 1) {
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${this.layout.fontSize - 4}px Arial, sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(item.quantity.toString(), x + itemSize - 2, y + itemSize - 2);
      }
    });
  }

  /**
     * 渲染小地图
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Object} theme - 主题配置
     */
  renderMinimap(ctx, theme) {
    const pos = this.positions.minimap;
    const size = 150;
        
    // 绘制小地图背景
    ctx.fillStyle = theme.backgroundColor;
    ctx.fillRect(pos.x, pos.y, size, size);
        
    // 绘制边框
    ctx.strokeStyle = theme.borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(pos.x, pos.y, size, size);
        
    // 绘制玩家位置（中心点）
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(pos.x + size / 2, pos.y + size / 2, 3, 0, Math.PI * 2);
    ctx.fill();
        
    // 绘制标题
    ctx.fillStyle = theme.textColor;
    ctx.font = `${this.layout.fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Minimap', pos.x + size / 2, pos.y - 20);
  }

  /**
     * 渲染统计信息
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Object} theme - 主题配置
     */
  renderStats(ctx, theme) {
    const pos = this.positions.stats;
    const stats = [
      `Wave: ${this.gameStats.wave}`,
      `Kills: ${this.gameStats.enemiesKilled}`,
      `Items: ${this.gameStats.itemsCollected}`,
      `Damage: ${this.formatNumber(this.gameStats.damageDealt)}`,
      `FPS: ${Math.round(this.gameStats.fps)}`
    ];
        
    // 绘制背景
    const width = 150;
    const height = stats.length * 20 + 20;
        
    ctx.fillStyle = theme.backgroundColor;
    ctx.fillRect(pos.x, pos.y, width, height);
        
    ctx.strokeStyle = theme.borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(pos.x, pos.y, width, height);
        
    // 绘制统计信息
    ctx.fillStyle = theme.textColor;
    ctx.font = `${this.layout.fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
        
    stats.forEach((stat, index) => {
      ctx.fillText(stat, pos.x + 10, pos.y + 10 + index * 20);
    });
  }

  /**
     * 渲染通知
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Object} theme - 主题配置
     */
  renderNotifications(ctx, theme) {
    const startY = 100;
    const spacing = 30;
        
    this.notifications.forEach((notification, index) => {
      const y = startY + index * spacing;
            
      ctx.save();
      ctx.globalAlpha = notification.alpha;
            
      // 绘制通知背景
      const textWidth = ctx.measureText(notification.message).width;
      const padding = 10;
            
      ctx.fillStyle = theme.notificationColor;
      ctx.fillRect(
        ctx.canvas.width - textWidth - padding * 2 - 20,
        y - 10,
        textWidth + padding * 2,
        25
      );
            
      // 绘制通知文本
      ctx.fillStyle = '#000';
      ctx.font = `${this.layout.fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        notification.message,
        ctx.canvas.width - textWidth - padding - 20,
        y
      );
            
      ctx.restore();
    });
  }

  /**
     * 渲染伤害数字
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Object} theme - 主题配置
     */
  renderDamageNumbers(ctx, theme) {
    this.damageNumbers.forEach(damageNumber => {
      ctx.save();
      ctx.globalAlpha = damageNumber.alpha;
            
      // 根据类型选择颜色
      let color = theme.damageColor;
      let fontSize = this.layout.fontSize + 2;
            
      switch (damageNumber.type) {
      case 'heal':
        color = theme.healColor;
        break;
      case 'critical':
        color = theme.criticalColor;
        fontSize += 4;
        break;
      }
            
      ctx.fillStyle = color;
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
            
      // 绘制阴影
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
            
      const text = damageNumber.type === 'heal' ? `+${damageNumber.value}` : `-${damageNumber.value}`;
      ctx.fillText(text, damageNumber.x, damageNumber.y);
            
      ctx.restore();
    });
  }

  /**
     * 格式化数字
     * @param {number} num - 数字
     * @returns {string} 格式化后的字符串
     */
  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  /**
     * 格式化时间
     * @param {number} seconds - 秒数
     * @returns {string} 格式化后的时间字符串
     */
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
     * 获取HUD配置
     * @returns {HUDConfig} HUD配置
     */
  getConfig() {
    return { ...this.config };
  }

  /**
     * 设置HUD配置
     * @param {Partial<HUDConfig>} config - 配置选项
     */
  setConfig(config) {
    Object.assign(this.config, config);
    this.calculateLayout();
  }

  /**
     * 重置HUD
     */
  reset() {
    this.playerStats = {
      health: 100,
      maxHealth: 100,
      mana: 50,
      maxMana: 50,
      experience: 0,
      experienceToNext: 100,
      level: 1,
      score: 0,
      kills: 0,
      damage: 10,
      defense: 5,
      speed: 100
    };
        
    this.gameStats = {
      time: 0,
      wave: 1,
      enemiesKilled: 0,
      itemsCollected: 0,
      damageDealt: 0,
      damageTaken: 0,
      fps: 60,
      ping: 0
    };
        
    this.notifications = [];
    this.damageNumbers = [];
    this.animationTime = 0;
  }

  /**
     * 销毁HUD
     */
  destroy() {
    this.notifications = [];
    this.damageNumbers = [];
    this.skills = [];
    this.inventory = [];
  }
}

/**
 * 默认导出HUD管理器
 */
export default HUDManager;