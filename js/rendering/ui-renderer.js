/**
 * UI Renderer module - UI渲染器
 * @module UIRenderer
 */

/**
 * @typedef {Object} UIElement
 * @property {string} id - 元素ID
 * @property {string} type - 元素类型
 * @property {number} x - X坐标
 * @property {number} y - Y坐标
 * @property {number} width - 宽度
 * @property {number} height - 高度
 * @property {boolean} visible - 是否可见
 * @property {number} zIndex - 层级
 */

/**
 * @typedef {Object} TextStyle
 * @property {string} font - 字体
 * @property {string} color - 颜色
 * @property {string} align - 对齐方式
 * @property {string} baseline - 基线
 * @property {number} [strokeWidth] - 描边宽度
 * @property {string} [strokeColor] - 描边颜色
 */

/**
 * @typedef {Object} ProgressBarConfig
 * @property {number} x - X坐标
 * @property {number} y - Y坐标
 * @property {number} width - 宽度
 * @property {number} height - 高度
 * @property {number} value - 当前值
 * @property {number} maxValue - 最大值
 * @property {string} fillColor - 填充颜色
 * @property {string} backgroundColor - 背景颜色
 * @property {string} [borderColor] - 边框颜色
 * @property {number} [borderWidth] - 边框宽度
 */

/**
 * UI渲染器类
 */
