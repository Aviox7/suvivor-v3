/**
 * Game types definitions - 游戏类型定义
 * @module GameTypes
 */

/**
 * 基础实体类型定义
 * @typedef {Object} BaseEntity
 * @property {string} id - 实体唯一标识符
 * @property {string} type - 实体类型
 * @property {Vector2} position - 位置坐标
 * @property {Vector2} velocity - 速度向量
 * @property {number} rotation - 旋转角度（弧度）
 * @property {number} scale - 缩放比例
 * @property {boolean} active - 是否激活
 * @property {boolean} visible - 是否可见
 * @property {number} layer - 渲染层级
 * @property {BoundingBox} bounds - 边界框
 * @property {number} createdAt - 创建时间戳
 * @property {number} updatedAt - 更新时间戳
 */

/**
 * 玩家数据类型定义
 * @typedef {Object} Player
 * @property {string} id - 玩家ID
 * @property {string} name - 玩家名称
 * @property {Vector2} position - 位置坐标
 * @property {Vector2} velocity - 速度向量
 * @property {number} rotation - 旋转角度
 * @property {PlayerStats} stats - 玩家属性
 * @property {PlayerStatus} status - 玩家状态
 * @property {Array<Skill>} skills - 技能列表
 * @property {Array<Equipment>} equipment - 装备列表
 * @property {Inventory} inventory - 物品栏
 * @property {Array<StatusEffect>} statusEffects - 状态效果列表
 * @property {number} experience - 当前经验值
 * @property {number} experienceToNext - 升级所需经验
 * @property {number} level - 等级
 * @property {number} score - 分数
 * @property {number} lastDamageTime - 上次受伤时间
 * @property {boolean} invulnerable - 是否无敌
 */

/**
 * 玩家属性类型定义
 * @typedef {Object} PlayerStats
 * @property {number} health - 当前生命值
 * @property {number} maxHealth - 最大生命值
 * @property {number} mana - 当前魔法值
 * @property {number} maxMana - 最大魔法值
 * @property {number} damage - 攻击力
 * @property {number} defense - 防御力
 * @property {number} speed - 移动速度
 * @property {number} attackSpeed - 攻击速度
 * @property {number} criticalChance - 暴击几率
 * @property {number} criticalMultiplier - 暴击倍率
 * @property {number} accuracy - 精确度
 * @property {number} range - 攻击范围
 * @property {number} healthRegen - 生命回复
 * @property {number} manaRegen - 魔法回复
 * @property {number} experienceMultiplier - 经验倍率
 * @property {number} goldMultiplier - 金币倍率
 * @property {number} luck - 幸运值
 */

/**
 * 玩家状态类型定义
 * @typedef {Object} PlayerStatus
 * @property {boolean} alive - 是否存活
 * @property {boolean} moving - 是否移动中
 * @property {boolean} attacking - 是否攻击中
 * @property {boolean} casting - 是否施法中
 * @property {boolean} stunned - 是否眩晕
 * @property {boolean} frozen - 是否冰冻
 * @property {boolean} poisoned - 是否中毒
 * @property {boolean} burning - 是否燃烧
 * @property {boolean} shielded - 是否有护盾
 * @property {boolean} invisible - 是否隐身
 * @property {boolean} invulnerable - 是否无敌
 * @property {string} currentAction - 当前动作
 * @property {number} actionStartTime - 动作开始时间
 */

/**
 * 敌人数据类型定义
 * @typedef {Object} Enemy
 * @property {string} id - 敌人ID
 * @property {string} type - 敌人类型
 * @property {string} name - 敌人名称
 * @property {Vector2} position - 位置坐标
 * @property {Vector2} velocity - 速度向量
 * @property {Vector2} targetPosition - 目标位置
 * @property {number} rotation - 旋转角度
 * @property {EnemyStats} stats - 敌人属性
 * @property {EnemyBehavior} behavior - 行为配置
 * @property {Array<StatusEffect>} statusEffects - 状态效果列表
 * @property {AIState} aiState - AI状态
 * @property {number} lastAttackTime - 上次攻击时间
 * @property {number} lastMoveTime - 上次移动时间
 * @property {number} spawnTime - 生成时间
 * @property {boolean} isDead - 是否死亡
 * @property {number} deathTime - 死亡时间
 * @property {DropTable} dropTable - 掉落表
 */

