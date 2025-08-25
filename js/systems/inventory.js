/**
 * Inventory System module - 背包系统逻辑
 * @module InventorySystem
 */

/**
 * @typedef {Object} Item
 * @property {string} id - 物品ID
 * @property {string} name - 物品名称
 * @property {string} type - 物品类型
 * @property {number} quantity - 数量
 * @property {number} maxStack - 最大堆叠数量
 * @property {string} quality - 物品品质
 * @property {Object} properties - 物品属性
 * @property {string} description - 物品描述
 * @property {number} value - 物品价值
 * @property {boolean} consumable - 是否可消耗
 */

/**
 * @typedef {Object} DropItem
 * @property {number} x - X坐标
 * @property {number} y - Y坐标
 * @property {string} type - 掉落物类型
 * @property {number} value - 价值
 * @property {number} createdAt - 创建时间
 * @property {boolean} collected - 是否已收集
 * @property {number} lifetime - 生存时间
 */

/**
 * 背包系统类
 */
export class InventorySystem {
  constructor() {
    this.items = new Map();
    this.maxSlots = 50;
    this.usedSlots = 0;
        
    // 掉落物管理
    this.dropItems = [];
    this.maxDropItems = 100;
    this.dropItemLifetime = 30000; // 30秒
        
    // 物品类型配置
    this.itemConfigs = {
      health_potion: {
        name: '生命药水',
        type: 'consumable',
        maxStack: 10,
        quality: 'common',
        properties: { healAmount: 50 },
        description: '恢复50点生命值',
        value: 10,
        consumable: true
      },
      mana_potion: {
        name: '魔法药水',
        type: 'consumable',
        maxStack: 10,
        quality: 'common',
        properties: { manaAmount: 30 },
        description: '恢复30点魔法值',
        value: 8,
        consumable: true
      },
      exp_gem: {
        name: '经验宝石',
        type: 'consumable',
        maxStack: 99,
        quality: 'uncommon',
        properties: { expAmount: 100 },
        description: '获得100点经验值',
        value: 5,
        consumable: true
      },
      gold_coin: {
        name: '金币',
        type: 'currency',
        maxStack: 999,
        quality: 'common',
        properties: { coinValue: 1 },
        description: '游戏货币',
        value: 1,
        consumable: false
      },
      upgrade_stone: {
        name: '强化石',
        type: 'material',
        maxStack: 20,
        quality: 'rare',
        properties: { upgradeLevel: 1 },
        description: '用于强化装备',
        value: 25,
        consumable: true
      }
    };
        
    // 掉落物配置
    this.dropConfigs = {
      health: {
        name: '生命球',
        color: '#ff4444',
        value: 20,
        effect: 'heal'
      },
      exp: {
        name: '经验球',
        color: '#44ff44',
        value: 10,
        effect: 'experience'
      },
      coin: {
        name: '金币',
        color: '#ffff44',
        value: 5,
        effect: 'currency'
      },
      equipment: {
        name: '装备',
        color: '#4444ff',
        value: 50,
        effect: 'equipment'
      }
    };
  }

  /**
     * 添加物品到背包
     * @param {string} itemType - 物品类型
     * @param {number} quantity - 数量
     * @returns {boolean} 是否成功添加
     */
  addItem(itemType, quantity = 1) {
    const config = this.itemConfigs[itemType];
    if (!config) {
      console.warn(`Unknown item type: ${itemType}`);
      return false;
    }
        
    // 检查是否已有该物品
    const existingItem = this.items.get(itemType);
    if (existingItem) {
      // 尝试堆叠
      const canStack = Math.min(quantity, config.maxStack - existingItem.quantity);
      if (canStack > 0) {
        existingItem.quantity += canStack;
        quantity -= canStack;
      }
    }
        
    // 如果还有剩余数量，创建新的物品槽
    while (quantity > 0 && this.usedSlots < this.maxSlots) {
      const stackSize = Math.min(quantity, config.maxStack);
      const newItem = {
        id: this.generateItemId(),
        ...config,
        quantity: stackSize,
        createdAt: Date.now()
      };
            
      this.items.set(newItem.id, newItem);
      this.usedSlots++;
      quantity -= stackSize;
    }
        
    return quantity === 0;
  }

  /**
     * 移除物品
     * @param {string} itemId - 物品ID或类型
     * @param {number} quantity - 数量
     * @returns {number} 实际移除的数量
     */
  removeItem(itemId, quantity = 1) {
    let item = this.items.get(itemId);
        
    // 如果通过ID找不到，尝试通过类型查找
    if (!item) {
      for (const [id, itemData] of this.items) {
        if (itemData.type === itemId) {
          item = itemData;
          itemId = id;
          break;
        }
      }
    }
        
    if (!item) {
      return 0;
    }
        
    const removedQuantity = Math.min(quantity, item.quantity);
    item.quantity -= removedQuantity;
        
    // 如果数量为0，移除物品
    if (item.quantity <= 0) {
      this.items.delete(itemId);
      this.usedSlots--;
    }
        
    return removedQuantity;
  }

