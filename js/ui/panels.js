/**
 * UI Panels module - 游戏面板模块
 * @module Panels
 */

/**
 * @typedef {Object} PanelConfig
 * @property {string} id - 面板ID
 * @property {string} title - 面板标题
 * @property {number} x - X坐标
 * @property {number} y - Y坐标
 * @property {number} width - 宽度
 * @property {number} height - 高度
 * @property {boolean} visible - 是否可见
 * @property {boolean} draggable - 是否可拖拽
 * @property {boolean} resizable - 是否可调整大小
 * @property {boolean} closable - 是否可关闭
 * @property {string} theme - 主题样式
 * @property {number} zIndex - 层级
 */

/**
 * @typedef {Object} PanelButton
 * @property {string} id - 按钮ID
 * @property {string} text - 按钮文本
 * @property {Function} onClick - 点击回调
 * @property {boolean} enabled - 是否启用
 * @property {string} style - 按钮样式
 */

/**
 * @typedef {Object} PanelTab
 * @property {string} id - 标签ID
 * @property {string} title - 标签标题
 * @property {Function} render - 渲染函数
 * @property {boolean} active - 是否激活
 */

/**
 * 基础面板类
 */
export class BasePanel {
    /**
     * 构造函数
     * @param {PanelConfig} config - 面板配置
     */
    constructor(config) {
        /** @type {string} */
        this.id = config.id;
        
        /** @type {string} */
        this.title = config.title || '';
        
        /** @type {number} */
        this.x = config.x || 0;
        
        /** @type {number} */
        this.y = config.y || 0;
        
        /** @type {number} */
        this.width = config.width || 300;
        
        /** @type {number} */
        this.height = config.height || 200;
        
        /** @type {boolean} */
        this.visible = config.visible !== false;
        
        /** @type {boolean} */
        this.draggable = config.draggable !== false;
        
        /** @type {boolean} */
        this.resizable = config.resizable || false;
        
        /** @type {boolean} */
        this.closable = config.closable !== false;
        
        /** @type {string} */
        this.theme = config.theme || 'default';
        
        /** @type {number} */
        this.zIndex = config.zIndex || 1;
        
        /** @type {boolean} */
        this.isDragging = false;
        
        /** @type {boolean} */
        this.isResizing = false;
        
        /** @type {Object} */
        this.dragOffset = { x: 0, y: 0 };
        
        /** @type {Object} */
        this.minSize = { width: 200, height: 150 };
        
        /** @type {Object} */
        this.maxSize = { width: 800, height: 600 };
        
        /** @type {Array<PanelButton>} */
        this.buttons = [];
        
        /** @type {Map<string, Function>} */
        this.eventHandlers = new Map();
        
        /** @type {Object} */
        this.content = null;
        
        /** @type {boolean} */
        this.needsUpdate = true;
        
        this.initializeTheme();
    }

    /**
     * 初始化主题
     */
    initializeTheme() {
        this.themes = {
            default: {
                backgroundColor: 'rgba(40, 40, 40, 0.95)',
                borderColor: '#666',
                titleColor: '#fff',
                textColor: '#ddd',
                buttonColor: '#555',
                buttonHoverColor: '#777',
                borderWidth: 2,
                borderRadius: 8,
                titleHeight: 30,
                padding: 10
            },
            dark: {
                backgroundColor: 'rgba(20, 20, 20, 0.98)',
                borderColor: '#444',
                titleColor: '#fff',
                textColor: '#ccc',
                buttonColor: '#333',
                buttonHoverColor: '#555',
                borderWidth: 1,
                borderRadius: 4,
                titleHeight: 28,
                padding: 8
            },
            light: {
                backgroundColor: 'rgba(240, 240, 240, 0.95)',
                borderColor: '#ccc',
                titleColor: '#333',
                textColor: '#666',
                buttonColor: '#e0e0e0',
                buttonHoverColor: '#d0d0d0',
                borderWidth: 1,
                borderRadius: 6,
                titleHeight: 32,
                padding: 12
            }
        };
    }

    /**
     * 获取当前主题
     * @returns {Object} 主题配置
     */
    getCurrentTheme() {
        return this.themes[this.theme] || this.themes.default;
    }

