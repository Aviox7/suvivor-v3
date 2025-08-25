/**
 * Collision module - 碰撞检测核心逻辑
 * 提供高性能的2D碰撞检测系统，支持圆形、矩形碰撞检测和空间分割优化
 * @module Collision
 */

/**
 * 碰撞检测结果
 * @typedef {Object} CollisionResult
 * @property {boolean} collided - 是否发生碰撞
 * @property {number} distance - 两个对象中心点之间的距离
 * @property {CollisionNormal} normal - 碰撞法向量，指向第二个对象
 * @property {number} overlap - 重叠距离，用于碰撞响应
 */

/**
 * 碰撞法向量
 * @typedef {Object} CollisionNormal
 * @property {number} x - X方向分量（-1到1）
 * @property {number} y - Y方向分量（-1到1）
 */

/**
 * 矩形边界框
 * @typedef {Object} BoundingBox
 * @property {number} x - 左上角X坐标（像素）
 * @property {number} y - 左上角Y坐标（像素）
 * @property {number} width - 矩形宽度（像素）
 * @property {number} height - 矩形高度（像素）
 */

/**
 * 圆形几何体
 * @typedef {Object} Circle
 * @property {number} x - 圆心X坐标（像素）
 * @property {number} y - 圆心Y坐标（像素）
 * @property {number} radius - 半径（像素）
 */

/**
 * 游戏对象接口（用于碰撞检测）
 * @typedef {Object} GameObject
 * @property {number} x - 对象X坐标
 * @property {number} y - 对象Y坐标
 * @property {number} [size] - 对象大小（用作碰撞半径）
 * @property {number} [radius] - 对象半径
 * @property {boolean} [isActive] - 对象是否激活
 * @property {boolean} [isDead] - 对象是否死亡
 */

/**
 * 碰撞检测工具类
 * 提供各种几何形状的碰撞检测静态方法，支持圆形、矩形和混合碰撞检测
 */
export class CollisionDetector {
  /**
     * 检测两个圆形是否碰撞
     * 使用距离比较法进行高效的圆形碰撞检测
     * @param {Circle} circle1 - 第一个圆形对象
     * @param {Circle} circle2 - 第二个圆形对象
     * @returns {CollisionResult} 碰撞检测结果，包含碰撞状态、距离、法向量和重叠距离
     * @example
     * // 检测玩家和敌人的碰撞
     * const player = { x: 100, y: 100, radius: 20 };
     * const enemy = { x: 110, y: 110, radius: 15 };
     * const result = CollisionDetector.checkCircleCollision(player, enemy);
     * if (result.collided) {
     *   console.log(`碰撞！重叠距离: ${result.overlap}`);
     * }
     */
  static checkCircleCollision(circle1, circle2) {
    const dx = circle2.x - circle1.x;
    const dy = circle2.y - circle1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = circle1.radius + circle2.radius;
        
    const collided = distance < minDistance;
    const overlap = collided ? minDistance - distance : 0;
        
    // 计算碰撞法向量
    const normal = { x: 0, y: 0 };
    if (distance > 0) {
      normal.x = dx / distance;
      normal.y = dy / distance;
    }
        
    return {
      collided,
      distance,
      normal,
      overlap
    };
  }

