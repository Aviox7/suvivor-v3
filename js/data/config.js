/**
 * Game configuration module - 游戏配置模块
 * @module Config
 */

/**
 * @typedef {Object} GameConfig
 * @property {PlayerConfig} player - 玩家配置
 * @property {EnemyConfig} enemy - 敌人配置
 * @property {WeaponConfig} weapon - 武器配置
 * @property {SkillConfig} skill - 技能配置
 * @property {ItemConfig} item - 物品配置
 * @property {UIConfig} ui - 界面配置
 * @property {AudioConfig} audio - 音频配置
 * @property {GraphicsConfig} graphics - 图形配置
 * @property {GameplayConfig} gameplay - 游戏玩法配置
 */

/**
 * @typedef {Object} PlayerConfig
 * @property {number} baseHealth - 基础生命值
 * @property {number} baseMana - 基础魔法值
 * @property {number} baseSpeed - 基础移动速度
 * @property {number} baseDamage - 基础攻击力
 * @property {number} baseDefense - 基础防御力
 * @property {number} experienceMultiplier - 经验倍率
 * @property {number} levelUpHealthBonus - 升级生命值奖励
 * @property {number} levelUpManaBonus - 升级魔法值奖励
 * @property {number} invulnerabilityTime - 无敌时间
 */

/**
 * @typedef {Object} EnemyConfig
 * @property {number} spawnRate - 生成速率
 * @property {number} maxEnemies - 最大敌人数量
 * @property {number} difficultyScaling - 难度缩放
 * @property {number} healthScaling - 生命值缩放
 * @property {number} damageScaling - 伤害缩放
 * @property {number} speedScaling - 速度缩放
 * @property {number} experienceReward - 经验奖励
 */

/**
 * @typedef {Object} WeaponConfig
 * @property {number} baseDamage - 基础伤害
 * @property {number} baseFireRate - 基础射速
 * @property {number} baseRange - 基础射程
 * @property {number} baseAccuracy - 基础精度
 * @property {number} criticalChance - 暴击几率
 * @property {number} criticalMultiplier - 暴击倍率
 */

/**
 * @typedef {Object} SkillConfig
 * @property {number} maxLevel - 最大等级
 * @property {number} baseCooldown - 基础冷却时间
 * @property {number} baseDamage - 基础伤害
 * @property {number} manaCost - 魔法消耗
 * @property {number} levelScaling - 等级缩放
 */

/**
 * @typedef {Object} ItemConfig
 * @property {number} dropRate - 掉落率
 * @property {number} magnetRange - 吸引范围
 * @property {number} experienceValue - 经验值
 * @property {number} healthValue - 生命值
 * @property {number} manaValue - 魔法值
 */

/**
 * @typedef {Object} UIConfig
 * @property {boolean} showFPS - 显示FPS
 * @property {boolean} showDebugInfo - 显示调试信息
 * @property {string} theme - 主题
 * @property {number} hudOpacity - HUD透明度
 * @property {number} fontSize - 字体大小
 */

/**
 * @typedef {Object} AudioConfig
 * @property {number} masterVolume - 主音量
 * @property {number} musicVolume - 音乐音量
 * @property {number} sfxVolume - 音效音量
 * @property {boolean} muted - 是否静音
 */

/**
 * @typedef {Object} GraphicsConfig
 * @property {number} resolution - 分辨率缩放
 * @property {boolean} fullscreen - 全屏模式
 * @property {boolean} vsync - 垂直同步
 * @property {string} quality - 画质等级
 * @property {boolean} particles - 粒子效果
 * @property {boolean} shadows - 阴影效果
 */

/**
 * @typedef {Object} GameplayConfig
 * @property {number} gameSpeed - 游戏速度
 * @property {boolean} autoAim - 自动瞄准
 * @property {boolean} autoPause - 自动暂停
 * @property {number} saveInterval - 自动保存间隔
 * @property {boolean} permadeath - 永久死亡
 */

/**
 * 游戏配置管理器类
 */
export class ConfigManager {
  /**
     * 构造函数
     */
  constructor() {
    /** @type {GameConfig} */
    this.config = this.getDefaultConfig();
        
    /** @type {Map<string, Function>} */
    this.changeListeners = new Map();
        
    /** @type {string} */
    this.storageKey = 'genspark_survivor_config';
        
    /** @type {boolean} */
    this.autoSave = true;
        
    this.loadConfig();
  }

