/**
 * Type validation utilities - 类型验证工具
 * @module TypeValidator
 */

/**
 * 类型验证器类
 * 提供运行时类型检查和验证功能
 */
export class TypeValidator {
  /**
     * 创建类型验证器实例
     * @param {boolean} [enableLogging=false] - 是否启用日志记录
     * @param {boolean} [throwOnError=false] - 验证失败时是否抛出异常
     */
  constructor(enableLogging = false, throwOnError = false) {
    this.enableLogging = enableLogging;
    this.throwOnError = throwOnError;
    this.validationErrors = [];
    this.validationCount = 0;
    this.errorCount = 0;
  }

  /**
     * 验证基础类型
     * @param {*} value - 要验证的值
     * @param {string} expectedType - 期望的类型
     * @param {string} [fieldName='value'] - 字段名称
     * @returns {boolean} 验证结果
     */
  validateType(value, expectedType, fieldName = 'value') {
    this.validationCount++;
        
    const actualType = this.getType(value);
    const isValid = actualType === expectedType;
        
    if (!isValid) {
      this.handleValidationError(
        `Type mismatch for ${fieldName}: expected ${expectedType}, got ${actualType}`,
        { value, expectedType, actualType, fieldName }
      );
    }
        
    return isValid;
  }

  /**
     * 验证对象结构
     * @param {Object} obj - 要验证的对象
     * @param {Object} schema - 对象结构定义
     * @param {string} [objectName='object'] - 对象名称
     * @returns {boolean} 验证结果
     */
  validateObject(obj, schema, objectName = 'object') {
    this.validationCount++;
        
    if (!this.isObject(obj)) {
      this.handleValidationError(
        `${objectName} is not an object`,
        { obj, schema, objectName }
      );
      return false;
    }
        
    let isValid = true;
        
    // 验证必需字段
    for (const [key, fieldSchema] of Object.entries(schema)) {
      const fieldPath = `${objectName}.${key}`;
            
      if (fieldSchema.required && !(key in obj)) {
        this.handleValidationError(
          `Missing required field: ${fieldPath}`,
          { obj, schema, fieldPath }
        );
        isValid = false;
        continue;
      }
            
      if (key in obj) {
        const fieldValid = this.validateField(obj[key], fieldSchema, fieldPath);
        isValid = isValid && fieldValid;
      }
    }
        
    return isValid;
  }

  /**
     * 验证字段
     * @param {*} value - 字段值
     * @param {Object} fieldSchema - 字段结构定义
     * @param {string} fieldPath - 字段路径
     * @returns {boolean} 验证结果
     */
  validateField(value, fieldSchema, fieldPath) {
    let isValid = true;
        
    // 验证类型
    if (fieldSchema.type) {
      if (Array.isArray(fieldSchema.type)) {
        // 联合类型
        const typeValid = fieldSchema.type.some(type => 
          this.getType(value) === type
        );
        if (!typeValid) {
          this.handleValidationError(
            `Type mismatch for ${fieldPath}: expected one of [${fieldSchema.type.join(', ')}], got ${this.getType(value)}`,
            { value, fieldSchema, fieldPath }
          );
          isValid = false;
        }
      } else {
        const typeValid = this.validateType(value, fieldSchema.type, fieldPath);
        isValid = isValid && typeValid;
      }
    }
        
    // 验证数组元素
    if (fieldSchema.itemType && Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const itemValid = this.validateType(value[i], fieldSchema.itemType, `${fieldPath}[${i}]`);
        isValid = isValid && itemValid;
      }
    }
        
    // 验证嵌套对象
    if (fieldSchema.schema && this.isObject(value)) {
      const objectValid = this.validateObject(value, fieldSchema.schema, fieldPath);
      isValid = isValid && objectValid;
    }
        
    // 验证数值范围
    if (fieldSchema.min !== undefined && typeof value === 'number') {
      if (value < fieldSchema.min) {
        this.handleValidationError(
          `Value ${value} is below minimum ${fieldSchema.min} for ${fieldPath}`,
          { value, fieldSchema, fieldPath }
        );
        isValid = false;
      }
    }
        
    if (fieldSchema.max !== undefined && typeof value === 'number') {
      if (value > fieldSchema.max) {
        this.handleValidationError(
          `Value ${value} is above maximum ${fieldSchema.max} for ${fieldPath}`,
          { value, fieldSchema, fieldPath }
        );
        isValid = false;
      }
    }
        
    // 验证字符串长度
    if (fieldSchema.minLength !== undefined && typeof value === 'string') {
      if (value.length < fieldSchema.minLength) {
        this.handleValidationError(
          `String length ${value.length} is below minimum ${fieldSchema.minLength} for ${fieldPath}`,
          { value, fieldSchema, fieldPath }
        );
        isValid = false;
      }
    }
        
