/**
 * AI System module - AI系统逻辑
 * @module AISystem
 */

/**
 * @typedef {Object} ThreatInfo
 * @property {Object} enemy - 敌人对象
 * @property {number} distance - 距离
 * @property {number} threat - 威胁等级
 * @property {string} type - 威胁类型
 */

/**
 * @typedef {Object} MovementDecision
 * @property {number} x - X方向移动
 * @property {number} y - Y方向移动
 * @property {number} priority - 优先级
 * @property {string} reason - 移动原因
 */

/**
 * AI系统类 - 处理自动移动和决策
 */
export class AISystem {
  constructor() {
    this.enabled = true;
    this.safeDistance = 80; // 安全距离
    this.dangerDistance = 50; // 危险距离
    this.criticalDistance = 30; // 临界距离
        
    // 优先级权重
    this.priorities = {
      bulletDodge: 10, // 躲避子弹 - 最高优先级
      enemyDodge: 8,   // 躲避敌人
      equipmentPickup: 6, // 拾取装备
      dropPickup: 4,   // 拾取掉落物
      exploration: 2   // 探索移动
    };
        
    this.lastDecisionTime = 0;
    this.decisionInterval = 100; // 100ms决策一次
  }

  /**
     * 更新AI系统
     * @param {Object} player - 玩家对象
     * @param {Array} enemies - 敌人数组
     * @param {Array} projectiles - 投射物数组
     * @param {Array} items - 物品数组
     * @returns {MovementDecision} 移动决策
     */
  update(player, enemies = [], projectiles = [], items = []) {
    if (!this.enabled || !player || player.isDead) {
      return { x: 0, y: 0, priority: 0, reason: 'disabled' };
    }
        
    const currentTime = Date.now();
    if (currentTime - this.lastDecisionTime < this.decisionInterval) {
      return { x: 0, y: 0, priority: 0, reason: 'cooldown' };
    }
        
    this.lastDecisionTime = currentTime;
        
    // 分析威胁
    const threats = this.analyzeThreats(player, enemies, projectiles);
        
    // 生成移动决策
    const decisions = [];
        
    // 1. 躲避子弹（最高优先级）
    const bulletDodge = this.calculateBulletDodgeMovement(player, projectiles);
    if (bulletDodge.priority > 0) {
      decisions.push(bulletDodge);
    }
        
    // 2. 躲避敌人
    const enemyDodge = this.calculateEnemyDodgeMovement(player, enemies);
    if (enemyDodge.priority > 0) {
      decisions.push(enemyDodge);
    }
        
    // 3. 拾取装备
    const equipmentPickup = this.calculateEquipmentPickupMovement(player, items);
    if (equipmentPickup.priority > 0) {
      decisions.push(equipmentPickup);
    }
        
    // 4. 探索移动
    const exploration = this.calculateExplorationMovement(player);
    if (exploration.priority > 0) {
      decisions.push(exploration);
    }
        
    // 选择最高优先级的决策
    const bestDecision = this.selectBestDecision(decisions);
        
    return bestDecision;
  }

  /**
     * 分析威胁情况
     * @param {Object} player - 玩家对象
     * @param {Array} enemies - 敌人数组
     * @param {Array} projectiles - 投射物数组
     * @returns {Array} 威胁信息数组
     */
  analyzeThreats(player, enemies, projectiles) {
    const threats = [];
        
    // 分析敌人威胁
    enemies.forEach(enemy => {
      if (!enemy.isDead) {
        const distance = this.getDistance(player.x, player.y, enemy.x, enemy.y);
        let threat = 0;
                
        if (distance < this.criticalDistance) {
          threat = 10;
        } else if (distance < this.dangerDistance) {
          threat = 7;
        } else if (distance < this.safeDistance) {
          threat = 4;
        }
                
        if (threat > 0) {
          threats.push({
            enemy,
            distance,
            threat,
            type: 'enemy'
          });
        }
      }
    });
        
    // 分析投射物威胁
    projectiles.forEach(projectile => {
      if (projectile.isActive) {
        const distance = this.getDistance(player.x, player.y, projectile.x, projectile.y);
        const threat = this.calculateProjectileThreat(player, projectile);
                
        if (threat > 0) {
          threats.push({
            enemy: projectile,
            distance,
            threat,
            type: 'projectile'
          });
        }
      }
    });
        
    return threats.sort((a, b) => b.threat - a.threat);
  }

