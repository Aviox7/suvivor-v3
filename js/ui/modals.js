/**
 * UI Modals module - 模态对话框模块
 * @module Modals
 */

/**
 * @typedef {Object} ModalConfig
 * @property {string} id - 模态框ID
 * @property {string} title - 标题
 * @property {string} content - 内容
 * @property {number} width - 宽度
 * @property {number} height - 高度
 * @property {boolean} closable - 是否可关闭
 * @property {boolean} draggable - 是否可拖拽
 * @property {string} type - 模态框类型
 * @property {Array<ModalButton>} buttons - 按钮列表
 * @property {Function} onShow - 显示回调
 * @property {Function} onHide - 隐藏回调
 * @property {Function} onClose - 关闭回调
 */

/**
 * @typedef {Object} ModalButton
 * @property {string} id - 按钮ID
 * @property {string} text - 按钮文本
 * @property {string} type - 按钮类型 (primary, secondary, danger)
 * @property {Function} onClick - 点击回调
 * @property {boolean} enabled - 是否启用
 * @property {boolean} autoClose - 点击后是否自动关闭模态框
 */

/**
 * @typedef {Object} ConfirmOptions
 * @property {string} title - 标题
 * @property {string} message - 消息
 * @property {string} confirmText - 确认按钮文本
 * @property {string} cancelText - 取消按钮文本
 * @property {Function} onConfirm - 确认回调
 * @property {Function} onCancel - 取消回调
 */

/**
 * @typedef {Object} AlertOptions
 * @property {string} title - 标题
 * @property {string} message - 消息
 * @property {string} type - 类型 (info, warning, error, success)
 * @property {string} buttonText - 按钮文本
 * @property {Function} onClose - 关闭回调
 */

/**
 * @typedef {Object} InputOptions
 * @property {string} title - 标题
 * @property {string} message - 消息
 * @property {string} placeholder - 输入框占位符
 * @property {string} defaultValue - 默认值
 * @property {string} inputType - 输入类型
 * @property {Function} onConfirm - 确认回调
 * @property {Function} onCancel - 取消回调
 * @property {Function} validator - 验证函数
 */

/**
 * 基础模态框类
 */
export class BaseModal {
  /**
     * 构造函数
     * @param {ModalConfig} config - 模态框配置
     */
  constructor(config) {
    /** @type {string} */
    this.id = config.id;
        
    /** @type {string} */
    this.title = config.title || '';
        
    /** @type {string} */
    this.content = config.content || '';
        
    /** @type {number} */
    this.width = config.width || 400;
        
    /** @type {number} */
    this.height = config.height || 300;
        
    /** @type {boolean} */
    this.closable = config.closable !== false;
        
    /** @type {boolean} */
    this.draggable = config.draggable !== false;
        
    /** @type {string} */
    this.type = config.type || 'default';
        
    /** @type {Array<ModalButton>} */
    this.buttons = config.buttons || [];
        
    /** @type {Function|null} */
    this.onShow = config.onShow || null;
        
    /** @type {Function|null} */
    this.onHide = config.onHide || null;
        
    /** @type {Function|null} */
    this.onClose = config.onClose || null;
        
    /** @type {boolean} */
    this.visible = false;
        
    /** @type {boolean} */
    this.isDragging = false;
        
    /** @type {Object} */
    this.dragOffset = { x: 0, y: 0 };
        
    /** @type {number} */
    this.x = 0;
        
    /** @type {number} */
    this.y = 0;
        
    /** @type {number} */
    this.alpha = 0;
        
    /** @type {number} */
    this.targetAlpha = 0;
        
    /** @type {number} */
    this.animationSpeed = 8;
        
    /** @type {Map<string, Function>} */
    this.eventHandlers = new Map();
        
    /** @type {Object} */
    this.inputState = {
      text: '',
      cursorPosition: 0,
      focused: false
    };
        
    this.initializeThemes();
    this.calculatePosition();
  }

