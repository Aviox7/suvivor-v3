/**
 * Helper utilities module - 通用辅助工具模块
 * @module Helpers
 */

/**
 * @typedef {Object} ColorRGB
 * @property {number} r - 红色分量 (0-255)
 * @property {number} g - 绿色分量 (0-255)
 * @property {number} b - 蓝色分量 (0-255)
 */

/**
 * @typedef {Object} ColorHSL
 * @property {number} h - 色相 (0-360)
 * @property {number} s - 饱和度 (0-100)
 * @property {number} l - 亮度 (0-100)
 */

/**
 * @typedef {Object} Rect
 * @property {number} x - X坐标
 * @property {number} y - Y坐标
 * @property {number} width - 宽度
 * @property {number} height - 高度
 */

/**
 * @typedef {Object} Point
 * @property {number} x - X坐标
 * @property {number} y - Y坐标
 */

/**
 * 通用辅助工具类
 */
export class Helpers {
  /**
     * 深度克隆对象
     * @param {any} obj - 要克隆的对象
     * @returns {any} 克隆后的对象
     */
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
        
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
        
    if (obj instanceof Array) {
      return obj.map(item => Helpers.deepClone(item));
    }
        
    if (obj instanceof Map) {
      const cloned = new Map();
      obj.forEach((value, key) => {
        cloned.set(key, Helpers.deepClone(value));
      });
      return cloned;
    }
        
    if (obj instanceof Set) {
      const cloned = new Set();
      obj.forEach(value => {
        cloned.add(Helpers.deepClone(value));
      });
      return cloned;
    }
        
    if (typeof obj === 'object') {
      const cloned = {};
      Object.keys(obj).forEach(key => {
        cloned[key] = Helpers.deepClone(obj[key]);
      });
      return cloned;
    }
        
