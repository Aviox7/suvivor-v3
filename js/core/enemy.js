/**
 * Enemy module - 敌人核心逻辑
 * @module Enemy
 */

/**
 * @typedef {'basic'|'fast'|'tank'|'boss'} EnemyType
 * 敌人类型枚举
 */

/**
 * @typedef {Object} EnemyConfig
 * @property {number} health - 血量
 * @property {number} speed - 移动速度
 * @property {number} damage - 攻击力
 * @property {number} size - 大小
 * @property {number} attackCooldown - 攻击冷却时间（毫秒）
 * @property {number} expValue - 击杀获得的经验值
 */

/**
 * @typedef {Object} EnemyStatus
 * @property {{x: number, y: number}} position - 敌人位置
 * @property {number} health - 当前血量
 * @property {number} maxHealth - 最大血量
 * @property {EnemyType} type - 敌人类型
 * @property {number} size - 敌人大小
 * @property {boolean} isDead - 是否死亡
 * @property {number} expValue - 击杀获得的经验值
 */

/**
 * @typedef {Object} EnemyStats
 * @property {number} x - 敌人X坐标（像素）
 * @property {number} y - 敌人Y坐标（像素）
 * @property {number} health - 当前血量
 * @property {number} maxHealth - 最大血量
 * @property {number} speed - 移动速度（像素/帧）
 * @property {number} damage - 攻击力
 * @property {EnemyType} type - 敌人类型
 * @property {number} size - 敌人大小（像素）
 * @property {boolean} isDead - 是否死亡
 * @property {number} lastAttackTime - 上次攻击时间戳（毫秒）
 * @property {number} attackCooldown - 攻击冷却时间（毫秒）
 * @property {number} expValue - 击杀获得的经验值
 */

/**
 * 敌人基类
 * 管理敌人的基本属性、移动、攻击和状态
 */
export class Enemy {
  /**
     * 创建敌人实例
     * 根据指定类型初始化敌人的基本属性和状态
     * @param {number} x - 初始X坐标（像素）
     * @param {number} y - 初始Y坐标（像素）
     * @param {EnemyType} [type='basic'] - 敌人类型
     */
  constructor(x, y, type = 'basic') {
    /** @type {number} 敌人X坐标 */
    this.x = x;
    /** @type {number} 敌人Y坐标 */
    this.y = y;
    /** @type {EnemyType} 敌人类型 */
    this.type = type;
    /** @type {boolean} 是否死亡 */
    this.isDead = false;
    /** @type {number} 上次攻击时间戳（毫秒） */
    this.lastAttackTime = 0;
        
    // 根据类型设置属性
    this.initializeByType(type);
  }

  /**
     * 根据类型初始化敌人属性
     * 设置不同类型敌人的血量、速度、攻击力等属性
     * @param {EnemyType} type - 敌人类型
     * @returns {void}
     */
  initializeByType(type) {
    const enemyTypes = {
      basic: {
        health: 50,
        speed: 1,
        damage: 10,
        size: 15,
        attackCooldown: 1000,
        expValue: 10
      },
      fast: {
        health: 30,
        speed: 2.5,
        damage: 8,
        size: 12,
        attackCooldown: 800,
        expValue: 15
      },
      tank: {
        health: 150,
        speed: 0.5,
        damage: 20,
        size: 25,
        attackCooldown: 2000,
        expValue: 30
      },
      boss: {
        health: 500,
        speed: 1.5,
        damage: 30,
        size: 40,
        attackCooldown: 1500,
        expValue: 100
      }
    };
        
    const config = enemyTypes[type] || enemyTypes.basic;
        
    /** @type {number} 当前血量 */
    this.health = config.health;
    /** @type {number} 最大血量 */
    this.maxHealth = config.health;
    /** @type {number} 移动速度（像素/帧） */
    this.speed = config.speed;
    /** @type {number} 攻击力 */
    this.damage = config.damage;
    /** @type {number} 敌人大小（像素） */
    this.size = config.size;
    /** @type {number} 攻击冷却时间（毫秒） */
    this.attackCooldown = config.attackCooldown;
    /** @type {number} 击杀获得的经验值 */
    this.expValue = config.expValue;
  }