  /**
     * 初始化主题
     */
  initializeThemes() {
    this.themes = {
      default: {
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        backgroundColor: 'rgba(50, 50, 50, 0.95)',
        borderColor: '#666',
        titleColor: '#fff',
        textColor: '#ddd',
        buttonColors: {
          primary: '#4a90e2',
          secondary: '#666',
          danger: '#e74c3c',
          success: '#27ae60'
        },
        borderWidth: 2,
        borderRadius: 8,
        titleHeight: 40,
        padding: 20,
        buttonHeight: 35,
        buttonSpacing: 10
      },
      dark: {
        overlayColor: 'rgba(0, 0, 0, 0.7)',
        backgroundColor: 'rgba(30, 30, 30, 0.98)',
        borderColor: '#444',
        titleColor: '#fff',
        textColor: '#ccc',
        buttonColors: {
          primary: '#3a7bd5',
          secondary: '#555',
          danger: '#c0392b',
          success: '#229954'
        },
        borderWidth: 1,
        borderRadius: 6,
        titleHeight: 35,
        padding: 15,
        buttonHeight: 30,
        buttonSpacing: 8
      }
    };
  }

  /**
     * 获取当前主题
     * @returns {Object} 主题配置
     */
  getCurrentTheme() {
    return this.themes[this.type] || this.themes.default;
  }

  /**
     * 计算模态框位置（居中）
     */
  calculatePosition() {
    // 假设画布大小为800x600，实际使用时应该从外部传入
    const canvasWidth = 800;
    const canvasHeight = 600;
        
    this.x = (canvasWidth - this.width) / 2;
    this.y = (canvasHeight - this.height) / 2;
  }

  /**
     * 显示模态框
     */
  show() {
    this.visible = true;
    this.targetAlpha = 1;
        
    if (this.onShow) {
      this.onShow();
    }
        
    this.emit('show');
  }

  /**
     * 隐藏模态框
     */
  hide() {
    this.targetAlpha = 0;
        
    if (this.onHide) {
      this.onHide();
    }
        
    this.emit('hide');
  }

  /**
     * 关闭模态框
     */
  close() {
    this.hide();
        
    if (this.onClose) {
      this.onClose();
    }
        
    this.emit('close');
  }

  /**
     * 添加事件监听器
     * @param {string} event - 事件名称
     * @param {Function} handler - 事件处理函数
     */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
     * 移除事件监听器
     * @param {string} event - 事件名称
     * @param {Function} handler - 事件处理函数
     */
  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
     * 触发事件
     * @param {string} event - 事件名称
     * @param {any} data - 事件数据
     */
  emit(event, data = null) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in modal event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
     * 检查点是否在模态框内
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {boolean} 是否在模态框内
     */
  containsPoint(x, y) {
    return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
  }

  /**
     * 检查点是否在标题栏内
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {boolean} 是否在标题栏内
     */
  containsPointInTitle(x, y) {
    const theme = this.getCurrentTheme();
    return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + theme.titleHeight;
  }

  /**
     * 处理鼠标按下事件
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} button - 鼠标按钮
     * @returns {boolean} 是否处理了事件
     */
  handleMouseDown(x, y, button) {
    if (!this.visible || this.alpha < 0.5) return false;
        
    // 检查是否点击在模态框外（关闭模态框）
    if (!this.containsPoint(x, y)) {
      if (this.closable) {
        this.close();
      }
      return true; // 阻止事件穿透
    }
        
    // 检查按钮点击
    const clickedButton = this.getButtonAt(x, y);
    if (clickedButton && clickedButton.enabled && clickedButton.onClick) {
      clickedButton.onClick();
            
      if (clickedButton.autoClose !== false) {
        this.close();
      }
            
      return true;
    }
        
    // 检查关闭按钮
    if (this.closable && this.isCloseButtonAt(x, y)) {
      this.close();
      return true;
    }
        
    // 检查拖拽
    if (this.draggable && this.containsPointInTitle(x, y)) {
      this.isDragging = true;
      this.dragOffset.x = x - this.x;
      this.dragOffset.y = y - this.y;
      return true;
    }
        
    // 检查输入框点击
    this.handleInputClick(x, y);
        
    return true; // 阻止事件穿透
  }