    /**
     * 显示面板
     */
    show() {
        this.visible = true;
        this.needsUpdate = true;
        this.emit('show');
    }

    /**
     * 隐藏面板
     */
    hide() {
        this.visible = false;
        this.emit('hide');
    }

    /**
     * 切换显示状态
     */
    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * 设置位置
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.needsUpdate = true;
    }

    /**
     * 设置大小
     * @param {number} width - 宽度
     * @param {number} height - 高度
     */
    setSize(width, height) {
        this.width = Math.max(this.minSize.width, Math.min(this.maxSize.width, width));
        this.height = Math.max(this.minSize.height, Math.min(this.maxSize.height, height));
        this.needsUpdate = true;
    }

    /**
     * 添加按钮
     * @param {PanelButton} button - 按钮配置
     */
    addButton(button) {
        this.buttons.push(button);
        this.needsUpdate = true;
    }

    /**
     * 移除按钮
     * @param {string} buttonId - 按钮ID
     */
    removeButton(buttonId) {
        this.buttons = this.buttons.filter(btn => btn.id !== buttonId);
        this.needsUpdate = true;
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
                    console.error(`Error in panel event handler for ${event}:`, error);
                }
            });
        }
    }

    /**
     * 检查点是否在面板内
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {boolean} 是否在面板内
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
        if (!this.visible || !this.containsPoint(x, y)) {
            return false;
        }

        // 检查按钮点击
        const clickedButton = this.getButtonAt(x, y);
        if (clickedButton && clickedButton.enabled && clickedButton.onClick) {
            clickedButton.onClick();
            return true;
        }

        // 检查拖拽
        if (this.draggable && this.containsPointInTitle(x, y)) {
            this.isDragging = true;
            this.dragOffset.x = x - this.x;
            this.dragOffset.y = y - this.y;
            this.emit('dragStart', { x, y });
            return true;
        }

        // 检查调整大小
        if (this.resizable && this.isInResizeArea(x, y)) {
            this.isResizing = true;
            this.emit('resizeStart', { x, y });
            return true;
        }

        return true; // 阻止事件穿透
    }

    /**
     * 处理鼠标移动事件
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {boolean} 是否处理了事件
     */
    handleMouseMove(x, y) {
        if (!this.visible) return false;

        if (this.isDragging) {
            this.setPosition(x - this.dragOffset.x, y - this.dragOffset.y);
            this.emit('drag', { x: this.x, y: this.y });
            return true;
        }

        if (this.isResizing) {
            const newWidth = Math.max(this.minSize.width, x - this.x);
            const newHeight = Math.max(this.minSize.height, y - this.y);
            this.setSize(newWidth, newHeight);
            this.emit('resize', { width: this.width, height: this.height });
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
        if (!this.visible) return false;

        if (this.isDragging) {
            this.isDragging = false;
            this.emit('dragEnd', { x: this.x, y: this.y });
            return true;
        }

        if (this.isResizing) {
            this.isResizing = false;
            this.emit('resizeEnd', { width: this.width, height: this.height });
            return true;
        }

        return false;
    }

    /**
     * 获取指定位置的按钮
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {PanelButton|null} 按钮对象
     */
    getButtonAt(x, y) {
        const theme = this.getCurrentTheme();
        const buttonWidth = 60;
        const buttonHeight = 20;
        const buttonSpacing = 5;
        
        let buttonX = this.x + this.width - buttonWidth - theme.padding;
        const buttonY = this.y + theme.titleHeight + theme.padding;
        
        for (let i = this.buttons.length - 1; i >= 0; i--) {
            const button = this.buttons[i];
            
            if (x >= buttonX && x <= buttonX + buttonWidth &&
                y >= buttonY && y <= buttonY + buttonHeight) {
                return button;
            }
            
            buttonX -= buttonWidth + buttonSpacing;
        }
        
        return null;
    }

    /**
     * 检查是否在调整大小区域
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {boolean} 是否在调整大小区域
     */
    isInResizeArea(x, y) {
        const resizeAreaSize = 10;
        return x >= this.x + this.width - resizeAreaSize &&
               x <= this.x + this.width &&
               y >= this.y + this.height - resizeAreaSize &&
               y <= this.y + this.height;
    }

    /**
     * 渲染面板
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
    render(ctx) {
        if (!this.visible) return;

        const theme = this.getCurrentTheme();
        
        // 保存上下文状态
        ctx.save();
        
        // 渲染面板背景
        this.renderBackground(ctx, theme);
        
        // 渲染标题栏
        this.renderTitleBar(ctx, theme);
        
        // 渲染内容区域
        this.renderContent(ctx, theme);
        
        // 渲染按钮
        this.renderButtons(ctx, theme);
        
        // 渲染调整大小手柄
        if (this.resizable) {
            this.renderResizeHandle(ctx, theme);
        }
        
        // 恢复上下文状态
        ctx.restore();
        
        this.needsUpdate = false;
    }

    /**
     * 渲染背景
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Object} theme - 主题配置
     */
    renderBackground(ctx, theme) {
        // 绘制背景
        ctx.fillStyle = theme.backgroundColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
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
        ctx.font = '14px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            this.title,
            this.x + theme.padding,
            this.y + theme.titleHeight / 2
        );
        
        // 绘制关闭按钮
        if (this.closable) {
            const closeButtonSize = 16;
            const closeButtonX = this.x + this.width - closeButtonSize - theme.padding;
            const closeButtonY = this.y + (theme.titleHeight - closeButtonSize) / 2;
            
            ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
            ctx.fillRect(closeButtonX, closeButtonY, closeButtonSize, closeButtonSize);
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(closeButtonX + 4, closeButtonY + 4);
            ctx.lineTo(closeButtonX + closeButtonSize - 4, closeButtonY + closeButtonSize - 4);
            ctx.moveTo(closeButtonX + closeButtonSize - 4, closeButtonY + 4);
            ctx.lineTo(closeButtonX + 4, closeButtonY + closeButtonSize - 4);
            ctx.stroke();
        }
    }

    /**
     * 渲染内容区域
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Object} theme - 主题配置
     */
    renderContent(ctx, theme) {
        const contentX = this.x + theme.padding;
        const contentY = this.y + theme.titleHeight + theme.padding;
        const contentWidth = this.width - theme.padding * 2;
        const contentHeight = this.height - theme.titleHeight - theme.padding * 2;
        
        // 设置裁剪区域
        ctx.save();
        ctx.beginPath();
        ctx.rect(contentX, contentY, contentWidth, contentHeight);
        ctx.clip();
        
        // 渲染具体内容（由子类实现）
        this.renderPanelContent(ctx, contentX, contentY, contentWidth, contentHeight, theme);
        
        ctx.restore();
    }

    /**
     * 渲染面板具体内容（由子类重写）
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {number} x - 内容区域X坐标
     * @param {number} y - 内容区域Y坐标
     * @param {number} width - 内容区域宽度
     * @param {number} height - 内容区域高度
     * @param {Object} theme - 主题配置
     */
    renderPanelContent(ctx, x, y, width, height, theme) {
        // 默认实现：显示占位文本
        ctx.fillStyle = theme.textColor;
        ctx.font = '12px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Panel Content', x + width / 2, y + height / 2);
    }

    /**
     * 渲染按钮
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Object} theme - 主题配置
     */
    renderButtons(ctx, theme) {
        if (this.buttons.length === 0) return;
        
        const buttonWidth = 60;
        const buttonHeight = 20;
        const buttonSpacing = 5;
        
        let buttonX = this.x + this.width - buttonWidth - theme.padding;
        const buttonY = this.y + theme.titleHeight + theme.padding;
        
        for (let i = this.buttons.length - 1; i >= 0; i--) {
            const button = this.buttons[i];
            
            // 绘制按钮背景
            ctx.fillStyle = button.enabled ? theme.buttonColor : 'rgba(100, 100, 100, 0.5)';
            ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
            
            // 绘制按钮边框
            ctx.strokeStyle = theme.borderColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
            
            // 绘制按钮文本
            ctx.fillStyle = button.enabled ? theme.textColor : 'rgba(150, 150, 150, 0.8)';
            ctx.font = '10px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                button.text,
                buttonX + buttonWidth / 2,
                buttonY + buttonHeight / 2
            );
            
            buttonX -= buttonWidth + buttonSpacing;
        }
    }

    /**
     * 渲染调整大小手柄
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Object} theme - 主题配置
     */
    renderResizeHandle(ctx, theme) {
        const handleSize = 10;
        const handleX = this.x + this.width - handleSize;
        const handleY = this.y + this.height - handleSize;
        
        ctx.fillStyle = theme.borderColor;
        ctx.fillRect(handleX, handleY, handleSize, handleSize);
        
        // 绘制调整大小图标
        ctx.strokeStyle = theme.textColor;
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(handleX + 2 + i * 2, handleY + handleSize - 2);
            ctx.lineTo(handleX + handleSize - 2, handleY + 2 + i * 2);
            ctx.stroke();
        }
    }

    /**
     * 更新面板
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        // 基础更新逻辑（由子类扩展）
    }

    /**
     * 销毁面板
     */
    destroy() {
        this.eventHandlers.clear();
        this.buttons = [];
        this.content = null;
    }
}