  /**
     * 更新敌人状态
     * 处理敌人的移动和攻击逻辑
     * @param {number} deltaTime - 自上次更新以来的时间差（毫秒）
     * @param {import('./player.js').Player} player - 玩家对象
     * @returns {void}
     */
  update(deltaTime, player) {
    if (this.isDead) return;
        
    // 移动向玩家
    this.moveTowardsPlayer(player);
        
    // 检查攻击
    this.checkAttack(player);
  }

  /**
     * 向玩家移动
     * 计算并执行向玩家方向的移动
     * @param {import('./player.js').Player} player - 玩家对象
     * @returns {void}
     */
  moveTowardsPlayer(player) {
    if (this.isDead || !player) return;
        
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
        
    if (distance > 0) {
      const moveX = (dx / distance) * this.speed;
      const moveY = (dy / distance) * this.speed;
            
      this.x += moveX;
      this.y += moveY;
    }
  }

  /**
     * 检查是否可以攻击玩家
     * 检查攻击冷却时间和攻击范围，如果满足条件则对玩家造成伤害
     * @param {import('./player.js').Player} player - 玩家对象
     * @returns {boolean} 是否成功对玩家造成伤害
     * @example
     * // 检查敌人是否攻击到玩家
     * const attacked = enemy.checkAttack(player);
     * if (attacked) {
     *   console.log('敌人攻击了玩家');
     * }
     */
  checkAttack(player) {
    if (this.isDead || !player || player.isDead) return false;
        
    const currentTime = Date.now();
    if (currentTime - this.lastAttackTime < this.attackCooldown) {
      return false;
    }
        
    const distance = this.getDistanceToPlayer(player);
    const attackRange = this.size + 20; // 攻击范围
        
    if (distance <= attackRange) {
      this.lastAttackTime = currentTime;
      return player.takeDamage(this.damage);
    }
        
    return false;
  }

  /**
     * 获取与玩家的距离
     * 计算敌人与玩家之间的欧几里得距离
     * @param {import('./player.js').Player} player - 玩家对象
     * @returns {number} 距离（像素）
     * @example
     * // 获取敌人与玩家的距离
     * const distance = enemy.getDistanceToPlayer(player);
     * console.log(`距离玩家 ${distance} 像素`);
     */
  getDistanceToPlayer(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
     * 敌人受到伤害
     * 减少敌人血量，如果血量归零则标记为死亡
     * @param {number} damage - 伤害值（必须为正数）
     * @returns {boolean} 敌人是否因此次伤害而死亡
     * @example
     * // 对敌人造成25点伤害
     * const died = enemy.takeDamage(25);
     * if (died) {
     *   console.log('敌人死亡');
     * }
     */
  takeDamage(damage) {
    if (this.isDead) return false;
        
    this.health -= damage;
        
    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      return true;
    }
        
    return false;
  }

  /**
     * 获取敌人状态信息
     * 返回包含敌人当前状态的完整信息对象
     * @returns {EnemyStatus} 敌人状态信息对象
     * @example
     * // 获取敌人状态
     * const status = enemy.getStatus();
     * console.log(`敌人位置: (${status.position.x}, ${status.position.y})`);
     * console.log(`血量: ${status.health}/${status.maxHealth}`);
     */
  getStatus() {
    return {
      position: { x: this.x, y: this.y },
      health: this.health,
      maxHealth: this.maxHealth,
      type: this.type,
      size: this.size,
      isDead: this.isDead,
      expValue: this.expValue
    };
  }
}

/**
 * 敌人管理器
 * 负责管理所有敌人的生成、更新、移除和状态跟踪
 */
export class EnemyManager {
  /**
     * 创建敌人管理器实例
     * 初始化敌人列表和生成参数
     */
  constructor() {
    /** @type {Enemy[]} 敌人列表 */
    this.enemies = [];
    /** @type {number} 生成计时器（毫秒） */
    this.spawnTimer = 0;
    /** @type {number} 生成间隔时间（毫秒） */
    this.spawnInterval = 2000; // 2秒生成一个敌人
    /** @type {number} 最大敌人数量 */
    this.maxEnemies = 50;
  }