  /**
     * 处理鼠标移动事件
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {boolean} 是否处理了事件
     */
  handleMouseMove(x, y) {
    if (!this.visible || this.alpha < 0.5) return false;
        
    if (this.isDragging) {
      this.x = x - this.dragOffset.x;
      this.y = y - this.dragOffset.y;
      return true;
    }
        
    return false;
  }

  /**
     * 处理鼠标释放事件
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} button - 鼠标按钮
     * @returns {boolean} 是否处理了事件
     */
  handleMouseUp(x, y, button) {
    if (!this.visible || this.alpha < 0.5) return false;
        
    if (this.isDragging) {
      this.isDragging = false;
      return true;
    }
        
    return false;
  }

  /**
     * 处理键盘事件
     * @param {string} key - 按键
     * @param {boolean} isDown - 是否按下
     * @returns {boolean} 是否处理了事件
     */
  handleKeyboard(key, isDown) {
    if (!this.visible || this.alpha < 0.5 || !isDown) return false;
        
    // ESC键关闭模态框
    if (key === 'Escape' && this.closable) {
      this.close();
      return true;
    }
        
    // 处理输入框键盘事件
    return this.handleInputKeyboard(key);
  }

  /**
     * 处理输入框点击
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
  handleInputClick(x, y) {
    // 由子类实现
  }

  /**
     * 处理输入框键盘事件
     * @param {string} key - 按键
     * @returns {boolean} 是否处理了事件
     */
  handleInputKeyboard(key) {
    // 由子类实现
    return false;
  }

  /**
     * 获取指定位置的按钮
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {ModalButton|null} 按钮对象
     */
  getButtonAt(x, y) {
    const theme = this.getCurrentTheme();
    const buttonWidth = 100;
    const totalButtonWidth = this.buttons.length * buttonWidth + (this.buttons.length - 1) * theme.buttonSpacing;
        
    let buttonX = this.x + (this.width - totalButtonWidth) / 2;
    const buttonY = this.y + this.height - theme.padding - theme.buttonHeight;
        
    for (const button of this.buttons) {
      if (x >= buttonX && x <= buttonX + buttonWidth &&
                y >= buttonY && y <= buttonY + theme.buttonHeight) {
        return button;
      }
            
      buttonX += buttonWidth + theme.buttonSpacing;
    }
        
    return null;
  }

  /**
     * 检查是否点击了关闭按钮
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {boolean} 是否点击了关闭按钮
     */
  isCloseButtonAt(x, y) {
    const theme = this.getCurrentTheme();
    const closeButtonSize = 20;
    const closeButtonX = this.x + this.width - closeButtonSize - 10;
    const closeButtonY = this.y + 10;
        
    return x >= closeButtonX && x <= closeButtonX + closeButtonSize &&
               y >= closeButtonY && y <= closeButtonY + closeButtonSize;
  }

  /**
     * 更新模态框
     * @param {number} deltaTime - 时间间隔
     */
  update(deltaTime) {
    // 更新透明度动画
    if (Math.abs(this.alpha - this.targetAlpha) > 0.01) {
      const diff = this.targetAlpha - this.alpha;
      this.alpha += diff * this.animationSpeed * deltaTime;
            
      if (Math.abs(diff) < 0.01) {
        this.alpha = this.targetAlpha;
                
        if (this.alpha === 0) {
          this.visible = false;
        }
      }
    }
  }

