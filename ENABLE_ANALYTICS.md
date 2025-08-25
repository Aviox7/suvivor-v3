# 🔧 启用游戏分析系统

## 当前状态
游戏现在可以正常运行，分析系统暂时被禁用以确保稳定性。

## 如何启用分析系统

### 1. 修改配置
在 `js/main.js` 文件中找到这一行：
```javascript
const ENABLE_ANALYTICS = false; // 设为true以启用分析
```

将其改为：
```javascript
const ENABLE_ANALYTICS = true; // 设为true以启用分析
```

### 2. 启动后端服务器
要使用完整的分析功能，需要运行后端服务器：

**Windows:**
```bash
double-click start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

**手动启动:**
```bash
npm install
npm start
```

### 3. 访问地址
- 游戏: http://localhost:3000
- 分析API: http://localhost:3000/api/analytics/stats

## 分析系统功能

启用后，系统将自动记录：
- ⚔️ 每次攻击和伤害数据
- 👾 敌人击杀统计
- 🛡️ 装备掉落和穿戴记录
- 📈 玩家升级和技能获取
- 🎮 游戏会话统计（每5秒）

## 数据存储
所有数据存储在本地SQLite数据库 `game_analytics.db` 中，可用于：
- 游戏平衡分析
- 玩家行为研究
- 性能优化
- 内容改进建议

## 注意事项
1. 启用分析系统会轻微增加CPU和网络使用
2. 数据库文件会随游戏时间增长
3. 仅在需要数据分析时启用
4. 基础游戏功能不依赖分析系统