  /**
     * 使用物品
     * @param {string} itemId - 物品ID
     * @param {Object} target - 使用目标
     * @returns {boolean} 是否成功使用
     */
  useItem(itemId, target = null) {
    const item = this.items.get(itemId);
    if (!item || !item.consumable) {
      return false;
    }
        
    // 执行物品效果
    const success = this.applyItemEffect(item, target);
        
    if (success) {
      this.removeItem(itemId, 1);
    }
        
    return success;
  }

  /**
     * 应用物品效果
     * @param {Item} item - 物品对象
     * @param {Object} target - 目标对象
     * @returns {boolean} 是否成功应用
     */
  applyItemEffect(item, target) {
    if (!target) {
      return false;
    }
        
    switch (item.type) {
    case 'consumable':
      return this.applyConsumableEffect(item, target);
    case 'material':
      return this.applyMaterialEffect(item, target);
    default:
      return false;
    }
  }

  /**
     * 应用消耗品效果
     * @param {Item} item - 物品对象
     * @param {Object} target - 目标对象
     * @returns {boolean} 是否成功应用
     */
  applyConsumableEffect(item, target) {
    const properties = item.properties;
        
    if (properties.healAmount && target.heal) {
      target.heal(properties.healAmount);
      return true;
    }
        
    if (properties.manaAmount && target.restoreMana) {
      target.restoreMana(properties.manaAmount);
      return true;
    }
        
    if (properties.expAmount && target.addExp) {
      target.addExp(properties.expAmount);
      return true;
    }
        
    return false;
  }

  /**
     * 应用材料效果
     * @param {Item} item - 物品对象
     * @param {Object} target - 目标对象
     * @returns {boolean} 是否成功应用
     */
  applyMaterialEffect(item, target) {
    // 材料通常用于合成或强化，这里简化处理
    console.log(`Using material: ${item.name}`);
    return true;
  }

  /**
     * 创建掉落物
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {string} type - 掉落物类型
     * @param {number} value - 价值
     * @returns {DropItem} 掉落物对象
     */
  createDropItem(x, y, type, value = null) {
    const config = this.dropConfigs[type];
    if (!config) {
      console.warn(`Unknown drop type: ${type}`);
      return null;
    }
        
    const dropItem = {
      id: this.generateItemId(),
      x,
      y,
      type,
      name: config.name,
      color: config.color,
      value: value || config.value,
      effect: config.effect,
      createdAt: Date.now(),
      collected: false,
      lifetime: this.dropItemLifetime
    };
        
    // 限制掉落物数量
    if (this.dropItems.length >= this.maxDropItems) {
      this.dropItems.shift(); // 移除最老的掉落物
    }
        
    this.dropItems.push(dropItem);
    return dropItem;
  }

  /**
     * 收集掉落物
     * @param {string} dropItemId - 掉落物ID
     * @param {Object} collector - 收集者对象
     * @returns {boolean} 是否成功收集
     */
  collectDropItem(dropItemId, collector) {
    const dropItem = this.dropItems.find(item => item.id === dropItemId);
    if (!dropItem || dropItem.collected) {
      return false;
    }
        
    // 应用掉落物效果
    const success = this.applyDropEffect(dropItem, collector);
        
    if (success) {
      dropItem.collected = true;
    }
        
    return success;
  }

  /**
     * 应用掉落物效果
     * @param {DropItem} dropItem - 掉落物对象
     * @param {Object} collector - 收集者对象
     * @returns {boolean} 是否成功应用
     */
  applyDropEffect(dropItem, collector) {
    switch (dropItem.effect) {
    case 'heal':
      if (collector.heal) {
        collector.heal(dropItem.value);
        return true;
      }
      break;
                
    case 'experience':
      if (collector.addExp) {
        collector.addExp(dropItem.value);
        return true;
      }
      break;
                
    case 'currency':
      if (collector.addCurrency) {
        collector.addCurrency(dropItem.value);
        return true;
      }
      break;
                
    case 'equipment':
      // 这里应该生成装备并添加到背包
      console.log(`Collected equipment worth ${dropItem.value}`);
      return true;
    }
        
    return false;
  }

  /**
     * 更新掉落物（清理过期的掉落物）
     * @param {number} currentTime - 当前时间
     */
  updateDropItems(currentTime = Date.now()) {
    this.dropItems = this.dropItems.filter(item => {
      const age = currentTime - item.createdAt;
      return !item.collected && age < item.lifetime;
    });
  }