  /**
     * 渲染模态框
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
  render(ctx) {
    if (!this.visible && this.alpha === 0) return;
        
    const theme = this.getCurrentTheme();
        
    ctx.save();
    ctx.globalAlpha = this.alpha;
        
    // 渲染遮罩层
    this.renderOverlay(ctx, theme);
        
    // 渲染模态框背景
    this.renderBackground(ctx, theme);
        
    // 渲染标题栏
    this.renderTitleBar(ctx, theme);
        
    // 渲染内容
    this.renderContent(ctx, theme);
        
    // 渲染按钮
    this.renderButtons(ctx, theme);
        
    ctx.restore();
  }

  /**
     * 渲染遮罩层
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Object} theme - 主题配置
     */
  renderOverlay(ctx, theme) {
    ctx.fillStyle = theme.overlayColor;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  /**
     * 渲染背景
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Object} theme - 主题配置
     */
  renderBackground(ctx, theme) {
    // 绘制阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 5;
        
    // 绘制背景
    ctx.fillStyle = theme.backgroundColor;
    ctx.fillRect(this.x, this.y, this.width, this.height);
        
    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
        
    // 绘制边框
    ctx.strokeStyle = theme.borderColor;
    ctx.lineWidth = theme.borderWidth;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
  }

  /**
     * 渲染标题栏
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Object} theme - 主题配置
     */
  renderTitleBar(ctx, theme) {
    if (!this.title) return;
        
    // 绘制标题栏背景
    const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + theme.titleHeight);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
        
    ctx.fillStyle = gradient;
    ctx.fillRect(this.x, this.y, this.width, theme.titleHeight);
        
    // 绘制标题栏分割线
    ctx.strokeStyle = theme.borderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + theme.titleHeight);
    ctx.lineTo(this.x + this.width, this.y + theme.titleHeight);
    ctx.stroke();
        
    // 绘制标题文本
    ctx.fillStyle = theme.titleColor;
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      this.title,
      this.x + theme.padding,
      this.y + theme.titleHeight / 2
    );
        
    // 绘制关闭按钮
    if (this.closable) {
      const closeButtonSize = 20;
      const closeButtonX = this.x + this.width - closeButtonSize - 10;
      const closeButtonY = this.y + 10;
            
      ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
      ctx.fillRect(closeButtonX, closeButtonY, closeButtonSize, closeButtonSize);
            
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(closeButtonX + 5, closeButtonY + 5);
      ctx.lineTo(closeButtonX + closeButtonSize - 5, closeButtonY + closeButtonSize - 5);
      ctx.moveTo(closeButtonX + closeButtonSize - 5, closeButtonY + 5);
      ctx.lineTo(closeButtonX + 5, closeButtonY + closeButtonSize - 5);
      ctx.stroke();
    }
  }

  /**
     * 渲染内容
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Object} theme - 主题配置
     */
  renderContent(ctx, theme) {
    const contentX = this.x + theme.padding;
    const contentY = this.y + theme.titleHeight + theme.padding;
    const contentWidth = this.width - theme.padding * 2;
    const contentHeight = this.height - theme.titleHeight - theme.padding * 3 - theme.buttonHeight;
        
    // 设置裁剪区域
    ctx.save();
    ctx.beginPath();
    ctx.rect(contentX, contentY, contentWidth, contentHeight);
    ctx.clip();
        
    // 渲染内容文本
    if (this.content) {
      ctx.fillStyle = theme.textColor;
      ctx.font = '14px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
            
      // 简单的文本换行处理
      const lines = this.wrapText(ctx, this.content, contentWidth);
      const lineHeight = 20;
            
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], contentX, contentY + i * lineHeight);
      }
    }
        
    // 渲染自定义内容（由子类实现）
    this.renderModalContent(ctx, contentX, contentY, contentWidth, contentHeight, theme);
        
    ctx.restore();
  }

  /**
     * 渲染模态框具体内容（由子类重写）
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {number} x - 内容区域X坐标
     * @param {number} y - 内容区域Y坐标
     * @param {number} width - 内容区域宽度
     * @param {number} height - 内容区域高度
     * @param {Object} theme - 主题配置
     */
  renderModalContent(ctx, x, y, width, height, theme) {
    // 由子类实现
  }

  /**
     * 渲染按钮
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Object} theme - 主题配置
     */
  renderButtons(ctx, theme) {
    if (this.buttons.length === 0) return;
        
    const buttonWidth = 100;
    const totalButtonWidth = this.buttons.length * buttonWidth + (this.buttons.length - 1) * theme.buttonSpacing;
        
    let buttonX = this.x + (this.width - totalButtonWidth) / 2;
    const buttonY = this.y + this.height - theme.padding - theme.buttonHeight;
        
    for (const button of this.buttons) {
      // 获取按钮颜色
      const buttonColor = theme.buttonColors[button.type] || theme.buttonColors.secondary;
            
      // 绘制按钮背景
      ctx.fillStyle = button.enabled ? buttonColor : 'rgba(100, 100, 100, 0.5)';
      ctx.fillRect(buttonX, buttonY, buttonWidth, theme.buttonHeight);
            
      // 绘制按钮边框
      ctx.strokeStyle = theme.borderColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(buttonX, buttonY, buttonWidth, theme.buttonHeight);
            
      // 绘制按钮文本
      ctx.fillStyle = button.enabled ? '#fff' : 'rgba(255, 255, 255, 0.5)';
      ctx.font = '14px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        button.text,
        buttonX + buttonWidth / 2,
        buttonY + theme.buttonHeight / 2
      );
            
      buttonX += buttonWidth + theme.buttonSpacing;
    }
  }

  /**
     * 文本换行处理
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {string} text - 文本
     * @param {number} maxWidth - 最大宽度
     * @returns {Array<string>} 换行后的文本数组
     */
  wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
        
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
            
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
        
    if (currentLine) {
      lines.push(currentLine);
    }
        
    return lines;
  }

  /**
     * 销毁模态框
     */
  destroy() {
    this.eventHandlers.clear();
    this.buttons = [];
  }
}

