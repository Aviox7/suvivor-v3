/**
 * Skills System module - 技能系统逻辑
 * @module SkillsSystem
 */

/**
 * @typedef {Object} Skill
 * @property {string} id - 技能ID
 * @property {string} name - 技能名称
 * @property {string} description - 技能描述
 * @property {number} level - 技能等级
 * @property {number} maxLevel - 最大等级
 * @property {string} type - 技能类型
 * @property {Object} stats - 技能属性
 * @property {number} cooldown - 冷却时间
 * @property {number} lastUsed - 上次使用时间
 * @property {boolean} isActive - 是否激活
 */

/**
 * @typedef {Object} SkillStats
 * @property {number} damage - 伤害统计
 * @property {number} kills - 击杀数
 * @property {number} hits - 命中次数
 * @property {number} critHits - 暴击次数
 * @property {number} totalDamage - 总伤害
 * @property {number} damageRatio - 伤害占比
 */

/**
 * 技能系统类
 */
export class SkillsSystem {
  constructor() {
    this.skills = new Map();
    this.activeSkills = [];
    this.skillStats = new Map();
    this.globalCooldownReduction = 0;
        
    // 初始化技能配置
    this.initializeSkillConfigs();
  }

  /**
     * 初始化技能配置
     */
  initializeSkillConfigs() {
    this.skillConfigs = {
      // 主武器技能
      mainWeapon: {
        id: 'mainWeapon',
        name: '主武器',
        description: '基础攻击武器',
        type: 'weapon',
        maxLevel: 10,
        baseStats: {
          damage: 10,
          attackSpeed: 1.0,
          range: 100,
          critRate: 0.05
        },
        levelMultiplier: 1.2
      },
            
      // 副武器技能
      subWeapon: {
        id: 'subWeapon',
        name: '副武器',
        description: '辅助攻击武器',
        type: 'weapon',
        maxLevel: 8,
        baseStats: {
          damage: 8,
          attackSpeed: 1.5,
          range: 80,
          critRate: 0.08
        },
        levelMultiplier: 1.15
      },
            
      // 被动技能
      healthBoost: {
        id: 'healthBoost',
        name: '生命强化',
        description: '增加最大生命值',
        type: 'passive',
        maxLevel: 5,
        baseStats: {
          healthMultiplier: 1.2
        },
        levelMultiplier: 1.1
      },
            
      speedBoost: {
        id: 'speedBoost',
        name: '速度强化',
        description: '增加移动速度',
        type: 'passive',
        maxLevel: 5,
        baseStats: {
          speedMultiplier: 1.15
        },
        levelMultiplier: 1.08
      },
            
      damageBoost: {
        id: 'damageBoost',
        name: '伤害强化',
        description: '增加攻击伤害',
        type: 'passive',
        maxLevel: 5,
        baseStats: {
          damageMultiplier: 1.25
        },
        levelMultiplier: 1.12
      },
            
      // 主动技能
      fireball: {
        id: 'fireball',
        name: '火球术',
        description: '发射火球攻击敌人',
        type: 'active',
        maxLevel: 8,
        cooldown: 3000,
        baseStats: {
          damage: 25,
          range: 150,
          speed: 200
        },
        levelMultiplier: 1.3
      },
            
      lightning: {
        id: 'lightning',
        name: '闪电链',
        description: '释放闪电攻击多个敌人',
        type: 'active',
        maxLevel: 6,
        cooldown: 4000,
        baseStats: {
          damage: 20,
          chainCount: 3,
          range: 120
        },
        levelMultiplier: 1.25
      }
    };
  }

  /**
     * 学习技能
     * @param {string} skillId - 技能ID
     * @returns {boolean} 是否成功学习
     */
  learnSkill(skillId) {
    const config = this.skillConfigs[skillId];
    if (!config) {
      console.warn(`Unknown skill: ${skillId}`);
      return false;
    }
        
    if (this.skills.has(skillId)) {
      console.warn(`Skill already learned: ${skillId}`);
      return false;
    }
        
    const skill = {
      ...config,
      level: 1,
      stats: { ...config.baseStats },
      lastUsed: 0,
      isActive: config.type === 'passive'
    };
        
    this.skills.set(skillId, skill);
        
    // 初始化技能统计
    this.skillStats.set(skillId, {
      damage: 0,
      kills: 0,
      hits: 0,
      critHits: 0,
      totalDamage: 0,
      damageRatio: 0
    });
        
    // 如果是被动技能，立即激活
    if (skill.type === 'passive') {
      this.activateSkill(skillId);
    }
        
    return true;
  }