/**
 * 信息面板类
 */
export class InfoPanel extends BasePanel {
    /**
     * 构造函数
     * @param {PanelConfig} config - 面板配置
     */
    constructor(config) {
        super({
            ...config,
            title: config.title || 'Information'
        });
        
        /** @type {Array<Object>} */
        this.infoItems = [];
        
        /** @type {number} */
        this.scrollOffset = 0;
        
        /** @type {number} */
        this.lineHeight = 18;
    }

    /**
     * 添加信息项
     * @param {string} label - 标签
     * @param {string} value - 值
     * @param {string} color - 颜色
     */
    addInfo(label, value, color = null) {
        this.infoItems.push({ label, value, color });
        this.needsUpdate = true;
    }

    /**
     * 清空信息
     */
    clearInfo() {
        this.infoItems = [];
        this.scrollOffset = 0;
        this.needsUpdate = true;
    }

    /**
     * 渲染面板内容
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {number} x - 内容区域X坐标
     * @param {number} y - 内容区域Y坐标
     * @param {number} width - 内容区域宽度
     * @param {number} height - 内容区域高度
     * @param {Object} theme - 主题配置
     */
    renderPanelContent(ctx, x, y, width, height, theme) {
        if (this.infoItems.length === 0) {
            ctx.fillStyle = theme.textColor;
            ctx.font = '12px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('No information available', x + width / 2, y + height / 2);
            return;
        }
        
        ctx.font = '12px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        let currentY = y - this.scrollOffset;
        
        for (const item of this.infoItems) {
            if (currentY > y + height) break;
            if (currentY + this.lineHeight < y) {
                currentY += this.lineHeight;
                continue;
            }
            
            // 绘制标签
            ctx.fillStyle = theme.textColor;
            ctx.fillText(item.label + ':', x, currentY);
            
            // 绘制值
            const labelWidth = ctx.measureText(item.label + ': ').width;
            ctx.fillStyle = item.color || theme.titleColor;
            ctx.fillText(item.value, x + labelWidth, currentY);
            
            currentY += this.lineHeight;
        }
    }
}