/**
 * 确认对话框类
 */
export class ConfirmModal extends BaseModal {
  /**
     * 构造函数
     * @param {ConfirmOptions} options - 确认对话框选项
     */
  constructor(options) {
    super({
      id: 'confirm-modal',
      title: options.title || 'Confirm',
      content: options.message || 'Are you sure?',
      width: 350,
      height: 180,
      buttons: [
        {
          id: 'cancel',
          text: options.cancelText || 'Cancel',
          type: 'secondary',
          enabled: true,
          autoClose: true,
          onClick: () => {
            if (options.onCancel) {
              options.onCancel();
            }
          }
        },
        {
          id: 'confirm',
          text: options.confirmText || 'Confirm',
          type: 'primary',
          enabled: true,
          autoClose: true,
          onClick: () => {
            if (options.onConfirm) {
              options.onConfirm();
            }
          }
        }
      ]
    });
  }
}

/**
 * 警告对话框类
 */
export class AlertModal extends BaseModal {
  /**
     * 构造函数
     * @param {AlertOptions} options - 警告对话框选项
     */
  constructor(options) {
    const typeColors = {
      info: '#4a90e2',
      warning: '#f39c12',
      error: '#e74c3c',
      success: '#27ae60'
    };
        
    super({
      id: 'alert-modal',
      title: options.title || options.type.charAt(0).toUpperCase() + options.type.slice(1),
      content: options.message || 'Alert message',
      width: 300,
      height: 150,
      type: options.type || 'info',
      buttons: [
        {
          id: 'ok',
          text: options.buttonText || 'OK',
          type: 'primary',
          enabled: true,
          autoClose: true,
          onClick: () => {
            if (options.onClose) {
              options.onClose();
            }
          }
        }
      ]
    });
        
    /** @type {string} */
    this.alertType = options.type || 'info';
        
    /** @type {string} */
    this.alertColor = typeColors[this.alertType] || typeColors.info;
  }