/**
 * 敌人属性类型定义
 * @typedef {Object} EnemyStats
 * @property {number} health - 当前生命值
 * @property {number} maxHealth - 最大生命值
 * @property {number} damage - 攻击力
 * @property {number} defense - 防御力
 * @property {number} speed - 移动速度
 * @property {number} attackSpeed - 攻击速度
 * @property {number} range - 攻击范围
 * @property {number} detectionRange - 检测范围
 * @property {number} experienceReward - 经验奖励
 * @property {number} goldReward - 金币奖励
 * @property {Array<string>} resistances - 抗性列表
 * @property {Array<string>} weaknesses - 弱点列表
 */

/**
 * 敌人行为配置类型定义
 * @typedef {Object} EnemyBehavior
 * @property {string} type - 行为类型 ('aggressive', 'defensive', 'passive', 'patrol')
 * @property {number} aggroRange - 仇恨范围
 * @property {number} leashRange - 拴绳范围
 * @property {number} attackCooldown - 攻击冷却时间
 * @property {number} moveCooldown - 移动冷却时间
 * @property {boolean} canFly - 是否可以飞行
 * @property {boolean} canSwim - 是否可以游泳
 * @property {Array<Vector2>} patrolPoints - 巡逻点列表
 * @property {number} currentPatrolIndex - 当前巡逻点索引
 * @property {Object} specialAbilities - 特殊能力配置
 */

/**
 * AI状态类型定义
 * @typedef {Object} AIState
 * @property {string} current - 当前状态
 * @property {string} previous - 前一个状态
 * @property {number} stateStartTime - 状态开始时间
 * @property {Object} stateData - 状态数据
 * @property {Array<string>} availableStates - 可用状态列表
 * @property {Object} transitions - 状态转换规则
 */

/**
 * 弹药类型定义
 * @typedef {Object} Projectile
 * @property {string} id - 弹药ID
 * @property {string} type - 弹药类型
 * @property {string} ownerId - 发射者ID
 * @property {Vector2} position - 位置坐标
 * @property {Vector2} velocity - 速度向量
 * @property {number} rotation - 旋转角度
 * @property {number} damage - 伤害值
 * @property {string} damageType - 伤害类型
 * @property {number} speed - 飞行速度
 * @property {number} range - 射程
 * @property {number} lifeTime - 生存时间
 * @property {number} createdAt - 创建时间
 * @property {boolean} piercing - 是否穿透
 * @property {number} pierceCount - 穿透次数
 * @property {boolean} homing - 是否追踪
 * @property {string} targetId - 追踪目标ID
 * @property {Array<StatusEffect>} statusEffects - 附加状态效果
 * @property {ParticleEffect} trailEffect - 拖尾效果
 */

/**
 * 技能类型定义
 * @typedef {Object} Skill
 * @property {string} id - 技能ID
 * @property {string} name - 技能名称
 * @property {string} description - 技能描述
 * @property {string} type - 技能类型
 * @property {string} icon - 图标路径
 * @property {number} level - 技能等级
 * @property {number} maxLevel - 最大等级
 * @property {number} cooldown - 冷却时间
 * @property {number} lastUsed - 上次使用时间
 * @property {number} manaCost - 魔法消耗
 * @property {number} damage - 伤害值
 * @property {string} damageType - 伤害类型
 * @property {number} range - 作用范围
 * @property {number} duration - 持续时间
 * @property {Array<string>} requirements - 学习要求
 * @property {Array<StatusEffect>} effects - 技能效果
 * @property {Object} upgradeData - 升级数据
 * @property {boolean} unlocked - 是否已解锁
 * @property {boolean} passive - 是否被动技能
 */

/**
 * 装备类型定义
 * @typedef {Object} Equipment
 * @property {string} id - 装备ID
 * @property {string} name - 装备名称
 * @property {string} description - 装备描述
 * @property {string} type - 装备类型
 * @property {string} slot - 装备槽位
 * @property {string} rarity - 稀有度
 * @property {string} icon - 图标路径
 * @property {number} level - 装备等级
 * @property {number} durability - 当前耐久度
 * @property {number} maxDurability - 最大耐久度
 * @property {Object} stats - 属性加成
 * @property {Array<string>} setBonus - 套装加成
 * @property {Array<Enchantment>} enchantments - 附魔列表
 * @property {Array<string>} requirements - 装备要求
 * @property {number} value - 价值
 * @property {boolean} tradeable - 是否可交易
 * @property {boolean} equipped - 是否已装备
 */

/**
 * 物品类型定义
 * @typedef {Object} Item
 * @property {string} id - 物品ID
 * @property {string} name - 物品名称
 * @property {string} description - 物品描述
 * @property {string} type - 物品类型
 * @property {string} rarity - 稀有度
 * @property {string} icon - 图标路径
 * @property {number} quantity - 数量
 * @property {number} maxStack - 最大堆叠数
 * @property {number} value - 价值
 * @property {boolean} consumable - 是否消耗品
 * @property {boolean} tradeable - 是否可交易
 * @property {Object} useEffect - 使用效果
 * @property {Array<string>} tags - 标签列表
 */