  /**
     * 获取默认配置
     * @returns {GameConfig} 默认配置
     */
  getDefaultConfig() {
    return {
      player: {
        baseHealth: 100,
        baseMana: 50,
        baseSpeed: 100,
        baseDamage: 10,
        baseDefense: 5,
        experienceMultiplier: 1.0,
        levelUpHealthBonus: 20,
        levelUpManaBonus: 10,
        invulnerabilityTime: 1000
      },
      enemy: {
        spawnRate: 1.0,
        maxEnemies: 50,
        difficultyScaling: 1.1,
        healthScaling: 1.2,
        damageScaling: 1.1,
        speedScaling: 1.05,
        experienceReward: 10
      },
      weapon: {
        baseDamage: 10,
        baseFireRate: 1.0,
        baseRange: 200,
        baseAccuracy: 0.9,
        criticalChance: 0.1,
        criticalMultiplier: 2.0
      },
      skill: {
        maxLevel: 10,
        baseCooldown: 5000,
        baseDamage: 20,
        manaCost: 10,
        levelScaling: 1.2
      },
      item: {
        dropRate: 0.3,
        magnetRange: 50,
        experienceValue: 5,
        healthValue: 20,
        manaValue: 15
      },
      ui: {
        showFPS: false,
        showDebugInfo: false,
        theme: 'default',
        hudOpacity: 0.9,
        fontSize: 14
      },
      audio: {
        masterVolume: 0.7,
        musicVolume: 0.5,
        sfxVolume: 0.8,
        muted: false
      },
      graphics: {
        resolution: 1.0,
        fullscreen: false,
        vsync: true,
        quality: 'medium',
        particles: true,
        shadows: false
      },
      gameplay: {
        gameSpeed: 1.0,
        autoAim: false,
        autoPause: true,
        saveInterval: 30000,
        permadeath: false
      }
    };
  }

  /**
     * 获取配置值
     * @param {string} path - 配置路径 (例如: 'player.baseHealth')
     * @returns {*} 配置值
     */
  get(path) {
    const keys = path.split('.');
    let value = this.config;
        
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
        
    return value;
  }

  /**
     * 设置配置值
     * @param {string} path - 配置路径
     * @param {*} value - 配置值
     */
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = this.config;
        
