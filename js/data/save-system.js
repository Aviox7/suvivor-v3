/**
 * Game save system module - 游戏存档系统模块
 * @module SaveSystem
 */

import { VERSION, STORAGE, ERROR_CODES } from './constants.js';
import { Helpers } from '../utils/helpers.js';

/**
 * @typedef {Object} SaveData
 * @property {string} version - 存档版本
 * @property {number} timestamp - 保存时间戳
 * @property {PlayerSaveData} player - 玩家数据
 * @property {GameSaveData} game - 游戏数据
 * @property {ProgressSaveData} progress - 进度数据
 * @property {SettingsSaveData} settings - 设置数据
 * @property {StatisticsSaveData} statistics - 统计数据
 * @property {AchievementsSaveData} achievements - 成就数据
 */

/**
 * @typedef {Object} PlayerSaveData
 * @property {number} level - 等级
 * @property {number} experience - 经验值
 * @property {number} health - 生命值
 * @property {number} mana - 魔法值
 * @property {number} score - 分数
 * @property {Array<string>} skills - 技能列表
 * @property {Array<Object>} equipment - 装备列表
 * @property {Array<Object>} inventory - 物品栏
 * @property {Object} stats - 属性统计
 */

/**
 * @typedef {Object} GameSaveData
 * @property {string} state - 游戏状态
 * @property {number} time - 游戏时间
 * @property {number} wave - 当前波数
 * @property {number} difficulty - 难度等级
 * @property {Array<Object>} enemies - 敌人列表
 * @property {Array<Object>} projectiles - 弹药列表
 * @property {Array<Object>} items - 物品列表
 * @property {Object} world - 世界状态
 */

/**
 * @typedef {Object} ProgressSaveData
 * @property {Array<string>} unlockedSkills - 已解锁技能
 * @property {Array<string>} unlockedWeapons - 已解锁武器
 * @property {Array<string>} unlockedAchievements - 已解锁成就
 * @property {number} highestLevel - 最高等级
 * @property {number} highestScore - 最高分数
 * @property {number} totalPlayTime - 总游戏时间
 */

/**
 * @typedef {Object} SettingsSaveData
 * @property {Object} graphics - 图形设置
 * @property {Object} audio - 音频设置
 * @property {Object} controls - 控制设置
 * @property {Object} gameplay - 游戏设置
 */

/**
 * @typedef {Object} StatisticsSaveData
 * @property {number} gamesPlayed - 游戏次数
 * @property {number} totalKills - 总击杀数
 * @property {number} totalDeaths - 总死亡数
 * @property {number} totalTime - 总时间
 * @property {number} itemsCollected - 收集物品数
 * @property {number} distanceTraveled - 移动距离
 * @property {Object} weaponStats - 武器统计
 * @property {Object} skillStats - 技能统计
 */

/**
 * @typedef {Object} AchievementsSaveData
 * @property {Array<Object>} unlocked - 已解锁成就
 * @property {Array<Object>} progress - 成就进度
 * @property {number} totalPoints - 总成就点数
 */

/**
 * 存档槽信息
 * @typedef {Object} SaveSlot
 * @property {number} id - 槽位ID
 * @property {string} name - 存档名称
 * @property {number} timestamp - 保存时间
 * @property {number} playTime - 游戏时间
 * @property {number} level - 玩家等级
 * @property {number} score - 分数
 * @property {string} preview - 预览图片
 * @property {boolean} exists - 是否存在
 */

/**
 * 游戏存档系统类
 */
export class SaveSystem {
  /**
     * 构造函数
     */
  constructor() {
    /** @type {number} */
    this.maxSlots = 10;
        
    /** @type {number} */
    this.currentSlot = 0;
        
    /** @type {boolean} */
    this.autoSaveEnabled = true;
        
    /** @type {number} */
    this.autoSaveInterval = 30000; // 30秒
        
    /** @type {number} */
    this.autoSaveTimer = null;
        
    /** @type {Map<string, Function>} */
    this.eventListeners = new Map();
        
    /** @type {boolean} */
    this.compressionEnabled = true;
        
    /** @type {boolean} */
    this.encryptionEnabled = false;
        
    /** @type {string} */
    this.encryptionKey = 'genspark_survivor_key';
        
    this.initializeAutoSave();
  }

