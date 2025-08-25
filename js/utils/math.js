/**
 * Math utilities module - 数学工具函数
 * @module MathUtils
 */

/**
 * @typedef {Object} Vector2D
 * @property {number} x - X坐标
 * @property {number} y - Y坐标
 */

/**
 * @typedef {Object} Rectangle
 * @property {number} x - X坐标
 * @property {number} y - Y坐标
 * @property {number} width - 宽度
 * @property {number} height - 高度
 */

/**
 * @typedef {Object} Circle
 * @property {number} x - 圆心X坐标
 * @property {number} y - 圆心Y坐标
 * @property {number} radius - 半径
 */

/**
 * 数学工具类
 */
export class MathUtils {
  /**
     * 数学常量
     */
  static get PI() { return Math.PI; }
  static get TWO_PI() { return Math.PI * 2; }
  static get HALF_PI() { return Math.PI / 2; }
  static get DEG_TO_RAD() { return Math.PI / 180; }
  static get RAD_TO_DEG() { return 180 / Math.PI; }
  static get EPSILON() { return 1e-10; }

  /**
     * 将角度转换为弧度
     * @param {number} degrees - 角度
     * @returns {number} 弧度
     */
  static degToRad(degrees) {
    return degrees * this.DEG_TO_RAD;
  }

  /**
     * 将弧度转换为角度
     * @param {number} radians - 弧度
     * @returns {number} 角度
     */
  static radToDeg(radians) {
    return radians * this.RAD_TO_DEG;
  }

  /**
     * 限制数值在指定范围内
     * @param {number} value - 数值
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {number} 限制后的数值
     */
  static clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
     * 线性插值
     * @param {number} start - 起始值
     * @param {number} end - 结束值
     * @param {number} t - 插值参数 (0-1)
     * @returns {number} 插值结果
     */
  static lerp(start, end, t) {
    return start + (end - start) * this.clamp(t, 0, 1);
  }

  /**
     * 反向线性插值
     * @param {number} start - 起始值
     * @param {number} end - 结束值
     * @param {number} value - 当前值
     * @returns {number} 插值参数
     */
  static inverseLerp(start, end, value) {
    if (Math.abs(end - start) < this.EPSILON) return 0;
    return this.clamp((value - start) / (end - start), 0, 1);
  }

  /**
     * 重映射数值从一个范围到另一个范围
     * @param {number} value - 输入值
     * @param {number} inMin - 输入最小值
     * @param {number} inMax - 输入最大值
     * @param {number} outMin - 输出最小值
     * @param {number} outMax - 输出最大值
     * @returns {number} 重映射后的值
     */
  static map(value, inMin, inMax, outMin, outMax) {
    const t = this.inverseLerp(inMin, inMax, value);
    return this.lerp(outMin, outMax, t);
  }

