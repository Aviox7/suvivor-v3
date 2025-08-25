/**
 * Upgrade System module - 升级系统逻辑
 * @module UpgradeSystem
 */

/**
 * @typedef {Object} UpgradeOption
 * @property {string} id - 升级选项ID
 * @property {string} name - 升级名称
 * @property {string} description - 升级描述
 * @property {string} type - 升级类型
 * @property {string} category - 升级分类
 * @property {number} level - 当前等级
 * @property {number} maxLevel - 最大等级
 * @property {Object} effects - 升级效果
 * @property {Array} requirements - 升级需求
 * @property {number} cost - 升级成本
 * @property {string} rarity - 稀有度
 * @property {boolean} unlocked - 是否解锁
 */

/**
 * @typedef {Object} UpgradeTree
 * @property {string} id - 升级树ID
 * @property {string} name - 升级树名称
 * @property {Array<UpgradeOption>} upgrades - 升级选项列表
 * @property {Object} dependencies - 依赖关系
 * @property {number} totalPoints - 总投入点数
 * @property {boolean} completed - 是否完成
 */

/**
 * 升级系统类
 */
export class UpgradeSystem {
  constructor() {
    // 升级选项存储
    this.upgrades = new Map();
    this.upgradeHistory = [];
        
    // 升级点数
    this.upgradePoints = 0;
    this.totalPointsEarned = 0;
    this.totalPointsSpent = 0;
        
    // 升级树配置
    this.upgradeTrees = new Map();
        
    // 升级效果缓存
    this.effectCache = new Map();
    this.cacheValid = false;
        
    // 初始化升级配置
    this.initializeUpgradeConfigs();
  }