  /**
     * 升级技能
     * @param {string} skillId - 技能ID
     * @returns {boolean} 是否成功升级
     */
  upgradeSkill(skillId) {
    const skill = this.skills.get(skillId);
    if (!skill) {
      console.warn(`Skill not found: ${skillId}`);
      return false;
    }
        
    if (skill.level >= skill.maxLevel) {
      console.warn(`Skill already at max level: ${skillId}`);
      return false;
    }
        
    skill.level++;
        
    // 更新技能属性
    const config = this.skillConfigs[skillId];
    Object.keys(config.baseStats).forEach(statName => {
      const baseValue = config.baseStats[statName];
      skill.stats[statName] = baseValue * Math.pow(config.levelMultiplier, skill.level - 1);
    });
        
    return true;
  }

  /**
     * 激活技能
     * @param {string} skillId - 技能ID
     * @returns {boolean} 是否成功激活
     */
  activateSkill(skillId) {
    const skill = this.skills.get(skillId);
    if (!skill) {
      return false;
    }
        
    if (!this.activeSkills.includes(skillId)) {
      this.activeSkills.push(skillId);
      skill.isActive = true;
    }
        
    return true;
  }

  /**
     * 停用技能
     * @param {string} skillId - 技能ID
     * @returns {boolean} 是否成功停用
     */
  deactivateSkill(skillId) {
    const skill = this.skills.get(skillId);
    if (!skill) {
      return false;
    }
        
    const index = this.activeSkills.indexOf(skillId);
    if (index !== -1) {
      this.activeSkills.splice(index, 1);
      skill.isActive = false;
    }
        
    return true;
  }

  /**
     * 使用技能
     * @param {string} skillId - 技能ID
     * @param {Object} target - 目标对象
     * @returns {boolean} 是否成功使用
     */
  useSkill(skillId, target = null) {
    const skill = this.skills.get(skillId);
    if (!skill) {
      return false;
    }
        
    const currentTime = Date.now();
    const cooldown = skill.cooldown || 0;
    const adjustedCooldown = cooldown * (1 - this.globalCooldownReduction);
        
    // 检查冷却时间
    if (currentTime - skill.lastUsed < adjustedCooldown) {
      return false;
    }
        
    skill.lastUsed = currentTime;
        
    // 根据技能类型执行不同逻辑
    switch (skill.type) {
    case 'active':
      return this.executeActiveSkill(skill, target);
    case 'weapon':
      return this.executeWeaponSkill(skill, target);
    default:
      return true;
    }
  }

  /**
     * 执行主动技能
     * @param {Skill} skill - 技能对象
     * @param {Object} target - 目标对象
     * @returns {boolean} 是否成功执行
     */
  executeActiveSkill(skill, target) {
    switch (skill.id) {
    case 'fireball':
      return this.castFireball(skill, target);
    case 'lightning':
      return this.castLightning(skill, target);
    default:
      return false;
    }
  }

  /**
     * 执行武器技能
     * @param {Skill} skill - 技能对象
     * @param {Object} target - 目标对象
     * @returns {boolean} 是否成功执行
     */
  executeWeaponSkill(skill, target) {
    if (!target) {
      return false;
    }
        
    const damage = this.calculateSkillDamage(skill);
    const isCrit = Math.random() < (skill.stats.critRate || 0);
    const finalDamage = isCrit ? damage * 2 : damage;
        
    // 记录统计数据
    this.recordSkillHit(skill.id, finalDamage, isCrit);
        
    // 应用伤害
    if (target.takeDamage) {
      const killed = target.takeDamage(finalDamage);
      if (killed) {
        this.recordSkillKill(skill.id);
      }
    }
        
    return true;
  }

  /**
     * 释放火球术
     * @param {Skill} skill - 技能对象
     * @param {Object} target - 目标对象
     * @returns {boolean} 是否成功释放
     */
  castFireball(skill, target) {
    // 这里应该创建火球投射物
    // 实际实现需要与投射物系统集成
    console.log(`Casting fireball with damage: ${skill.stats.damage}`);
    return true;
  }

  /**
     * 释放闪电链
     * @param {Skill} skill - 技能对象
     * @param {Object} target - 目标对象
     * @returns {boolean} 是否成功释放
     */
  castLightning(skill, target) {
    // 这里应该创建闪电效果
    // 实际实现需要与特效系统集成
    console.log(`Casting lightning with damage: ${skill.stats.damage}`);
    return true;
  }

  /**
     * 计算技能伤害
     * @param {Skill} skill - 技能对象
     * @returns {number} 伤害值
     */
  calculateSkillDamage(skill) {
    const baseDamage = skill.stats.damage || 0;
    // 这里可以添加更多的伤害计算逻辑
    return baseDamage;
  }

  /**
     * 记录技能命中
     * @param {string} skillId - 技能ID
     * @param {number} damage - 伤害值
     * @param {boolean} isCrit - 是否暴击
     */
  recordSkillHit(skillId, damage, isCrit = false) {
    const stats = this.skillStats.get(skillId);
    if (stats) {
      stats.hits++;
      stats.totalDamage += damage;
      if (isCrit) {
        stats.critHits++;
      }
    }
  }