  /**
     * 检测两个矩形是否碰撞
     * 使用AABB（轴对齐边界框）算法进行矩形碰撞检测
     * @param {BoundingBox} rect1 - 第一个矩形边界框
     * @param {BoundingBox} rect2 - 第二个矩形边界框
     * @returns {CollisionResult} 碰撞检测结果，包含碰撞状态、法向量和重叠距离
     * @example
     * // 检测两个UI元素的碰撞
     * const button1 = { x: 50, y: 50, width: 100, height: 30 };
     * const button2 = { x: 120, y: 60, width: 80, height: 25 };
     * const result = CollisionDetector.checkRectCollision(button1, button2);
     * if (result.collided) {
     *   console.log('UI元素重叠');
     * }
     */
  static checkRectCollision(rect1, rect2) {
    const collided = (
      rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
    );
        
    let overlap = 0;
    const normal = { x: 0, y: 0 };
        
    if (collided) {
      // 计算重叠区域
      const overlapX = Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - 
                           Math.max(rect1.x, rect2.x);
      const overlapY = Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - 
                           Math.max(rect1.y, rect2.y);
            
      overlap = Math.min(overlapX, overlapY);
            
      // 计算法向量
      const centerX1 = rect1.x + rect1.width / 2;
      const centerY1 = rect1.y + rect1.height / 2;
      const centerX2 = rect2.x + rect2.width / 2;
      const centerY2 = rect2.y + rect2.height / 2;
            
      const dx = centerX2 - centerX1;
      const dy = centerY2 - centerY1;
      const distance = Math.sqrt(dx * dx + dy * dy);
            
      if (distance > 0) {
        normal.x = dx / distance;
        normal.y = dy / distance;
      }
    }
        
    return {
      collided,
      distance: 0,
      normal,
      overlap
    };
  }

  /**
     * 检测圆形和矩形是否碰撞
     * 通过计算圆心到矩形最近点的距离进行混合形状碰撞检测
     * @param {Circle} circle - 圆形对象
     * @param {BoundingBox} rect - 矩形边界框
     * @returns {CollisionResult} 碰撞检测结果，包含碰撞状态、距离、法向量和重叠距离
     * @example
     * // 检测圆形玩家和矩形障碍物的碰撞
     * const player = { x: 150, y: 200, radius: 25 };
     * const obstacle = { x: 140, y: 180, width: 60, height: 40 };
     * const result = CollisionDetector.checkCircleRectCollision(player, obstacle);
     * if (result.collided) {
     *   console.log('玩家撞到障碍物');
     * }
     */
  static checkCircleRectCollision(circle, rect) {
    // 找到矩形上距离圆心最近的点
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
        
    // 计算距离
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    const distance = Math.sqrt(dx * dx + dy * dy);
        
    const collided = distance < circle.radius;
    const overlap = collided ? circle.radius - distance : 0;
        
    // 计算法向量
    const normal = { x: 0, y: 0 };
    if (distance > 0) {
      normal.x = dx / distance;
      normal.y = dy / distance;
    }
        
    return {
      collided,
      distance,
      normal,
      overlap
    };
  }

  /**
     * 检测点是否在圆形内
     * 通过计算点到圆心的距离判断点是否在圆形区域内
     * @param {number} pointX - 点的X坐标（像素）
     * @param {number} pointY - 点的Y坐标（像素）
     * @param {Circle} circle - 圆形对象
     * @returns {boolean} 如果点在圆形内（包括边界）返回true，否则返回false
     * @example
     * // 检测鼠标点击是否在圆形按钮内
     * const button = { x: 200, y: 150, radius: 30 };
     * const mouseX = 210, mouseY = 160;
     * if (CollisionDetector.isPointInCircle(mouseX, mouseY, button)) {
     *   console.log('点击了圆形按钮');
     * }
     */
  static isPointInCircle(pointX, pointY, circle) {
    const dx = pointX - circle.x;
    const dy = pointY - circle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= circle.radius;
  }

  /**
     * 检测点是否在矩形内
     * 使用边界检查判断点是否在矩形区域内
     * @param {number} pointX - 点的X坐标（像素）
     * @param {number} pointY - 点的Y坐标（像素）
     * @param {BoundingBox} rect - 矩形边界框
     * @returns {boolean} 如果点在矩形内（包括边界）返回true，否则返回false
     * @example
     * // 检测鼠标是否在UI面板内
     * const panel = { x: 50, y: 100, width: 200, height: 150 };
     * const mouseX = 120, mouseY = 180;
     * if (CollisionDetector.isPointInRect(mouseX, mouseY, panel)) {
     *   console.log('鼠标在面板内');
     * }
     */
  static isPointInRect(pointX, pointY, rect) {
    return (
      pointX >= rect.x &&
            pointX <= rect.x + rect.width &&
            pointY >= rect.y &&
            pointY <= rect.y + rect.height
    );
  }