  /**
     * 计算躲避子弹的移动
     * @param {Object} player - 玩家对象
     * @param {Array} projectiles - 投射物数组
     * @returns {MovementDecision} 移动决策
     */
  calculateBulletDodgeMovement(player, projectiles) {
    let totalX = 0;
    let totalY = 0;
    let dangerCount = 0;
        
    projectiles.forEach(projectile => {
      if (!projectile.isActive) return;
            
      const distance = this.getDistance(player.x, player.y, projectile.x, projectile.y);
      const threat = this.calculateProjectileThreat(player, projectile);
            
      if (threat > 5 && distance < 100) {
        // 计算躲避方向（垂直于投射物运动方向）
        const perpX = -projectile.vy;
        const perpY = projectile.vx;
        const perpLength = Math.sqrt(perpX * perpX + perpY * perpY);
                
        if (perpLength > 0) {
          const normalizedX = perpX / perpLength;
          const normalizedY = perpY / perpLength;
                    
          // 选择更安全的方向
          const weight = (100 - distance) / 100;
          totalX += normalizedX * weight;
          totalY += normalizedY * weight;
          dangerCount++;
        }
      }
    });
        
    if (dangerCount > 0) {
      const length = Math.sqrt(totalX * totalX + totalY * totalY);
      if (length > 0) {
        return {
          x: totalX / length,
          y: totalY / length,
          priority: this.priorities.bulletDodge,
          reason: 'bullet_dodge'
        };
      }
    }
        
    return { x: 0, y: 0, priority: 0, reason: 'no_bullet_threat' };
  }

  /**
     * 计算躲避敌人的移动
     * @param {Object} player - 玩家对象
     * @param {Array} enemies - 敌人数组
     * @returns {MovementDecision} 移动决策
     */
  calculateEnemyDodgeMovement(player, enemies) {
    let totalX = 0;
    let totalY = 0;
    let dangerCount = 0;
        
    enemies.forEach(enemy => {
      if (enemy.isDead) return;
            
      const distance = this.getDistance(player.x, player.y, enemy.x, enemy.y);
            
      if (distance < this.safeDistance) {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
                
        if (distance > 0) {
          const weight = (this.safeDistance - distance) / this.safeDistance;
          totalX += (dx / distance) * weight;
          totalY += (dy / distance) * weight;
          dangerCount++;
        }
      }
    });
        
    if (dangerCount > 0) {
      const length = Math.sqrt(totalX * totalX + totalY * totalY);
      if (length > 0) {
        return {
          x: totalX / length,
          y: totalY / length,
          priority: this.priorities.enemyDodge,
          reason: 'enemy_dodge'
        };
      }
    }
        
    return { x: 0, y: 0, priority: 0, reason: 'no_enemy_threat' };
  }

  /**
     * 计算拾取装备的移动
     * @param {Object} player - 玩家对象
     * @param {Array} items - 物品数组
     * @returns {MovementDecision} 移动决策
     */
  calculateEquipmentPickupMovement(player, items) {
    if (!items || items.length === 0) {
      return { x: 0, y: 0, priority: 0, reason: 'no_items' };
    }
        
    let bestItem = null;
    let bestDistance = Infinity;
    let bestValue = 0;
        
    items.forEach(item => {
      const distance = this.getDistance(player.x, player.y, item.x, item.y);
      const value = this.calculateItemValue(item);
      const score = value / (distance + 1); // 距离越近，价值越高，分数越高
            
      if (distance < 150 && score > bestValue) {
        bestItem = item;
        bestDistance = distance;
        bestValue = score;
      }
    });
        
    if (bestItem && bestDistance < 150) {
      const dx = bestItem.x - player.x;
      const dy = bestItem.y - player.y;
      const length = Math.sqrt(dx * dx + dy * dy);
            
      if (length > 0) {
        return {
          x: dx / length,
          y: dy / length,
          priority: this.priorities.equipmentPickup,
          reason: 'equipment_pickup'
        };
      }
    }
        
    return { x: 0, y: 0, priority: 0, reason: 'no_valuable_items' };
  }

