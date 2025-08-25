/**
 * Game constants module - 游戏常量模块
 * @module Constants
 */

/**
 * 游戏状态常量
 * @readonly
 * @enum {string}
 */
export const GAME_STATES = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
  VICTORY: 'victory',
  LOADING: 'loading',
  SETTINGS: 'settings'
};

/**
 * 实体类型常量
 * @readonly
 * @enum {string}
 */
export const ENTITY_TYPES = {
  PLAYER: 'player',
  ENEMY: 'enemy',
  PROJECTILE: 'projectile',
  ITEM: 'item',
  OBSTACLE: 'obstacle',
  EFFECT: 'effect'
};

/**
 * 敌人类型常量
 * @readonly
 * @enum {string}
 */
export const ENEMY_TYPES = {
  BASIC: 'basic',
  FAST: 'fast',
  TANK: 'tank',
  SHOOTER: 'shooter',
  BOSS: 'boss',
  ELITE: 'elite',
  SWARM: 'swarm',
  EXPLODER: 'exploder'
};

/**
 * 武器类型常量
 * @readonly
 * @enum {string}
 */
export const WEAPON_TYPES = {
  PISTOL: 'pistol',
  RIFLE: 'rifle',
  SHOTGUN: 'shotgun',
  SNIPER: 'sniper',
  ROCKET: 'rocket',
  LASER: 'laser',
  PLASMA: 'plasma',
  FLAME: 'flame'
};

/**
 * 技能类型常量
 * @readonly
 * @enum {string}
 */
export const SKILL_TYPES = {
  PASSIVE: 'passive',
  ACTIVE: 'active',
  ULTIMATE: 'ultimate',
  AURA: 'aura',
  TRIGGER: 'trigger'
};

/**
 * 物品类型常量
 * @readonly
 * @enum {string}
 */
export const ITEM_TYPES = {
  EXPERIENCE: 'experience',
  HEALTH: 'health',
  MANA: 'mana',
  WEAPON: 'weapon',
  EQUIPMENT: 'equipment',
  CONSUMABLE: 'consumable',
  KEY: 'key',
  TREASURE: 'treasure'
};

/**
 * 装备类型常量
 * @readonly
 * @enum {string}
 */
export const EQUIPMENT_TYPES = {
  HELMET: 'helmet',
  ARMOR: 'armor',
  BOOTS: 'boots',
  GLOVES: 'gloves',
  RING: 'ring',
  AMULET: 'amulet',
  SHIELD: 'shield',
  ACCESSORY: 'accessory'
};

/**
 * 装备稀有度常量
 * @readonly
 * @enum {string}
 */
export const RARITY_TYPES = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
  MYTHIC: 'mythic'
};

/**
 * 伤害类型常量
 * @readonly
 * @enum {string}
 */
export const DAMAGE_TYPES = {
  PHYSICAL: 'physical',
  MAGICAL: 'magical',
  FIRE: 'fire',
  ICE: 'ice',
  LIGHTNING: 'lightning',
  POISON: 'poison',
  HOLY: 'holy',
  DARK: 'dark'
};

/**
 * 状态效果类型常量
 * @readonly
 * @enum {string}
 */
export const STATUS_EFFECTS = {
  BURN: 'burn',
  FREEZE: 'freeze',
  POISON: 'poison',
  STUN: 'stun',
  SLOW: 'slow',
  HASTE: 'haste',
  SHIELD: 'shield',
  REGENERATION: 'regeneration',
  INVULNERABLE: 'invulnerable',
  INVISIBLE: 'invisible'
};

/**
 * 粒子效果类型常量
 * @readonly
 * @enum {string}
 */
export const PARTICLE_TYPES = {
  SPARK: 'spark',
  SMOKE: 'smoke',
  FIRE: 'fire',
  EXPLOSION: 'explosion',
  TRAIL: 'trail',
  MAGIC: 'magic',
  BLOOD: 'blood',
  HEAL: 'heal'
};

/**
 * 音效类型常量
 * @readonly
 * @enum {string}
 */
export const SOUND_TYPES = {
  SHOOT: 'shoot',
  HIT: 'hit',
  EXPLOSION: 'explosion',
  PICKUP: 'pickup',
  LEVEL_UP: 'level_up',
  DEATH: 'death',
  MENU: 'menu',
  AMBIENT: 'ambient'
};

/**
 * 输入键位常量
 * @readonly
 * @enum {string}
 */
export const INPUT_KEYS = {
  // 移动
  MOVE_UP: 'KeyW',
  MOVE_DOWN: 'KeyS',
  MOVE_LEFT: 'KeyA',
  MOVE_RIGHT: 'KeyD',
    
  // 技能
  SKILL_1: 'Digit1',
  SKILL_2: 'Digit2',
  SKILL_3: 'Digit3',
  SKILL_4: 'Digit4',
  ULTIMATE: 'KeyR',
    
  // 系统
  PAUSE: 'Escape',
  INVENTORY: 'KeyI',
  MAP: 'KeyM',
  STATS: 'KeyC',
    
  // 其他
  INTERACT: 'KeyE',
  RELOAD: 'KeyR',
  DASH: 'Space'
};