  /**
     * 初始化自动保存
     */
  initializeAutoSave() {
    if (this.autoSaveEnabled) {
      this.autoSaveTimer = setInterval(() => {
        this.autoSave();
      }, this.autoSaveInterval);
    }
  }

  /**
     * 保存游戏数据
     * @param {SaveData} data - 要保存的数据
     * @param {number} [slot=0] - 存档槽位
     * @returns {Promise<boolean>} 是否保存成功
     */
  async saveGame(data, slot = this.currentSlot) {
    try {
      // 验证数据
      if (!this.validateSaveData(data)) {
        throw new Error('Invalid save data');
      }
            
      // 添加元数据
      const saveData = {
        ...data,
        version: VERSION.STRING,
        timestamp: Date.now(),
        slot
      };
            
      // 处理数据（压缩、加密等）
      let processedData = JSON.stringify(saveData);
            
      if (this.compressionEnabled) {
        processedData = this.compressData(processedData);
      }
            
      if (this.encryptionEnabled) {
        processedData = this.encryptData(processedData);
      }
            
      // 保存到本地存储
      const key = this.getSlotKey(slot);
      localStorage.setItem(key, processedData);
            
      // 更新槽位信息
      this.updateSlotInfo(slot, saveData);
            
      // 触发事件
      this.emit('save', { slot, data: saveData });
            
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      this.emit('error', { type: 'save', error });
      return false;
    }
  }

  /**
     * 加载游戏数据
     * @param {number} [slot=0] - 存档槽位
     * @returns {Promise<SaveData|null>} 加载的数据
     */
  async loadGame(slot = this.currentSlot) {
    try {
      const key = this.getSlotKey(slot);
      let data = localStorage.getItem(key);
            
      if (!data) {
        return null;
      }
            
      // 处理数据（解密、解压缩等）
      if (this.encryptionEnabled) {
        data = this.decryptData(data);
      }
            
      if (this.compressionEnabled) {
        data = this.decompressData(data);
      }
            
      const saveData = JSON.parse(data);
            
      // 验证数据
      if (!this.validateSaveData(saveData)) {
        throw new Error('Invalid save data format');
      }
            
      // 版本兼容性检查
      if (saveData.version !== VERSION.STRING) {
        saveData = this.migrateSaveData(saveData);
      }
            
      // 触发事件
      this.emit('load', { slot, data: saveData });
            
      return saveData;
    } catch (error) {
      console.error('Failed to load game:', error);
      this.emit('error', { type: 'load', error });
      return null;
    }
  }

  /**
     * 删除存档
     * @param {number} slot - 存档槽位
     * @returns {boolean} 是否删除成功
     */
  deleteSave(slot) {
    try {
      const key = this.getSlotKey(slot);
      localStorage.removeItem(key);
            
      // 更新槽位信息
      this.updateSlotInfo(slot, null);
            
      // 触发事件
      this.emit('delete', { slot });
            
      return true;
    } catch (error) {
      console.error('Failed to delete save:', error);
      this.emit('error', { type: 'delete', error });
      return false;
    }
  }

  /**
     * 获取所有存档槽位信息
     * @returns {Array<SaveSlot>} 存档槽位列表
     */
  getSaveSlots() {
    const slots = [];
        
    for (let i = 0; i < this.maxSlots; i++) {
      const slotInfo = this.getSlotInfo(i);
      slots.push(slotInfo);
    }
        
    return slots;
  }