  /**
     * 计算探索移动
     * @param {Object} player - 玩家对象
     * @returns {MovementDecision} 移动决策
     */
  calculateExplorationMovement(player) {
    // 简单的随机探索
    const centerX = 400;
    const centerY = 300;
    const dx = centerX - player.x;
    const dy = centerY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
        
    if (distance > 200) {
      // 向中心移动
      return {
        x: dx / distance,
        y: dy / distance,
        priority: this.priorities.exploration,
        reason: 'return_to_center'
      };
    }
        
    return { x: 0, y: 0, priority: 0, reason: 'no_exploration_needed' };
  }

  /**
     * 计算投射物威胁等级
     * @param {Object} player - 玩家对象
     * @param {Object} projectile - 投射物对象
     * @returns {number} 威胁等级
     */
  calculateProjectileThreat(player, projectile) {
    const distance = this.getDistance(player.x, player.y, projectile.x, projectile.y);
        
    // 预测投射物路径
    const futureX = projectile.x + projectile.vx * 10;
    const futureY = projectile.y + projectile.vy * 10;
    const futureDistance = this.getDistance(player.x, player.y, futureX, futureY);
        
    // 如果投射物正在远离玩家，威胁较低
    if (futureDistance > distance) {
      return Math.max(0, 5 - distance / 20);
    }
        
    // 计算投射物是否会击中玩家
    const timeToReach = distance / Math.sqrt(projectile.vx * projectile.vx + projectile.vy * projectile.vy);
    const predictedX = projectile.x + projectile.vx * timeToReach;
    const predictedY = projectile.y + projectile.vy * timeToReach;
    const hitDistance = this.getDistance(player.x, player.y, predictedX, predictedY);
        
    if (hitDistance < 30) {
      return 10; // 高威胁
    } else if (hitDistance < 50) {
      return 7; // 中等威胁
    } else {
      return Math.max(0, 3 - distance / 50); // 低威胁
    }
  }

  /**
     * 计算物品价值
     * @param {Object} item - 物品对象
     * @returns {number} 物品价值
     */
  calculateItemValue(item) {
    if (!item.type) return 1;
        
    const values = {
      health: 8,
      weapon: 6,
      armor: 5,
      exp: 4,
      coin: 3,
      common: 2
    };
        
    return values[item.type] || 1;
  }

  /**
     * 选择最佳决策
     * @param {Array} decisions - 决策数组
     * @returns {MovementDecision} 最佳决策
     */
  selectBestDecision(decisions) {
    if (decisions.length === 0) {
      return { x: 0, y: 0, priority: 0, reason: 'no_decisions' };
    }
        
    // 按优先级排序
    decisions.sort((a, b) => b.priority - a.priority);
        
    // 如果有多个相同优先级的决策，可以进行组合
    const topPriority = decisions[0].priority;
    const topDecisions = decisions.filter(d => d.priority === topPriority);
        
    if (topDecisions.length === 1) {
      return topDecisions[0];
    }
        
    // 组合多个决策
    let totalX = 0;
    let totalY = 0;
        
    topDecisions.forEach(decision => {
      totalX += decision.x;
      totalY += decision.y;
    });
        
    const length = Math.sqrt(totalX * totalX + totalY * totalY);
    if (length > 0) {
      return {
        x: totalX / length,
        y: totalY / length,
        priority: topPriority,
        reason: 'combined_decisions'
      };
    }
        
    return decisions[0];
  }

  /**
     * 获取两点之间的距离
     * @param {number} x1 - 第一个点的X坐标
     * @param {number} y1 - 第一个点的Y坐标
     * @param {number} x2 - 第二个点的X坐标
     * @param {number} y2 - 第二个点的Y坐标
     * @returns {number} 距离
     */
  getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
     * 启用AI系统
     */
  enable() {
    this.enabled = true;
  }

  /**
     * 禁用AI系统
     */
  disable() {
    this.enabled = false;
  }

  /**
     * 设置AI参数
     * @param {Object} params - 参数对象
     */
  setParameters(params) {
    if (params.safeDistance !== undefined) {
      this.safeDistance = params.safeDistance;
    }
    if (params.dangerDistance !== undefined) {
      this.dangerDistance = params.dangerDistance;
    }
    if (params.criticalDistance !== undefined) {
      this.criticalDistance = params.criticalDistance;
    }
    if (params.priorities) {
      this.priorities = { ...this.priorities, ...params.priorities };
    }
  }
}

/**
 * 默认导出AI系统实例
 */
export const aiSystem = new AISystem();