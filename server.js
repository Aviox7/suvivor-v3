const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // 提供静态文件服务

// 初始化数据库
const db = new sqlite3.Database('game_analytics.db');

// 创建数据表
db.serialize(() => {
  // 战斗事件表
  db.run(`CREATE TABLE IF NOT EXISTS battle_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    game_time REAL NOT NULL,
    player_level INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 玩家事件表
  db.run(`CREATE TABLE IF NOT EXISTS player_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    game_time REAL NOT NULL,
    player_level INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 装备事件表
  db.run(`CREATE TABLE IF NOT EXISTS equipment_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    game_time REAL NOT NULL,
    player_level INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    equipment_id TEXT NOT NULL,
    equipment_type TEXT NOT NULL,
    equipment_quality TEXT NOT NULL,
    equipment_level INTEGER NOT NULL,
    equipment_score REAL NOT NULL,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 会话统计表
  db.run(`CREATE TABLE IF NOT EXISTS session_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    session_duration INTEGER NOT NULL,
    game_time REAL NOT NULL,
    player_level INTEGER NOT NULL,
    player_hp REAL NOT NULL,
    max_hp REAL NOT NULL,
    kills INTEGER NOT NULL,
    coins_earned INTEGER NOT NULL,
    total_damage REAL NOT NULL,
    damage_by_source TEXT NOT NULL,
    equipped_items INTEGER NOT NULL,
    inventory_count INTEGER NOT NULL,
    owned_skills TEXT NOT NULL,
    auto_settings TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 创建索引以提高查询性能
  db.run(`CREATE INDEX IF NOT EXISTS idx_battle_events_session ON battle_events(session_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_battle_events_timestamp ON battle_events(timestamp)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_player_events_session ON player_events(session_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_equipment_events_session ON equipment_events(session_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_session_stats_session ON session_stats(session_id)`);
  
  console.log('Database tables created/verified');
});

// API路由

// 批量插入数据
app.post('/api/analytics/batch', (req, res) => {
  const { sessionId, data } = req.body;
  
  if (!sessionId || !data || !Array.isArray(data)) {
    return res.status(400).json({ error: 'Invalid request format' });
  }

  if (data.length === 0) {
    return res.json({ success: true, inserted: 0 });
  }

  // 使用事务处理批量插入
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    
    let completed = 0;
    let hasError = false;
    const total = data.length;
    
    const handleComplete = (err) => {
      if (err && !hasError) {
        hasError = true;
        console.error('Batch insert error:', err);
        db.run("ROLLBACK");
        return res.status(500).json({ error: 'Database insertion failed', details: err.message });
      }
      
      if (++completed === total && !hasError) {
        db.run("COMMIT", (commitErr) => {
          if (commitErr) {
            console.error('Commit error:', commitErr);
            return res.status(500).json({ error: 'Transaction commit failed' });
          }
          res.json({ success: true, inserted: total });
        });
      }
    };

    data.forEach(item => {
      if (hasError) return; // 如果已经有错误，跳过后续操作
      
      const { table, data: itemData } = item;
      
      // 数据验证
      if (!itemData || !itemData.sessionId) {
        return handleComplete(new Error('Invalid item data'));
      }
      
      switch (table) {
        case 'battle_events':
          if (!itemData.eventType || !itemData.timestamp) {
            return handleComplete(new Error('Invalid battle event data'));
          }
          db.run(
            `INSERT INTO battle_events (session_id, timestamp, game_time, player_level, event_type, data) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [itemData.sessionId, itemData.timestamp, itemData.gameTime || 0, itemData.playerLevel || 1, 
             itemData.eventType, JSON.stringify(itemData.data || {})],
            handleComplete
          );
          break;

        case 'player_events':
          if (!itemData.eventType || !itemData.timestamp) {
            return handleComplete(new Error('Invalid player event data'));
          }
          db.run(
            `INSERT INTO player_events (session_id, timestamp, game_time, player_level, event_type, data) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [itemData.sessionId, itemData.timestamp, itemData.gameTime || 0, itemData.playerLevel || 1, 
             itemData.eventType, JSON.stringify(itemData.data || {})],
            handleComplete
          );
          break;

        case 'equipment_events':
          if (!itemData.equipment || !itemData.eventType) {
            return handleComplete(new Error('Invalid equipment event data'));
          }
          db.run(
            `INSERT INTO equipment_events (session_id, timestamp, game_time, player_level, event_type, 
             equipment_id, equipment_type, equipment_quality, equipment_level, equipment_score, data) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [itemData.sessionId, itemData.timestamp, itemData.gameTime || 0, itemData.playerLevel || 1, 
             itemData.eventType, itemData.equipment.id || '', itemData.equipment.type || 'unknown', 
             itemData.equipment.quality || 'common', itemData.equipment.level || 1, itemData.equipment.score || 0,
             JSON.stringify(itemData)],
            handleComplete
          );
          break;

        case 'session_stats':
          if (!itemData.timestamp) {
            return handleComplete(new Error('Invalid session stats data'));
          }
          db.run(
            `INSERT INTO session_stats (session_id, timestamp, session_duration, game_time, player_level, 
             player_hp, max_hp, kills, coins_earned, total_damage, damage_by_source, equipped_items, 
             inventory_count, owned_skills, auto_settings) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [itemData.sessionId, itemData.timestamp, itemData.sessionDuration || 0, itemData.gameTime || 0, 
             itemData.playerLevel || 1, itemData.playerHP || 0, itemData.maxHP || 100, itemData.kills || 0, 
             itemData.coinsEarned || 0, itemData.totalDamage || 0, JSON.stringify(itemData.damageBySource || {}),
             itemData.equippedItems || 0, itemData.inventoryCount || 0, JSON.stringify(itemData.ownedSkills || {}),
             JSON.stringify(itemData.autoSettings || {})],
            handleComplete
          );
          break;

        default:
          console.warn('Unknown table:', table);
          handleComplete(); // 不认为是错误，只是警告
      }
    });
  });
});