    if (fieldSchema.maxLength !== undefined && typeof value === 'string') {
      if (value.length > fieldSchema.maxLength) {
        this.handleValidationError(
          `String length ${value.length} is above maximum ${fieldSchema.maxLength} for ${fieldPath}`,
          { value, fieldSchema, fieldPath }
        );
        isValid = false;
      }
    }
        
    // 验证枚举值
    if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
      this.handleValidationError(
        `Value '${value}' is not in allowed enum values [${fieldSchema.enum.join(', ')}] for ${fieldPath}`,
        { value, fieldSchema, fieldPath }
      );
      isValid = false;
    }
        
    // 自定义验证函数
    if (fieldSchema.validator && typeof fieldSchema.validator === 'function') {
      try {
        const customValid = fieldSchema.validator(value, fieldPath);
        if (!customValid) {
          this.handleValidationError(
            `Custom validation failed for ${fieldPath}`,
            { value, fieldSchema, fieldPath }
          );
          isValid = false;
        }
      } catch (error) {
        this.handleValidationError(
          `Custom validator threw error for ${fieldPath}: ${error.message}`,
          { value, fieldSchema, fieldPath, error }
        );
        isValid = false;
      }
    }
        
    return isValid;
  }

  /**
     * 验证玩家对象
     * @param {Object} player - 玩家对象
     * @returns {boolean} 验证结果
     */
  validatePlayer(player) {
    const schema = {
      id: { type: 'string', required: true },
      name: { type: 'string', required: true, minLength: 1, maxLength: 50 },
      position: { 
        type: 'object', 
        required: true,
        schema: {
          x: { type: 'number', required: true },
          y: { type: 'number', required: true }
        }
      },
      velocity: { 
        type: 'object', 
        required: true,
        schema: {
          x: { type: 'number', required: true },
          y: { type: 'number', required: true }
        }
      },
      stats: {
        type: 'object',
        required: true,
        schema: {
          health: { type: 'number', required: true, min: 0 },
          maxHealth: { type: 'number', required: true, min: 1 },
          mana: { type: 'number', required: true, min: 0 },
          maxMana: { type: 'number', required: true, min: 0 },
          damage: { type: 'number', required: true, min: 0 },
          defense: { type: 'number', required: true, min: 0 },
          speed: { type: 'number', required: true, min: 0 }
        }
      },
      level: { type: 'number', required: true, min: 1 },
      experience: { type: 'number', required: true, min: 0 },
      score: { type: 'number', required: true, min: 0 }
    };
        
    return this.validateObject(player, schema, 'Player');
  }

  /**
     * 验证敌人对象
     * @param {Object} enemy - 敌人对象
     * @returns {boolean} 验证结果
     */
  validateEnemy(enemy) {
    const schema = {
      id: { type: 'string', required: true },
      type: { type: 'string', required: true },
      position: { 
        type: 'object', 
        required: true,
        schema: {
          x: { type: 'number', required: true },
          y: { type: 'number', required: true }
        }
      },
      stats: {
        type: 'object',
        required: true,
        schema: {
          health: { type: 'number', required: true, min: 0 },
          maxHealth: { type: 'number', required: true, min: 1 },
          damage: { type: 'number', required: true, min: 0 },
          speed: { type: 'number', required: true, min: 0 }
        }
      },
      aiState: {
        type: 'object',
        required: true,
        schema: {
          current: { type: 'string', required: true },
          stateStartTime: { type: 'number', required: true }
        }
      }
    };
        
    return this.validateObject(enemy, schema, 'Enemy');
  }

  /**
     * 验证弹药对象
     * @param {Object} projectile - 弹药对象
     * @returns {boolean} 验证结果
     */
  validateProjectile(projectile) {
    const schema = {
      id: { type: 'string', required: true },
      type: { type: 'string', required: true },
      ownerId: { type: 'string', required: true },
      position: { 
        type: 'object', 
        required: true,
        schema: {
          x: { type: 'number', required: true },
          y: { type: 'number', required: true }
        }
      },
      velocity: { 
        type: 'object', 
        required: true,
        schema: {
          x: { type: 'number', required: true },
          y: { type: 'number', required: true }
        }
      },
      damage: { type: 'number', required: true, min: 0 },
      speed: { type: 'number', required: true, min: 0 },
      range: { type: 'number', required: true, min: 0 },
      createdAt: { type: 'number', required: true }
    };
        
    return this.validateObject(projectile, schema, 'Projectile');
  }

  /**
     * 验证技能对象
     * @param {Object} skill - 技能对象
     * @returns {boolean} 验证结果
     */
  validateSkill(skill) {
    const schema = {
      id: { type: 'string', required: true },
      name: { type: 'string', required: true },
      type: { type: 'string', required: true },
      level: { type: 'number', required: true, min: 0 },
      maxLevel: { type: 'number', required: true, min: 1 },
      cooldown: { type: 'number', required: true, min: 0 },
      manaCost: { type: 'number', required: true, min: 0 },
      unlocked: { type: 'boolean', required: true }
    };
        
    return this.validateObject(skill, schema, 'Skill');
  }

  /**
     * 验证装备对象
     * @param {Object} equipment - 装备对象
     * @returns {boolean} 验证结果
     */
  validateEquipment(equipment) {
    const schema = {
      id: { type: 'string', required: true },
      name: { type: 'string', required: true },
      type: { type: 'string', required: true },
      slot: { type: 'string', required: true },
      rarity: { 
        type: 'string', 
        required: true,
        enum: ['common', 'uncommon', 'rare', 'epic', 'legendary']
      },
      level: { type: 'number', required: true, min: 1 },
      durability: { type: 'number', required: true, min: 0 },
      maxDurability: { type: 'number', required: true, min: 1 },
      stats: { type: 'object', required: true },
      equipped: { type: 'boolean', required: true }
    };
        
    return this.validateObject(equipment, schema, 'Equipment');
  }

  /**
     * 获取值的类型
     * @param {*} value - 要检查的值
     * @returns {string} 类型名称
     */
  getType(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  /**
     * 检查是否为对象
     * @param {*} value - 要检查的值
     * @returns {boolean} 是否为对象
     */
  isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  /**
     * 处理验证错误
     * @param {string} message - 错误消息
     * @param {Object} context - 错误上下文
     */
  handleValidationError(message, context) {
    this.errorCount++;
        
    const error = {
      message,
      context,
      timestamp: Date.now()
    };
        
    this.validationErrors.push(error);
        
    if (this.enableLogging) {
      console.warn('[TypeValidator]', message, context);
    }
        
    if (this.throwOnError) {
      throw new TypeError(message);
    }
  }

  /**
     * 获取验证统计信息
     * @returns {Object} 统计信息
     */
  getStats() {
    return {
      validationCount: this.validationCount,
      errorCount: this.errorCount,
      successRate: this.validationCount > 0 ? 
        ((this.validationCount - this.errorCount) / this.validationCount * 100).toFixed(2) + '%' : '100%',
      errors: this.validationErrors.slice(-10) // 最近10个错误
    };
  }

  /**
     * 清除验证错误记录
     */
  clearErrors() {
    this.validationErrors = [];
    this.errorCount = 0;
  }

  /**
     * 重置验证器
     */
  reset() {
    this.validationErrors = [];
    this.validationCount = 0;
    this.errorCount = 0;
  }

  /**
     * 设置配置
     * @param {Object} config - 配置选项
     */
  setConfig(config) {
    if (config.enableLogging !== undefined) {
      this.enableLogging = config.enableLogging;
    }
    if (config.throwOnError !== undefined) {
      this.throwOnError = config.throwOnError;
    }
  }
}