  /**
     * 平滑步进函数
     * @param {number} edge0 - 下边界
     * @param {number} edge1 - 上边界
     * @param {number} x - 输入值
     * @returns {number} 平滑插值结果
     */
  static smoothstep(edge0, edge1, x) {
    const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  /**
     * 更平滑的步进函数
     * @param {number} edge0 - 下边界
     * @param {number} edge1 - 上边界
     * @param {number} x - 输入值
     * @returns {number} 更平滑的插值结果
     */
  static smootherstep(edge0, edge1, x) {
    const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  /**
     * 计算两点间距离
     * @param {number} x1 - 第一个点的X坐标
     * @param {number} y1 - 第一个点的Y坐标
     * @param {number} x2 - 第二个点的X坐标
     * @param {number} y2 - 第二个点的Y坐标
     * @returns {number} 距离
     */
  static distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
     * 计算两点间距离的平方（避免开方运算）
     * @param {number} x1 - 第一个点的X坐标
     * @param {number} y1 - 第一个点的Y坐标
     * @param {number} x2 - 第二个点的X坐标
     * @param {number} y2 - 第二个点的Y坐标
     * @returns {number} 距离的平方
     */
  static distanceSquared(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
  }

  /**
     * 计算曼哈顿距离
     * @param {number} x1 - 第一个点的X坐标
     * @param {number} y1 - 第一个点的Y坐标
     * @param {number} x2 - 第二个点的X坐标
     * @param {number} y2 - 第二个点的Y坐标
     * @returns {number} 曼哈顿距离
     */
  static manhattanDistance(x1, y1, x2, y2) {
    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
  }

  /**
     * 计算两点间角度
     * @param {number} x1 - 第一个点的X坐标
     * @param {number} y1 - 第一个点的Y坐标
     * @param {number} x2 - 第二个点的X坐标
     * @param {number} y2 - 第二个点的Y坐标
     * @returns {number} 角度（弧度）
     */
  static angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  }

  /**
     * 标准化角度到 -π 到 π 范围
     * @param {number} angle - 角度（弧度）
     * @returns {number} 标准化后的角度
     */
  static normalizeAngle(angle) {
    while (angle > Math.PI) angle -= this.TWO_PI;
    while (angle < -Math.PI) angle += this.TWO_PI;
    return angle;
  }

  /**
     * 计算角度差
     * @param {number} angle1 - 第一个角度
     * @param {number} angle2 - 第二个角度
     * @returns {number} 角度差
     */
  static angleDifference(angle1, angle2) {
    return this.normalizeAngle(angle2 - angle1);
  }

  /**
     * 角度插值（考虑角度的循环性）
     * @param {number} start - 起始角度
     * @param {number} end - 结束角度
     * @param {number} t - 插值参数
     * @returns {number} 插值后的角度
     */
  static lerpAngle(start, end, t) {
    const diff = this.angleDifference(start, end);
    return this.normalizeAngle(start + diff * t);
  }

  /**
     * 生成指定范围内的随机数
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {number} 随机数
     */
  static random(min = 0, max = 1) {
    return min + Math.random() * (max - min);
  }

  /**
     * 生成指定范围内的随机整数
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {number} 随机整数
     */
  static randomInt(min, max) {
    return Math.floor(this.random(min, max + 1));
  }

  /**
     * 随机选择数组中的元素
     * @param {Array} array - 数组
     * @returns {*} 随机元素
     */
  static randomChoice(array) {
    return array[this.randomInt(0, array.length - 1)];
  }

  /**
     * 根据权重随机选择
     * @param {Array} items - 选项数组
     * @param {Array} weights - 权重数组
     * @returns {*} 选中的项目
     */
  static weightedRandom(items, weights) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
        
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }
        
    return items[items.length - 1];
  }

  /**
     * 生成高斯分布随机数（Box-Muller变换）
     * @param {number} mean - 均值
     * @param {number} stdDev - 标准差
     * @returns {number} 高斯分布随机数
     */
  static randomGaussian(mean = 0, stdDev = 1) {
    if (this._hasSpare) {
      this._hasSpare = false;
      return this._spare * stdDev + mean;
    }
        
    this._hasSpare = true;
    const u = Math.random();
    const v = Math.random();
    const mag = stdDev * Math.sqrt(-2 * Math.log(u));
    this._spare = mag * Math.cos(this.TWO_PI * v);
        
    return mag * Math.sin(this.TWO_PI * v) + mean;
  }

  /**
     * 检查数值是否接近
     * @param {number} a - 第一个数值
     * @param {number} b - 第二个数值
     * @param {number} epsilon - 误差范围
     * @returns {boolean} 是否接近
     */
  static approximately(a, b, epsilon = this.EPSILON) {
    return Math.abs(a - b) < epsilon;
  }

  /**
     * 检查数值是否为零
     * @param {number} value - 数值
     * @param {number} epsilon - 误差范围
     * @returns {boolean} 是否为零
     */
  static isZero(value, epsilon = this.EPSILON) {
    return Math.abs(value) < epsilon;
  }

  /**
     * 符号函数
     * @param {number} value - 数值
     * @returns {number} 符号 (-1, 0, 1)
     */
  static sign(value) {
    return value > 0 ? 1 : value < 0 ? -1 : 0;
  }

  /**
     * 向上取整到最近的2的幂
     * @param {number} value - 数值
     * @returns {number} 2的幂
     */
  static nextPowerOfTwo(value) {
    return Math.pow(2, Math.ceil(Math.log2(value)));
  }

  /**
     * 检查是否为2的幂
     * @param {number} value - 数值
     * @returns {boolean} 是否为2的幂
     */
  static isPowerOfTwo(value) {
    return value > 0 && (value & (value - 1)) === 0;
  }

  /**
     * 计算阶乘
     * @param {number} n - 数值
     * @returns {number} 阶乘结果
     */
  static factorial(n) {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }

  /**
     * 计算组合数 C(n, k)
     * @param {number} n - 总数
     * @param {number} k - 选择数
     * @returns {number} 组合数
     */
  static combination(n, k) {
    if (k > n || k < 0) return 0;
    if (k === 0 || k === n) return 1;
        
    k = Math.min(k, n - k); // 利用对称性
    let result = 1;
        
    for (let i = 0; i < k; i++) {
      result = result * (n - i) / (i + 1);
    }
        
    return Math.round(result);
  }

  /**
     * 计算最大公约数
     * @param {number} a - 第一个数
     * @param {number} b - 第二个数
     * @returns {number} 最大公约数
     */
  static gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }

  /**
     * 计算最小公倍数
     * @param {number} a - 第一个数
     * @param {number} b - 第二个数
     * @returns {number} 最小公倍数
     */
  static lcm(a, b) {
    return Math.abs(a * b) / this.gcd(a, b);
  }
}