/**
 * 标签面板类
 */
export class TabbedPanel extends BasePanel {
    /**
     * 构造函数
     * @param {PanelConfig} config - 面板配置
     */
    constructor(config) {
        super(config);
        
        /** @type {Array<PanelTab>} */
        this.tabs = [];
        
        /** @type {string|null} */
        this.activeTabId = null;
        
        /** @type {number} */
        this.tabHeight = 25;
    }

    /**
     * 添加标签
     * @param {PanelTab} tab - 标签配置
     */
    addTab(tab) {
        this.tabs.push(tab);
        
        if (!this.activeTabId) {
            this.activeTabId = tab.id;
        }
        
        this.needsUpdate = true;
    }

    /**
     * 移除标签
     * @param {string} tabId - 标签ID
     */
    removeTab(tabId) {
        this.tabs = this.tabs.filter(tab => tab.id !== tabId);
        
        if (this.activeTabId === tabId) {
            this.activeTabId = this.tabs.length > 0 ? this.tabs[0].id : null;
        }
        
        this.needsUpdate = true;
    }

    /**
     * 激活标签
     * @param {string} tabId - 标签ID
     */
    activateTab(tabId) {
        if (this.tabs.find(tab => tab.id === tabId)) {
            this.activeTabId = tabId;
            this.needsUpdate = true;
            this.emit('tabChanged', tabId);
        }
    }