// 查询API - 获取会话列表
app.get('/api/analytics/sessions', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  db.all(
    `SELECT session_id, MIN(timestamp) as start_time, MAX(timestamp) as end_time,
     MAX(game_time) as max_game_time, MAX(player_level) as max_level, MAX(kills) as max_kills
     FROM session_stats 
     GROUP BY session_id 
     ORDER BY start_time DESC 
     LIMIT ? OFFSET ?`,
    [limit, offset],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
    }
  );
});

// 查询API - 获取会话详细信息
app.get('/api/analytics/session/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;

  const queries = {
    stats: new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM session_stats WHERE session_id = ? ORDER BY timestamp`,
        [sessionId],
        (err, rows) => err ? reject(err) : resolve(rows)
      );
    }),
    battleEvents: new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM battle_events WHERE session_id = ? ORDER BY timestamp LIMIT 1000`,
        [sessionId],
        (err, rows) => err ? reject(err) : resolve(rows)
      );
    }),
    playerEvents: new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM player_events WHERE session_id = ? ORDER BY timestamp`,
        [sessionId],
        (err, rows) => err ? reject(err) : resolve(rows)
      );
    }),
    equipmentEvents: new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM equipment_events WHERE session_id = ? ORDER BY timestamp`,
        [sessionId],
        (err, rows) => err ? reject(err) : resolve(rows)
      );
    })
  };

  Promise.all(Object.values(queries))
    .then(([stats, battleEvents, playerEvents, equipmentEvents]) => {
      res.json({
        sessionId,
        stats,
        battleEvents,
        playerEvents,
        equipmentEvents
      });
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

// 查询API - 获取统计数据
app.get('/api/analytics/stats', (req, res) => {
  const queries = {
    totalSessions: new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(DISTINCT session_id) as count FROM session_stats`,
        (err, row) => err ? reject(err) : resolve(row.count)
      );
    }),
    totalPlayTime: new Promise((resolve, reject) => {
      db.get(
        `SELECT SUM(max_game_time) as total FROM (
          SELECT session_id, MAX(game_time) as max_game_time 
          FROM session_stats GROUP BY session_id
        )`,
        (err, row) => err ? reject(err) : resolve(row.total || 0)
      );
    }),
    averageLevel: new Promise((resolve, reject) => {
      db.get(
        `SELECT AVG(max_level) as avg FROM (
          SELECT session_id, MAX(player_level) as max_level 
          FROM session_stats GROUP BY session_id
        )`,
        (err, row) => err ? reject(err) : resolve(row.avg || 0)
      );
    }),
    totalKills: new Promise((resolve, reject) => {
      db.get(
        `SELECT SUM(max_kills) as total FROM (
          SELECT session_id, MAX(kills) as max_kills 
          FROM session_stats GROUP BY session_id
        )`,
        (err, row) => err ? reject(err) : resolve(row.total || 0)
      );
    })
  };

  Promise.all(Object.values(queries))
    .then(([totalSessions, totalPlayTime, averageLevel, totalKills]) => {
      res.json({
        totalSessions,
        totalPlayTime: Math.round(totalPlayTime),
        averageLevel: Math.round(averageLevel * 100) / 100,
        totalKills
      });
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

// 提供主页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Game analytics server running on port ${PORT}`);
  console.log(`Game: http://localhost:${PORT}`);
  console.log(`Analytics API: http://localhost:${PORT}/api/analytics/stats`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Database close error:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});