  /**
     * 获取两点之间的欧几里得距离
     * 使用勾股定理计算两点间的直线距离
     * @param {number} x1 - 第一个点的X坐标（像素）
     * @param {number} y1 - 第一个点的Y坐标（像素）
     * @param {number} x2 - 第二个点的X坐标（像素）
     * @param {number} y2 - 第二个点的Y坐标（像素）
     * @returns {number} 两点间的距离（像素）
     * @example
     * // 计算玩家和敌人之间的距离
     * const playerX = 100, playerY = 200;
     * const enemyX = 150, enemyY = 250;
     * const distance = CollisionDetector.getDistance(playerX, playerY, enemyX, enemyY);
     * console.log(`距离: ${distance.toFixed(2)} 像素`);
     */
  static getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
     * 获取从第一个点指向第二个点的角度
     * 计算两点连线与X轴正方向的夹角
     * @param {number} x1 - 第一个点的X坐标（像素）
     * @param {number} y1 - 第一个点的Y坐标（像素）
     * @param {number} x2 - 第二个点的X坐标（像素）
     * @param {number} y2 - 第二个点的Y坐标（像素）
     * @returns {number} 角度值（弧度），范围为-π到π
     * @example
     * // 计算投射物发射角度
     * const playerX = 100, playerY = 100;
     * const targetX = 200, targetY = 150;
     * const angle = CollisionDetector.getAngle(playerX, playerY, targetX, targetY);
     * console.log(`发射角度: ${(angle * 180 / Math.PI).toFixed(1)}度`);
     */
  static getAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  }
}

/**
 * 碰撞管理器
 * 高性能的碰撞检测管理系统，使用空间分割网格优化大量对象的碰撞检测
 */
export class CollisionManager {
  /**
     * 创建碰撞管理器实例
     * 初始化空间分割网格和碰撞对列表
     */
  constructor() {
    /** @type {Array<{obj1: GameObject, obj2: GameObject}>} 当前帧的碰撞对列表 */
    this.collisionPairs = [];
    /** @type {SpatialGrid} 空间分割网格，用于优化碰撞检测性能 */
    this.spatialGrid = new SpatialGrid(800, 600, 50); // 空间分割网格
  }

  /**
     * 更新碰撞检测系统
     * 将所有活跃对象添加到空间网格中，并检测潜在的碰撞对
     * @param {GameObject[]} objects - 需要检测碰撞的游戏对象数组
     * @example
     * // 在游戏循环中更新碰撞检测
     * const allObjects = [...players, ...enemies, ...projectiles];
     * collisionManager.update(allObjects);
     */
  update(objects) {
    // 清空空间网格
    this.spatialGrid.clear();
        
    // 将对象添加到空间网格
    objects.forEach(obj => {
      if (obj.isActive !== false && !obj.isDead) {
        this.spatialGrid.addObject(obj);
      }
    });
        
    // 检测碰撞
    this.collisionPairs = [];
    this.spatialGrid.detectCollisions(this.collisionPairs);
  }

  /**
     * 获取所有可能发生碰撞的对象对
     * 返回当前帧检测到的所有潜在碰撞对
     * @returns {Array<{obj1: GameObject, obj2: GameObject}>} 可能碰撞的对象对数组
     * @example
     * // 获取所有潜在碰撞对
     * const pairs = collisionManager.getCollisionPairs();
     * console.log(`需要检测${pairs.length}个潜在碰撞对`);
     * // 对每个碰撞对进行精确检测
     * pairs.forEach(pair => {
     *   const result = CollisionDetector.checkCircleCollision(pair.obj1, pair.obj2);
     *   if (result.collided) {
     *     handleCollision(pair.obj1, pair.obj2);
     *   }
     * });
     */
  getCollisionPairs() {
    return this.collisionPairs;
  }