    /**
     * 获取活动标签
     * @returns {PanelTab|null} 活动标签
     */
    getActiveTab() {
        return this.tabs.find(tab => tab.id === this.activeTabId) || null;
    }

    /**
     * 处理鼠标按下事件
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} button - 鼠标按钮
     * @returns {boolean} 是否处理了事件
     */
    handleMouseDown(x, y, button) {
        if (!this.visible || !this.containsPoint(x, y)) {
            return false;
        }

        // 检查标签点击
        const clickedTab = this.getTabAt(x, y);
        if (clickedTab) {
            this.activateTab(clickedTab.id);
            return true;
        }

        return super.handleMouseDown(x, y, button);
    }

    /**
     * 获取指定位置的标签
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {PanelTab|null} 标签对象
     */
    getTabAt(x, y) {
        const theme = this.getCurrentTheme();
        const tabY = this.y + theme.titleHeight;
        
        if (y < tabY || y > tabY + this.tabHeight) {
            return null;
        }
        
        const tabWidth = this.width / this.tabs.length;
        let tabX = this.x;
        
        for (const tab of this.tabs) {
            if (x >= tabX && x < tabX + tabWidth) {
                return tab;
            }
            tabX += tabWidth;
        }
        
        return null;
    }

    /**
     * 渲染标题栏
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Object} theme - 主题配置
     */
    renderTitleBar(ctx, theme) {
        super.renderTitleBar(ctx, theme);
        
        // 渲染标签
        this.renderTabs(ctx, theme);
    }

    /**
     * 渲染标签
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Object} theme - 主题配置
     */
    renderTabs(ctx, theme) {
        if (this.tabs.length === 0) return;
        
        const tabY = this.y + theme.titleHeight;
        const tabWidth = this.width / this.tabs.length;
        let tabX = this.x;
        
        for (const tab of this.tabs) {
            const isActive = tab.id === this.activeTabId;
            
            // 绘制标签背景
            ctx.fillStyle = isActive ? theme.backgroundColor : 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(tabX, tabY, tabWidth, this.tabHeight);
            
            // 绘制标签边框
            ctx.strokeStyle = theme.borderColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(tabX, tabY, tabWidth, this.tabHeight);
            
            // 绘制标签文本
            ctx.fillStyle = isActive ? theme.titleColor : theme.textColor;
            ctx.font = '11px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                tab.title,
                tabX + tabWidth / 2,
                tabY + this.tabHeight / 2
            );
            
            tabX += tabWidth;
        }
    }

    /**
     * 渲染内容区域
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Object} theme - 主题配置
     */
    renderContent(ctx, theme) {
        const contentX = this.x + theme.padding;
        const contentY = this.y + theme.titleHeight + this.tabHeight + theme.padding;
        const contentWidth = this.width - theme.padding * 2;
        const contentHeight = this.height - theme.titleHeight - this.tabHeight - theme.padding * 2;
        
        // 设置裁剪区域
        ctx.save();
        ctx.beginPath();
        ctx.rect(contentX, contentY, contentWidth, contentHeight);
        ctx.clip();
        
        // 渲染活动标签内容
        const activeTab = this.getActiveTab();
        if (activeTab && activeTab.render) {
            activeTab.render(ctx, contentX, contentY, contentWidth, contentHeight, theme);
        } else {
            this.renderPanelContent(ctx, contentX, contentY, contentWidth, contentHeight, theme);
        }
        
        ctx.restore();
    }
}

/**
 * 面板管理器
 */
export class PanelManager {
    /**
     * 构造函数
     */
    constructor() {
        /** @type {Map<string, BasePanel>} */
        this.panels = new Map();
        
        /** @type {Array<string>} */
        this.renderOrder = [];
        
        /** @type {BasePanel|null} */
        this.focusedPanel = null;
        
        /** @type {boolean} */
        this.enabled = true;
    }