  /**
     * 渲染标题栏
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Object} theme - 主题配置
     */
  renderTitleBar(ctx, theme) {
    super.renderTitleBar(ctx, theme);
        
    // 绘制类型图标
    const iconSize = 16;
    const iconX = this.x + theme.padding + ctx.measureText(this.title).width + 10;
    const iconY = this.y + (theme.titleHeight - iconSize) / 2;
        
    ctx.fillStyle = this.alertColor;
    ctx.fillRect(iconX, iconY, iconSize, iconSize);
        
    // 绘制图标符号
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
        
    let iconText = '!';
    switch (this.alertType) {
    case 'info': iconText = 'i'; break;
    case 'warning': iconText = '!'; break;
    case 'error': iconText = '×'; break;
    case 'success': iconText = '✓'; break;
    }
        
    ctx.fillText(iconText, iconX + iconSize / 2, iconY + iconSize / 2);
  }
}

/**
 * 输入对话框类
 */
export class InputModal extends BaseModal {
  /**
     * 构造函数
     * @param {InputOptions} options - 输入对话框选项
     */
  constructor(options) {
    super({
      id: 'input-modal',
      title: options.title || 'Input',
      content: options.message || 'Please enter a value:',
      width: 400,
      height: 200,
      buttons: [
        {
          id: 'cancel',
          text: 'Cancel',
          type: 'secondary',
          enabled: true,
          autoClose: true,
          onClick: () => {
            if (options.onCancel) {
              options.onCancel();
            }
          }
        },
        {
          id: 'ok',
          text: 'OK',
          type: 'primary',
          enabled: true,
          autoClose: false,
          onClick: () => {
            if (this.validateInput()) {
              if (options.onConfirm) {
                options.onConfirm(this.inputState.text);
              }
              this.close();
            }
          }
        }
      ]
    });
        
    /** @type {string} */
    this.placeholder = options.placeholder || '';
        
    /** @type {string} */
    this.inputType = options.inputType || 'text';
        
    /** @type {Function|null} */
    this.validator = options.validator || null;
        
    /** @type {string} */
    this.errorMessage = '';
        
    // 设置默认值
    this.inputState.text = options.defaultValue || '';
    this.inputState.cursorPosition = this.inputState.text.length;
    this.inputState.focused = true;
  }

  /**
     * 验证输入
     * @returns {boolean} 是否有效
     */
  validateInput() {
    if (this.validator) {
      const result = this.validator(this.inputState.text);
      if (result !== true) {
        this.errorMessage = typeof result === 'string' ? result : 'Invalid input';
        return false;
      }
    }
        
    this.errorMessage = '';
    return true;
  }