  /**
     * 初始化升级配置
     */
  initializeUpgradeConfigs() {
    // 攻击系升级树
    this.addUpgradeTree('attack', {
      name: '攻击系',
      upgrades: [
        {
          id: 'damage_boost',
          name: '伤害提升',
          description: '增加基础攻击伤害',
          type: 'stat',
          category: 'damage',
          maxLevel: 10,
          effects: { damageMultiplier: 0.1 },
          cost: 1,
          rarity: 'common'
        },
        {
          id: 'crit_chance',
          name: '暴击几率',
          description: '增加暴击几率',
          type: 'stat',
          category: 'crit',
          maxLevel: 5,
          effects: { critChance: 0.05 },
          cost: 2,
          rarity: 'uncommon'
        },
        {
          id: 'crit_damage',
          name: '暴击伤害',
          description: '增加暴击伤害倍数',
          type: 'stat',
          category: 'crit',
          maxLevel: 5,
          effects: { critMultiplier: 0.2 },
          cost: 2,
          rarity: 'uncommon',
          requirements: [{ upgradeId: 'crit_chance', minLevel: 1 }]
        },
        {
          id: 'attack_speed',
          name: '攻击速度',
          description: '增加攻击速度',
          type: 'stat',
          category: 'speed',
          maxLevel: 8,
          effects: { attackSpeedMultiplier: 0.15 },
          cost: 1,
          rarity: 'common'
        },
        {
          id: 'penetration',
          name: '穿透攻击',
          description: '攻击可以穿透多个敌人',
          type: 'ability',
          category: 'special',
          maxLevel: 3,
          effects: { penetrationCount: 1 },
          cost: 3,
          rarity: 'rare',
          requirements: [{ upgradeId: 'damage_boost', minLevel: 3 }]
        }
      ]
    });
        
    // 防御系升级树
    this.addUpgradeTree('defense', {
      name: '防御系',
      upgrades: [
        {
          id: 'health_boost',
          name: '生命提升',
          description: '增加最大生命值',
          type: 'stat',
          category: 'health',
          maxLevel: 10,
          effects: { maxHealthMultiplier: 0.2 },
          cost: 1,
          rarity: 'common'
        },
        {
          id: 'armor',
          name: '护甲',
          description: '减少受到的伤害',
          type: 'stat',
          category: 'defense',
          maxLevel: 8,
          effects: { damageReduction: 0.05 },
          cost: 2,
          rarity: 'uncommon'
        },
        {
          id: 'regeneration',
          name: '生命回复',
          description: '每秒回复生命值',
          type: 'stat',
          category: 'regen',
          maxLevel: 5,
          effects: { healthRegen: 2 },
          cost: 2,
          rarity: 'uncommon'
        },
        {
          id: 'dodge_chance',
          name: '闪避几率',
          description: '有几率完全闪避攻击',
          type: 'stat',
          category: 'dodge',
          maxLevel: 3,
          effects: { dodgeChance: 0.1 },
          cost: 3,
          rarity: 'rare'
        },
        {
          id: 'shield',
          name: '护盾',
          description: '获得可再生的护盾',
          type: 'ability',
          category: 'special',
          maxLevel: 1,
          effects: { shieldAmount: 100, shieldRegen: 5 },
          cost: 5,
          rarity: 'epic',
          requirements: [{ upgradeId: 'armor', minLevel: 3 }]
        }
      ]
    });
        
    // 移动系升级树
    this.addUpgradeTree('mobility', {
      name: '移动系',
      upgrades: [
        {
          id: 'move_speed',
          name: '移动速度',
          description: '增加移动速度',
          type: 'stat',
          category: 'speed',
          maxLevel: 8,
          effects: { moveSpeedMultiplier: 0.1 },
          cost: 1,
          rarity: 'common'
        },
        {
          id: 'dash',
          name: '冲刺',
          description: '获得冲刺能力',
          type: 'ability',
          category: 'special',
          maxLevel: 3,
          effects: { dashDistance: 100, dashCooldown: -0.5 },
          cost: 3,
          rarity: 'rare',
          requirements: [{ upgradeId: 'move_speed', minLevel: 2 }]
        },
        {
          id: 'pickup_range',
          name: '拾取范围',
          description: '增加物品拾取范围',
          type: 'stat',
          category: 'utility',
          maxLevel: 5,
          effects: { pickupRangeMultiplier: 0.2 },
          cost: 1,
          rarity: 'common'
        },
        {
          id: 'magnet',
          name: '磁力',
          description: '自动吸引附近的物品',
          type: 'ability',
          category: 'special',
          maxLevel: 1,
          effects: { magnetRange: 150, magnetStrength: 5 },
          cost: 4,
          rarity: 'epic',
          requirements: [{ upgradeId: 'pickup_range', minLevel: 3 }]
        }
      ]
    });
        
    // 特殊系升级树
    this.addUpgradeTree('special', {
      name: '特殊系',
      upgrades: [
        {
          id: 'exp_boost',
          name: '经验加成',
          description: '增加获得的经验值',
          type: 'stat',
          category: 'utility',
          maxLevel: 5,
          effects: { expMultiplier: 0.2 },
          cost: 2,
          rarity: 'uncommon'
        },
        {
          id: 'luck',
          name: '幸运',
          description: '增加掉落物品的几率和品质',
          type: 'stat',
          category: 'utility',
          maxLevel: 3,
          effects: { dropRateMultiplier: 0.25, qualityBonus: 0.1 },
          cost: 3,
          rarity: 'rare'
        },
        {
          id: 'multishot',
          name: '多重射击',
          description: '同时发射多个投射物',
          type: 'ability',
          category: 'special',
          maxLevel: 3,
          effects: { additionalProjectiles: 1 },
          cost: 4,
          rarity: 'epic'
        },
        {
          id: 'time_slow',
          name: '时间减缓',
          description: '在危险时自动减缓时间',
          type: 'ability',
          category: 'special',
          maxLevel: 1,
          effects: { timeSlowFactor: 0.5, timeSlowDuration: 2 },
          cost: 6,
          rarity: 'legendary',
          requirements: [{ upgradeId: 'luck', minLevel: 2 }]
        }
      ]
    });
  }

  /**
     * 添加升级树
     * @param {string} treeId - 升级树ID
     * @param {Object} treeConfig - 升级树配置
     */
  addUpgradeTree(treeId, treeConfig) {
    const tree = {
      id: treeId,
      name: treeConfig.name,
      upgrades: new Map(),
      dependencies: new Map(),
      totalPoints: 0,
      completed: false
    };
        
    // 添加升级选项
    treeConfig.upgrades.forEach(upgradeConfig => {
      const upgrade = {
        ...upgradeConfig,
        level: 0,
        unlocked: !upgradeConfig.requirements || upgradeConfig.requirements.length === 0,
        treeId
      };
            
      tree.upgrades.set(upgrade.id, upgrade);
      this.upgrades.set(upgrade.id, upgrade);
            
      // 处理依赖关系
      if (upgrade.requirements) {
        tree.dependencies.set(upgrade.id, upgrade.requirements);
      }
    });
        
    this.upgradeTrees.set(treeId, tree);
  }