    /**
     * 添加面板
     * @param {BasePanel} panel - 面板实例
     */
    addPanel(panel) {
        this.panels.set(panel.id, panel);
        this.renderOrder.push(panel.id);
        this.sortPanelsByZIndex();
    }

    /**
     * 移除面板
     * @param {string} panelId - 面板ID
     */
    removePanel(panelId) {
        const panel = this.panels.get(panelId);
        if (panel) {
            panel.destroy();
            this.panels.delete(panelId);
            this.renderOrder = this.renderOrder.filter(id => id !== panelId);
            
            if (this.focusedPanel === panel) {
                this.focusedPanel = null;
            }
        }
    }

    /**
     * 获取面板
     * @param {string} panelId - 面板ID
     * @returns {BasePanel|null} 面板实例
     */
    getPanel(panelId) {
        return this.panels.get(panelId) || null;
    }

    /**
     * 显示面板
     * @param {string} panelId - 面板ID
     */
    showPanel(panelId) {
        const panel = this.panels.get(panelId);
        if (panel) {
            panel.show();
            this.bringToFront(panelId);
        }
    }

    /**
     * 隐藏面板
     * @param {string} panelId - 面板ID
     */
    hidePanel(panelId) {
        const panel = this.panels.get(panelId);
        if (panel) {
            panel.hide();
        }
    }

    /**
     * 切换面板显示状态
     * @param {string} panelId - 面板ID
     */
    togglePanel(panelId) {
        const panel = this.panels.get(panelId);
        if (panel) {
            if (panel.visible) {
                this.hidePanel(panelId);
            } else {
                this.showPanel(panelId);
            }
        }
    }

    /**
     * 将面板置于前台
     * @param {string} panelId - 面板ID
     */
    bringToFront(panelId) {
        const index = this.renderOrder.indexOf(panelId);
        if (index > -1) {
            this.renderOrder.splice(index, 1);
            this.renderOrder.push(panelId);
            
            const panel = this.panels.get(panelId);
            if (panel) {
                this.focusedPanel = panel;
            }
        }
    }

    /**
     * 按Z轴顺序排序面板
     */
    sortPanelsByZIndex() {
        this.renderOrder.sort((a, b) => {
            const panelA = this.panels.get(a);
            const panelB = this.panels.get(b);
            return (panelA?.zIndex || 0) - (panelB?.zIndex || 0);
        });
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
        if (!this.enabled) return false;
        
        // 从前到后检查面板
        for (let i = this.renderOrder.length - 1; i >= 0; i--) {
            const panelId = this.renderOrder[i];
            const panel = this.panels.get(panelId);
            
            if (!panel || !panel.visible) continue;
            
            let handled = false;
            
            switch (eventType) {
                case 'mousedown':
                    handled = panel.handleMouseDown(x, y, button);
                    if (handled) {
                        this.bringToFront(panelId);
                    }
                    break;
                case 'mousemove':
                    handled = panel.handleMouseMove(x, y);
                    break;
                case 'mouseup':
                    handled = panel.handleMouseUp(x, y, button);
                    break;
            }
            
            if (handled) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * 更新所有面板
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        if (!this.enabled) return;
        
        this.panels.forEach(panel => {
            if (panel.visible) {
                panel.update(deltaTime);
            }
        });
    }

    /**
     * 渲染所有面板
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
    render(ctx) {
        if (!this.enabled) return;
        
        // 按渲染顺序绘制面板
        for (const panelId of this.renderOrder) {
            const panel = this.panels.get(panelId);
            if (panel && panel.visible) {
                panel.render(ctx);
            }
        }
    }

    /**
     * 隐藏所有面板
     */
    hideAllPanels() {
        this.panels.forEach(panel => panel.hide());
    }

    /**
     * 显示所有面板
     */
    showAllPanels() {
        this.panels.forEach(panel => panel.show());
    }

    /**
     * 启用/禁用面板管理器
     * @param {boolean} enabled - 是否启用
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * 销毁所有面板
     */
    destroy() {
        this.panels.forEach(panel => panel.destroy());
        this.panels.clear();
        this.renderOrder = [];
        this.focusedPanel = null;
    }
}

/**
 * 默认导出面板管理器
 */
export default PanelManager;