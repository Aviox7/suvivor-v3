/**
 * Player module - 玩家核心逻辑
 * @module Player
 */

/**
 * @typedef {Object} PlayerPosition
 * @property {number} x - X坐标
 * @property {number} y - Y坐标
 */

/**
 * @typedef {Object} PlayerStatus
 * @property {PlayerPosition} position - 玩家位置
 * @property {number} health - 当前血量
 * @property {number} maxHealth - 最大血量
 * @property {number} level - 当前等级
 * @property {number} exp - 当前经验值
 * @property {number} expToNext - 升级所需经验值
 * @property {boolean} isDead - 是否死亡
 * @property {boolean} isInvulnerable - 是否处于无敌状态
 */

/**
 * @typedef {Object} PlayerStats
 * @property {number} x - 玩家X坐标（像素）
 * @property {number} y - 玩家Y坐标（像素）
 * @property {number} health - 当前血量
 * @property {number} maxHealth - 最大血量
 * @property {number} speed - 移动速度（像素/帧）
 * @property {number} level - 当前等级
 * @property {number} exp - 当前经验值
 * @property {number} expToNext - 升级所需经验值
 * @property {boolean} isDead - 是否死亡
 * @property {number} lastDamageTime - 上次受伤时间戳（毫秒）
 * @property {number} invulnerabilityDuration - 无敌持续时间（毫秒）
 */

/**
 * 玩家类
 * 管理玩家的位置、生命值、等级、经验值和状态
 */
export class Player {
  /**
     * 创建玩家实例
     * 初始化玩家的基本属性，包括位置、生命值、等级等
     * @param {number} [x=400] - 初始X坐标（像素）
     * @param {number} [y=300] - 初始Y坐标（像素）
     */
  constructor(x = 400, y = 300) {
    /** @type {number} 玩家X坐标 */
    this.x = x;
    /** @type {number} 玩家Y坐标 */
    this.y = y;
    /** @type {number} 当前血量 */
    this.health = 100;
    /** @type {number} 最大血量 */
    this.maxHealth = 100;
    /** @type {number} 移动速度（像素/帧） */
    this.speed = 2;
    /** @type {number} 当前等级 */
    this.level = 1;
    /** @type {number} 当前经验值 */
    this.exp = 0;
    /** @type {number} 升级所需经验值 */
    this.expToNext = 100;
    /** @type {boolean} 是否死亡 */
    this.isDead = false;
    /** @type {number} 上次受伤时间戳（毫秒） */
    this.lastDamageTime = 0;
    /** @type {number} 无敌持续时间（毫秒） */
    this.invulnerabilityDuration = 1000; // 1秒无敌时间
  }

  /**
     * 更新玩家状态
     * 检查玩家的生命状态，处理死亡逻辑
     * @param {number} deltaTime - 自上次更新以来的时间差（毫秒）
     * @returns {void}
     */
  update(deltaTime) {
    // 检查是否死亡
    if (this.health <= 0 && !this.isDead) {
      this.isDead = true;
    }
  }

  /**
     * 移动玩家
     * 根据输入方向移动玩家，并进行边界检查
     * @param {number} dx - X方向移动方向（-1, 0, 1）
     * @param {number} dy - Y方向移动方向（-1, 0, 1）
     * @returns {void}
     */
  move(dx, dy) {
    if (this.isDead) return;
        
    this.x += dx * this.speed;
    this.y += dy * this.speed;
        
    // 边界检查（游戏区域：20-780, 20-580）
    this.x = Math.max(20, Math.min(780, this.x));
    this.y = Math.max(20, Math.min(580, this.y));
  }

  /**
     * 玩家受到伤害
     * 处理玩家受伤逻辑，包括无敌时间检查和死亡判定
     * @param {number} damage - 伤害值（必须为正数）
     * @returns {boolean} 是否成功造成伤害（false表示处于无敌状态或已死亡）
     * @example
     * // 对玩家造成10点伤害
     * const damaged = player.takeDamage(10);
     * if (damaged) {
     *   console.log('玩家受到伤害');
     * }
     */
  takeDamage(damage) {
    if (this.isDead) return false;
        
    const currentTime = Date.now();
    // 检查无敌时间
    if (currentTime - this.lastDamageTime < this.invulnerabilityDuration) {
      return false;
    }
        
    this.health -= damage;
    this.lastDamageTime = currentTime;
        
    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
    }
        
    return true;
  }

  /**
     * 玩家治疗
     * 恢复玩家血量，不会超过最大血量
     * @param {number} amount - 治疗量（必须为正数）
     * @returns {void}
     * @example
     * // 治疗玩家20点血量
     * player.heal(20);
     */
  heal(amount) {
    if (this.isDead) return;
        
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  /**
     * 增加经验值
     * 为玩家增加经验值，如果达到升级条件则自动升级
     * @param {number} exp - 要增加的经验值（必须为正数）
     * @returns {boolean} 是否触发升级
     * @example
     * // 增加50点经验值
     * const leveledUp = player.addExp(50);
     * if (leveledUp) {
     *   console.log('玩家升级了！');
     * }
     */
  addExp(exp) {
    if (this.isDead) return false;
        
    this.exp += exp;
        
    if (this.exp >= this.expToNext) {
      this.levelUp();
      return true;
    }
        
    return false;
  }

  /**
     * 升级
     * 提升玩家等级，重新计算升级所需经验，并恢复部分血量
     * @returns {void}
     * @example
     * // 手动升级玩家
     * player.levelUp();
     */
  levelUp() {
    this.level++;
    this.exp -= this.expToNext;
    this.expToNext = Math.floor(this.expToNext * 1.2);
        
    // 升级时恢复部分血量
    this.heal(20);
  }

  /**
     * 重置玩家状态
     * 将玩家所有属性重置为初始状态，用于游戏重新开始
     * @returns {void}
     * @example
     * // 重新开始游戏时重置玩家
     * player.reset();
     */
  reset() {
    this.x = 400;
    this.y = 300;
    this.health = 100;
    this.maxHealth = 100;
    this.speed = 2;
    this.level = 1;
    this.exp = 0;
    this.expToNext = 100;
    this.isDead = false;
    this.lastDamageTime = 0;
  }

  /**
     * 获取玩家状态信息
     * 返回包含玩家当前状态的完整信息对象
     * @returns {PlayerStatus} 玩家状态信息对象
     * @example
     * // 获取玩家状态
     * const status = player.getStatus();
     * console.log(`玩家位置: (${status.position.x}, ${status.position.y})`);
     * console.log(`血量: ${status.health}/${status.maxHealth}`);
     * console.log(`等级: ${status.level}`);
     */
  getStatus() {
    return {
      position: { x: this.x, y: this.y },
      health: this.health,
      maxHealth: this.maxHealth,
      level: this.level,
      exp: this.exp,
      expToNext: this.expToNext,
      isDead: this.isDead,
      isInvulnerable: Date.now() - this.lastDamageTime < this.invulnerabilityDuration
    };
  }
}

/**
 * 玩家实例
 * 全局单例玩家对象，用于管理玩家状态和行为
 * @type {Player}
 * @example
 * // 移动玩家
 * player.move(1, 0); // 向右移动
 * 
 * // 玩家受伤
 * player.takeDamage(10);
 * 
 * // 获取玩家状态
 * const status = player.getStatus();
 */
export const player = new Player();