  /**
     * 升级选项
     * @param {string} upgradeId - 升级ID
     * @param {number} levels - 升级等级数
     * @returns {boolean} 是否成功升级
     */
  upgradeOption(upgradeId, levels = 1) {
    const upgrade = this.upgrades.get(upgradeId);
    if (!upgrade) {
      console.warn(`Upgrade not found: ${upgradeId}`);
      return false;
    }
        
    // 检查是否解锁
    if (!upgrade.unlocked) {
      console.warn(`Upgrade not unlocked: ${upgradeId}`);
      return false;
    }
        
    // 检查等级限制
    const targetLevel = upgrade.level + levels;
    if (targetLevel > upgrade.maxLevel) {
      console.warn(`Upgrade max level reached: ${upgradeId}`);
      return false;
    }
        
    // 计算总成本
    const totalCost = this.calculateUpgradeCost(upgrade, levels);
    if (this.upgradePoints < totalCost) {
      console.warn(`Insufficient upgrade points: need ${totalCost}, have ${this.upgradePoints}`);
      return false;
    }
        
    // 执行升级
    upgrade.level = targetLevel;
    this.upgradePoints -= totalCost;
    this.totalPointsSpent += totalCost;
        
    // 记录升级历史
    this.upgradeHistory.push({
      upgradeId,
      levels,
      cost: totalCost,
      timestamp: Date.now()
    });
        
    // 更新升级树状态
    const tree = this.upgradeTrees.get(upgrade.treeId);
    if (tree) {
      tree.totalPoints += totalCost;
    }
        
    // 检查并解锁新的升级选项
    this.checkUnlockConditions(upgrade.treeId);
        
    // 使效果缓存失效
    this.invalidateEffectCache();
        
    return true;
  }

  /**
     * 计算升级成本
     * @param {UpgradeOption} upgrade - 升级选项
     * @param {number} levels - 升级等级数
     * @returns {number} 总成本
     */
  calculateUpgradeCost(upgrade, levels) {
    let totalCost = 0;
        
    for (let i = 0; i < levels; i++) {
      const currentLevel = upgrade.level + i;
      // 成本随等级递增
      const levelCost = upgrade.cost * Math.pow(1.2, currentLevel);
      totalCost += Math.ceil(levelCost);
    }
        
    return totalCost;
  }

  /**
     * 检查解锁条件
     * @param {string} treeId - 升级树ID
     */
  checkUnlockConditions(treeId) {
    const tree = this.upgradeTrees.get(treeId);
    if (!tree) return;
        
    for (const [upgradeId, requirements] of tree.dependencies) {
      const upgrade = tree.upgrades.get(upgradeId);
      if (!upgrade || upgrade.unlocked) continue;
            
      // 检查所有依赖是否满足
      const allRequirementsMet = requirements.every(req => {
        const requiredUpgrade = this.upgrades.get(req.upgradeId);
        return requiredUpgrade && requiredUpgrade.level >= req.minLevel;
      });
            
      if (allRequirementsMet) {
        upgrade.unlocked = true;
        console.log(`Upgrade unlocked: ${upgradeId}`);
      }
    }
  }

  /**
     * 获取升级选项
     * @param {string} upgradeId - 升级ID
     * @returns {UpgradeOption|null} 升级选项
     */
  getUpgrade(upgradeId) {
    return this.upgrades.get(upgradeId) || null;
  }

  /**
     * 获取升级树
     * @param {string} treeId - 升级树ID
     * @returns {UpgradeTree|null} 升级树
     */
  getUpgradeTree(treeId) {
    return this.upgradeTrees.get(treeId) || null;
  }