  /**
     * 获取掉落物列表
     * @param {boolean} includeCollected - 是否包含已收集的
     * @returns {Array} 掉落物数组
     */
  getDropItems(includeCollected = false) {
    if (includeCollected) {
      return [...this.dropItems];
    }
    return this.dropItems.filter(item => !item.collected);
  }

  /**
     * 检查物品是否存在
     * @param {string} itemType - 物品类型
     * @param {number} quantity - 需要的数量
     * @returns {boolean} 是否有足够数量
     */
  hasItem(itemType, quantity = 1) {
    let totalQuantity = 0;
        
    for (const item of this.items.values()) {
      if (item.type === itemType) {
        totalQuantity += item.quantity;
        if (totalQuantity >= quantity) {
          return true;
        }
      }
    }
        
    return false;
  }

  /**
     * 获取物品数量
     * @param {string} itemType - 物品类型
     * @returns {number} 物品总数量
     */
  getItemQuantity(itemType) {
    let totalQuantity = 0;
        
    for (const item of this.items.values()) {
      if (item.type === itemType) {
        totalQuantity += item.quantity;
      }
    }
        
    return totalQuantity;
  }

  /**
     * 获取所有物品
     * @returns {Array} 物品数组
     */
  getAllItems() {
    return Array.from(this.items.values());
  }

  /**
     * 按类型获取物品
     * @param {string} type - 物品类型
     * @returns {Array} 物品数组
     */
  getItemsByType(type) {
    return Array.from(this.items.values()).filter(item => item.type === type);
  }

  /**
     * 获取背包使用情况
     * @returns {Object} 背包信息
     */
  getInventoryInfo() {
    return {
      usedSlots: this.usedSlots,
      maxSlots: this.maxSlots,
      freeSlots: this.maxSlots - this.usedSlots,
      utilization: (this.usedSlots / this.maxSlots) * 100
    };
  }

  /**
     * 清空背包
     */
  clearInventory() {
    this.items.clear();
    this.usedSlots = 0;
  }

  /**
     * 清空掉落物
     */
  clearDropItems() {
    this.dropItems = [];
  }

  /**
     * 生成物品ID
     * @returns {string} 物品ID
     */
  generateItemId() {
    return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
     * 计算物品价值
     * @param {Item} item - 物品对象
     * @returns {number} 总价值
     */
  calculateItemValue(item) {
    return item.value * item.quantity;
  }

  /**
     * 计算背包总价值
     * @returns {number} 总价值
     */
  calculateTotalValue() {
    let totalValue = 0;
        
    for (const item of this.items.values()) {
      totalValue += this.calculateItemValue(item);
    }
        
    return totalValue;
  }

  /**
     * 排序背包
     * @param {string} sortBy - 排序方式 ('name', 'type', 'value', 'quantity')
     * @param {boolean} ascending - 是否升序
     */
  sortInventory(sortBy = 'name', ascending = true) {
    const items = Array.from(this.items.entries());
        
    items.sort((a, b) => {
      const itemA = a[1];
      const itemB = b[1];
      let valueA, valueB;
            
      switch (sortBy) {
      case 'name':
        valueA = itemA.name;
        valueB = itemB.name;
        break;
      case 'type':
        valueA = itemA.type;
        valueB = itemB.type;
        break;
      case 'value':
        valueA = this.calculateItemValue(itemA);
        valueB = this.calculateItemValue(itemB);
        break;
      case 'quantity':
        valueA = itemA.quantity;
        valueB = itemB.quantity;
        break;
      default:
        return 0;
      }
            
      if (valueA < valueB) return ascending ? -1 : 1;
      if (valueA > valueB) return ascending ? 1 : -1;
      return 0;
    });
        
    // 重建items Map
    this.items.clear();
    items.forEach(([id, item]) => {
      this.items.set(id, item);
    });
  }

  /**
     * 保存背包数据
     * @returns {Object} 背包数据
     */
  saveData() {
    return {
      items: Array.from(this.items.entries()),
      dropItems: this.dropItems,
      usedSlots: this.usedSlots
    };
  }

  /**
     * 加载背包数据
     * @param {Object} data - 背包数据
     */
  loadData(data) {
    if (data.items) {
      this.items = new Map(data.items);
    }
    if (data.dropItems) {
      this.dropItems = data.dropItems;
    }
    if (data.usedSlots !== undefined) {
      this.usedSlots = data.usedSlots;
    }
  }
}

/**
 * 默认导出背包系统实例
 */
export const inventorySystem = new InventorySystem();