/**
 * 类型检查装饰器工厂
 * @param {Object} schema - 参数结构定义
 * @returns {Function} 装饰器函数
 */
export function validateParams(schema) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    const validator = new TypeValidator(true, false);
        
    descriptor.value = function(...args) {
      // 验证参数
      for (let i = 0; i < args.length && i < schema.length; i++) {
        if (schema[i]) {
          validator.validateField(args[i], schema[i], `${propertyKey}.param${i}`);
        }
      }
            
      return originalMethod.apply(this, args);
    };
        
    return descriptor;
  };
}

/**
 * 类型检查函数包装器
 * @param {Function} fn - 要包装的函数
 * @param {Array} paramSchemas - 参数结构定义数组
 * @param {Object} [returnSchema] - 返回值结构定义
 * @returns {Function} 包装后的函数
 */
export function wrapWithTypeCheck(fn, paramSchemas = [], returnSchema = null) {
  const validator = new TypeValidator(true, false);
    
  return function(...args) {
    // 验证参数
    for (let i = 0; i < args.length && i < paramSchemas.length; i++) {
      if (paramSchemas[i]) {
        validator.validateField(args[i], paramSchemas[i], `${fn.name}.param${i}`);
      }
    }
        
    // 调用原函数
    const result = fn.apply(this, args);
        
    // 验证返回值
    if (returnSchema) {
      validator.validateField(result, returnSchema, `${fn.name}.return`);
    }
        
    return result;
  };
}

/**
 * 全局类型验证器实例
 */
export const globalValidator = new TypeValidator(false, false);

/**
 * 开发模式类型验证器实例
 */
export const devValidator = new TypeValidator(true, true);

/**
 * 快捷验证函数
 */
export const validate = {
  player: (player) => globalValidator.validatePlayer(player),
  enemy: (enemy) => globalValidator.validateEnemy(enemy),
  projectile: (projectile) => globalValidator.validateProjectile(projectile),
  skill: (skill) => globalValidator.validateSkill(skill),
  equipment: (equipment) => globalValidator.validateEquipment(equipment),
  type: (value, type, name) => globalValidator.validateType(value, type, name),
  object: (obj, schema, name) => globalValidator.validateObject(obj, schema, name)
};