    return obj;
  }

  /**
     * 防抖函数
     * @param {Function} func - 要防抖的函数
     * @param {number} wait - 等待时间（毫秒）
     * @param {boolean} immediate - 是否立即执行
     * @returns {Function} 防抖后的函数
     */
  static debounce(func, wait, immediate = false) {
    let timeout;
        
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(this, args);
      };
            
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
            
      if (callNow) func.apply(this, args);
    };
  }

  /**
     * 节流函数
     * @param {Function} func - 要节流的函数
     * @param {number} limit - 限制时间（毫秒）
     * @returns {Function} 节流后的函数
     */
  static throttle(func, limit) {
    let inThrottle;
        
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
     * 格式化数字
     * @param {number} num - 数字
     * @param {number} decimals - 小数位数
     * @returns {string} 格式化后的字符串
     */
  static formatNumber(num, decimals = 0) {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(decimals) + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(decimals) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(decimals) + 'K';
    }
    return num.toFixed(decimals);
  }

  /**
     * 格式化时间
     * @param {number} milliseconds - 毫秒数
     * @param {boolean} showMilliseconds - 是否显示毫秒
     * @returns {string} 格式化后的时间字符串
     */
  static formatTime(milliseconds, showMilliseconds = false) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);
        
    let result = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
    if (showMilliseconds) {
      result += `.${ms.toString().padStart(2, '0')}`;
    }
        
    return result;
  }

  /**
     * 生成唯一ID
     * @param {string} prefix - 前缀
     * @returns {string} 唯一ID
     */
  static generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
     * 检查对象是否为空
     * @param {any} obj - 要检查的对象
     * @returns {boolean} 是否为空
     */
  static isEmpty(obj) {
    if (obj === null || obj === undefined) return true;
    if (typeof obj === 'string' || Array.isArray(obj)) return obj.length === 0;
    if (obj instanceof Map || obj instanceof Set) return obj.size === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
  }

  /**
     * 获取对象的嵌套属性
     * @param {Object} obj - 对象
     * @param {string} path - 属性路径（如 'a.b.c'）
     * @param {any} defaultValue - 默认值
     * @returns {any} 属性值
     */
  static getNestedProperty(obj, path, defaultValue = undefined) {
    const keys = path.split('.');
    let result = obj;
        
    for (const key of keys) {
      if (result === null || result === undefined || typeof result !== 'object') {
        return defaultValue;
      }
      result = result[key];
    }
        
    return result !== undefined ? result : defaultValue;
  }

  /**
     * 设置对象的嵌套属性
     * @param {Object} obj - 对象
     * @param {string} path - 属性路径（如 'a.b.c'）
     * @param {any} value - 要设置的值
     */
  static setNestedProperty(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
        
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
        
    current[keys[keys.length - 1]] = value;
  }

  /**
     * 数组去重
     * @param {Array} array - 数组
     * @param {string|Function} key - 去重键或函数
     * @returns {Array} 去重后的数组
     */
  static uniqueArray(array, key = null) {
    if (!key) {
      return [...new Set(array)];
    }
        
    const seen = new Set();
    return array.filter(item => {
      const keyValue = typeof key === 'function' ? key(item) : item[key];
      if (seen.has(keyValue)) {
        return false;
      }
      seen.add(keyValue);
      return true;
    });
  }

  /**
     * 数组分组
     * @param {Array} array - 数组
     * @param {string|Function} key - 分组键或函数
     * @returns {Object} 分组后的对象
     */
  static groupBy(array, key) {
    return array.reduce((groups, item) => {
      const groupKey = typeof key === 'function' ? key(item) : item[key];
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {});
  }

  /**
     * 数组排序
     * @param {Array} array - 数组
     * @param {string|Function} key - 排序键或函数
     * @param {boolean} ascending - 是否升序
     * @returns {Array} 排序后的数组
     */
  static sortBy(array, key, ascending = true) {
    const sorted = [...array].sort((a, b) => {
      const aValue = typeof key === 'function' ? key(a) : a[key];
      const bValue = typeof key === 'function' ? key(b) : b[key];
            
      if (aValue < bValue) return ascending ? -1 : 1;
      if (aValue > bValue) return ascending ? 1 : -1;
      return 0;
    });
        
    return sorted;
  }

  /**
     * 检查值是否在范围内
     * @param {number} value - 值
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {boolean} 是否在范围内
     */
  static inRange(value, min, max) {
    return value >= min && value <= max;
  }

  /**
     * 将值限制在范围内
     * @param {number} value - 值
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {number} 限制后的值
     */
  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /**
     * 线性映射
     * @param {number} value - 输入值
     * @param {number} inMin - 输入最小值
     * @param {number} inMax - 输入最大值
     * @param {number} outMin - 输出最小值
     * @param {number} outMax - 输出最大值
     * @returns {number} 映射后的值
     */
  static map(value, inMin, inMax, outMin, outMax) {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
  }

  /**
     * 等待指定时间
     * @param {number} ms - 毫秒数
     * @returns {Promise} Promise对象
     */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
     * 重试函数
     * @param {Function} fn - 要重试的函数
     * @param {number} maxRetries - 最大重试次数
     * @param {number} delay - 重试延迟（毫秒）
     * @returns {Promise} Promise对象
     */
  static async retry(fn, maxRetries = 3, delay = 1000) {
    let lastError;
        
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < maxRetries) {
          await Helpers.sleep(delay * Math.pow(2, i)); // 指数退避
        }
      }
    }
        
    throw lastError;
  }

  /**
     * 检查是否为移动设备
     * @returns {boolean} 是否为移动设备
     */
  static isMobile() {
    if (typeof navigator === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
     * 检查是否支持触摸
     * @returns {boolean} 是否支持触摸
     */
  static isTouchDevice() {
    if (typeof window === 'undefined') return false;
    if ('ontouchstart' in window) return true;
    if (typeof navigator === 'undefined') return false;
    return navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
  }

  /**
     * 获取设备像素比
     * @returns {number} 设备像素比
     */
  static getDevicePixelRatio() {
    return window.devicePixelRatio || 1;
  }

  /**
     * 获取视口尺寸
     * @returns {Object} 视口尺寸
     */
  static getViewportSize() {
    return {
      width: window.innerWidth || document.documentElement.clientWidth,
      height: window.innerHeight || document.documentElement.clientHeight
    };
  }

  /**
     * 全屏API封装
     * @param {HTMLElement} element - 要全屏的元素
     */
  static requestFullscreen(element = document.documentElement) {
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    }
  }

  /**
     * 退出全屏
     */
  static exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    }
  }

  /**
     * 检查是否全屏
     * @returns {boolean} 是否全屏
     */
  static isFullscreen() {
    return !!(document.fullscreenElement ||
                 document.webkitFullscreenElement ||
                 document.msFullscreenElement ||
                 document.mozFullScreenElement);
  }
}

/**
 * 颜色工具类
 */