  /**
     * 处理输入框点击
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
  handleInputClick(x, y) {
    const theme = this.getCurrentTheme();
    const inputX = this.x + theme.padding;
    const inputY = this.y + theme.titleHeight + theme.padding + 40;
    const inputWidth = this.width - theme.padding * 2;
    const inputHeight = 30;
        
    if (x >= inputX && x <= inputX + inputWidth &&
            y >= inputY && y <= inputY + inputHeight) {
      this.inputState.focused = true;
            
      // 计算光标位置
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.font = '14px Arial, sans-serif';
            
      let cursorPos = 0;
      for (let i = 0; i <= this.inputState.text.length; i++) {
        const textWidth = ctx.measureText(this.inputState.text.substring(0, i)).width;
        if (x <= inputX + 5 + textWidth) {
          cursorPos = i;
          break;
        }
        cursorPos = i;
      }
            
      this.inputState.cursorPosition = cursorPos;
    } else {
      this.inputState.focused = false;
    }
  }

  /**
     * 处理输入框键盘事件
     * @param {string} key - 按键
     * @returns {boolean} 是否处理了事件
     */
  handleInputKeyboard(key) {
    if (!this.inputState.focused) return false;
        
    switch (key) {
    case 'Backspace':
      if (this.inputState.cursorPosition > 0) {
        this.inputState.text = 
                        this.inputState.text.substring(0, this.inputState.cursorPosition - 1) +
                        this.inputState.text.substring(this.inputState.cursorPosition);
        this.inputState.cursorPosition--;
      }
      return true;
                
    case 'Delete':
      if (this.inputState.cursorPosition < this.inputState.text.length) {
        this.inputState.text = 
                        this.inputState.text.substring(0, this.inputState.cursorPosition) +
                        this.inputState.text.substring(this.inputState.cursorPosition + 1);
      }
      return true;
                
    case 'ArrowLeft':
      if (this.inputState.cursorPosition > 0) {
        this.inputState.cursorPosition--;
      }
      return true;
                
    case 'ArrowRight':
      if (this.inputState.cursorPosition < this.inputState.text.length) {
        this.inputState.cursorPosition++;
      }
      return true;
                
    case 'Home':
      this.inputState.cursorPosition = 0;
      return true;
                
    case 'End':
      this.inputState.cursorPosition = this.inputState.text.length;
      return true;
                
    case 'Enter':
      // 触发确认按钮
      const okButton = this.buttons.find(btn => btn.id === 'ok');
      if (okButton && okButton.onClick) {
        okButton.onClick();
      }
      return true;
                
    default:
      // 处理可打印字符
      if (key.length === 1 && key >= ' ' && key <= '~') {
        this.inputState.text = 
                        this.inputState.text.substring(0, this.inputState.cursorPosition) +
                        key +
                        this.inputState.text.substring(this.inputState.cursorPosition);
        this.inputState.cursorPosition++;
        return true;
      }
      break;
    }
        
    return false;
  }

  /**
     * 渲染模态框内容
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {number} x - 内容区域X坐标
     * @param {number} y - 内容区域Y坐标
     * @param {number} width - 内容区域宽度
     * @param {number} height - 内容区域高度
     * @param {Object} theme - 主题配置
     */
  renderModalContent(ctx, x, y, width, height, theme) {
    // 渲染输入框
    const inputY = y + 40;
    const inputHeight = 30;
        
    // 绘制输入框背景
    ctx.fillStyle = this.inputState.focused ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(x, inputY, width, inputHeight);
        
    // 绘制输入框边框
    ctx.strokeStyle = this.inputState.focused ? '#4a90e2' : theme.borderColor;
    ctx.lineWidth = this.inputState.focused ? 2 : 1;
    ctx.strokeRect(x, inputY, width, inputHeight);
        
    // 绘制输入文本或占位符
    ctx.font = '14px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
        
    const textY = inputY + inputHeight / 2;
    const textX = x + 5;
        
    if (this.inputState.text) {
      ctx.fillStyle = theme.textColor;
      ctx.fillText(this.inputState.text, textX, textY);
    } else if (this.placeholder) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText(this.placeholder, textX, textY);
    }
        
    // 绘制光标
    if (this.inputState.focused && Math.floor(Date.now() / 500) % 2 === 0) {
      const cursorText = this.inputState.text.substring(0, this.inputState.cursorPosition);
      const cursorX = textX + ctx.measureText(cursorText).width;
            
      ctx.strokeStyle = theme.textColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cursorX, inputY + 5);
      ctx.lineTo(cursorX, inputY + inputHeight - 5);
      ctx.stroke();
    }
        
    // 绘制错误消息
    if (this.errorMessage) {
      ctx.fillStyle = '#e74c3c';
      ctx.font = '12px Arial, sans-serif';
      ctx.fillText(this.errorMessage, x, inputY + inputHeight + 20);
    }
  }
}

/**
 * 模态框管理器
 */
export class ModalManager {
  /**
     * 构造函数
     */
  constructor() {
    /** @type {Array<BaseModal>} */
    this.modals = [];
        
    /** @type {boolean} */
    this.enabled = true;
  }