export class UIRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // UI元素管理
        this.elements = new Map();
        this.layers = new Map();
        this.dirtyRegions = [];
        
        // 渲染状态
        this.renderStats = {
            elementsRendered: 0,
            drawCalls: 0,
            lastFrameTime: 0
        };
        
        // 缓存
        this.textCache = new Map();
        this.imageCache = new Map();
        
        // 动画系统
        this.animations = new Map();
        this.tweens = [];
        
        // 主题配置
        this.theme = {
            colors: {
                primary: '#4a90e2',
                secondary: '#7ed321',
                danger: '#d0021b',
                warning: '#f5a623',
                success: '#7ed321',
                text: '#333333',
                textLight: '#666666',
                background: '#ffffff',
                backgroundDark: '#f8f8f8',
                border: '#e0e0e0'
            },
            fonts: {
                default: '14px Arial, sans-serif',
                title: 'bold 18px Arial, sans-serif',
                small: '12px Arial, sans-serif',
                large: '16px Arial, sans-serif'
            },
            spacing: {
                small: 4,
                medium: 8,
                large: 16,
                xlarge: 24
            }
        };
        
        // 响应式配置
        this.responsive = {
            breakpoints: {
                mobile: 768,
                tablet: 1024,
                desktop: 1200
            },
            currentBreakpoint: 'desktop'
        };
        
        this.updateResponsiveBreakpoint();
    }

    /**
     * 更新响应式断点
     */
    updateResponsiveBreakpoint() {
        const width = this.canvas.width;
        
        if (width <= this.responsive.breakpoints.mobile) {
            this.responsive.currentBreakpoint = 'mobile';
        } else if (width <= this.responsive.breakpoints.tablet) {
            this.responsive.currentBreakpoint = 'tablet';
        } else {
            this.responsive.currentBreakpoint = 'desktop';
        }
    }

    /**
     * 添加UI元素
     * @param {string} id - 元素ID
     * @param {UIElement} element - 元素配置
     * @param {string} [layer='default'] - 层级名称
     */
    addElement(id, element, layer = 'default') {
        element.id = id;
        element.layer = layer;
        element.visible = element.visible !== false;
        element.zIndex = element.zIndex || 0;
        
        this.elements.set(id, element);
        
        // 添加到层级
        if (!this.layers.has(layer)) {
            this.layers.set(layer, []);
        }
        this.layers.get(layer).push(element);
        
        // 排序层级元素
        this.layers.get(layer).sort((a, b) => a.zIndex - b.zIndex);
    }

    /**
     * 移除UI元素
     * @param {string} id - 元素ID
     */
    removeElement(id) {
        const element = this.elements.get(id);
        if (!element) return;
        
        // 从层级中移除
        const layer = this.layers.get(element.layer);
        if (layer) {
            const index = layer.indexOf(element);
            if (index !== -1) {
                layer.splice(index, 1);
            }
        }
        
        // 从元素映射中移除
        this.elements.delete(id);
        
        // 停止相关动画
        this.stopAnimation(id);
    }

    /**
     * 获取UI元素
     * @param {string} id - 元素ID
     * @returns {UIElement|null} 元素对象
     */
    getElement(id) {
        return this.elements.get(id) || null;
    }

    /**
     * 更新UI元素
     * @param {string} id - 元素ID
     * @param {Object} updates - 更新属性
     */
    updateElement(id, updates) {
        const element = this.elements.get(id);
        if (!element) return;
        
        Object.assign(element, updates);
        
        // 如果更新了zIndex，重新排序层级
        if (updates.zIndex !== undefined) {
            const layer = this.layers.get(element.layer);
            if (layer) {
                layer.sort((a, b) => a.zIndex - b.zIndex);
            }
        }
    }

    /**
     * 渲染所有UI元素
     * @param {number} deltaTime - 帧时间间隔
     */
    render(deltaTime) {
        this.renderStats.elementsRendered = 0;
        this.renderStats.drawCalls = 0;
        
        const startTime = performance.now();
        
        // 更新动画
        this.updateAnimations(deltaTime);
        
        // 按层级顺序渲染
        const sortedLayers = Array.from(this.layers.keys()).sort();
        
        for (const layerName of sortedLayers) {
            const layer = this.layers.get(layerName);
            if (!layer) continue;
            
            for (const element of layer) {
                if (!element.visible) continue;
                
                this.renderElement(element);
                this.renderStats.elementsRendered++;
            }
        }
        
        this.renderStats.lastFrameTime = performance.now() - startTime;
    }

    /**
     * 渲染单个UI元素
     * @param {UIElement} element - UI元素
     */
    renderElement(element) {
        this.ctx.save();
        
        // 应用变换
        if (element.rotation) {
            this.ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
            this.ctx.rotate(element.rotation);
            this.ctx.translate(-element.width / 2, -element.height / 2);
        } else {
            this.ctx.translate(element.x, element.y);
        }
        
        // 应用透明度
        if (element.alpha !== undefined) {
            this.ctx.globalAlpha = element.alpha;
        }
        
        // 根据类型渲染
        switch (element.type) {
            case 'text':
                this.renderText(element);
                break;
            case 'button':
                this.renderButton(element);
                break;
            case 'progressBar':
                this.renderProgressBar(element);
                break;
            case 'panel':
                this.renderPanel(element);
                break;
            case 'image':
                this.renderImage(element);
                break;
            case 'healthBar':
                this.renderHealthBar(element);
                break;
            case 'minimap':
                this.renderMinimap(element);
                break;
            case 'skillIcon':
                this.renderSkillIcon(element);
                break;
            case 'tooltip':
                this.renderTooltip(element);
                break;
            default:
                this.renderCustomElement(element);
                break;
        }
        
        this.ctx.restore();
        this.renderStats.drawCalls++;
    }

    /**
     * 渲染文本
     * @param {UIElement} element - 文本元素
     */
    renderText(element) {
        const style = element.style || {};
        
        // 设置字体样式
        this.ctx.font = style.font || this.theme.fonts.default;
        this.ctx.fillStyle = style.color || this.theme.colors.text;
        this.ctx.textAlign = style.align || 'left';
        this.ctx.textBaseline = style.baseline || 'top';
        
        // 描边
        if (style.strokeWidth && style.strokeColor) {
            this.ctx.strokeStyle = style.strokeColor;
            this.ctx.lineWidth = style.strokeWidth;
            this.ctx.strokeText(element.text, 0, 0);
        }
        
        // 填充文本
        this.ctx.fillText(element.text, 0, 0);
    }

    /**
     * 渲染按钮
     * @param {UIElement} element - 按钮元素
     */
    renderButton(element) {
        const { width, height } = element;
        const style = element.style || {};
        
        // 确定按钮状态
        const isHovered = element.hovered;
        const isPressed = element.pressed;
        const isDisabled = element.disabled;
        
        // 背景颜色
        let bgColor = style.backgroundColor || this.theme.colors.primary;
        if (isDisabled) {
            bgColor = style.disabledColor || '#cccccc';
        } else if (isPressed) {
            bgColor = style.pressedColor || this.darkenColor(bgColor, 0.2);
        } else if (isHovered) {
            bgColor = style.hoverColor || this.lightenColor(bgColor, 0.1);
        }
        
        // 绘制背景
        this.ctx.fillStyle = bgColor;
        this.roundRect(0, 0, width, height, style.borderRadius || 4);
        this.ctx.fill();
        
        // 绘制边框
        if (style.borderWidth && style.borderColor) {
            this.ctx.strokeStyle = style.borderColor;
            this.ctx.lineWidth = style.borderWidth;
            this.ctx.stroke();
        }
        
        // 绘制文本
        if (element.text) {
            this.ctx.fillStyle = style.textColor || '#ffffff';
            this.ctx.font = style.font || this.theme.fonts.default;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(element.text, width / 2, height / 2);
        }
    }

    /**
     * 渲染进度条
     * @param {UIElement} element - 进度条元素
     */
    renderProgressBar(element) {
        const { width, height, value, maxValue } = element;
        const style = element.style || {};
        
        const progress = Math.max(0, Math.min(1, value / maxValue));
        const fillWidth = width * progress;
        
        // 背景
        this.ctx.fillStyle = style.backgroundColor || this.theme.colors.backgroundDark;
        this.roundRect(0, 0, width, height, style.borderRadius || 2);
        this.ctx.fill();
        
        // 填充
        if (fillWidth > 0) {
            this.ctx.fillStyle = style.fillColor || this.theme.colors.primary;
            this.roundRect(0, 0, fillWidth, height, style.borderRadius || 2);
            this.ctx.fill();
        }
        
        // 边框
        if (style.borderWidth && style.borderColor) {
            this.ctx.strokeStyle = style.borderColor;
            this.ctx.lineWidth = style.borderWidth;
            this.roundRect(0, 0, width, height, style.borderRadius || 2);
            this.ctx.stroke();
        }
        
        // 文本
        if (element.showText) {
            this.ctx.fillStyle = style.textColor || this.theme.colors.text;
            this.ctx.font = style.font || this.theme.fonts.small;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            const text = element.textFormat ? 
                element.textFormat(value, maxValue) : 
                `${Math.round(value)}/${Math.round(maxValue)}`;
            
            this.ctx.fillText(text, width / 2, height / 2);
        }
    }

    /**
     * 渲染面板
     * @param {UIElement} element - 面板元素
     */
    renderPanel(element) {
        const { width, height } = element;
        const style = element.style || {};
        
        // 背景
        this.ctx.fillStyle = style.backgroundColor || this.theme.colors.background;
        this.roundRect(0, 0, width, height, style.borderRadius || 8);
        this.ctx.fill();
        
        // 阴影
        if (style.shadow) {
            this.ctx.shadowColor = style.shadowColor || 'rgba(0,0,0,0.2)';
            this.ctx.shadowBlur = style.shadowBlur || 10;
            this.ctx.shadowOffsetX = style.shadowOffsetX || 0;
            this.ctx.shadowOffsetY = style.shadowOffsetY || 2;
        }
        
        // 边框
        if (style.borderWidth && style.borderColor) {
            this.ctx.strokeStyle = style.borderColor;
            this.ctx.lineWidth = style.borderWidth;
            this.roundRect(0, 0, width, height, style.borderRadius || 8);
            this.ctx.stroke();
        }
        
        // 标题
        if (element.title) {
            this.ctx.fillStyle = style.titleColor || this.theme.colors.text;
            this.ctx.font = style.titleFont || this.theme.fonts.title;
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(element.title, this.theme.spacing.medium, this.theme.spacing.medium);
        }
    }

    /**
     * 渲染图像
     * @param {UIElement} element - 图像元素
     */
    renderImage(element) {
        if (!element.image) return;
        
        const { width, height } = element;
        
        // 绘制图像
        this.ctx.drawImage(element.image, 0, 0, width, height);
        
        // 滤镜效果
        if (element.filter) {
            this.ctx.filter = element.filter;
        }
    }

    /**
     * 渲染血条
     * @param {UIElement} element - 血条元素
     */
    renderHealthBar(element) {
        const { width, height, health, maxHealth } = element;
        const healthPercent = health / maxHealth;
        
        // 背景
        this.ctx.fillStyle = '#333333';
        this.roundRect(0, 0, width, height, 2);
        this.ctx.fill();
        
        // 血量填充
        if (healthPercent > 0) {
            let healthColor = '#4CAF50'; // 绿色
            if (healthPercent < 0.3) {
                healthColor = '#F44336'; // 红色
            } else if (healthPercent < 0.6) {
                healthColor = '#FF9800'; // 橙色
            }
            
            this.ctx.fillStyle = healthColor;
            this.roundRect(1, 1, (width - 2) * healthPercent, height - 2, 1);
            this.ctx.fill();
        }
        
        // 边框
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.roundRect(0, 0, width, height, 2);
        this.ctx.stroke();
    }

    /**
     * 渲染小地图
     * @param {UIElement} element - 小地图元素
     */
    renderMinimap(element) {
        const { width, height } = element;
        
        // 背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.roundRect(0, 0, width, height, 4);
        this.ctx.fill();
        
        // 边框
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.roundRect(0, 0, width, height, 4);
        this.ctx.stroke();
        
        // 玩家位置（中心点）
        this.ctx.fillStyle = '#00ff00';
        this.ctx.beginPath();
        this.ctx.arc(width / 2, height / 2, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 敌人位置
        if (element.enemies) {
            this.ctx.fillStyle = '#ff0000';
            for (const enemy of element.enemies) {
                const x = (enemy.x / element.worldWidth) * width;
                const y = (enemy.y / element.worldHeight) * height;
                this.ctx.beginPath();
                this.ctx.arc(x, y, 1, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }

    /**
     * 渲染技能图标
     * @param {UIElement} element - 技能图标元素
     */
    renderSkillIcon(element) {
        const { width, height } = element;
        const style = element.style || {};
        
        // 背景
        this.ctx.fillStyle = style.backgroundColor || '#444444';
        this.roundRect(0, 0, width, height, style.borderRadius || 4);
        this.ctx.fill();
        
        // 技能图标
        if (element.icon) {
            this.ctx.drawImage(element.icon, 2, 2, width - 4, height - 4);
        }
        
        // 冷却遮罩
        if (element.cooldownPercent > 0) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.beginPath();
            this.ctx.moveTo(width / 2, height / 2);
            this.ctx.arc(width / 2, height / 2, width / 2, -Math.PI / 2, 
                -Math.PI / 2 + Math.PI * 2 * element.cooldownPercent);
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        // 边框
        this.ctx.strokeStyle = element.active ? '#00ff00' : '#666666';
        this.ctx.lineWidth = 2;
        this.roundRect(0, 0, width, height, style.borderRadius || 4);
        this.ctx.stroke();
        
        // 快捷键
        if (element.hotkey) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'bottom';
            this.ctx.fillText(element.hotkey, width - 2, height - 2);
        }
    }

    /**
     * 渲染工具提示
     * @param {UIElement} element - 工具提示元素
     */
    renderTooltip(element) {
        const { width, height } = element;
        const style = element.style || {};
        
        // 背景
        this.ctx.fillStyle = style.backgroundColor || 'rgba(0, 0, 0, 0.9)';
        this.roundRect(0, 0, width, height, style.borderRadius || 4);
        this.ctx.fill();
        
        // 边框
        this.ctx.strokeStyle = style.borderColor || '#666666';
        this.ctx.lineWidth = 1;
        this.roundRect(0, 0, width, height, style.borderRadius || 4);
        this.ctx.stroke();
        
        // 文本内容
        if (element.content) {
            this.ctx.fillStyle = style.textColor || '#ffffff';
            this.ctx.font = style.font || this.theme.fonts.small;
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            
            const lines = element.content.split('\n');
            const lineHeight = 14;
            const padding = this.theme.spacing.small;
            
            for (let i = 0; i < lines.length; i++) {
                this.ctx.fillText(lines[i], padding, padding + i * lineHeight);
            }
        }
    }

    /**
     * 渲染自定义元素
     * @param {UIElement} element - 自定义元素
     */
    renderCustomElement(element) {
        if (element.render && typeof element.render === 'function') {
            element.render(this.ctx, element);
        }
    }

    /**
     * 绘制圆角矩形
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @param {number} radius - 圆角半径
     */
    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    /**
     * 颜色变亮
     * @param {string} color - 颜色
     * @param {number} amount - 变亮程度
     * @returns {string} 新颜色
     */
    lightenColor(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * amount * 100);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    /**
     * 颜色变暗
     * @param {string} color - 颜色
     * @param {number} amount - 变暗程度
     * @returns {string} 新颜色
     */
    darkenColor(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * amount * 100);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
            (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
            (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
    }

    /**
     * 开始动画
     * @param {string} elementId - 元素ID
     * @param {Object} animation - 动画配置
     */
    startAnimation(elementId, animation) {
        animation.elementId = elementId;
        animation.startTime = performance.now();
        animation.duration = animation.duration || 1000;
        animation.easing = animation.easing || 'linear';
        
        this.animations.set(elementId, animation);
    }

    /**
     * 停止动画
     * @param {string} elementId - 元素ID
     */
    stopAnimation(elementId) {
        this.animations.delete(elementId);
    }

    /**
     * 更新动画
     * @param {number} deltaTime - 帧时间间隔
     */
    updateAnimations(deltaTime) {
        const currentTime = performance.now();
        
        for (const [elementId, animation] of this.animations) {
            const element = this.elements.get(elementId);
            if (!element) {
                this.animations.delete(elementId);
                continue;
            }
            
            const elapsed = currentTime - animation.startTime;
            const progress = Math.min(1, elapsed / animation.duration);
            const easedProgress = this.applyEasing(progress, animation.easing);
            
            // 应用动画属性
            for (const [property, target] of Object.entries(animation.to)) {
                const start = animation.from[property] || element[property] || 0;
                element[property] = start + (target - start) * easedProgress;
            }
            
            // 动画完成
            if (progress >= 1) {
                this.animations.delete(elementId);
                if (animation.onComplete) {
                    animation.onComplete();
                }
            }
        }
    }

    /**
     * 应用缓动函数
     * @param {number} t - 时间参数
     * @param {string} easing - 缓动类型
     * @returns {number} 缓动值
     */
    applyEasing(t, easing) {
        switch (easing) {
            case 'easeIn':
                return t * t;
            case 'easeOut':
                return 1 - (1 - t) * (1 - t);
            case 'easeInOut':
                return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            case 'bounce':
                return this.bounceEasing(t);
            default:
                return t; // linear
        }
    }

    /**
     * 弹跳缓动
     * @param {number} t - 时间参数
     * @returns {number} 缓动值
     */
    bounceEasing(t) {
        const n1 = 7.5625;
        const d1 = 2.75;
        
        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    }

    /**
     * 清除所有UI元素
     */
    clear() {
        this.elements.clear();
        this.layers.clear();
        this.animations.clear();
        this.textCache.clear();
    }

    /**
     * 获取渲染统计
     * @returns {Object} 渲染统计信息
     */
    getRenderStats() {
        return { ...this.renderStats };
    }

    /**
     * 设置主题
     * @param {Object} theme - 主题配置
     */
    setTheme(theme) {
        this.theme = { ...this.theme, ...theme };
    }

    /**
     * 获取当前主题
     * @returns {Object} 主题配置
     */
    getTheme() {
        return { ...this.theme };
    }
}

/**
 * 默认导出UI渲染器
 */
export default UIRenderer;