/**
 * 向量工具类
 */
export class Vector2 {
  /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
     * 创建向量副本
     * @returns {Vector2} 新向量
     */
  clone() {
    return new Vector2(this.x, this.y);
  }

  /**
     * 复制另一个向量
     * @param {Vector2} other - 另一个向量
     * @returns {Vector2} 当前向量
     */
  copy(other) {
    this.x = other.x;
    this.y = other.y;
    return this;
  }

  /**
     * 设置向量值
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {Vector2} 当前向量
     */
  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  /**
     * 向量加法
     * @param {Vector2} other - 另一个向量
     * @returns {Vector2} 当前向量
     */
  add(other) {
    this.x += other.x;
    this.y += other.y;
    return this;
  }

  /**
     * 向量减法
     * @param {Vector2} other - 另一个向量
     * @returns {Vector2} 当前向量
     */
  subtract(other) {
    this.x -= other.x;
    this.y -= other.y;
    return this;
  }

  /**
     * 向量乘法（标量）
     * @param {number} scalar - 标量
     * @returns {Vector2} 当前向量
     */
  multiply(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  /**
     * 向量除法（标量）
     * @param {number} scalar - 标量
     * @returns {Vector2} 当前向量
     */
  divide(scalar) {
    if (scalar !== 0) {
      this.x /= scalar;
      this.y /= scalar;
    }
    return this;
  }

  /**
     * 计算向量长度
     * @returns {number} 长度
     */
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
     * 计算向量长度的平方
     * @returns {number} 长度的平方
     */
  lengthSquared() {
    return this.x * this.x + this.y * this.y;
  }

  /**
     * 标准化向量
     * @returns {Vector2} 当前向量
     */
  normalize() {
    const len = this.length();
    if (len > 0) {
      this.divide(len);
    }
    return this;
  }

  /**
     * 获取标准化向量（不修改原向量）
     * @returns {Vector2} 标准化后的新向量
     */
  normalized() {
    return this.clone().normalize();
  }

  /**
     * 点积
     * @param {Vector2} other - 另一个向量
     * @returns {number} 点积结果
     */
  dot(other) {
    return this.x * other.x + this.y * other.y;
  }

  /**
     * 叉积（2D中返回标量）
     * @param {Vector2} other - 另一个向量
     * @returns {number} 叉积结果
     */
  cross(other) {
    return this.x * other.y - this.y * other.x;
  }

  /**
     * 计算到另一个向量的距离
     * @param {Vector2} other - 另一个向量
     * @returns {number} 距离
     */
  distanceTo(other) {
    return MathUtils.distance(this.x, this.y, other.x, other.y);
  }

  /**
     * 计算到另一个向量的距离平方
     * @param {Vector2} other - 另一个向量
     * @returns {number} 距离平方
     */
  distanceToSquared(other) {
    return MathUtils.distanceSquared(this.x, this.y, other.x, other.y);
  }

  /**
     * 计算到另一个向量的角度
     * @param {Vector2} other - 另一个向量
     * @returns {number} 角度（弧度）
     */
  angleTo(other) {
    return MathUtils.angle(this.x, this.y, other.x, other.y);
  }

  /**
     * 获取向量角度
     * @returns {number} 角度（弧度）
     */
  angle() {
    return Math.atan2(this.y, this.x);
  }

  /**
     * 旋转向量
     * @param {number} angle - 旋转角度（弧度）
     * @returns {Vector2} 当前向量
     */
  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = this.x * cos - this.y * sin;
    const y = this.x * sin + this.y * cos;
    this.x = x;
    this.y = y;
    return this;
  }

  /**
     * 向量插值
     * @param {Vector2} other - 目标向量
     * @param {number} t - 插值参数
     * @returns {Vector2} 当前向量
     */
  lerp(other, t) {
    this.x = MathUtils.lerp(this.x, other.x, t);
    this.y = MathUtils.lerp(this.y, other.y, t);
    return this;
  }

