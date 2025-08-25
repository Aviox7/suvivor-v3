/**
 * Jest 测试环境设置
 */

// Mock Canvas API
const mockCanvas = {
  getContext: jest.fn(() => ({
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    beginPath: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    closePath: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    scale: jest.fn(),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    fillText: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    createLinearGradient: jest.fn(() => ({
      addColorStop: jest.fn()
    })),
    createRadialGradient: jest.fn(() => ({
      addColorStop: jest.fn()
    }))
  })),
  getBoundingClientRect: jest.fn(() => ({
    width: 800,
    height: 600,
    left: 0,
    top: 0
  })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  width: 800,
  height: 600
};

// Mock DOM elements
global.document = {
  ...global.document,
  getElementById: jest.fn((id) => {
    if (id === 'game') return mockCanvas;
    return {
      style: {},
      innerHTML: '',
      textContent: '',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };
  }),
  createElement: jest.fn(() => ({
    style: {},
    innerHTML: '',
    textContent: '',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    appendChild: jest.fn(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn()
    }
  })),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Mock window
global.window = {
  ...global.window,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  devicePixelRatio: 1,
  requestAnimationFrame: jest.fn(cb => setTimeout(cb, 16)),
  cancelAnimationFrame: jest.fn(),
  performance: {
    now: jest.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 1024 * 1024 * 10 // 10MB
    }
  }
};

// Mock navigator
global.navigator = {
  ...global.navigator,
  getBattery: jest.fn(() => Promise.resolve({
    level: 0.8,
    charging: false,
    addEventListener: jest.fn()
  }))
};

// Mock audio
global.Audio = jest.fn(() => ({
  play: jest.fn(),
  pause: jest.fn(),
  load: jest.fn(),
  addEventListener: jest.fn()
}));

// 全局测试工具函数
global.createMockGame = () => ({
  player: {
    x: 100,
    y: 100,
    hp: 100,
    maxHp: 100,
    level: 1,
    exp: 0,
    expToNext: 100
  },
  enemies: [],
  projectiles: [],
  particles: [],
  camera: { x: 0, y: 0 },
  world: { w: 2000, h: 2000 },
  deltaTime: 16.67,
  paused: false
});

// 测试超时设置
jest.setTimeout(10000);

// 清理定时器
afterEach(() => {
  jest.clearAllTimers();
  jest.clearAllMocks();
});