  /**
     * 检测特定对象与目标对象数组的碰撞
     * 逐一检测指定对象与目标数组中每个对象的碰撞情况
     * @param {GameObject} object - 要检测碰撞的源对象
     * @param {GameObject[]} targets - 目标对象数组
     * @returns {Array<{target: GameObject, result: CollisionResult}>} 碰撞结果数组，包含碰撞的目标对象和详细结果
     * @example
     * // 检测玩家与所有敌人的碰撞
     * const playerCollisions = collisionManager.checkObjectCollisions(player, enemies);
     * playerCollisions.forEach(collision => {
     *   console.log('玩家撞到敌人:', collision.target);
     *   player.takeDamage(collision.target.damage);
     * });
     */
  checkObjectCollisions(object, targets) {
    const collisions = [];
        
    targets.forEach(target => {
      if (target !== object && target.isActive !== false && !target.isDead) {
        const result = this.checkCollision(object, target);
        if (result.collided) {
          collisions.push({
            target,
            result
          });
        }
      }
    });
        
    return collisions;
  }

  /**
     * 检测两个对象之间的精确碰撞
     * 根据对象类型自动选择合适的碰撞检测算法（圆形或矩形）
     * @param {GameObject} obj1 - 第一个游戏对象
     * @param {GameObject} obj2 - 第二个游戏对象
     * @returns {CollisionResult} 碰撞检测结果，包含是否碰撞、碰撞点、法向量等信息
     * @example
     * // 检测玩家和敌人的碰撞
     * const result = collisionManager.checkCollision(player, enemy);
     * if (result.collided) {
     *   console.log('碰撞发生在:', result.point);
     *   console.log('碰撞法向量:', result.normal);
     *   // 处理碰撞响应
     *   handleCollisionResponse(player, enemy, result);
     * }
     */
  checkCollision(obj1, obj2) {
    // 根据对象类型选择合适的碰撞检测方法
    if (obj1.radius && obj2.radius) {
      // 两个圆形
      return CollisionDetector.checkCircleCollision(
        { x: obj1.x, y: obj1.y, radius: obj1.radius },
        { x: obj2.x, y: obj2.y, radius: obj2.radius }
      );
    } else if (obj1.size && obj2.size) {
      // 使用size作为半径的圆形碰撞
      return CollisionDetector.checkCircleCollision(
        { x: obj1.x, y: obj1.y, radius: obj1.size },
        { x: obj2.x, y: obj2.y, radius: obj2.size }
      );
    } else {
      // 默认使用圆形碰撞，size默认为10
      const size1 = obj1.size || obj1.radius || 10;
      const size2 = obj2.size || obj2.radius || 10;
            
      return CollisionDetector.checkCircleCollision(
        { x: obj1.x, y: obj1.y, radius: size1 },
        { x: obj2.x, y: obj2.y, radius: size2 }
      );
    }
  }
}

/**
 * 空间分割网格
 * 用于优化大量对象的碰撞检测性能，将游戏区域划分为网格单元
 * 只检测相邻网格单元中的对象，大幅减少碰撞检测的计算量
 */
class SpatialGrid {
  /**
     * 创建空间分割网格
     * @param {number} width - 游戏区域宽度
     * @param {number} height - 游戏区域高度
     * @param {number} cellSize - 网格单元大小（像素）
     * @example
     * // 创建800x600的游戏区域，每个网格单元50x50像素
     * const grid = new SpatialGrid(800, 600, 50);
     */
  constructor(width, height, cellSize) {
    /** @type {number} 游戏区域宽度 */
    this.width = width;
    /** @type {number} 游戏区域高度 */
    this.height = height;
    /** @type {number} 网格单元大小 */
    this.cellSize = cellSize;
    /** @type {number} 网格列数 */
    this.cols = Math.ceil(width / cellSize);
    /** @type {number} 网格行数 */
    this.rows = Math.ceil(height / cellSize);
    /** @type {Array<Array<GameObject[]>>} 二维网格数组，每个单元包含该区域内的对象列表 */
    this.grid = [];
        
    // 初始化网格
    for (let i = 0; i < this.cols * this.rows; i++) {
      this.grid[i] = [];
    }
  }

