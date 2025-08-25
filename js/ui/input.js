/**
 * Input handling module - 输入处理模块
 * @module Input
 */

/**
 * @typedef {Object} KeyBinding
 * @property {string} key - 按键
 * @property {string} action - 动作名称
 * @property {boolean} repeat - 是否允许重复
 * @property {Array<string>} modifiers - 修饰键
 */

/**
 * @typedef {Object} MouseState
 * @property {number} x - X坐标
 * @property {number} y - Y坐标
 * @property {boolean} left - 左键状态
 * @property {boolean} right - 右键状态
 * @property {boolean} middle - 中键状态
 * @property {number} wheel - 滚轮增量
 */

/**
 * @typedef {Object} TouchState
 * @property {number} x - X坐标
 * @property {number} y - Y坐标
 * @property {number} id - 触摸ID
 * @property {boolean} active - 是否活跃
 */

/**
 * @typedef {Object} GamepadState
 * @property {boolean} connected - 是否连接
 * @property {Array<boolean>} buttons - 按钮状态
 * @property {Array<number>} axes - 摇杆轴值
 * @property {string} id - 手柄ID
 */

/**
 * 输入管理器类
 */
export class InputManager {
  /**
     * 构造函数
     * @param {HTMLElement} element - 监听元素
     */
  constructor(element = document) {
    /** @type {HTMLElement} */
    this.element = element;
        
    /** @type {Map<string, boolean>} */
    this.keys = new Map();
        
    /** @type {Map<string, boolean>} */
    this.keysPressed = new Map();
        
    /** @type {Map<string, boolean>} */
    this.keysReleased = new Map();
        
    /** @type {MouseState} */
    this.mouse = {
      x: 0,
      y: 0,
      left: false,
      right: false,
      middle: false,
      wheel: 0
    };
        
    /** @type {MouseState} */
    this.mousePressed = {
      x: 0,
      y: 0,
      left: false,
      right: false,
      middle: false,
      wheel: 0
    };
        
    /** @type {MouseState} */
    this.mouseReleased = {
      x: 0,
      y: 0,
      left: false,
      right: false,
      middle: false,
      wheel: 0
    };
        
    /** @type {Array<TouchState>} */
    this.touches = [];
        
    /** @type {Array<GamepadState>} */
    this.gamepads = [];
        
    /** @type {Map<string, KeyBinding>} */
    this.keyBindings = new Map();
        
    /** @type {Map<string, Function>} */
    this.actionHandlers = new Map();
        
    /** @type {boolean} */
    this.enabled = true;
        
    /** @type {boolean} */
    this.preventDefaults = true;
        
    /** @type {Array<string>} */
    this.inputHistory = [];
        
    /** @type {number} */
    this.maxHistoryLength = 100;
        
    this.initializeEventListeners();
    this.setupDefaultBindings();
  }