/**
 * 物品栏类型定义
 * @typedef {Object} Inventory
 * @property {Array<InventorySlot>} slots - 物品槽列表
 * @property {number} maxSlots - 最大槽位数
 * @property {number} usedSlots - 已使用槽位数
 * @property {number} gold - 金币数量
 * @property {Array<Item>} quickUse - 快捷使用栏
 * @property {boolean} autoSort - 自动排序
 * @property {Array<string>} filters - 过滤器列表
 */

/**
 * 物品槽类型定义
 * @typedef {Object} InventorySlot
 * @property {number} index - 槽位索引
 * @property {Item|null} item - 物品
 * @property {boolean} locked - 是否锁定
 * @property {string} category - 分类
 */

/**
 * 状态效果类型定义
 * @typedef {Object} StatusEffect
 * @property {string} id - 效果ID
 * @property {string} type - 效果类型
 * @property {string} name - 效果名称
 * @property {string} description - 效果描述
 * @property {string} icon - 图标路径
 * @property {number} duration - 持续时间
 * @property {number} remainingTime - 剩余时间
 * @property {number} stacks - 叠加层数
 * @property {number} maxStacks - 最大叠加层数
 * @property {Object} values - 效果数值
 * @property {number} tickInterval - 触发间隔
 * @property {number} lastTick - 上次触发时间
 * @property {string} sourceId - 来源ID
 * @property {boolean} beneficial - 是否有益效果
 * @property {boolean} dispellable - 是否可驱散
 */

/**
 * 附魔类型定义
 * @typedef {Object} Enchantment
 * @property {string} id - 附魔ID
 * @property {string} name - 附魔名称
 * @property {string} description - 附魔描述
 * @property {number} level - 附魔等级
 * @property {number} maxLevel - 最大等级
 * @property {Object} effect - 附魔效果
 * @property {string} rarity - 稀有度
 * @property {Array<string>} applicableTypes - 适用装备类型
 */

/**
 * 掉落表类型定义
 * @typedef {Object} DropTable
 * @property {Array<DropEntry>} entries - 掉落条目列表
 * @property {number} totalWeight - 总权重
 * @property {number} guaranteedDrops - 保证掉落数量
 * @property {number} maxDrops - 最大掉落数量
 * @property {Object} conditions - 掉落条件
 */

/**
 * 掉落条目类型定义
 * @typedef {Object} DropEntry
 * @property {string} itemId - 物品ID
 * @property {number} weight - 权重
 * @property {number} minQuantity - 最小数量
 * @property {number} maxQuantity - 最大数量
 * @property {number} chance - 掉落几率
 * @property {Array<string>} conditions - 掉落条件
 */

/**
 * 二维向量类型定义
 * @typedef {Object} Vector2
 * @property {number} x - X坐标
 * @property {number} y - Y坐标
 */

/**
 * 边界框类型定义
 * @typedef {Object} BoundingBox
 * @property {number} x - 左上角X坐标
 * @property {number} y - 左上角Y坐标
 * @property {number} width - 宽度
 * @property {number} height - 高度
 */

/**
 * 圆形边界类型定义
 * @typedef {Object} CircleBounds
 * @property {number} x - 圆心X坐标
 * @property {number} y - 圆心Y坐标
 * @property {number} radius - 半径
 */

/**
 * 粒子效果类型定义
 * @typedef {Object} ParticleEffect
 * @property {string} id - 效果ID
 * @property {string} type - 效果类型
 * @property {Vector2} position - 位置坐标
 * @property {number} duration - 持续时间
 * @property {number} particleCount - 粒子数量
 * @property {Object} config - 配置参数
 * @property {boolean} active - 是否激活
 */

/**
 * 音效类型定义
 * @typedef {Object} SoundEffect
 * @property {string} id - 音效ID
 * @property {string} name - 音效名称
 * @property {string} url - 音频文件路径
 * @property {number} volume - 音量
 * @property {number} pitch - 音调
 * @property {boolean} loop - 是否循环
 * @property {number} duration - 持续时间
 * @property {string} category - 分类
 */