  /**
     * 限制向量长度
     * @param {number} maxLength - 最大长度
     * @returns {Vector2} 当前向量
     */
  clampLength(maxLength) {
    const len = this.length();
    if (len > maxLength) {
      this.multiply(maxLength / len);
    }
    return this;
  }

  /**
     * 反射向量
     * @param {Vector2} normal - 法向量
     * @returns {Vector2} 当前向量
     */
  reflect(normal) {
    const dot = this.dot(normal);
    this.x -= 2 * dot * normal.x;
    this.y -= 2 * dot * normal.y;
    return this;
  }

  /**
     * 投影到另一个向量
     * @param {Vector2} other - 目标向量
     * @returns {Vector2} 当前向量
     */
  project(other) {
    const dot = this.dot(other);
    const lenSq = other.lengthSquared();
    if (lenSq > 0) {
      const scalar = dot / lenSq;
      this.x = other.x * scalar;
      this.y = other.y * scalar;
    }
    return this;
  }

  /**
     * 检查向量是否为零
     * @param {number} epsilon - 误差范围
     * @returns {boolean} 是否为零向量
     */
  isZero(epsilon = MathUtils.EPSILON) {
    return this.lengthSquared() < epsilon * epsilon;
  }

  /**
     * 检查向量是否相等
     * @param {Vector2} other - 另一个向量
     * @param {number} epsilon - 误差范围
     * @returns {boolean} 是否相等
     */
  equals(other, epsilon = MathUtils.EPSILON) {
    return MathUtils.approximately(this.x, other.x, epsilon) &&
               MathUtils.approximately(this.y, other.y, epsilon);
  }

  /**
     * 转换为数组
     * @returns {Array<number>} 数组形式
     */
  toArray() {
    return [this.x, this.y];
  }

