// 游戏数据分析和记录系统
class GameAnalytics {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
    this.lastDataUpload = Date.now();
    this.pendingData = [];
    this.battleEvents = [];
    this.playerEvents = [];
    this.equipmentEvents = [];
    
    // 5秒上传一次数据
    setInterval(() => this.uploadPendingData(), 5000);
  }
  
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  // 记录战斗事件
  recordBattleEvent(eventType, data) {
    const event = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      gameTime: G?.time || 0,
      playerLevel: G?.player?.lvl || 1,
      eventType: eventType,
      data: data
    };
    
    this.battleEvents.push(event);
    this.pendingData.push({
      table: 'battle_events',
      data: event
    });
  }
  
  // 记录玩家事件
  recordPlayerEvent(eventType, data) {
    const event = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      gameTime: G?.time || 0,
      playerLevel: G?.player?.lvl || 1,
      eventType: eventType,
      data: data
    };
    
    this.playerEvents.push(event);
    this.pendingData.push({
      table: 'player_events',
      data: event
    });
  }
  
  // 记录装备事件
  recordEquipmentEvent(eventType, equipment, additionalData = {}) {
    const event = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      gameTime: G?.time || 0,
      playerLevel: G?.player?.lvl || 1,
      eventType: eventType,
      equipment: {
        id: equipment.id,
        type: equipment.type,
        quality: equipment.quality,
        level: equipment.level,
        stats: equipment.stats,
        score: 0 // TODO: 实现装备评分算法
      },
      ...additionalData
    };
    
    this.equipmentEvents.push(event);
    this.pendingData.push({
      table: 'equipment_events',
      data: event
    });
  }
  
  // 记录游戏会话统计
  recordSessionStats() {
    if (typeof G === 'undefined' || !G) return;
    
    const stats = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      sessionDuration: Date.now() - this.sessionStart,
      gameTime: G.time,
      playerLevel: G.player.lvl,
      playerHP: G.player.hp,
      maxHP: G.player.maxHp,
      kills: G.kills,
      coinsEarned: G.coins,
      
      // 伤害统计
      totalDamage: G.damageStats.total,
      damageBySource: { ...G.damageStats.bySource },
      
      // 装备统计
      equippedItems: Object.keys(G.equipment).filter(slot => G.equipment[slot]).length,
      inventoryCount: G.inventory.length,
      
      // 技能统计
      ownedSkills: Object.keys(G.skills).filter(skill => G.skills[skill].owned),
      
      // 自动化状态
      autoSettings: { ...G.auto }
    };
    
    this.pendingData.push({
      table: 'session_stats',
      data: stats
    });
  }
  
  // 上传待处理数据到后端
  async uploadPendingData() {
    if (this.pendingData.length === 0) return;
    
    try {
      if (typeof fetch === 'undefined') {
        console.warn('fetch is not available in this environment');
        return;
      }
      const response = await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          data: this.pendingData.splice(0, 100) // 一次最多上传100条记录
        })
      });
      
      if (!response.ok) {
        console.warn('Analytics upload failed:', response.status);
      }
    } catch (error) {
      console.warn('Analytics upload error:', error);
      // 如果上传失败，数据已经从pendingData中移除，可以考虑重新添加或记录到本地存储
    }
  }
  
  // 记录游戏结束
  recordGameEnd(reason = 'player_quit') {
    this.recordPlayerEvent('game_end', {
      reason: reason,
      finalLevel: G?.player?.lvl || 1,
      finalScore: G?.kills || 0,
      survivalTime: G?.time || 0,
      totalDamage: G?.damageStats?.total || 0
    });
    
    this.recordSessionStats();
    this.uploadPendingData(); // 立即上传剩余数据
  }
}

// 全局分析实例
let gameAnalytics = null;

// 初始化分析系统
function initAnalytics() {
  try {
    gameAnalytics = new GameAnalytics();
    console.log('Game analytics initialized:', gameAnalytics.sessionId);
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
    gameAnalytics = null;
  }
}

// 便捷函数
function recordDamageDealt(source, amount, target) {
  if (gameAnalytics) {
    gameAnalytics.recordBattleEvent('damage_dealt', {
      source: source,
      amount: amount,
      target: target?.type || 'unknown'
    });
  }
}

function recordEnemyKilled(enemy) {
  if (gameAnalytics) {
    gameAnalytics.recordBattleEvent('enemy_killed', {
      enemyType: enemy.type,
      enemyHP: enemy.maxHp,
      enemyDefense: enemy.defense,
      playerLevel: G?.player?.lvl || 1
    });
  }
}

function recordLevelUp(newLevel, oldLevel) {
  if (gameAnalytics) {
    gameAnalytics.recordPlayerEvent('level_up', {
      newLevel: newLevel,
      oldLevel: oldLevel,
      gameTime: G?.time || 0
    });
  }
}

function recordEquipmentDropped(equipment) {
  if (gameAnalytics) {
    gameAnalytics.recordEquipmentEvent('equipment_dropped', equipment);
  }
}

function recordEquipmentEquipped(equipment, previousEquipment = null) {
  if (gameAnalytics) {
    gameAnalytics.recordEquipmentEvent('equipment_equipped', equipment, {
      previousEquipment: previousEquipment ? {
        id: previousEquipment.id,
        type: previousEquipment.type,
        quality: previousEquipment.quality,
        level: previousEquipment.level,
        score: 0 // TODO: 实现装备评分算法
      } : null
    });
  }
}

function recordSkillAcquired(skillName, skillLevel) {
  if (gameAnalytics) {
    gameAnalytics.recordPlayerEvent('skill_acquired', {
      skill: skillName,
      level: skillLevel,
      playerLevel: G?.player?.lvl || 1
    });
  }
}

// 页面关闭时记录游戏结束
window.addEventListener('beforeunload', () => {
  if (gameAnalytics) {
    gameAnalytics.recordGameEnd('page_unload');
  }
});