  /**
     * 更新所有敌人
     * 更新现有敌人状态，移除死亡敌人，并根据时间间隔生成新敌人
     * @param {number} deltaTime - 时间间隔（毫秒）
     * @param {import('./player.js').Player} player - 玩家对象
     * @example
     * // 在游戏循环中更新敌人管理器
     * enemyManager.update(16, player); // 60fps下约16ms
     */
  update(deltaTime, player) {
    // 更新现有敌人
    this.enemies = this.enemies.filter(enemy => {
      if (enemy.isDead) {
        return false;
      }
      enemy.update(deltaTime, player);
      return true;
    });
        
    // 生成新敌人
    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= this.spawnInterval && this.enemies.length < this.maxEnemies) {
      this.spawnEnemy();
      this.spawnTimer = 0;
    }
  }

  /**
     * 生成敌人
     * 在屏幕边缘随机位置生成指定类型的敌人
     * @param {EnemyType} [type='basic'] - 敌人类型，默认为基础敌人
     * @example
     * // 生成基础敌人
     * enemyManager.spawnEnemy();
     * // 生成快速敌人
     * enemyManager.spawnEnemy('fast');
     * // 生成坦克敌人
     * enemyManager.spawnEnemy('tank');
     */
  spawnEnemy(type = 'basic') {
    // 在屏幕边缘随机位置生成敌人
    const canvas = document.getElementById('gameCanvas');
    const margin = 50;
    let x, y;
        
    // 随机选择边缘
    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
    case 0: // 上边
      x = Math.random() * canvas.width;
      y = -margin;
      break;
    case 1: // 右边
      x = canvas.width + margin;
      y = Math.random() * canvas.height;
      break;
    case 2: // 下边
      x = Math.random() * canvas.width;
      y = canvas.height + margin;
      break;
    case 3: // 左边
      x = -margin;
      y = Math.random() * canvas.height;
      break;
    }
        
    const enemy = new Enemy(x, y, type);
    this.enemies.push(enemy);
  }

  /**
     * 生成BOSS
     * 在屏幕中央上方生成BOSS敌人
     * @example
     * // 在第5波时生成BOSS
     * if (wave % 5 === 0) {
     *   enemyManager.spawnBoss();
     * }
     */
  spawnBoss() {
    const canvas = document.getElementById('gameCanvas');
    const x = canvas.width / 2;
    const y = -100; // 从屏幕上方出现
        
    const boss = new Enemy(x, y, 'boss');
    this.enemies.push(boss);
  }

  /**
     * 获取所有活着的敌人
     * 过滤出未死亡的敌人列表
     * @returns {Enemy[]} 活着的敌人数组
     * @example
     * // 获取所有活着的敌人进行碰撞检测
     * const aliveEnemies = enemyManager.getAliveEnemies();
     * aliveEnemies.forEach(enemy => {
     *   // 进行碰撞检测逻辑
     * });
     */
  getAliveEnemies() {
    return this.enemies.filter(enemy => !enemy.isDead);
  }

  /**
     * 清除所有敌人
     * 移除所有敌人，通常在游戏重置或结束时使用
     * @example
     * // 游戏结束时清除所有敌人
     * enemyManager.clearAll();
     */
  clearAll() {
    this.enemies = [];
  }

  /**
     * 获取敌人数量
     * 返回当前敌人列表中的敌人总数（包括死亡的敌人）
     * @returns {number} 敌人总数量
     * @example
     * // 检查敌人数量是否达到上限
     * if (enemyManager.getEnemyCount() >= enemyManager.maxEnemies) {
     *   console.log('敌人数量已达上限');
     * }
     */
  getEnemyCount() {
    return this.enemies.length;
  }
}

/**
 * 敌人管理器实例
 * 全局单例，用于管理游戏中的所有敌人
 * @type {EnemyManager}
 * @example
 * // 导入并使用敌人管理器
 * import enemyManager from './enemy.js';
 * 
 * // 在游戏循环中更新敌人
 * enemyManager.update(deltaTime, player);
 * 
 * // 生成新敌人
 * enemyManager.spawnEnemy('fast');
 * 
 * // 获取活着的敌人
 * const enemies = enemyManager.getAliveEnemies();
 */
export default new EnemyManager();