  /**
     * 获取存档槽位信息
     * @param {number} slot - 存档槽位
     * @returns {SaveSlot} 存档槽位信息
     */
  getSlotInfo(slot) {
    const key = this.getSlotKey(slot);
    const data = localStorage.getItem(key);
        
    if (!data) {
      return {
        id: slot,
        name: `存档 ${slot + 1}`,
        timestamp: 0,
        playTime: 0,
        level: 0,
        score: 0,
        preview: null,
        exists: false
      };
    }
        
    try {
      // 解析基本信息（不完全加载）
      let processedData = data;
            
      if (this.encryptionEnabled) {
        processedData = this.decryptData(processedData);
      }
            
      if (this.compressionEnabled) {
        processedData = this.decompressData(processedData);
      }
            
      const saveData = JSON.parse(processedData);
            
      return {
        id: slot,
        name: saveData.name || `存档 ${slot + 1}`,
        timestamp: saveData.timestamp || 0,
        playTime: saveData.game?.time || 0,
        level: saveData.player?.level || 0,
        score: saveData.player?.score || 0,
        preview: saveData.preview || null,
        exists: true
      };
    } catch (error) {
      console.error('Failed to get slot info:', error);
      return {
        id: slot,
        name: `存档 ${slot + 1} (损坏)`,
        timestamp: 0,
        playTime: 0,
        level: 0,
        score: 0,
        preview: null,
        exists: false
      };
    }
  }

  /**
     * 更新存档槽位信息
     * @param {number} slot - 存档槽位
     * @param {SaveData|null} data - 存档数据
     */
  updateSlotInfo(slot, data) {
    const infoKey = `${STORAGE.GAME_DATA}_slot_info`;
    let slotsInfo = {};
        
    try {
      const stored = localStorage.getItem(infoKey);
      if (stored) {
        slotsInfo = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load slots info:', error);
    }
        
    if (data) {
      slotsInfo[slot] = {
        timestamp: data.timestamp,
        playTime: data.game?.time || 0,
        level: data.player?.level || 0,
        score: data.player?.score || 0,
        name: data.name || `存档 ${slot + 1}`
      };
    } else {
      delete slotsInfo[slot];
    }
        
    try {
      localStorage.setItem(infoKey, JSON.stringify(slotsInfo));
    } catch (error) {
      console.error('Failed to save slots info:', error);
    }
  }

  /**
     * 自动保存
     */
  async autoSave() {
    if (!this.autoSaveEnabled) {
      return;
    }
        
    try {
      // 获取当前游戏数据
      const gameData = this.getCurrentGameData();
      if (gameData) {
        await this.saveGame(gameData, this.currentSlot);
        this.emit('autosave', { slot: this.currentSlot });
      }
    } catch (error) {
      console.error('Auto save failed:', error);
    }
  }

  /**
     * 获取当前游戏数据（需要由游戏主循环提供）
     * @returns {SaveData|null} 当前游戏数据
     */
  getCurrentGameData() {
    // 这个方法需要由游戏主循环实现
    // 这里返回null作为占位符
    return null;
  }

  /**
     * 导出存档
     * @param {number} slot - 存档槽位
     * @returns {string|null} 导出的存档字符串
     */
  exportSave(slot) {
    try {
      const key = this.getSlotKey(slot);
      const data = localStorage.getItem(key);
            
      if (!data) {
        return null;
      }
            
      // 创建导出数据
      const exportData = {
        version: VERSION.STRING,
        exportTime: Date.now(),
        slot,
        data,
        compressed: this.compressionEnabled,
        encrypted: this.encryptionEnabled
      };
            
      const jsonString = JSON.stringify(exportData);
      if (typeof btoa !== 'undefined') {
        return btoa(jsonString);
      } else if (typeof Buffer !== 'undefined') {
        return Buffer.from(jsonString, 'utf8').toString('base64');
      } else {
        return jsonString; // 降级处理
      }
    } catch (error) {
      console.error('Failed to export save:', error);
      return null;
    }
  }

  /**
     * 导入存档
     * @param {string} exportString - 导出的存档字符串
     * @param {number} slot - 目标存档槽位
     * @returns {boolean} 是否导入成功
     */
  importSave(exportString, slot) {
    try {
      let decodedString;
      if (typeof atob !== 'undefined') {
        decodedString = atob(exportString);
      } else if (typeof Buffer !== 'undefined') {
        decodedString = Buffer.from(exportString, 'base64').toString('utf8');
      } else {
        decodedString = exportString; // 降级处理
      }
      const exportData = JSON.parse(decodedString);
            
      // 验证导出数据
      if (!exportData.data || !exportData.version) {
        throw new Error('Invalid export data');
      }
            
      // 版本兼容性检查
      if (exportData.version !== VERSION.STRING) {
        console.warn('Import data version mismatch');
      }
            
      // 保存导入的数据
      const key = this.getSlotKey(slot);
      localStorage.setItem(key, exportData.data);
            
      // 更新槽位信息
      const saveData = this.loadGame(slot);
      if (saveData) {
        this.updateSlotInfo(slot, saveData);
      }
            
      // 触发事件
      this.emit('import', { slot, data: exportData });
            
      return true;
    } catch (error) {
      console.error('Failed to import save:', error);
      this.emit('error', { type: 'import', error });
      return false;
    }
  }

  /**
     * 验证存档数据
     * @param {SaveData} data - 存档数据
     * @returns {boolean} 是否有效
     */
  validateSaveData(data) {
    if (!data || typeof data !== 'object') {
      return false;
    }
        
    // 检查必需字段
    const requiredFields = ['player', 'game', 'progress'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return false;
      }
    }
        
    // 检查玩家数据
    if (!data.player.level || !data.player.experience) {
      return false;
    }
        
    // 检查游戏数据
    if (!data.game.state || data.game.time === undefined) {
      return false;
    }
        
    return true;
  }