export class ColorUtils {
  /**
     * 十六进制转RGB
     * @param {string} hex - 十六进制颜色值
     * @returns {ColorRGB} RGB颜色对象
     */
  static hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
     * RGB转十六进制
     * @param {number} r - 红色分量
     * @param {number} g - 绿色分量
     * @param {number} b - 蓝色分量
     * @returns {string} 十六进制颜色值
     */
  static rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  /**
     * RGB转HSL
     * @param {number} r - 红色分量 (0-255)
     * @param {number} g - 绿色分量 (0-255)
     * @param {number} b - 蓝色分量 (0-255)
     * @returns {ColorHSL} HSL颜色对象
     */
  static rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
        
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s;
    const l = (max + min) / 2;
        
    if (max === min) {
      h = s = 0; // 无色
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
      switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
        
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  /**
     * HSL转RGB
     * @param {number} h - 色相 (0-360)
     * @param {number} s - 饱和度 (0-100)
     * @param {number} l - 亮度 (0-100)
     * @returns {ColorRGB} RGB颜色对象
     */
  static hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
        
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
        
    let r, g, b;
        
    if (s === 0) {
      r = g = b = l; // 无色
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
        
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  /**
     * 颜色插值
     * @param {string} color1 - 起始颜色
     * @param {string} color2 - 结束颜色
     * @param {number} factor - 插值因子 (0-1)
     * @returns {string} 插值后的颜色
     */
  static interpolateColor(color1, color2, factor) {
    const rgb1 = ColorUtils.hexToRgb(color1);
    const rgb2 = ColorUtils.hexToRgb(color2);
        
    if (!rgb1 || !rgb2) return color1;
        
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);
        
    return ColorUtils.rgbToHex(r, g, b);
  }

  /**
     * 获取随机颜色
     * @returns {string} 随机十六进制颜色
     */
  static getRandomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  }

  /**
     * 调整颜色亮度
     * @param {string} color - 颜色值
     * @param {number} amount - 调整量 (-100 到 100)
     * @returns {string} 调整后的颜色
     */
  static adjustBrightness(color, amount) {
    const rgb = ColorUtils.hexToRgb(color);
    if (!rgb) return color;
        
    const adjust = (value) => {
      const adjusted = value + (amount * 255 / 100);
      return Math.max(0, Math.min(255, adjusted));
    };
        
    return ColorUtils.rgbToHex(
      adjust(rgb.r),
      adjust(rgb.g),
      adjust(rgb.b)
    );
  }

  /**
     * 获取颜色的对比色
     * @param {string} color - 颜色值
     * @returns {string} 对比色
     */
  static getContrastColor(color) {
    const rgb = ColorUtils.hexToRgb(color);
    if (!rgb) return '#000000';
        
    // 计算亮度
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        
    return brightness > 128 ? '#000000' : '#ffffff';
  }
}

/**
 * 几何工具类
 */
export class GeometryHelpers {
  /**
     * 计算两点间距离
     * @param {Point} p1 - 点1
     * @param {Point} p2 - 点2
     * @returns {number} 距离
     */
  static distance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
     * 计算两点间角度
     * @param {Point} p1 - 点1
     * @param {Point} p2 - 点2
     * @returns {number} 角度（弧度）
     */
  static angle(p1, p2) {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  }

  /**
     * 点是否在矩形内
     * @param {Point} point - 点
     * @param {Rect} rect - 矩形
     * @returns {boolean} 是否在矩形内
     */
  static pointInRect(point, rect) {
    return point.x >= rect.x &&
               point.x <= rect.x + rect.width &&
               point.y >= rect.y &&
               point.y <= rect.y + rect.height;
  }

  /**
     * 点是否在圆内
     * @param {Point} point - 点
     * @param {Point} center - 圆心
     * @param {number} radius - 半径
     * @returns {boolean} 是否在圆内
     */
  static pointInCircle(point, center, radius) {
    return GeometryHelpers.distance(point, center) <= radius;
  }

  /**
     * 矩形是否相交
     * @param {Rect} rect1 - 矩形1
     * @param {Rect} rect2 - 矩形2
     * @returns {boolean} 是否相交
     */
  static rectIntersect(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
  }

  /**
     * 圆是否相交
     * @param {Point} center1 - 圆心1
     * @param {number} radius1 - 半径1
     * @param {Point} center2 - 圆心2
     * @param {number} radius2 - 半径2
     * @returns {boolean} 是否相交
     */
  static circleIntersect(center1, radius1, center2, radius2) {
    return GeometryHelpers.distance(center1, center2) <= radius1 + radius2;
  }