/**
 * 游戏平衡常量
 * @readonly
 */
export const BALANCE = {
  // 玩家相关
  PLAYER: {
    BASE_HEALTH: 100,
    BASE_MANA: 50,
    BASE_SPEED: 100,
    BASE_DAMAGE: 10,
    LEVEL_UP_HEALTH: 20,
    LEVEL_UP_MANA: 10,
    INVULNERABILITY_TIME: 1000,
    EXPERIENCE_BASE: 100,
    EXPERIENCE_MULTIPLIER: 1.5
  },
    
  // 敌人相关
  ENEMY: {
    SPAWN_DISTANCE_MIN: 300,
    SPAWN_DISTANCE_MAX: 500,
    MAX_COUNT: 50,
    DIFFICULTY_SCALING: 1.1,
    HEALTH_SCALING: 1.2,
    DAMAGE_SCALING: 1.1,
    SPEED_SCALING: 1.05
  },
    
  // 武器相关
  WEAPON: {
    CRITICAL_CHANCE: 0.1,
    CRITICAL_MULTIPLIER: 2.0,
    ACCURACY_BASE: 0.9,
    RANGE_BASE: 200,
    FIRE_RATE_BASE: 1.0
  },
    
  // 物品相关
  ITEM: {
    DROP_RATE: 0.3,
    MAGNET_RANGE: 50,
    EXPERIENCE_VALUE: 5,
    HEALTH_VALUE: 20,
    MANA_VALUE: 15
  }
};

/**
 * 渲染层级常量
 * @readonly
 */
export const RENDER_LAYERS = {
  BACKGROUND: 0,
  TERRAIN: 1,
  ITEMS: 2,
  ENEMIES: 3,
  PLAYER: 4,
  PROJECTILES: 5,
  EFFECTS: 6,
  UI: 7,
  DEBUG: 8
};

/**
 * 颜色常量
 * @readonly
 */
export const COLORS = {
  // 基础颜色
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  RED: '#FF0000',
  GREEN: '#00FF00',
  BLUE: '#0000FF',
  YELLOW: '#FFFF00',
  CYAN: '#00FFFF',
  MAGENTA: '#FF00FF',
    
  // 游戏颜色
  PLAYER: '#00AAFF',
  ENEMY: '#FF4444',
  PROJECTILE: '#FFAA00',
  EXPERIENCE: '#00FF88',
  HEALTH: '#FF4444',
  MANA: '#4444FF',
    
  // 稀有度颜色
  COMMON: '#FFFFFF',
  UNCOMMON: '#00FF00',
  RARE: '#0088FF',
  EPIC: '#AA00FF',
  LEGENDARY: '#FF8800',
  MYTHIC: '#FF0088',
    
  // UI颜色
  UI_BACKGROUND: '#000000AA',
  UI_BORDER: '#FFFFFF44',
  UI_TEXT: '#FFFFFF',
  UI_HIGHLIGHT: '#FFFF00',
  UI_DANGER: '#FF4444',
  UI_SUCCESS: '#44FF44',
  UI_WARNING: '#FFAA44'
};

/**
 * 数学常量
 * @readonly
 */
export const MATH = {
  PI: Math.PI,
  TWO_PI: Math.PI * 2,
  HALF_PI: Math.PI / 2,
  DEG_TO_RAD: Math.PI / 180,
  RAD_TO_DEG: 180 / Math.PI,
  EPSILON: 1e-6,
  GOLDEN_RATIO: 1.618033988749895
};

/**
 * 物理常量
 * @readonly
 */
export const PHYSICS = {
  GRAVITY: 9.81,
  FRICTION: 0.98,
  AIR_RESISTANCE: 0.99,
  BOUNCE_DAMPING: 0.8,
  MIN_VELOCITY: 0.1,
  MAX_VELOCITY: 1000
};

/**
 * 时间常量（毫秒）
 * @readonly
 */
export const TIME = {
  SECOND: 1000,
  MINUTE: 60000,
  HOUR: 3600000,
  FRAME_TIME: 16.67, // 60 FPS
  TICK_RATE: 20, // 50 TPS
  SAVE_INTERVAL: 30000, // 30秒
  AUTOSAVE_INTERVAL: 300000 // 5分钟
};

/**
 * 网络常量
 * @readonly
 */
export const NETWORK = {
  TIMEOUT: 5000,
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000,
  HEARTBEAT_INTERVAL: 30000,
  RECONNECT_DELAY: 5000
};

/**
 * 存储常量
 * @readonly
 */
export const STORAGE = {
  GAME_DATA: 'genspark_survivor_data',
  CONFIG: 'genspark_survivor_config',
  ACHIEVEMENTS: 'genspark_survivor_achievements',
  STATISTICS: 'genspark_survivor_stats',
  SETTINGS: 'genspark_survivor_settings'
};

/**
 * 版本信息
 * @readonly
 */
