/**
 * Equipment System module - 装备系统逻辑
 * @module EquipmentSystem
 */

/**
 * @typedef {Object} Equipment
 * @property {string} id - 装备ID
 * @property {string} name - 装备名称
 * @property {string} type - 装备类型
 * @property {number} level - 装备等级
 * @property {string} quality - 装备品质
 * @property {Object} stats - 装备属性
 * @property {string} description - 装备描述
 * @property {boolean} isEquipped - 是否已装备
 */

/**
 * @typedef {Object} EquipmentStats
 * @property {number} damage - 伤害
 * @property {number} defense - 防御
 * @property {number} speed - 速度
 * @property {number} health - 生命值
 * @property {number} critRate - 暴击率
 * @property {number} critDamage - 暴击伤害
 */

/**
 * 装备系统类
 */
export class EquipmentSystem {
  constructor() {
    this.equippedItems = {
      weapon: null,
      armor: null,
      accessory: null
    };
        
    this.inventory = [];
    this.maxInventorySize = 50;
        
    // 装备品质配置
    this.qualityConfig = {
      common: { color: '#ffffff', multiplier: 1.0 },
      uncommon: { color: '#1eff00', multiplier: 1.2 },
      rare: { color: '#0070dd', multiplier: 1.5 },
      epic: { color: '#a335ee', multiplier: 2.0 },
      legendary: { color: '#ff8000', multiplier: 3.0 }
    };
        
    // 装备类型配置
    this.typeConfig = {
      weapon: {
        baseStats: { damage: 10, critRate: 0.05 },
        statRanges: { damage: [5, 25], critRate: [0.02, 0.15] }
      },
      armor: {
        baseStats: { defense: 5, health: 20 },
        statRanges: { defense: [3, 15], health: [10, 50] }
      },
      accessory: {
        baseStats: { speed: 5, critDamage: 0.1 },
        statRanges: { speed: [2, 12], critDamage: [0.05, 0.25] }
      }
    };
  }

  /**
     * 生成随机装备
     * @param {string} type - 装备类型
     * @param {number} level - 装备等级
     * @param {string} quality - 装备品质
     * @returns {Equipment} 生成的装备
     */
  generateEquipment(type, level = 1, quality = null) {
    if (!this.typeConfig[type]) {
      throw new Error(`Unknown equipment type: ${type}`);
    }
        
    // 随机品质（如果未指定）
    if (!quality) {
      quality = this.generateRandomQuality();
    }
        
    const config = this.typeConfig[type];
    const qualityMultiplier = this.qualityConfig[quality].multiplier;
        
    // 生成装备属性
    const stats = {};
    Object.keys(config.baseStats).forEach(statName => {
      const baseValue = config.baseStats[statName];
      const range = config.statRanges[statName];
      const randomValue = this.randomBetween(range[0], range[1]);
      stats[statName] = Math.round((baseValue + randomValue) * level * qualityMultiplier * 100) / 100;
    });
        
    const equipment = {
      id: this.generateEquipmentId(),
      name: this.generateEquipmentName(type, quality),
      type,
      level,
      quality,
      stats,
      description: this.generateEquipmentDescription(type, stats, quality),
      isEquipped: false,
      createdAt: Date.now()
    };
        
    return equipment;
  }

  /**
     * 装备物品
     * @param {Equipment} equipment - 要装备的物品
     * @returns {Equipment|null} 被替换的装备（如果有）
     */
  equipItem(equipment) {
    if (!equipment || !this.typeConfig[equipment.type]) {
      return null;
    }
        
    const slot = equipment.type;
    const previousEquipment = this.equippedItems[slot];
        
    // 卸下之前的装备
    if (previousEquipment) {
      previousEquipment.isEquipped = false;
    }
        
    // 装备新物品
    equipment.isEquipped = true;
    this.equippedItems[slot] = equipment;
        
    // 从背包中移除
    this.removeFromInventory(equipment.id);
        
    return previousEquipment;
  }

  /**
     * 卸下装备
     * @param {string} slot - 装备槽位
     * @returns {Equipment|null} 被卸下的装备
     */
  unequipItem(slot) {
    const equipment = this.equippedItems[slot];
    if (!equipment) {
      return null;
    }
        
    equipment.isEquipped = false;
    this.equippedItems[slot] = null;
        
    // 添加到背包
    this.addToInventory(equipment);
        
    return equipment;
  }

  /**
     * 添加物品到背包
     * @param {Equipment} equipment - 要添加的装备
     * @returns {boolean} 是否成功添加
     */
  addToInventory(equipment) {
    if (this.inventory.length >= this.maxInventorySize) {
      return false;
    }
        
    this.inventory.push(equipment);
    return true;
  }

  /**
     * 从背包中移除物品
     * @param {string} equipmentId - 装备ID
     * @returns {Equipment|null} 被移除的装备
     */
  removeFromInventory(equipmentId) {
    const index = this.inventory.findIndex(item => item.id === equipmentId);
    if (index === -1) {
      return null;
    }
        
    return this.inventory.splice(index, 1)[0];
  }

  /**
     * 获取装备的总属性加成
     * @returns {EquipmentStats} 总属性
     */
  getTotalStats() {
    const totalStats = {
      damage: 0,
      defense: 0,
      speed: 0,
      health: 0,
      critRate: 0,
      critDamage: 0
    };
        
    Object.values(this.equippedItems).forEach(equipment => {
      if (equipment && equipment.stats) {
        Object.keys(equipment.stats).forEach(statName => {
          if (totalStats.hasOwnProperty(statName)) {
            totalStats[statName] += equipment.stats[statName];
          }
        });
      }
    });
        
    return totalStats;
  }

