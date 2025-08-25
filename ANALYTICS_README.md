# 🎮 Vampire Survivors 游戏分析系统

## 📊 系统概述

这是一个完整的游戏数据分析系统，用于记录和分析 Vampire Survivors 风格游戏的所有游戏事件和玩家行为数据。

## 🚀 快速启动

### Windows 用户
双击运行 `start.bat` 文件

### Linux/Mac 用户
```bash
chmod +x start.sh
./start.sh
```

### 手动启动
```bash
npm install
npm start
```

## 🌐 访问地址

- **游戏**: http://localhost:3000
- **分析API**: http://localhost:3000/api/analytics/stats
- **会话列表**: http://localhost:3000/api/analytics/sessions

## 📋 数据收集内容

### 🎯 战斗事件 (battle_events)
- 伤害造成记录 (每次攻击)
- 敌人击杀记录
- 技能使用统计
- 伤害来源分析

### 👤 玩家事件 (player_events) 
- 等级提升
- 游戏开始/结束
- 游戏重启
- 技能获得

### 🛡️ 装备事件 (equipment_events)
- 装备掉落 (位置、品质、等级、属性)
- 装备穿戴 (替换记录)
- 装备评分变化
- 装备获取路径

### 📈 会话统计 (session_stats)
- 实时游戏状态 (每5秒)
- 玩家属性快照
- 伤害统计汇总
- 装备和技能状态
- 自动化设置状态

## 🔍 API 接口

### GET /api/analytics/stats
获取总体统计数据
```json
{
  "totalSessions": 156,
  "totalPlayTime": 14520,
  "averageLevel": 12.5,
  "totalKills": 45230
}
```

### GET /api/analytics/sessions
获取游戏会话列表
```json
[
  {
    "session_id": "session_1703...",
    "start_time": 1703123456789,
    "end_time": 1703127056789,
    "max_game_time": 1205.6,
    "max_level": 15,
    "max_kills": 342
  }
]
```

### GET /api/analytics/session/:sessionId
获取特定会话的详细数据
```json
{
  "sessionId": "session_1703...",
  "stats": [...],
  "battleEvents": [...],
  "playerEvents": [...],
  "equipmentEvents": [...]
}
```

### POST /api/analytics/batch
批量上传游戏事件数据 (游戏自动调用)

## 📊 数据分析用途

### 🎮 游戏平衡分析
- 各技能DPS统计和平衡性评估
- 装备掉落率和获取难度分析
- 敌人强度和玩家生存率关系
- 自动化功能使用率统计

### 📈 玩家行为分析
- 平均游戏时长和留存分析
- 等级进展速度和难度曲线
- 装备选择偏好和策略分析
- AI自动化功能依赖度

### 🔧 性能优化分析
- 游戏性能瓶颈识别
- 内存和CPU使用模式
- 网络数据传输效率
- 数据库查询性能监控

### 🎯 内容优化建议
- 基于数据的数值平衡调整
- 新功能需求和优先级分析
- 用户体验改进方向
- 游戏机制创新建议

## 💾 数据库结构

系统使用SQLite数据库存储数据，包含以下表：

- `battle_events`: 战斗相关事件
- `player_events`: 玩家行为事件  
- `equipment_events`: 装备相关事件
- `session_stats`: 会话统计快照

数据库文件：`game_analytics.db`

## 🔒 隐私和安全

- 所有数据存储在本地SQLite数据库
- 不收集任何个人身份信息
- 仅记录游戏内行为数据
- 数据用于游戏改进和分析

## 🛠️ 开发和扩展

### 添加新的事件类型
1. 在 `js/analytics.js` 中添加新的记录函数
2. 在游戏逻辑中调用记录函数
3. 在 `server.js` 中添加对应的数据库表和API

### 自定义分析查询
可以直接操作 `game_analytics.db` 文件进行自定义SQL查询和数据分析。

## 📞 技术支持

如遇到问题，请检查：
1. Node.js 版本是否 >= 14.0
2. 端口3000是否被占用
3. 数据库文件权限是否正确
4. 网络连接是否正常

---
*本分析系统为游戏开发和数据分析而设计，支持实时数据收集和离线分析。*