export const VERSION = {
  MAJOR: 1,
  MINOR: 0,
  PATCH: 0,
  BUILD: 1,
  STRING: '1.0.0-beta.1',
  SAVE_FORMAT: 1
};

/**
 * 调试常量
 * @readonly
 */
export const DEBUG = {
  SHOW_FPS: false,
  SHOW_BOUNDS: false,
  SHOW_GRID: false,
  SHOW_STATS: false,
  LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
  PERFORMANCE_MONITOR: false
};

/**
 * 性能常量
 * @readonly
 */
export const PERFORMANCE = {
  MAX_ENTITIES: 1000,
  MAX_PARTICLES: 500,
  MAX_SOUNDS: 32,
  CULLING_MARGIN: 100,
  LOD_DISTANCE_1: 200,
  LOD_DISTANCE_2: 500,
  GC_INTERVAL: 10000 // 垃圾回收间隔
};

/**
 * 本地化常量
 * @readonly
 */
export const LOCALIZATION = {
  DEFAULT_LANGUAGE: 'zh-CN',
  SUPPORTED_LANGUAGES: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'],
  FALLBACK_LANGUAGE: 'en-US'
};

/**
 * 平台常量
 * @readonly
 */
export const PLATFORM = {
  DESKTOP: 'desktop',
  MOBILE: 'mobile',
  TABLET: 'tablet',
  WEB: 'web'
};

/**
 * 事件类型常量
 * @readonly
 * @enum {string}
 */
export const EVENT_TYPES = {
  // 游戏事件
  GAME_START: 'game_start',
  GAME_END: 'game_end',
  GAME_PAUSE: 'game_pause',
  GAME_RESUME: 'game_resume',
  LEVEL_UP: 'level_up',
  PLAYER_DEATH: 'player_death',
  ENEMY_DEATH: 'enemy_death',
  ITEM_PICKUP: 'item_pickup',
  SKILL_UNLOCK: 'skill_unlock',
  ACHIEVEMENT_UNLOCK: 'achievement_unlock',
    
  // 系统事件
  CONFIG_CHANGE: 'config_change',
  SAVE_GAME: 'save_game',
  LOAD_GAME: 'load_game',
  ERROR: 'error',
  WARNING: 'warning',
    
  // 输入事件
  KEY_DOWN: 'key_down',
  KEY_UP: 'key_up',
  MOUSE_DOWN: 'mouse_down',
  MOUSE_UP: 'mouse_up',
  MOUSE_MOVE: 'mouse_move',
  TOUCH_START: 'touch_start',
  TOUCH_END: 'touch_end',
  TOUCH_MOVE: 'touch_move'
};

/**
 * 错误代码常量
 * @readonly
 */
export const ERROR_CODES = {
  UNKNOWN: 0,
  INVALID_INPUT: 1001,
  INVALID_STATE: 1002,
  RESOURCE_NOT_FOUND: 2001,
  RESOURCE_LOAD_FAILED: 2002,
  SAVE_FAILED: 3001,
  LOAD_FAILED: 3002,
  NETWORK_ERROR: 4001,
  PERMISSION_DENIED: 5001
};

/**
 * 成就类型常量
 * @readonly
 * @enum {string}
 */
export const ACHIEVEMENT_TYPES = {
  KILL_COUNT: 'kill_count',
  SURVIVAL_TIME: 'survival_time',
  LEVEL_REACHED: 'level_reached',
  SCORE_REACHED: 'score_reached',
  ITEM_COLLECTED: 'item_collected',
  SKILL_MASTERY: 'skill_mastery',
  SPECIAL: 'special'
};

/**
 * 统计类型常量
 * @readonly
 * @enum {string}
 */
export const STAT_TYPES = {
  GAMES_PLAYED: 'games_played',
  TOTAL_TIME: 'total_time',
  TOTAL_KILLS: 'total_kills',
  TOTAL_DEATHS: 'total_deaths',
  HIGHEST_LEVEL: 'highest_level',
  HIGHEST_SCORE: 'highest_score',
  ITEMS_COLLECTED: 'items_collected',
  DISTANCE_TRAVELED: 'distance_traveled'
};

/**
 * 默认导出所有常量
 */
export default {
  GAME_STATES,
  ENTITY_TYPES,
  ENEMY_TYPES,
  WEAPON_TYPES,
  SKILL_TYPES,
  ITEM_TYPES,
  EQUIPMENT_TYPES,
  RARITY_TYPES,
  DAMAGE_TYPES,
  STATUS_EFFECTS,
  PARTICLE_TYPES,
  SOUND_TYPES,
  INPUT_KEYS,
  BALANCE,
  RENDER_LAYERS,
  COLORS,
  MATH,
  PHYSICS,
  TIME,
  NETWORK,
  STORAGE,
  VERSION,
  DEBUG,
  PERFORMANCE,
  LOCALIZATION,
  PLATFORM,
  EVENT_TYPES,
  ERROR_CODES,
  ACHIEVEMENT_TYPES,
  STAT_TYPES
};