  /**
     * 迁移存档数据（版本兼容性）
     * @param {SaveData} data - 旧版本存档数据
     * @returns {SaveData} 迁移后的存档数据
     */
  migrateSaveData(data) {
    // 根据版本进行数据迁移
    const currentVersion = VERSION.STRING;
    const dataVersion = data.version || '1.0.0';
        
    console.log(`Migrating save data from ${dataVersion} to ${currentVersion}`);
        
    // 这里可以添加具体的迁移逻辑
    // 例如：添加新字段、重命名字段、转换数据格式等
        
    // 更新版本号
    data.version = currentVersion;
        
    return data;
  }

  /**
     * 压缩数据
     * @param {string} data - 原始数据
     * @returns {string} 压缩后的数据
     */
  compressData(data) {
    // 简单的压缩实现（实际项目中可以使用更好的压缩算法）
    try {
      if (typeof btoa !== 'undefined') {
        return btoa(data);
      } else if (typeof Buffer !== 'undefined') {
        return Buffer.from(data, 'utf8').toString('base64');
      } else {
        return data; // 降级处理
      }
    } catch (error) {
      console.error('Compression failed:', error);
      return data;
    }
  }

  /**
     * 解压缩数据
     * @param {string} data - 压缩的数据
     * @returns {string} 解压缩后的数据
     */
  decompressData(data) {
    try {
      if (typeof atob !== 'undefined') {
        return atob(data);
      } else if (typeof Buffer !== 'undefined') {
        return Buffer.from(data, 'base64').toString('utf8');
      } else {
        return data; // 降级处理
      }
    } catch (error) {
      console.error('Decompression failed:', error);
      return data;
    }
  }