    // 导航到目标对象
    for (const key of keys) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key];
    }
        
    const oldValue = target[lastKey];
    target[lastKey] = value;
        
    // 触发变更监听器
    this.notifyChange(path, value, oldValue);
        
    // 自动保存
    if (this.autoSave) {
      this.saveConfig();
    }
  }

  /**
     * 获取整个配置对象
     * @returns {GameConfig} 配置对象
     */
  getAll() {
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
     * 设置整个配置对象
     * @param {Partial<GameConfig>} config - 配置对象
     */
  setAll(config) {
    const oldConfig = this.getAll();
    this.config = this.mergeConfig(this.getDefaultConfig(), config);
        
    // 触发变更监听器
    this.notifyChange('*', this.config, oldConfig);
        
    // 自动保存
    if (this.autoSave) {
      this.saveConfig();
    }
  }

  /**
     * 合并配置
     * @param {Object} target - 目标配置
     * @param {Object} source - 源配置
     * @returns {Object} 合并后的配置
     */
  mergeConfig(target, source) {
    const result = { ...target };
        
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = this.mergeConfig(target[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
        
    return result;
  }

  /**
     * 重置配置到默认值
     * @param {string} [section] - 要重置的配置节，不指定则重置全部
     */
  reset(section) {
    const defaultConfig = this.getDefaultConfig();
        
    if (section) {
      if (defaultConfig[section]) {
        const oldValue = this.config[section];
        this.config[section] = defaultConfig[section];
        this.notifyChange(section, this.config[section], oldValue);
      }
    } else {
      const oldConfig = this.getAll();
      this.config = defaultConfig;
      this.notifyChange('*', this.config, oldConfig);
    }
        
    // 自动保存
    if (this.autoSave) {
      this.saveConfig();
    }
  }

  /**
     * 添加配置变更监听器
     * @param {string} path - 监听路径 ('*' 表示监听所有变更)
     * @param {Function} callback - 回调函数
     */
  addChangeListener(path, callback) {
    if (!this.changeListeners.has(path)) {
      this.changeListeners.set(path, []);
    }
    this.changeListeners.get(path).push(callback);
  }

  /**
     * 移除配置变更监听器
     * @param {string} path - 监听路径
     * @param {Function} callback - 回调函数
     */
  removeChangeListener(path, callback) {
    const listeners = this.changeListeners.get(path);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
            
      if (listeners.length === 0) {
        this.changeListeners.delete(path);
      }
    }
  }

  /**
     * 通知配置变更
     * @param {string} path - 变更路径
     * @param {*} newValue - 新值
     * @param {*} oldValue - 旧值
     */
  notifyChange(path, newValue, oldValue) {
    // 通知具体路径的监听器
    const listeners = this.changeListeners.get(path);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(path, newValue, oldValue);
        } catch (error) {
          console.error('Error in config change listener:', error);
        }
      });
    }
        
    // 通知全局监听器
    if (path !== '*') {
      const globalListeners = this.changeListeners.get('*');
      if (globalListeners) {
        globalListeners.forEach(callback => {
          try {
            callback(path, newValue, oldValue);
          } catch (error) {
            console.error('Error in global config change listener:', error);
          }
        });
      }
    }
  }

  /**
     * 保存配置到本地存储
     */
  saveConfig() {
    try {
      const configString = JSON.stringify(this.config, null, 2);
      localStorage.setItem(this.storageKey, configString);
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  /**
     * 从本地存储加载配置
     */
  loadConfig() {
    try {
      const configString = localStorage.getItem(this.storageKey);
      if (configString) {
        const savedConfig = JSON.parse(configString);
        this.config = this.mergeConfig(this.getDefaultConfig(), savedConfig);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      this.config = this.getDefaultConfig();
    }
  }

  /**
     * 导出配置
     * @returns {string} 配置JSON字符串
     */
  exportConfig() {
    return JSON.stringify(this.config, null, 2);
  }

  /**
     * 导入配置
     * @param {string} configString - 配置JSON字符串
     * @returns {boolean} 是否成功
     */
  importConfig(configString) {
    try {
      const importedConfig = JSON.parse(configString);
      this.setAll(importedConfig);
      return true;
    } catch (error) {
      console.error('Failed to import config:', error);
      return false;
    }
  }

  /**
     * 验证配置值
     * @param {string} path - 配置路径
     * @param {*} value - 配置值
     * @returns {boolean} 是否有效
     */
  validateValue(path, value) {
    const validators = {
      'player.baseHealth': (v) => typeof v === 'number' && v > 0,
      'player.baseMana': (v) => typeof v === 'number' && v >= 0,
      'player.baseSpeed': (v) => typeof v === 'number' && v > 0,
      'player.experienceMultiplier': (v) => typeof v === 'number' && v > 0,
      'enemy.spawnRate': (v) => typeof v === 'number' && v > 0,
      'enemy.maxEnemies': (v) => typeof v === 'number' && v > 0,
      'audio.masterVolume': (v) => typeof v === 'number' && v >= 0 && v <= 1,
      'audio.musicVolume': (v) => typeof v === 'number' && v >= 0 && v <= 1,
      'audio.sfxVolume': (v) => typeof v === 'number' && v >= 0 && v <= 1,
      'graphics.resolution': (v) => typeof v === 'number' && v > 0 && v <= 2,
      'graphics.quality': (v) => ['low', 'medium', 'high', 'ultra'].includes(v),
      'ui.hudOpacity': (v) => typeof v === 'number' && v >= 0 && v <= 1,
      'ui.fontSize': (v) => typeof v === 'number' && v > 0,
      'gameplay.gameSpeed': (v) => typeof v === 'number' && v > 0 && v <= 5
    };
        
    const validator = validators[path];
    return validator ? validator(value) : true;
  }

  /**
     * 获取配置预设
     * @returns {Object} 配置预设
     */
  getPresets() {
    return {
      performance: {
        graphics: {
          quality: 'low',
          particles: false,
          shadows: false,
          resolution: 0.8
        },
        enemy: {
          maxEnemies: 30
        }
      },
      quality: {
        graphics: {
          quality: 'high',
          particles: true,
          shadows: true,
          resolution: 1.0
        },
        enemy: {
          maxEnemies: 100
        }
      },
      casual: {
        gameplay: {
          autoAim: true,
          gameSpeed: 0.8,
          permadeath: false
        },
        player: {
          experienceMultiplier: 1.5
        }
      },
      hardcore: {
        gameplay: {
          autoAim: false,
          gameSpeed: 1.2,
          permadeath: true
        },
        player: {
          experienceMultiplier: 0.8
        },
        enemy: {
          difficultyScaling: 1.3
        }
      }
    };
  }

  /**
     * 应用配置预设
     * @param {string} presetName - 预设名称
     */
  applyPreset(presetName) {
    const presets = this.getPresets();
    const preset = presets[presetName];
        
    if (preset) {
      const mergedConfig = this.mergeConfig(this.config, preset);
      this.setAll(mergedConfig);
    }
  }

  /**
     * 设置自动保存
     * @param {boolean} enabled - 是否启用
     */
  setAutoSave(enabled) {
    this.autoSave = enabled;
  }

  /**
     * 获取配置统计信息
     * @returns {Object} 统计信息
     */
  getStats() {
    const flattenConfig = (obj, prefix = '') => {
      let count = 0;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            count += flattenConfig(obj[key], prefix + key + '.');
          } else {
            count++;
          }
        }
      }
      return count;
    };
        
    return {
      totalSettings: flattenConfig(this.config),
      sections: Object.keys(this.config).length,
      listeners: this.changeListeners.size,
      autoSave: this.autoSave,
      storageKey: this.storageKey
    };
  }

  /**
     * 销毁配置管理器
     */
  destroy() {
    if (this.autoSave) {
      this.saveConfig();
    }
        
    this.changeListeners.clear();
    this.config = null;
  }
}

/**
 * 全局配置管理器实例
 */
export const gameConfig = new ConfigManager();

/**
 * 默认导出配置管理器类
 */
export default ConfigManager;