  /**
     * 获取所有可用的升级选项
     * @param {string} treeId - 升级树ID（可选）
     * @returns {Array<UpgradeOption>} 升级选项数组
     */
  getAvailableUpgrades(treeId = null) {
    let upgrades;
        
    if (treeId) {
      const tree = this.upgradeTrees.get(treeId);
      upgrades = tree ? Array.from(tree.upgrades.values()) : [];
    } else {
      upgrades = Array.from(this.upgrades.values());
    }
        
    return upgrades.filter(upgrade => 
      upgrade.unlocked && upgrade.level < upgrade.maxLevel
    );
  }

  /**
     * 获取随机升级选项
     * @param {number} count - 选项数量
     * @param {Array<string>} excludeIds - 排除的升级ID
     * @returns {Array<UpgradeOption>} 随机升级选项
     */
  getRandomUpgrades(count = 3, excludeIds = []) {
    const available = this.getAvailableUpgrades()
      .filter(upgrade => !excludeIds.includes(upgrade.id));
        
    if (available.length <= count) {
      return available;
    }
        
    // 根据稀有度加权随机选择
    const weighted = [];
    const rarityWeights = {
      common: 10,
      uncommon: 6,
      rare: 3,
      epic: 1,
      legendary: 0.5
    };
        
    available.forEach(upgrade => {
      const weight = rarityWeights[upgrade.rarity] || 1;
      for (let i = 0; i < weight; i++) {
        weighted.push(upgrade);
      }
    });
        
    const selected = [];
    const usedIds = new Set();
        
    while (selected.length < count && weighted.length > 0) {
      const randomIndex = Math.floor(Math.random() * weighted.length);
      const upgrade = weighted[randomIndex];
            
      if (!usedIds.has(upgrade.id)) {
        selected.push(upgrade);
        usedIds.add(upgrade.id);
      }
            
      // 移除所有相同ID的选项
      for (let i = weighted.length - 1; i >= 0; i--) {
        if (weighted[i].id === upgrade.id) {
          weighted.splice(i, 1);
        }
      }
    }
        
    return selected;
  }

  /**
     * 计算总效果
     * @returns {Object} 总效果对象
     */
  calculateTotalEffects() {
    if (this.cacheValid && this.effectCache.size > 0) {
      return Object.fromEntries(this.effectCache);
    }
        
    const totalEffects = {};
        
    for (const upgrade of this.upgrades.values()) {
      if (upgrade.level > 0) {
        for (const [effectName, effectValue] of Object.entries(upgrade.effects)) {
          const totalValue = effectValue * upgrade.level;
                    
          if (totalEffects[effectName]) {
            totalEffects[effectName] += totalValue;
          } else {
            totalEffects[effectName] = totalValue;
          }
        }
      }
    }
        
    // 更新缓存
    this.effectCache.clear();
    Object.entries(totalEffects).forEach(([key, value]) => {
      this.effectCache.set(key, value);
    });
    this.cacheValid = true;
        
    return totalEffects;
  }

  /**
     * 获取特定效果值
     * @param {string} effectName - 效果名称
     * @returns {number} 效果值
     */
  getEffectValue(effectName) {
    const effects = this.calculateTotalEffects();
    return effects[effectName] || 0;
  }

  /**
     * 添加升级点数
     * @param {number} points - 点数
     */
  addUpgradePoints(points) {
    this.upgradePoints += points;
    this.totalPointsEarned += points;
  }

  /**
     * 重置升级
     * @param {string} upgradeId - 升级ID（可选，不提供则重置所有）
     * @returns {number} 返还的点数
     */
  resetUpgrade(upgradeId = null) {
    let refundedPoints = 0;
        
    if (upgradeId) {
      const upgrade = this.upgrades.get(upgradeId);
      if (upgrade && upgrade.level > 0) {
        // 计算返还点数
        for (let i = 0; i < upgrade.level; i++) {
          const levelCost = upgrade.cost * Math.pow(1.2, i);
          refundedPoints += Math.ceil(levelCost);
        }
                
        upgrade.level = 0;
      }
    } else {
      // 重置所有升级
      for (const upgrade of this.upgrades.values()) {
        if (upgrade.level > 0) {
          for (let i = 0; i < upgrade.level; i++) {
            const levelCost = upgrade.cost * Math.pow(1.2, i);
            refundedPoints += Math.ceil(levelCost);
          }
                    
          upgrade.level = 0;
        }
      }
            
      // 重置解锁状态
      this.resetUnlockStates();
    }
        
    this.upgradePoints += refundedPoints;
    this.totalPointsSpent -= refundedPoints;
        
    // 使效果缓存失效
    this.invalidateEffectCache();
        
    return refundedPoints;
  }