  /**
     * 比较两个装备的属性
     * @param {Equipment} equipment1 - 装备1
     * @param {Equipment} equipment2 - 装备2
     * @returns {Object} 比较结果
     */
  compareEquipment(equipment1, equipment2) {
    if (!equipment1 || !equipment2 || equipment1.type !== equipment2.type) {
      return null;
    }
        
    const comparison = {
      better: [],
      worse: [],
      equal: [],
      score1: 0,
      score2: 0
    };
        
    const allStats = new Set([...Object.keys(equipment1.stats), ...Object.keys(equipment2.stats)]);
        
    allStats.forEach(statName => {
      const value1 = equipment1.stats[statName] || 0;
      const value2 = equipment2.stats[statName] || 0;
            
      if (value1 > value2) {
        comparison.better.push({ stat: statName, diff: value1 - value2 });
        comparison.score1 += value1 - value2;
      } else if (value1 < value2) {
        comparison.worse.push({ stat: statName, diff: value2 - value1 });
        comparison.score2 += value2 - value1;
      } else {
        comparison.equal.push(statName);
      }
    });
        
    return comparison;
  }

  /**
     * 自动装备更好的装备
     * @param {Equipment} newEquipment - 新装备
     * @returns {boolean} 是否进行了装备
     */
  autoEquip(newEquipment) {
    const currentEquipment = this.equippedItems[newEquipment.type];
        
    if (!currentEquipment) {
      this.equipItem(newEquipment);
      return true;
    }
        
    const comparison = this.compareEquipment(newEquipment, currentEquipment);
    if (comparison && comparison.score1 > comparison.score2) {
      const oldEquipment = this.equipItem(newEquipment);
      if (oldEquipment) {
        this.addToInventory(oldEquipment);
      }
      return true;
    }
        
    return false;
  }

  /**
     * 生成随机品质
     * @returns {string} 品质名称
     */
  generateRandomQuality() {
    const rand = Math.random();
        
    if (rand < 0.5) return 'common';
    if (rand < 0.75) return 'uncommon';
    if (rand < 0.9) return 'rare';
    if (rand < 0.98) return 'epic';
    return 'legendary';
  }

  /**
     * 生成装备ID
     * @returns {string} 装备ID
     */
  generateEquipmentId() {
    return 'eq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
     * 生成装备名称
     * @param {string} type - 装备类型
     * @param {string} quality - 装备品质
     * @returns {string} 装备名称
     */
  generateEquipmentName(type, quality) {
    const prefixes = {
      common: ['普通的', '基础的', '简单的'],
      uncommon: ['优良的', '改良的', '强化的'],
      rare: ['稀有的', '精制的', '卓越的'],
      epic: ['史诗的', '传说的', '神话的'],
      legendary: ['传奇的', '至尊的', '无上的']
    };
        
    const typeNames = {
      weapon: ['剑', '刀', '枪', '弓', '法杖'],
      armor: ['护甲', '盔甲', '战甲', '法袍', '皮甲'],
      accessory: ['戒指', '项链', '护符', '徽章', '宝石']
    };
        
    const prefix = this.randomChoice(prefixes[quality]);
    const typeName = this.randomChoice(typeNames[type]);
        
    return `${prefix}${typeName}`;
  }

  /**
     * 生成装备描述
     * @param {string} type - 装备类型
     * @param {Object} stats - 装备属性
     * @param {string} quality - 装备品质
     * @returns {string} 装备描述
     */
  generateEquipmentDescription(type, stats, quality) {
    const descriptions = [];
        
    Object.keys(stats).forEach(statName => {
      const value = stats[statName];
      const statDisplayName = this.getStatDisplayName(statName);
      descriptions.push(`${statDisplayName}: +${value}`);
    });
        
    return descriptions.join('\n');
  }

  /**
     * 获取属性显示名称
     * @param {string} statName - 属性名称
     * @returns {string} 显示名称
     */
  getStatDisplayName(statName) {
    const displayNames = {
      damage: '攻击力',
      defense: '防御力',
      speed: '移动速度',
      health: '生命值',
      critRate: '暴击率',
      critDamage: '暴击伤害'
    };
        
    return displayNames[statName] || statName;
  }

  /**
     * 获取背包中的装备列表
     * @param {string} type - 装备类型过滤
     * @returns {Array} 装备列表
     */
  getInventoryItems(type = null) {
    if (type) {
      return this.inventory.filter(item => item.type === type);
    }
    return [...this.inventory];
  }

  /**
     * 获取已装备的物品
     * @returns {Object} 已装备的物品
     */
  getEquippedItems() {
    return { ...this.equippedItems };
  }

  /**
     * 清空背包
     */
  clearInventory() {
    this.inventory = [];
  }

  /**
     * 保存装备数据
     * @returns {Object} 装备数据
     */
  saveData() {
    return {
      equippedItems: this.equippedItems,
      inventory: this.inventory
    };
  }

  /**
     * 加载装备数据
     * @param {Object} data - 装备数据
     */
  loadData(data) {
    if (data.equippedItems) {
      this.equippedItems = data.equippedItems;
    }
    if (data.inventory) {
      this.inventory = data.inventory;
    }
  }

  /**
     * 工具方法：生成范围内的随机数
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {number} 随机数
     */
  randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  /**
     * 工具方法：从数组中随机选择一个元素
     * @param {Array} array - 数组
     * @returns {*} 随机元素
     */
  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
}

/**
 * 默认导出装备系统实例
 */
export const equipmentSystem = new EquipmentSystem();