  /**
     * 转换为字符串
     * @returns {string} 字符串形式
     */
  toString() {
    return `Vector2(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
  }

  /**
     * 静态方法：创建零向量
     * @returns {Vector2} 零向量
     */
  static zero() {
    return new Vector2(0, 0);
  }

  /**
     * 静态方法：创建单位向量
     * @returns {Vector2} 单位向量
     */
  static one() {
    return new Vector2(1, 1);
  }

  /**
     * 静态方法：创建上方向向量
     * @returns {Vector2} 上方向向量
     */
  static up() {
    return new Vector2(0, -1);
  }

  /**
     * 静态方法：创建下方向向量
     * @returns {Vector2} 下方向向量
     */
  static down() {
    return new Vector2(0, 1);
  }

  /**
     * 静态方法：创建左方向向量
     * @returns {Vector2} 左方向向量
     */
  static left() {
    return new Vector2(-1, 0);
  }

  /**
     * 静态方法：创建右方向向量
     * @returns {Vector2} 右方向向量
     */
  static right() {
    return new Vector2(1, 0);
  }

  /**
     * 静态方法：从角度创建向量
     * @param {number} angle - 角度（弧度）
     * @param {number} length - 长度
     * @returns {Vector2} 新向量
     */
  static fromAngle(angle, length = 1) {
    return new Vector2(Math.cos(angle) * length, Math.sin(angle) * length);
  }

  /**
     * 静态方法：向量加法
     * @param {Vector2} a - 第一个向量
     * @param {Vector2} b - 第二个向量
     * @returns {Vector2} 结果向量
     */
  static add(a, b) {
    return new Vector2(a.x + b.x, a.y + b.y);
  }

  /**
     * 静态方法：向量减法
     * @param {Vector2} a - 第一个向量
     * @param {Vector2} b - 第二个向量
     * @returns {Vector2} 结果向量
     */
  static subtract(a, b) {
    return new Vector2(a.x - b.x, a.y - b.y);
  }

  /**
     * 静态方法：向量插值
     * @param {Vector2} a - 起始向量
     * @param {Vector2} b - 结束向量
     * @param {number} t - 插值参数
     * @returns {Vector2} 插值结果
     */
  static lerp(a, b, t) {
    return new Vector2(
      MathUtils.lerp(a.x, b.x, t),
      MathUtils.lerp(a.y, b.y, t)
    );
  }
}

/**
 * 几何工具类
 */
export class GeometryUtils {
  /**
     * 检查点是否在矩形内
     * @param {number} px - 点X坐标
     * @param {number} py - 点Y坐标
     * @param {Rectangle} rect - 矩形
     * @returns {boolean} 是否在矩形内
     */
  static pointInRect(px, py, rect) {
    return px >= rect.x && px <= rect.x + rect.width &&
               py >= rect.y && py <= rect.y + rect.height;
  }

  /**
     * 检查点是否在圆内
     * @param {number} px - 点X坐标
     * @param {number} py - 点Y坐标
     * @param {Circle} circle - 圆
     * @returns {boolean} 是否在圆内
     */
  static pointInCircle(px, py, circle) {
    const distSq = MathUtils.distanceSquared(px, py, circle.x, circle.y);
    return distSq <= circle.radius * circle.radius;
  }

  /**
     * 检查两个矩形是否相交
     * @param {Rectangle} rect1 - 第一个矩形
     * @param {Rectangle} rect2 - 第二个矩形
     * @returns {boolean} 是否相交
     */
  static rectIntersect(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
  }

  /**
     * 检查两个圆是否相交
     * @param {Circle} circle1 - 第一个圆
     * @param {Circle} circle2 - 第二个圆
     * @returns {boolean} 是否相交
     */
  static circleIntersect(circle1, circle2) {
    const distSq = MathUtils.distanceSquared(circle1.x, circle1.y, circle2.x, circle2.y);
    const radiusSum = circle1.radius + circle2.radius;
    return distSq <= radiusSum * radiusSum;
  }

  /**
     * 检查圆和矩形是否相交
     * @param {Circle} circle - 圆
     * @param {Rectangle} rect - 矩形
     * @returns {boolean} 是否相交
     */
  static circleRectIntersect(circle, rect) {
    const closestX = MathUtils.clamp(circle.x, rect.x, rect.x + rect.width);
    const closestY = MathUtils.clamp(circle.y, rect.y, rect.y + rect.height);
        
    const distSq = MathUtils.distanceSquared(circle.x, circle.y, closestX, closestY);
    return distSq <= circle.radius * circle.radius;
  }

  /**
     * 计算线段与线段的交点
     * @param {number} x1 - 第一条线段起点X
     * @param {number} y1 - 第一条线段起点Y
     * @param {number} x2 - 第一条线段终点X
     * @param {number} y2 - 第一条线段终点Y
     * @param {number} x3 - 第二条线段起点X
     * @param {number} y3 - 第二条线段起点Y
     * @param {number} x4 - 第二条线段终点X
     * @param {number} y4 - 第二条线段终点Y
     * @returns {Vector2|null} 交点坐标，如果不相交返回null
     */
  static lineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < MathUtils.EPSILON) return null;
        
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
        
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return new Vector2(
        x1 + t * (x2 - x1),
        y1 + t * (y2 - y1)
      );
    }
        
    return null;
  }

  /**
     * 计算点到线段的最短距离
     * @param {number} px - 点X坐标
     * @param {number} py - 点Y坐标
     * @param {number} x1 - 线段起点X
     * @param {number} y1 - 线段起点Y
     * @param {number} x2 - 线段终点X
     * @param {number} y2 - 线段终点Y
     * @returns {number} 最短距离
     */
  static pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
        
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
        
    if (lenSq === 0) {
      return MathUtils.distance(px, py, x1, y1);
    }
        
    const param = dot / lenSq;
        
    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
        
    return MathUtils.distance(px, py, xx, yy);
  }

  /**
     * 计算多边形面积
     * @param {Array<Vector2>} vertices - 顶点数组
     * @returns {number} 面积
     */
  static polygonArea(vertices) {
    let area = 0;
    const n = vertices.length;
        
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += vertices[i].x * vertices[j].y;
      area -= vertices[j].x * vertices[i].y;
    }
        
    return Math.abs(area) / 2;
  }

  /**
     * 检查点是否在多边形内（射线法）
     * @param {number} px - 点X坐标
     * @param {number} py - 点Y坐标
     * @param {Array<Vector2>} vertices - 多边形顶点
     * @returns {boolean} 是否在多边形内
     */
  static pointInPolygon(px, py, vertices) {
    let inside = false;
    const n = vertices.length;
        
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = vertices[i].x;
      const yi = vertices[i].y;
      const xj = vertices[j].x;
      const yj = vertices[j].y;
            
      if (((yi > py) !== (yj > py)) &&
                (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
        
    return inside;
  }
}

// 静态属性初始化
MathUtils._hasSpare = false;
MathUtils._spare = 0;

/**
 * 默认导出数学工具
 */
export default MathUtils;