  /**
     * 初始化事件监听器
     */
  initializeEventListeners() {
    // 键盘事件
    this.element.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.element.addEventListener('keyup', this.handleKeyUp.bind(this));
        
    // 鼠标事件
    this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.element.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.element.addEventListener('wheel', this.handleWheel.bind(this));
    this.element.addEventListener('contextmenu', this.handleContextMenu.bind(this));
        
    // 触摸事件
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this));
        
    // 窗口焦点事件
    window.addEventListener('blur', this.handleWindowBlur.bind(this));
    window.addEventListener('focus', this.handleWindowFocus.bind(this));
        
    // 手柄连接事件
    window.addEventListener('gamepadconnected', this.handleGamepadConnected.bind(this));
    window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected.bind(this));
  }

  /**
     * 设置默认按键绑定
     */
  setupDefaultBindings() {
    // 移动
    this.bindKey('KeyW', 'move_up');
    this.bindKey('KeyA', 'move_left');
    this.bindKey('KeyS', 'move_down');
    this.bindKey('KeyD', 'move_right');
    this.bindKey('ArrowUp', 'move_up');
    this.bindKey('ArrowLeft', 'move_left');
    this.bindKey('ArrowDown', 'move_down');
    this.bindKey('ArrowRight', 'move_right');
        
    // 技能
    this.bindKey('KeyQ', 'skill_1');
    this.bindKey('KeyE', 'skill_2');
    this.bindKey('KeyR', 'skill_3');
    this.bindKey('KeyF', 'skill_4');
        
    // 界面
    this.bindKey('KeyI', 'toggle_inventory');
    this.bindKey('KeyM', 'toggle_map');
    this.bindKey('Tab', 'toggle_stats');
    this.bindKey('Escape', 'pause');
        
    // 其他
    this.bindKey('Space', 'interact');
    this.bindKey('ShiftLeft', 'run');
    this.bindKey('ControlLeft', 'crouch');
  }

  /**
     * 绑定按键
     * @param {string} key - 按键代码
     * @param {string} action - 动作名称
     * @param {boolean} repeat - 是否允许重复
     * @param {Array<string>} modifiers - 修饰键
     */
  bindKey(key, action, repeat = false, modifiers = []) {
    this.keyBindings.set(key, {
      key,
      action,
      repeat,
      modifiers
    });
  }

  /**
     * 解绑按键
     * @param {string} key - 按键代码
     */
  unbindKey(key) {
    this.keyBindings.delete(key);
  }

  /**
     * 绑定动作处理器
     * @param {string} action - 动作名称
     * @param {Function} handler - 处理函数
     */
  bindAction(action, handler) {
    this.actionHandlers.set(action, handler);
  }

  /**
     * 解绑动作处理器
     * @param {string} action - 动作名称
     */
  unbindAction(action) {
    this.actionHandlers.delete(action);
  }

  /**
     * 处理键盘按下事件
     * @param {KeyboardEvent} event - 键盘事件
     */
  handleKeyDown(event) {
    if (!this.enabled) return;
        
    const key = event.code;
    const wasPressed = this.keys.get(key);
        
    this.keys.set(key, true);
        
    if (!wasPressed) {
      this.keysPressed.set(key, true);
      this.addToHistory(`key_down:${key}`);
            
      // 处理按键绑定
      const binding = this.keyBindings.get(key);
      if (binding && this.checkModifiers(event, binding.modifiers)) {
        this.triggerAction(binding.action, { type: 'keydown', key, event });
                
        if (this.preventDefaults) {
          event.preventDefault();
        }
      }
    } else if (this.keyBindings.has(key)) {
      const binding = this.keyBindings.get(key);
      if (binding.repeat && this.checkModifiers(event, binding.modifiers)) {
        this.triggerAction(binding.action, { type: 'keyrepeat', key, event });
      }
    }
  }

  /**
     * 处理键盘释放事件
     * @param {KeyboardEvent} event - 键盘事件
     */
  handleKeyUp(event) {
    if (!this.enabled) return;
        
    const key = event.code;
        
    this.keys.set(key, false);
    this.keysReleased.set(key, true);
    this.addToHistory(`key_up:${key}`);
        
    // 处理按键绑定
    const binding = this.keyBindings.get(key);
    if (binding && this.checkModifiers(event, binding.modifiers)) {
      this.triggerAction(binding.action, { type: 'keyup', key, event });
            
      if (this.preventDefaults) {
        event.preventDefault();
      }
    }
  }

  /**
     * 处理鼠标按下事件
     * @param {MouseEvent} event - 鼠标事件
     */
  handleMouseDown(event) {
    if (!this.enabled) return;
        
    this.updateMousePosition(event);
        
    switch (event.button) {
    case 0: // 左键
      this.mouse.left = true;
      this.mousePressed.left = true;
      break;
    case 1: // 中键
      this.mouse.middle = true;
      this.mousePressed.middle = true;
      break;
    case 2: // 右键
      this.mouse.right = true;
      this.mousePressed.right = true;
      break;
    }
        
    this.addToHistory(`mouse_down:${event.button}`);
    this.triggerAction('mouse_down', { type: 'mousedown', button: event.button, event });
        
    if (this.preventDefaults) {
      event.preventDefault();
    }
  }

  /**
     * 处理鼠标释放事件
     * @param {MouseEvent} event - 鼠标事件
     */
  handleMouseUp(event) {
    if (!this.enabled) return;
        
    this.updateMousePosition(event);
        
    switch (event.button) {
    case 0: // 左键
      this.mouse.left = false;
      this.mouseReleased.left = true;
      break;
    case 1: // 中键
      this.mouse.middle = false;
      this.mouseReleased.middle = true;
      break;
    case 2: // 右键
      this.mouse.right = false;
      this.mouseReleased.right = true;
      break;
    }
        
    this.addToHistory(`mouse_up:${event.button}`);
    this.triggerAction('mouse_up', { type: 'mouseup', button: event.button, event });
  }

  /**
     * 处理鼠标移动事件
     * @param {MouseEvent} event - 鼠标事件
     */
  handleMouseMove(event) {
    if (!this.enabled) return;
        
    this.updateMousePosition(event);
    this.triggerAction('mouse_move', { type: 'mousemove', event });
  }

  /**
     * 处理滚轮事件
     * @param {WheelEvent} event - 滚轮事件
     */
  handleWheel(event) {
    if (!this.enabled) return;
        
    this.mouse.wheel = event.deltaY;
    this.addToHistory(`wheel:${event.deltaY}`);
    this.triggerAction('mouse_wheel', { type: 'wheel', delta: event.deltaY, event });
        
    if (this.preventDefaults) {
      event.preventDefault();
    }
  }

  /**
     * 处理右键菜单事件
     * @param {Event} event - 事件
     */
  handleContextMenu(event) {
    if (this.preventDefaults) {
      event.preventDefault();
    }
  }

  /**
     * 处理触摸开始事件
     * @param {TouchEvent} event - 触摸事件
     */
  handleTouchStart(event) {
    if (!this.enabled) return;
        
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const rect = this.element.getBoundingClientRect();
            
      this.touches.push({
        id: touch.identifier,
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        active: true
      });
    }
        
    this.addToHistory(`touch_start:${event.changedTouches.length}`);
    this.triggerAction('touch_start', { type: 'touchstart', event });
        
    if (this.preventDefaults) {
      event.preventDefault();
    }
  }

  /**
     * 处理触摸移动事件
     * @param {TouchEvent} event - 触摸事件
     */
  handleTouchMove(event) {
    if (!this.enabled) return;
        
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const existingTouch = this.touches.find(t => t.id === touch.identifier);
            
      if (existingTouch) {
        const rect = this.element.getBoundingClientRect();
        existingTouch.x = touch.clientX - rect.left;
        existingTouch.y = touch.clientY - rect.top;
      }
    }
        
    this.triggerAction('touch_move', { type: 'touchmove', event });
        
    if (this.preventDefaults) {
      event.preventDefault();
    }
  }

  /**
     * 处理触摸结束事件
     * @param {TouchEvent} event - 触摸事件
     */
  handleTouchEnd(event) {
    if (!this.enabled) return;
        
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const index = this.touches.findIndex(t => t.id === touch.identifier);
            
      if (index !== -1) {
        this.touches[index].active = false;
        this.touches.splice(index, 1);
      }
    }
        
    this.addToHistory(`touch_end:${event.changedTouches.length}`);
    this.triggerAction('touch_end', { type: 'touchend', event });
  }

  /**
     * 处理触摸取消事件
     * @param {TouchEvent} event - 触摸事件
     */
  handleTouchCancel(event) {
    this.handleTouchEnd(event);
  }

  /**
     * 处理窗口失焦事件
     */
  handleWindowBlur() {
    // 清除所有按键状态
    this.keys.clear();
    this.mouse.left = false;
    this.mouse.right = false;
    this.mouse.middle = false;
    this.touches = [];
  }

  /**
     * 处理窗口获焦事件
     */
  handleWindowFocus() {
    // 重置输入状态
    this.clearFrameStates();
  }

  /**
     * 处理手柄连接事件
     * @param {GamepadEvent} event - 手柄事件
     */
  handleGamepadConnected(event) {
    console.log('Gamepad connected:', event.gamepad.id);
    this.updateGamepadStates();
  }

  /**
     * 处理手柄断开事件
     * @param {GamepadEvent} event - 手柄事件
     */
  handleGamepadDisconnected(event) {
    console.log('Gamepad disconnected:', event.gamepad.id);
    this.updateGamepadStates();
  }

  /**
     * 更新鼠标位置
     * @param {MouseEvent} event - 鼠标事件
     */
  updateMousePosition(event) {
    const rect = this.element.getBoundingClientRect();
    this.mouse.x = event.clientX - rect.left;
    this.mouse.y = event.clientY - rect.top;
  }

  /**
     * 检查修饰键
     * @param {KeyboardEvent|MouseEvent} event - 事件
     * @param {Array<string>} modifiers - 修饰键列表
     * @returns {boolean} 是否匹配
     */
  checkModifiers(event, modifiers) {
    if (!modifiers || modifiers.length === 0) return true;
        
    return modifiers.every(modifier => {
      switch (modifier) {
      case 'ctrl':
        return event.ctrlKey;
      case 'shift':
        return event.shiftKey;
      case 'alt':
        return event.altKey;
      case 'meta':
        return event.metaKey;
      default:
        return false;
      }
    });
  }

  /**
     * 触发动作
     * @param {string} action - 动作名称
     * @param {Object} data - 事件数据
     */
  triggerAction(action, data) {
    const handler = this.actionHandlers.get(action);
    if (handler && typeof handler === 'function') {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in action handler for '${action}':`, error);
      }
    }
  }

  /**
     * 添加到输入历史
     * @param {string} entry - 历史条目
     */
  addToHistory(entry) {
    this.inputHistory.push(`${Date.now()}:${entry}`);
        
    if (this.inputHistory.length > this.maxHistoryLength) {
      this.inputHistory.shift();
    }
  }

  /**
     * 更新手柄状态
     */
  updateGamepadStates() {
    let gamepads = [];
    if (typeof navigator !== 'undefined' && navigator.getGamepads) {
      try {
        gamepads = navigator.getGamepads() || [];
      } catch (e) {
        console.warn('[Input] 无法获取手柄状态:', e.message);
      }
    }
    this.gamepads = [];
        
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      if (gamepad) {
        this.gamepads.push({
          connected: gamepad.connected,
          id: gamepad.id,
          buttons: gamepad.buttons.map(button => button.pressed),
          axes: [...gamepad.axes]
        });
      }
    }
  }

  /**
     * 更新输入状态
     */
  update() {
    // 更新手柄状态
    this.updateGamepadStates();
        
    // 处理手柄输入
    this.processGamepadInput();
        
    // 重置滚轮状态
    this.mouse.wheel = 0;
  }

  /**
     * 处理手柄输入
     */
  processGamepadInput() {
    this.gamepads.forEach((gamepad, index) => {
      if (!gamepad.connected) return;
            
      // 处理按钮
      gamepad.buttons.forEach((pressed, buttonIndex) => {
        if (pressed) {
          this.triggerAction(`gamepad_${index}_button_${buttonIndex}`, {
            type: 'gamepad',
            gamepadIndex: index,
            buttonIndex,
            pressed
          });
        }
      });
            
      // 处理摇杆
      gamepad.axes.forEach((value, axisIndex) => {
        if (Math.abs(value) > 0.1) { // 死区
          this.triggerAction(`gamepad_${index}_axis_${axisIndex}`, {
            type: 'gamepad',
            gamepadIndex: index,
            axisIndex,
            value
          });
        }
      });
    });
  }

  /**
     * 清除帧状态
     */
  clearFrameStates() {
    this.keysPressed.clear();
    this.keysReleased.clear();
        
    this.mousePressed.left = false;
    this.mousePressed.right = false;
    this.mousePressed.middle = false;
        
    this.mouseReleased.left = false;
    this.mouseReleased.right = false;
    this.mouseReleased.middle = false;
  }

  /**
     * 检查按键是否按下
     * @param {string} key - 按键代码
     * @returns {boolean} 是否按下
     */
  isKeyDown(key) {
    return this.keys.get(key) || false;
  }

  /**
     * 检查按键是否刚按下
     * @param {string} key - 按键代码
     * @returns {boolean} 是否刚按下
     */
  isKeyPressed(key) {
    return this.keysPressed.get(key) || false;
  }

  /**
     * 检查按键是否刚释放
     * @param {string} key - 按键代码
     * @returns {boolean} 是否刚释放
     */
  isKeyReleased(key) {
    return this.keysReleased.get(key) || false;
  }

  /**
     * 检查鼠标按钮是否按下
     * @param {string} button - 按钮名称 (left, right, middle)
     * @returns {boolean} 是否按下
     */
  isMouseDown(button) {
    return this.mouse[button] || false;
  }

  /**
     * 检查鼠标按钮是否刚按下
     * @param {string} button - 按钮名称 (left, right, middle)
     * @returns {boolean} 是否刚按下
     */
  isMousePressed(button) {
    return this.mousePressed[button] || false;
  }

  /**
     * 检查鼠标按钮是否刚释放
     * @param {string} button - 按钮名称 (left, right, middle)
     * @returns {boolean} 是否刚释放
     */
  isMouseReleased(button) {
    return this.mouseReleased[button] || false;
  }

  /**
     * 获取鼠标位置
     * @returns {{x: number, y: number}} 鼠标位置
     */
  getMousePosition() {
    return { x: this.mouse.x, y: this.mouse.y };
  }

  /**
     * 获取触摸列表
     * @returns {Array<TouchState>} 触摸列表
     */
  getTouches() {
    return [...this.touches];
  }

  /**
     * 获取手柄状态
     * @param {number} index - 手柄索引
     * @returns {GamepadState|null} 手柄状态
     */
  getGamepad(index) {
    return this.gamepads[index] || null;
  }

  /**
     * 获取所有按键绑定
     * @returns {Map<string, KeyBinding>} 按键绑定
     */
  getKeyBindings() {
    return new Map(this.keyBindings);
  }

  /**
     * 获取输入历史
     * @returns {Array<string>} 输入历史
     */
  getInputHistory() {
    return [...this.inputHistory];
  }

  /**
     * 清除输入历史
     */
  clearInputHistory() {
    this.inputHistory = [];
  }

  /**
     * 启用输入
     */
  enable() {
    this.enabled = true;
  }

  /**
     * 禁用输入
     */
  disable() {
    this.enabled = false;
    this.clearFrameStates();
  }

  /**
     * 设置是否阻止默认行为
     * @param {boolean} prevent - 是否阻止
     */
  setPreventDefaults(prevent) {
    this.preventDefaults = prevent;
  }

  /**
     * 重置输入状态
     */
  reset() {
    this.keys.clear();
    this.keysPressed.clear();
    this.keysReleased.clear();
        
    this.mouse = {
      x: 0,
      y: 0,
      left: false,
      right: false,
      middle: false,
      wheel: 0
    };
        
    this.mousePressed = {
      x: 0,
      y: 0,
      left: false,
      right: false,
      middle: false,
      wheel: 0
    };
        
    this.mouseReleased = {
      x: 0,
      y: 0,
      left: false,
      right: false,
      middle: false,
      wheel: 0
    };
        
    this.touches = [];
    this.gamepads = [];
    this.inputHistory = [];
  }

  /**
     * 销毁输入管理器
     */
  destroy() {
    // 移除事件监听器
    this.element.removeEventListener('keydown', this.handleKeyDown);
    this.element.removeEventListener('keyup', this.handleKeyUp);
    this.element.removeEventListener('mousedown', this.handleMouseDown);
    this.element.removeEventListener('mouseup', this.handleMouseUp);
    this.element.removeEventListener('mousemove', this.handleMouseMove);
    this.element.removeEventListener('wheel', this.handleWheel);
    this.element.removeEventListener('contextmenu', this.handleContextMenu);
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchCancel);
        
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('focus', this.handleWindowFocus);
    window.removeEventListener('gamepadconnected', this.handleGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.handleGamepadDisconnected);
        
    // 清除状态
    this.reset();
    this.keyBindings.clear();
    this.actionHandlers.clear();
  }
}

/**
 * 默认导出输入管理器
 */
export default InputManager;