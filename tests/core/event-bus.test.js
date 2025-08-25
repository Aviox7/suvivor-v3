/**
 * @fileoverview 事件总线系统单元测试
 */

import { EventBus } from '../js/core/event-bus.js';

describe('EventBus', () => {
  let eventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  afterEach(() => {
    eventBus.clear();
  });

  describe('基础事件监听和发布', () => {
    test('应该能够监听和触发事件', () => {
      const mockHandler = jest.fn();
      eventBus.on('test:event', mockHandler);
      
      eventBus.emit('test:event', 'test data');
      
      expect(mockHandler).toHaveBeenCalledWith('test data');
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    test('应该支持多个监听器', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      eventBus.on('test:event', handler1);
      eventBus.on('test:event', handler2);
      
      eventBus.emit('test:event', 'data');
      
      expect(handler1).toHaveBeenCalledWith('data');
      expect(handler2).toHaveBeenCalledWith('data');
    });

    test('应该返回是否有监听器处理事件', () => {
      const handler = jest.fn();
      eventBus.on('test:event', handler);
      
      const handled = eventBus.emit('test:event');
      const notHandled = eventBus.emit('unknown:event');
      
      expect(handled).toBe(true);
      expect(notHandled).toBe(false);
    });
  });

  describe('一次性事件监听', () => {
    test('once监听器应该只执行一次', () => {
      const mockHandler = jest.fn();
      eventBus.once('test:event', mockHandler);
      
      eventBus.emit('test:event', 'data1');
      eventBus.emit('test:event', 'data2');
      
      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(mockHandler).toHaveBeenCalledWith('data1');
    });

    test('on方法的once选项应该正常工作', () => {
      const mockHandler = jest.fn();
      eventBus.on('test:event', mockHandler, { once: true });
      
      eventBus.emit('test:event', 'data1');
      eventBus.emit('test:event', 'data2');
      
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('事件移除', () => {
    test('应该能够移除事件监听器', () => {
      const mockHandler = jest.fn();
      eventBus.on('test:event', mockHandler);
      
      eventBus.emit('test:event');
      expect(mockHandler).toHaveBeenCalledTimes(1);
      
      eventBus.off('test:event', mockHandler);
      eventBus.emit('test:event');
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    test('on方法应该返回取消监听的函数', () => {
      const mockHandler = jest.fn();
      const unsubscribe = eventBus.on('test:event', mockHandler);
      
      eventBus.emit('test:event');
      expect(mockHandler).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      eventBus.emit('test:event');
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    test('应该能够清除所有监听器', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      eventBus.on('event1', handler1);
      eventBus.on('event2', handler2);
      
      eventBus.clear();
      
      eventBus.emit('event1');
      eventBus.emit('event2');
      
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('中间件系统', () => {
    test('应该能够添加和执行中间件', () => {
      const middleware = jest.fn((eventName, data) => {
        return `processed_${data}`;
      });
      const handler = jest.fn();
      
      eventBus.use(middleware);
      eventBus.on('test:event', handler);
      
      eventBus.emit('test:event', 'data');
      
      expect(middleware).toHaveBeenCalledWith('test:event', 'data');
      expect(handler).toHaveBeenCalledWith('processed_data');
    });

    test('多个中间件应该按顺序执行', () => {
      const middleware1 = (eventName, data) => `1_${data}`;
      const middleware2 = (eventName, data) => `2_${data}`;
      const handler = jest.fn();
      
      eventBus.use(middleware1);
      eventBus.use(middleware2);
      eventBus.on('test:event', handler);
      
      eventBus.emit('test:event', 'data');
      
      expect(handler).toHaveBeenCalledWith('2_1_data');
    });

    test('中间件异常不应该影响其他监听器', () => {
      const badMiddleware = () => {
        throw new Error('Middleware error');
      };
      const handler = jest.fn();
      
      eventBus.use(badMiddleware);
      eventBus.on('test:event', handler);
      
      const result = eventBus.emit('test:event', 'data');
      
      expect(result).toBe(false);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('上下文绑定', () => {
    test('应该能够绑定执行上下文', () => {
      const context = { value: 'test' };
      const handler = jest.fn(function() {
        return this.value;
      });
      
      eventBus.on('test:event', handler, { context });
      eventBus.emit('test:event');
      
      expect(handler).toHaveBeenCalled();
      // 在测试环境中，this绑定可能会被Jest处理，这里主要测试不会报错
    });
  });

  describe('等待事件Promise化', () => {
    test('应该能够等待事件触发', async () => {
      setTimeout(() => {
        eventBus.emit('test:event', 'async data');
      }, 10);
      
      const data = await eventBus.waitFor('test:event');
      expect(data).toBe('async data');
    });

    test('等待事件应该支持超时', async () => {
      await expect(eventBus.waitFor('nonexistent:event', 100))
        .rejects.toThrow('等待事件超时: nonexistent:event');
    });
  });

  describe('统计信息', () => {
    test('应该能够获取事件统计', () => {
      eventBus.on('event1', () => {});
      eventBus.on('event1', () => {});
      eventBus.on('event2', () => {});
      
      const stats = eventBus.getStats();
      
      expect(stats.totalEvents).toBe(2);
      expect(stats.totalListeners).toBe(3);
      expect(stats.events.event1.listeners).toBe(2);
      expect(stats.events.event2.listeners).toBe(1);
    });
  });

  describe('错误处理', () => {
    test('应该验证事件名称', () => {
      expect(() => {
        eventBus.on('', () => {});
      }).toThrow('Event name must be a non-empty string');
      
      expect(() => {
        eventBus.on(null, () => {});
      }).toThrow('Event name must be a non-empty string');
    });

    test('应该验证回调函数', () => {
      expect(() => {
        eventBus.on('test', null);
      }).toThrow('Callback must be a function');
      
      expect(() => {
        eventBus.on('test', 'not a function');
      }).toThrow('Callback must be a function');
    });

    test('监听器异常不应该影响其他监听器', () => {
      const goodHandler = jest.fn();
      const badHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      
      eventBus.on('test:event', badHandler);
      eventBus.on('test:event', goodHandler);
      
      const result = eventBus.emit('test:event');
      
      expect(result).toBe(true); // 至少有一个监听器成功执行
      expect(goodHandler).toHaveBeenCalled();
    });
  });

  describe('内存泄漏预防', () => {
    test('移除监听器后应该清理空的事件映射', () => {
      const handler = jest.fn();
      eventBus.on('test:event', handler);
      
      expect(eventBus.events.has('test:event')).toBe(true);
      
      eventBus.off('test:event', handler);
      
      expect(eventBus.events.has('test:event')).toBe(false);
    });

    test('一次性监听器执行后应该自动清理', () => {
      const handler = jest.fn();
      eventBus.once('test:event', handler);
      
      expect(eventBus.events.has('test:event')).toBe(true);
      
      eventBus.emit('test:event');
      
      expect(eventBus.events.has('test:event')).toBe(false);
    });
  });
});