  /**
     * 显示确认对话框
     * @param {ConfirmOptions} options - 确认对话框选项
     * @returns {ConfirmModal} 确认对话框实例
     */
  showConfirm(options) {
    const modal = new ConfirmModal(options);
    this.addModal(modal);
    modal.show();
    return modal;
  }

  /**
     * 显示警告对话框
     * @param {AlertOptions} options - 警告对话框选项
     * @returns {AlertModal} 警告对话框实例
     */
  showAlert(options) {
    const modal = new AlertModal(options);
    this.addModal(modal);
    modal.show();
    return modal;
  }

  /**
     * 显示输入对话框
     * @param {InputOptions} options - 输入对话框选项
     * @returns {InputModal} 输入对话框实例
     */
  showInput(options) {
    const modal = new InputModal(options);
    this.addModal(modal);
    modal.show();
    return modal;
  }

  /**
     * 添加模态框
     * @param {BaseModal} modal - 模态框实例
     */
  addModal(modal) {
    this.modals.push(modal);
        
    // 监听关闭事件，自动移除
    modal.on('hide', () => {
      setTimeout(() => {
        this.removeModal(modal);
      }, 300); // 等待动画完成
    });
  }

  /**
     * 移除模态框
     * @param {BaseModal} modal - 模态框实例
     */
  removeModal(modal) {
    const index = this.modals.indexOf(modal);
    if (index > -1) {
      this.modals.splice(index, 1);
      modal.destroy();
    }
  }

  /**
     * 关闭所有模态框
     */
  closeAll() {
    this.modals.forEach(modal => modal.close());
  }

  /**
     * 处理鼠标事件
     * @param {string} eventType - 事件类型
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} button - 鼠标按钮
     * @returns {boolean} 是否处理了事件
     */
  handleMouseEvent(eventType, x, y, button = 0) {
    if (!this.enabled || this.modals.length === 0) return false;
        
    // 从最后一个（最上层）模态框开始处理
    for (let i = this.modals.length - 1; i >= 0; i--) {
      const modal = this.modals[i];
            
      let handled = false;
            
      switch (eventType) {
      case 'mousedown':
        handled = modal.handleMouseDown(x, y, button);
        break;
      case 'mousemove':
        handled = modal.handleMouseMove(x, y);
        break;
      case 'mouseup':
        handled = modal.handleMouseUp(x, y, button);
        break;
      }
            
      if (handled) {
        return true;
      }
    }
        
    return false;
  }

  /**
     * 处理键盘事件
     * @param {string} key - 按键
     * @param {boolean} isDown - 是否按下
     * @returns {boolean} 是否处理了事件
     */
  handleKeyboard(key, isDown) {
    if (!this.enabled || this.modals.length === 0) return false;
        
    // 只有最上层的模态框处理键盘事件
    const topModal = this.modals[this.modals.length - 1];
    return topModal.handleKeyboard(key, isDown);
  }

  /**
     * 更新所有模态框
     * @param {number} deltaTime - 时间间隔
     */
  update(deltaTime) {
    if (!this.enabled) return;
        
    this.modals.forEach(modal => modal.update(deltaTime));
  }

  /**
     * 渲染所有模态框
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
  render(ctx) {
    if (!this.enabled) return;
        
    this.modals.forEach(modal => modal.render(ctx));
  }

  /**
     * 启用/禁用模态框管理器
     * @param {boolean} enabled - 是否启用
     */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
     * 检查是否有可见的模态框
     * @returns {boolean} 是否有可见的模态框
     */
  hasVisibleModal() {
    return this.modals.some(modal => modal.visible);
  }

  /**
     * 销毁所有模态框
     */
  destroy() {
    this.modals.forEach(modal => modal.destroy());
    this.modals = [];
  }
}

/**
 * 默认导出模态框管理器
 */
export default ModalManager;