  /**
     * 加密数据
     * @param {string} data - 原始数据
     * @returns {string} 加密后的数据
     */
  encryptData(data) {
    // 简单的加密实现（实际项目中应使用更安全的加密算法）
    try {
      let encrypted = '';
      for (let i = 0; i < data.length; i++) {
        encrypted += String.fromCharCode(
          data.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length)
        );
      }
      if (typeof btoa !== 'undefined') {
        return btoa(encrypted);
      } else if (typeof Buffer !== 'undefined') {
        return Buffer.from(encrypted, 'utf8').toString('base64');
      } else {
        return encrypted; // 降级处理
      }
    } catch (error) {
      console.error('Encryption failed:', error);
      return data;
    }
  }

  /**
     * 解密数据
     * @param {string} data - 加密的数据
     * @returns {string} 解密后的数据
     */
  decryptData(data) {
    try {
      let encrypted;
      if (typeof atob !== 'undefined') {
        encrypted = atob(data);
      } else if (typeof Buffer !== 'undefined') {
        encrypted = Buffer.from(data, 'base64').toString('utf8');
      } else {
        encrypted = data; // 降级处理
      }
      let decrypted = '';
      for (let i = 0; i < encrypted.length; i++) {
        decrypted += String.fromCharCode(
          encrypted.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length)
        );
      }
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return data;
    }
  }

  /**
     * 获取存档槽位键名
     * @param {number} slot - 存档槽位
     * @returns {string} 键名
     */
  getSlotKey(slot) {
    return `${STORAGE.GAME_DATA}_slot_${slot}`;
  }

  /**
     * 设置当前存档槽位
     * @param {number} slot - 存档槽位
     */
  setCurrentSlot(slot) {
    if (slot >= 0 && slot < this.maxSlots) {
      this.currentSlot = slot;
    }
  }

  /**
     * 设置自动保存
     * @param {boolean} enabled - 是否启用
     * @param {number} [interval] - 保存间隔（毫秒）
     */
  setAutoSave(enabled, interval) {
    this.autoSaveEnabled = enabled;
        
    if (interval) {
      this.autoSaveInterval = interval;
    }
        
    // 重新初始化自动保存
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
        
    if (enabled) {
      this.initializeAutoSave();
    }
  }

  /**
     * 清理存储空间
     */
  cleanup() {
    try {
      // 清理过期的临时数据
      const keys = Object.keys(localStorage);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
            
      for (const key of keys) {
        if (key.startsWith(STORAGE.GAME_DATA)) {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const parsed = JSON.parse(data);
              if (parsed.timestamp && (now - parsed.timestamp) > maxAge) {
                localStorage.removeItem(key);
              }
            }
          } catch (error) {
            // 如果解析失败，可能是损坏的数据，删除它
            localStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  /**
     * 获取存储使用情况
     * @returns {Object} 存储统计信息
     */
  getStorageStats() {
    let totalSize = 0;
    let gameDataSize = 0;
    let slotCount = 0;
        
    try {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          const value = localStorage.getItem(key);
          const size = typeof Blob !== 'undefined' ? new Blob([value]).size : Buffer.byteLength(value, 'utf8');
          totalSize += size;
                    
          if (key.startsWith(STORAGE.GAME_DATA)) {
            gameDataSize += size;
            if (key.includes('_slot_')) {
              slotCount++;
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to get storage stats:', error);
    }
        
    return {
      totalSize,
      gameDataSize,
      slotCount,
      maxSlots: this.maxSlots,
      compressionEnabled: this.compressionEnabled,
      encryptionEnabled: this.encryptionEnabled
    };
  }

  /**
     * 添加事件监听器
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
     * 移除事件监听器
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
  off(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
     * 触发事件
     * @param {string} event - 事件名称
     * @param {*} data - 事件数据
     */
  emit(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Event listener error:', error);
        }
      });
    }
  }

  /**
     * 销毁存档系统
     */
  destroy() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
        
    this.eventListeners.clear();
  }
}

/**
 * 全局存档系统实例
 */
export const saveSystem = new SaveSystem();

/**
 * 默认导出存档系统类
 */
export default SaveSystem;