  /**
     * 记录技能击杀
     * @param {string} skillId - 技能ID
     */
  recordSkillKill(skillId) {
    const stats = this.skillStats.get(skillId);
    if (stats) {
      stats.kills++;
    }
  }

  /**
     * 更新技能伤害占比
     * @param {number} totalGameDamage - 游戏总伤害
     */
  updateDamageRatios(totalGameDamage) {
    if (totalGameDamage <= 0) return;
        
    this.skillStats.forEach((stats, skillId) => {
      stats.damageRatio = (stats.totalDamage / totalGameDamage) * 100;
    });
  }

  /**
     * 获取技能信息
     * @param {string} skillId - 技能ID
     * @returns {Skill|null} 技能对象
     */
  getSkill(skillId) {
    return this.skills.get(skillId) || null;
  }

  /**
     * 获取所有技能
     * @returns {Array} 技能数组
     */
  getAllSkills() {
    return Array.from(this.skills.values());
  }

  /**
     * 获取激活的技能
     * @returns {Array} 激活技能数组
     */
  getActiveSkills() {
    return this.activeSkills.map(skillId => this.skills.get(skillId)).filter(Boolean);
  }

  /**
     * 获取技能统计
     * @param {string} skillId - 技能ID
     * @returns {SkillStats|null} 技能统计
     */
  getSkillStats(skillId) {
    return this.skillStats.get(skillId) || null;
  }

  /**
     * 获取所有技能统计
     * @returns {Map} 技能统计映射
     */
  getAllSkillStats() {
    return new Map(this.skillStats);
  }

  /**
     * 获取技能显示名称
     * @param {string} skillId - 技能ID
     * @returns {string} 显示名称
     */
  getSkillDisplayName(skillId) {
    const skill = this.skills.get(skillId);
    return skill ? skill.name : skillId;
  }

  /**
     * 获取技能描述
     * @param {string} skillId - 技能ID
     * @returns {string} 技能描述
     */
  getSkillDescription(skillId) {
    const skill = this.skills.get(skillId);
    if (!skill) return '';
        
    let description = skill.description;
        
    // 添加当前等级的属性信息
    if (skill.stats) {
      description += `\n等级 ${skill.level}/${skill.maxLevel}`;
      Object.keys(skill.stats).forEach(statName => {
        const value = skill.stats[statName];
        description += `\n${this.getStatDisplayName(statName)}: ${value}`;
      });
    }
        
    return description;
  }

  /**
     * 获取属性显示名称
     * @param {string} statName - 属性名称
     * @returns {string} 显示名称
     */
  getStatDisplayName(statName) {
    const displayNames = {
      damage: '伤害',
      attackSpeed: '攻击速度',
      range: '射程',
      critRate: '暴击率',
      healthMultiplier: '生命倍率',
      speedMultiplier: '速度倍率',
      damageMultiplier: '伤害倍率',
      chainCount: '连锁数量',
      speed: '速度'
    };
        
    return displayNames[statName] || statName;
  }

  /**
     * 计算实时DPS
     * @param {string} skillId - 技能ID
     * @param {number} timeWindow - 时间窗口（毫秒）
     * @returns {number} DPS值
     */
  calculateRealTimeDPS(skillId, timeWindow = 10000) {
    const stats = this.skillStats.get(skillId);
    if (!stats) return 0;
        
    // 这里需要更复杂的实现来跟踪时间窗口内的伤害
    // 简化版本：使用总伤害除以游戏时间
    const gameTime = Date.now() - (this.gameStartTime || Date.now());
    if (gameTime <= 0) return 0;
        
    return (stats.totalDamage / gameTime) * 1000; // 转换为每秒伤害
  }

  /**
     * 重置技能统计
     */
  resetStats() {
    this.skillStats.forEach(stats => {
      stats.damage = 0;
      stats.kills = 0;
      stats.hits = 0;
      stats.critHits = 0;
      stats.totalDamage = 0;
      stats.damageRatio = 0;
    });
    this.gameStartTime = Date.now();
  }

  /**
     * 保存技能数据
     * @returns {Object} 技能数据
     */
  saveData() {
    return {
      skills: Array.from(this.skills.entries()),
      activeSkills: this.activeSkills,
      skillStats: Array.from(this.skillStats.entries()),
      globalCooldownReduction: this.globalCooldownReduction
    };
  }

  /**
     * 加载技能数据
     * @param {Object} data - 技能数据
     */
  loadData(data) {
    if (data.skills) {
      this.skills = new Map(data.skills);
    }
    if (data.activeSkills) {
      this.activeSkills = data.activeSkills;
    }
    if (data.skillStats) {
      this.skillStats = new Map(data.skillStats);
    }
    if (data.globalCooldownReduction !== undefined) {
      this.globalCooldownReduction = data.globalCooldownReduction;
    }
  }
}

/**
 * 默认导出技能系统实例
 */
export const skillsSystem = new SkillsSystem();