/**
 * 游戏世界类型定义
 * @typedef {Object} GameWorld
 * @property {number} width - 世界宽度
 * @property {number} height - 世界高度
 * @property {Array<Tile>} tiles - 地块列表
 * @property {Array<Obstacle>} obstacles - 障碍物列表
 * @property {Array<SpawnPoint>} spawnPoints - 生成点列表
 * @property {Object} environment - 环境配置
 * @property {WeatherSystem} weather - 天气系统
 * @property {LightingSystem} lighting - 光照系统
 */

/**
 * 地块类型定义
 * @typedef {Object} Tile
 * @property {number} x - X坐标
 * @property {number} y - Y坐标
 * @property {string} type - 地块类型
 * @property {boolean} walkable - 是否可行走
 * @property {number} movementCost - 移动消耗
 * @property {Object} properties - 属性配置
 */

/**
 * 障碍物类型定义
 * @typedef {Object} Obstacle
 * @property {string} id - 障碍物ID
 * @property {string} type - 障碍物类型
 * @property {Vector2} position - 位置坐标
 * @property {BoundingBox} bounds - 边界框
 * @property {boolean} solid - 是否实体
 * @property {boolean} destructible - 是否可破坏
 * @property {number} health - 生命值
 * @property {DropTable} dropTable - 掉落表
 */

/**
 * 生成点类型定义
 * @typedef {Object} SpawnPoint
 * @property {string} id - 生成点ID
 * @property {Vector2} position - 位置坐标
 * @property {string} type - 生成类型
 * @property {number} radius - 生成半径
 * @property {number} cooldown - 冷却时间
 * @property {number} lastSpawn - 上次生成时间
 * @property {Array<string>} spawnList - 可生成实体列表
 * @property {Object} conditions - 生成条件
 */

/**
 * 天气系统类型定义
 * @typedef {Object} WeatherSystem
 * @property {string} current - 当前天气
 * @property {number} intensity - 强度
 * @property {number} duration - 持续时间
 * @property {Array<WeatherEffect>} effects - 天气效果列表
 * @property {Object} forecast - 天气预报
 */

/**
 * 天气效果类型定义
 * @typedef {Object} WeatherEffect
 * @property {string} type - 效果类型
 * @property {number} intensity - 强度
 * @property {Object} visualEffect - 视觉效果
 * @property {Object} gameplayEffect - 游戏效果
 */

/**
 * 光照系统类型定义
 * @typedef {Object} LightingSystem
 * @property {number} ambientLight - 环境光强度
 * @property {Array<LightSource>} lightSources - 光源列表
 * @property {boolean} dynamicLighting - 动态光照
 * @property {boolean} shadows - 阴影效果
 */

/**
 * 光源类型定义
 * @typedef {Object} LightSource
 * @property {string} id - 光源ID
 * @property {Vector2} position - 位置坐标
 * @property {number} intensity - 强度
 * @property {number} radius - 半径
 * @property {string} color - 颜色
 * @property {boolean} dynamic - 是否动态
 * @property {Object} animation - 动画配置
 */

/**
 * 游戏配置类型定义
 * @typedef {Object} GameConfig
 * @property {GraphicsConfig} graphics - 图形配置
 * @property {AudioConfig} audio - 音频配置
 * @property {InputConfig} input - 输入配置
 * @property {GameplayConfig} gameplay - 游戏配置
 * @property {UIConfig} ui - 界面配置
 * @property {PerformanceConfig} performance - 性能配置
 */

/**
 * 图形配置类型定义
 * @typedef {Object} GraphicsConfig
 * @property {number} resolution - 分辨率缩放
 * @property {boolean} fullscreen - 全屏模式
 * @property {boolean} vsync - 垂直同步
 * @property {string} quality - 画质等级
 * @property {boolean} particles - 粒子效果
 * @property {boolean} shadows - 阴影效果
 * @property {boolean} bloom - 泛光效果
 * @property {number} brightness - 亮度
 * @property {number} contrast - 对比度
 */

/**
 * 音频配置类型定义
 * @typedef {Object} AudioConfig
 * @property {number} masterVolume - 主音量
 * @property {number} musicVolume - 音乐音量
 * @property {number} sfxVolume - 音效音量
 * @property {number} voiceVolume - 语音音量
 * @property {boolean} muted - 是否静音
 * @property {string} audioDevice - 音频设备
 */

/**
 * 输入配置类型定义
 * @typedef {Object} InputConfig
 * @property {Object} keyBindings - 按键绑定
 * @property {number} mouseSensitivity - 鼠标灵敏度
 * @property {boolean} invertMouse - 反转鼠标
 * @property {Object} gamepadConfig - 手柄配置
 * @property {boolean} touchControls - 触摸控制
 */