  /**
     * 重置解锁状态
     */
  resetUnlockStates() {
    for (const upgrade of this.upgrades.values()) {
      upgrade.unlocked = !upgrade.requirements || upgrade.requirements.length === 0;
    }
  }

  /**
     * 使效果缓存失效
     */
  invalidateEffectCache() {
    this.cacheValid = false;
  }

  /**
     * 获取升级统计
     * @returns {Object} 升级统计信息
     */
  getUpgradeStats() {
    const stats = {
      totalUpgrades: this.upgrades.size,
      unlockedUpgrades: 0,
      maxedUpgrades: 0,
      upgradePoints: this.upgradePoints,
      totalPointsEarned: this.totalPointsEarned,
      totalPointsSpent: this.totalPointsSpent,
      upgradesByTree: {},
      upgradesByRarity: {}
    };
        
    for (const upgrade of this.upgrades.values()) {
      if (upgrade.unlocked) {
        stats.unlockedUpgrades++;
      }
            
      if (upgrade.level >= upgrade.maxLevel) {
        stats.maxedUpgrades++;
      }
            
      // 按升级树统计
      if (!stats.upgradesByTree[upgrade.treeId]) {
        stats.upgradesByTree[upgrade.treeId] = {
          total: 0,
          unlocked: 0,
          maxed: 0,
          points: 0
        };
      }
            
      const treeStats = stats.upgradesByTree[upgrade.treeId];
      treeStats.total++;
            
      if (upgrade.unlocked) {
        treeStats.unlocked++;
      }
            
      if (upgrade.level >= upgrade.maxLevel) {
        treeStats.maxed++;
      }
            
      // 计算投入点数
      for (let i = 0; i < upgrade.level; i++) {
        const levelCost = upgrade.cost * Math.pow(1.2, i);
        treeStats.points += Math.ceil(levelCost);
      }
            
      // 按稀有度统计
      if (!stats.upgradesByRarity[upgrade.rarity]) {
        stats.upgradesByRarity[upgrade.rarity] = 0;
      }
      stats.upgradesByRarity[upgrade.rarity]++;
    }
        
    return stats;
  }

  /**
     * 保存升级数据
     * @returns {Object} 升级数据
     */
  saveData() {
    const upgradeData = {};
        
    for (const [id, upgrade] of this.upgrades) {
      if (upgrade.level > 0 || upgrade.unlocked !== (!upgrade.requirements || upgrade.requirements.length === 0)) {
        upgradeData[id] = {
          level: upgrade.level,
          unlocked: upgrade.unlocked
        };
      }
    }
        
    return {
      upgrades: upgradeData,
      upgradePoints: this.upgradePoints,
      totalPointsEarned: this.totalPointsEarned,
      totalPointsSpent: this.totalPointsSpent,
      upgradeHistory: this.upgradeHistory
    };
  }

  /**
     * 加载升级数据
     * @param {Object} data - 升级数据
     */
  loadData(data) {
    if (data.upgrades) {
      for (const [id, upgradeData] of Object.entries(data.upgrades)) {
        const upgrade = this.upgrades.get(id);
        if (upgrade) {
          upgrade.level = upgradeData.level || 0;
          upgrade.unlocked = upgradeData.unlocked !== undefined ? 
            upgradeData.unlocked : 
            (!upgrade.requirements || upgrade.requirements.length === 0);
        }
      }
    }
        
    if (data.upgradePoints !== undefined) {
      this.upgradePoints = data.upgradePoints;
    }
        
    if (data.totalPointsEarned !== undefined) {
      this.totalPointsEarned = data.totalPointsEarned;
    }
        
    if (data.totalPointsSpent !== undefined) {
      this.totalPointsSpent = data.totalPointsSpent;
    }
        
    if (data.upgradeHistory) {
      this.upgradeHistory = data.upgradeHistory;
    }
        
    // 使效果缓存失效
    this.invalidateEffectCache();
  }
}

/**
 * 默认导出升级系统实例
 */
export const upgradeSystem = new UpgradeSystem();