  /**
     * 获取矩形中心点
     * @param {Rect} rect - 矩形
     * @returns {Point} 中心点
     */
  static getRectCenter(rect) {
    return {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2
    };
  }

  /**
     * 旋转点
     * @param {Point} point - 点
     * @param {Point} center - 旋转中心
     * @param {number} angle - 旋转角度（弧度）
     * @returns {Point} 旋转后的点
     */
  static rotatePoint(point, center, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = point.x - center.x;
    const dy = point.y - center.y;
        
    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos
    };
  }
}

/**
 * 动画工具类
 */
export class AnimationUtils {
  /**
     * 缓动函数
     */
  static get easing() {
    return {
      linear: t => t,
      easeInQuad: t => t * t,
      easeOutQuad: t => t * (2 - t),
      easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
      easeInCubic: t => t * t * t,
      easeOutCubic: t => (--t) * t * t + 1,
      easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
      easeInSine: t => 1 - Math.cos(t * Math.PI / 2),
      easeOutSine: t => Math.sin(t * Math.PI / 2),
      easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
      easeInElastic: t => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
      },
      easeOutElastic: t => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
      },
      easeInBounce: t => 1 - AnimationUtils.easing.easeOutBounce(1 - t),
      easeOutBounce: t => {
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
    };
  }

  /**
     * 创建动画
     * @param {Object} options - 动画选项
     * @param {number} options.duration - 持续时间（毫秒）
     * @param {Function} options.update - 更新回调
     * @param {Function} options.complete - 完成回调
     * @param {Function} options.easing - 缓动函数
     * @returns {Object} 动画控制对象
     */
  static createAnimation(options) {
    const {
      duration = 1000,
      update = () => {},
      complete = () => {},
      easing = AnimationUtils.easing.linear
    } = options;
        
    let startTime = null;
    let animationId = null;
    let isRunning = false;
        
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
            
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);
            
      update(easedProgress, progress);
            
      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        isRunning = false;
        complete();
      }
    };
        
    return {
      start() {
        if (!isRunning) {
          isRunning = true;
          startTime = null;
          animationId = requestAnimationFrame(animate);
        }
      },
            
      stop() {
        if (isRunning) {
          isRunning = false;
          if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
          }
        }
      },
            
      get isRunning() {
        return isRunning;
      }
    };
  }

  /**
     * 数值动画
     * @param {number} from - 起始值
     * @param {number} to - 结束值
     * @param {number} duration - 持续时间
     * @param {Function} callback - 回调函数
     * @param {Function} easing - 缓动函数
     * @returns {Object} 动画控制对象
     */
  static animateValue(from, to, duration, callback, easing = AnimationUtils.easing.linear) {
    return AnimationUtils.createAnimation({
      duration,
      easing,
      update: (progress) => {
        const value = from + (to - from) * progress;
        callback(value);
      }
    });
  }
}

/**
 * 存储工具类
 */
export class StorageUtils {
  /**
     * 设置本地存储
     * @param {string} key - 键
     * @param {any} value - 值
     * @param {number} expiry - 过期时间（毫秒）
     */
  static setItem(key, value, expiry = null) {
    try {
      const item = {
        value,
        timestamp: Date.now(),
        expiry: expiry ? Date.now() + expiry : null
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to set localStorage item:', error);
    }
  }

  /**
     * 获取本地存储
     * @param {string} key - 键
     * @param {any} defaultValue - 默认值
     * @returns {any} 存储的值
     */
  static getItem(key, defaultValue = null) {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return defaultValue;
            
      const item = JSON.parse(stored);
            
      // 检查是否过期
      if (item.expiry && Date.now() > item.expiry) {
        localStorage.removeItem(key);
        return defaultValue;
      }
            
      return item.value;
    } catch (error) {
      console.warn('Failed to get localStorage item:', error);
      return defaultValue;
    }
  }

  /**
     * 移除本地存储
     * @param {string} key - 键
     */
  static removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove localStorage item:', error);
    }
  }

  /**
     * 清空本地存储
     */
  static clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  /**
     * 获取存储大小
     * @returns {number} 存储大小（字节）
     */
  static getStorageSize() {
    let total = 0;
    try {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }
    } catch (error) {
      console.warn('Failed to calculate storage size:', error);
    }
    return total;
  }
}

/**
 * 默认导出辅助工具类
 */
export default Helpers;