/**
 * 游戏配置类型定义
 * @typedef {Object} GameplayConfig
 * @property {string} difficulty - 难度等级
 * @property {boolean} autoSave - 自动保存
 * @property {number} autoSaveInterval - 自动保存间隔
 * @property {boolean} pauseOnFocusLoss - 失去焦点时暂停
 * @property {boolean} showTutorial - 显示教程
 * @property {string} language - 语言设置
 */

/**
 * 界面配置类型定义
 * @typedef {Object} UIConfig
 * @property {number} scale - 界面缩放
 * @property {string} theme - 主题
 * @property {boolean} showFPS - 显示FPS
 * @property {boolean} showMinimap - 显示小地图
 * @property {boolean} showHealthBar - 显示血条
 * @property {number} hudOpacity - HUD透明度
 */

/**
 * 性能配置类型定义
 * @typedef {Object} PerformanceConfig
 * @property {number} targetFPS - 目标帧率
 * @property {boolean} adaptiveQuality - 自适应画质
 * @property {number} maxEntities - 最大实体数
 * @property {number} maxParticles - 最大粒子数
 * @property {boolean} culling - 视锥剔除
 * @property {boolean} lod - 细节层次
 */

/**
 * 游戏统计类型定义
 * @typedef {Object} GameStats
 * @property {number} gamesPlayed - 游戏次数
 * @property {number} totalTime - 总游戏时间
 * @property {number} totalKills - 总击杀数
 * @property {number} totalDeaths - 总死亡数
 * @property {number} highestLevel - 最高等级
 * @property {number} highestScore - 最高分数
 * @property {number} itemsCollected - 收集物品数
 * @property {number} skillsUnlocked - 解锁技能数
 * @property {number} achievementsUnlocked - 解锁成就数
 * @property {Object} weaponStats - 武器统计
 * @property {Object} enemyStats - 敌人统计
 */

/**
 * 成就类型定义
 * @typedef {Object} Achievement
 * @property {string} id - 成就ID
 * @property {string} name - 成就名称
 * @property {string} description - 成就描述
 * @property {string} icon - 图标路径
 * @property {string} category - 分类
 * @property {number} points - 成就点数
 * @property {boolean} hidden - 是否隐藏
 * @property {boolean} unlocked - 是否已解锁
 * @property {number} unlockedAt - 解锁时间
 * @property {Object} requirements - 解锁要求
 * @property {Object} progress - 进度数据
 * @property {Array<string>} rewards - 奖励列表
 */

/**
 * 事件数据类型定义
 * @typedef {Object} GameEvent
 * @property {string} type - 事件类型
 * @property {number} timestamp - 时间戳
 * @property {string} sourceId - 来源ID
 * @property {string} targetId - 目标ID
 * @property {Object} data - 事件数据
 * @property {boolean} handled - 是否已处理
 */

/**
 * 输入事件类型定义
 * @typedef {Object} InputEvent
 * @property {string} type - 事件类型
 * @property {string} key - 按键
 * @property {Vector2} position - 位置坐标
 * @property {number} timestamp - 时间戳
 * @property {boolean} pressed - 是否按下
 * @property {Object} modifiers - 修饰键状态
 */

/**
 * 渲染数据类型定义
 * @typedef {Object} RenderData
 * @property {Array<RenderObject>} objects - 渲染对象列表
 * @property {Camera} camera - 摄像机
 * @property {LightingSystem} lighting - 光照系统
 * @property {Array<ParticleEffect>} particles - 粒子效果列表
 * @property {Object} postProcessing - 后处理效果
 */

/**
 * 渲染对象类型定义
 * @typedef {Object} RenderObject
 * @property {string} id - 对象ID
 * @property {string} type - 对象类型
 * @property {Vector2} position - 位置坐标
 * @property {number} rotation - 旋转角度
 * @property {number} scale - 缩放比例
 * @property {string} texture - 纹理路径
 * @property {string} color - 颜色
 * @property {number} alpha - 透明度
 * @property {number} layer - 渲染层级
 * @property {boolean} visible - 是否可见
 * @property {Object} shader - 着色器配置
 */

/**
 * 摄像机类型定义
 * @typedef {Object} Camera
 * @property {Vector2} position - 位置坐标
 * @property {Vector2} target - 目标位置
 * @property {number} zoom - 缩放级别
 * @property {number} rotation - 旋转角度
 * @property {BoundingBox} viewport - 视口范围
 * @property {BoundingBox} bounds - 边界限制
 * @property {boolean} following - 是否跟随目标
 * @property {string} followTarget - 跟随目标ID
 * @property {Object} shake - 震动效果配置
 */

// 导出所有类型定义（用于JSDoc引用）
export default {};