  /**
     * 清空所有网格单元
     * 移除所有对象引用，准备下一帧的空间分割
     * @example
     * // 在每帧开始时清空网格
     * spatialGrid.clear();
     */
  clear() {
    this.grid.forEach(cell => {
      cell.length = 0;
    });
  }

  /**
     * 根据世界坐标获取对应的网格索引
     * 将世界坐标转换为网格坐标，并确保索引在有效范围内
     * @param {number} x - 世界坐标X值
     * @param {number} y - 世界坐标Y值
     * @returns {number} 网格索引，用于访问一维网格数组
     * @example
     * // 获取位置(150, 200)对应的网格索引
     * const index = spatialGrid.getGridIndex(150, 200);
     * console.log(`对象在网格索引${index}中`);
     */
  getGridIndex(x, y) {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    const clampedCol = Math.max(0, Math.min(col, this.cols - 1));
    const clampedRow = Math.max(0, Math.min(row, this.rows - 1));
    return clampedRow * this.cols + clampedCol;
  }

  /**
     * 将对象添加到对应的网格单元中
     * 根据对象的位置计算网格索引，并将对象添加到相应的网格单元
     * @param {GameObject} object - 要添加的游戏对象，必须包含x和y坐标属性
     * @example
     * // 将玩家对象添加到空间网格
     * spatialGrid.addObject(player);
     * // 将所有敌人添加到空间网格
     * enemies.forEach(enemy => spatialGrid.addObject(enemy));
     */
  addObject(object) {
    const index = this.getGridIndex(object.x, object.y);
    if (index >= 0 && index < this.grid.length) {
      this.grid[index].push(object);
    }
  }

  /**
     * 检测碰撞
     * @param {Array} collisionPairs - 碰撞对数组
     */
  detectCollisions(collisionPairs) {
    this.grid.forEach(cell => {
      // 检测同一网格内的对象碰撞
      for (let i = 0; i < cell.length; i++) {
        for (let j = i + 1; j < cell.length; j++) {
          const obj1 = cell[i];
          const obj2 = cell[j];
                    
          if (this.shouldCheckCollision(obj1, obj2)) {
            collisionPairs.push({ obj1, obj2 });
          }
        }
      }
    });
  }

  /**
     * 判断是否应该检测两个对象的碰撞
     * @param {Object} obj1 - 第一个对象
     * @param {Object} obj2 - 第二个对象
     * @returns {boolean} 是否应该检测
     */
  shouldCheckCollision(obj1, obj2) {
    // 可以根据对象类型添加更多的过滤条件
    return obj1 !== obj2 && 
               obj1.isActive !== false && 
               obj2.isActive !== false &&
               !obj1.isDead && 
               !obj2.isDead;
  }
}

/**
 * 默认导出的碰撞管理器实例
 * 全局单例，用于管理整个游戏的碰撞检测系统
 * @type {CollisionManager}
 * @example
 * // 导入并使用碰撞管理器
 * import collisionManager from './collision.js';
 * 
 * // 在游戏循环中更新碰撞检测
 * function gameLoop() {
 *   const allObjects = [...players, ...enemies, ...projectiles];
 *   collisionManager.update(allObjects);
 *   
 *   // 处理碰撞
 *   const pairs = collisionManager.getCollisionPairs();
 *   pairs.forEach(pair => {
 *     const result = collisionManager.checkCollision(pair.obj1, pair.obj2);
 *     if (result.collided) {
 *       handleCollision(pair.obj1, pair.obj2, result);
 *     }
 *   });
 * }
 */
export default new CollisionManager();

// CollisionDetector 已在文件开头导出，此处移除重复导出