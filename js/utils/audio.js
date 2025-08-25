/**
 * Audio utilities module - 音频工具模块
 * @module AudioUtils
 */

/**
 * @typedef {Object} AudioConfig
 * @property {number} masterVolume - 主音量 (0-1)
 * @property {number} musicVolume - 音乐音量 (0-1)
 * @property {number} sfxVolume - 音效音量 (0-1)
 * @property {boolean} muted - 是否静音
 * @property {string} audioFormat - 音频格式偏好
 */

/**
 * @typedef {Object} SoundEffect
 * @property {string} name - 音效名称
 * @property {AudioBuffer} buffer - 音频缓冲区
 * @property {number} volume - 音量
 * @property {number} pitch - 音调
 * @property {boolean} loop - 是否循环
 * @property {number} duration - 持续时间
 */

/**
 * 音频管理器类
 */
export class AudioManager {
  /**
     * 构造函数
     */
  constructor() {
    /** @type {AudioContext} */
    this.audioContext = null;
        
    /** @type {GainNode} */
    this.masterGain = null;
        
    /** @type {GainNode} */
    this.musicGain = null;
        
    /** @type {GainNode} */
    this.sfxGain = null;
        
    /** @type {Map<string, AudioBuffer>} */
    this.audioBuffers = new Map();
        
    /** @type {Map<string, AudioBufferSourceNode>} */
    this.activeSources = new Map();
        
    /** @type {AudioConfig} */
    this.config = {
      masterVolume: 1.0,
      musicVolume: 0.7,
      sfxVolume: 0.8,
      muted: false,
      audioFormat: 'ogg'
    };
        
    /** @type {boolean} */
    this.initialized = false;
        
    /** @type {Array<Function>} */
    this.loadQueue = [];
        
    this.init();
  }

  /**
     * 初始化音频系统
     */
  async init() {
    try {
      // 创建音频上下文
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
      // 创建增益节点
      this.masterGain = this.audioContext.createGain();
      this.musicGain = this.audioContext.createGain();
      this.sfxGain = this.audioContext.createGain();
            
      // 连接音频图
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);
            
      // 设置初始音量
      this.updateVolumes();
            
      // 处理音频上下文状态
      if (this.audioContext.state === 'suspended') {
        await this.resume();
      }
            
      this.initialized = true;
            
      // 处理加载队列
      this.loadQueue.forEach(callback => callback());
      this.loadQueue = [];
            
    } catch (error) {
      console.error('Failed to initialize audio system:', error);
    }
  }

  /**
     * 恢复音频上下文
     */
  async resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.error('Failed to resume audio context:', error);
      }
    }
  }

  /**
     * 暂停音频上下文
     */
  async suspend() {
    if (this.audioContext && this.audioContext.state === 'running') {
      try {
        await this.audioContext.suspend();
      } catch (error) {
        console.error('Failed to suspend audio context:', error);
      }
    }
  }

  /**
     * 加载音频文件
     * @param {string} name - 音频名称
     * @param {string} url - 音频URL
     * @returns {Promise<AudioBuffer>} 音频缓冲区
     */
  async loadAudio(name, url) {
    if (!this.initialized) {
      return new Promise(resolve => {
        this.loadQueue.push(async () => {
          const buffer = await this.loadAudio(name, url);
          resolve(buffer);
        });
      });
    }

    try {
      if (typeof fetch === 'undefined') {
        console.warn('fetch is not available in this environment');
        return null;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
      this.audioBuffers.set(name, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.error(`Failed to load audio: ${name}`, error);
      return null;
    }
  }

  /**
     * 批量加载音频文件
     * @param {Object<string, string>} audioFiles - 音频文件映射
     * @returns {Promise<void>}
     */
  async loadAudioBatch(audioFiles) {
    const promises = Object.entries(audioFiles).map(([name, url]) => 
      this.loadAudio(name, url)
    );
        
    await Promise.all(promises);
  }

  /**
     * 播放音效
     * @param {string} name - 音效名称
     * @param {Object} options - 播放选项
     * @param {number} options.volume - 音量 (0-1)
     * @param {number} options.pitch - 音调 (0.5-2)
     * @param {boolean} options.loop - 是否循环
     * @param {number} options.delay - 延迟时间（秒）
     * @returns {AudioBufferSourceNode|null} 音频源节点
     */
  playSFX(name, options = {}) {
    if (!this.initialized || this.config.muted) return null;
        
    const buffer = this.audioBuffers.get(name);
    if (!buffer) {
      console.warn(`Audio buffer not found: ${name}`);
      return null;
    }

    const {
      volume = 1.0,
      pitch = 1.0,
      loop = false,
      delay = 0
    } = options;

    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
            
      source.buffer = buffer;
      source.loop = loop;
      source.playbackRate.value = pitch;
            
      gainNode.gain.value = volume;
            
      source.connect(gainNode);
      gainNode.connect(this.sfxGain);
            
      const startTime = this.audioContext.currentTime + delay;
      source.start(startTime);
            
      // 清理资源
      source.onended = () => {
        source.disconnect();
        gainNode.disconnect();
      };
            
      return source;
    } catch (error) {
      console.error(`Failed to play SFX: ${name}`, error);
      return null;
    }
  }

  /**
     * 播放背景音乐
     * @param {string} name - 音乐名称
     * @param {Object} options - 播放选项
     * @param {number} options.volume - 音量
     * @param {boolean} options.loop - 是否循环
     * @param {number} options.fadeIn - 淡入时间（秒）
     * @returns {AudioBufferSourceNode|null} 音频源节点
     */
  playMusic(name, options = {}) {
    if (!this.initialized || this.config.muted) return null;
        
    // 停止当前音乐
    this.stopMusic();
        
    const buffer = this.audioBuffers.get(name);
    if (!buffer) {
      console.warn(`Music buffer not found: ${name}`);
      return null;
    }

    const {
      volume = 1.0,
      loop = true,
      fadeIn = 0
    } = options;

    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
            
      source.buffer = buffer;
      source.loop = loop;
            
      if (fadeIn > 0) {
        gainNode.gain.value = 0;
        gainNode.gain.linearRampToValueAtTime(
          volume,
          this.audioContext.currentTime + fadeIn
        );
      } else {
        gainNode.gain.value = volume;
      }
            
      source.connect(gainNode);
      gainNode.connect(this.musicGain);
            
      source.start();
            
      this.activeSources.set('music', source);
      this.activeSources.set('musicGain', gainNode);
            
      source.onended = () => {
        this.activeSources.delete('music');
        this.activeSources.delete('musicGain');
      };
            
      return source;
    } catch (error) {
      console.error(`Failed to play music: ${name}`, error);
      return null;
    }
  }

  /**
     * 停止背景音乐
     * @param {number} fadeOut - 淡出时间（秒）
     */
  stopMusic(fadeOut = 0) {
    const source = this.activeSources.get('music');
    const gainNode = this.activeSources.get('musicGain');
        
    if (source && gainNode) {
      if (fadeOut > 0) {
        gainNode.gain.linearRampToValueAtTime(
          0,
          this.audioContext.currentTime + fadeOut
        );
                
        setTimeout(() => {
          source.stop();
          source.disconnect();
          gainNode.disconnect();
        }, fadeOut * 1000);
      } else {
        source.stop();
        source.disconnect();
        gainNode.disconnect();
      }
            
      this.activeSources.delete('music');
      this.activeSources.delete('musicGain');
    }
  }

  /**
     * 停止所有音频
     */
  stopAll() {
    this.activeSources.forEach((source, key) => {
      if (source && typeof source.stop === 'function') {
        source.stop();
        source.disconnect();
      }
    });
    this.activeSources.clear();
  }

  /**
     * 设置主音量
     * @param {number} volume - 音量 (0-1)
     */
  setMasterVolume(volume) {
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  /**
     * 设置音乐音量
     * @param {number} volume - 音量 (0-1)
     */
  setMusicVolume(volume) {
    this.config.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  /**
     * 设置音效音量
     * @param {number} volume - 音量 (0-1)
     */
  setSFXVolume(volume) {
    this.config.sfxVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  /**
     * 切换静音状态
     */
  toggleMute() {
    this.config.muted = !this.config.muted;
    this.updateVolumes();
  }

  /**
     * 设置静音状态
     * @param {boolean} muted - 是否静音
     */
  setMuted(muted) {
    this.config.muted = muted;
    this.updateVolumes();
  }

  /**
     * 更新音量设置
     */
  updateVolumes() {
    if (!this.initialized) return;
        
    const masterVol = this.config.muted ? 0 : this.config.masterVolume;
        
    this.masterGain.gain.value = masterVol;
    this.musicGain.gain.value = this.config.musicVolume;
    this.sfxGain.gain.value = this.config.sfxVolume;
  }

  /**
     * 获取音频配置
     * @returns {AudioConfig} 音频配置
     */
  getConfig() {
    return { ...this.config };
  }

  /**
     * 设置音频配置
     * @param {Partial<AudioConfig>} config - 音频配置
     */
  setConfig(config) {
    Object.assign(this.config, config);
    this.updateVolumes();
  }

  /**
     * 检查音频是否支持
     * @param {string} format - 音频格式
     * @returns {boolean} 是否支持
     */
  static isFormatSupported(format) {
    const audio = new Audio();
    return audio.canPlayType(`audio/${format}`) !== '';
  }

  /**
     * 获取支持的音频格式
     * @returns {Array<string>} 支持的格式列表
     */
  static getSupportedFormats() {
    const formats = ['ogg', 'mp3', 'wav', 'aac', 'm4a'];
    return formats.filter(format => this.isFormatSupported(format));
  }
}

/**
 * 音效合成器类
 */
export class SoundSynthesizer {
  /**
     * 构造函数
     * @param {AudioContext} audioContext - 音频上下文
     */
  constructor(audioContext) {
    this.audioContext = audioContext;
  }

  /**
     * 生成简单音调
     * @param {number} frequency - 频率
     * @param {number} duration - 持续时间
     * @param {string} waveType - 波形类型
     * @param {number} volume - 音量
     * @returns {AudioBuffer} 音频缓冲区
     */
  generateTone(frequency, duration, waveType = 'sine', volume = 0.5) {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      switch (waveType) {
      case 'sine':
        sample = Math.sin(2 * Math.PI * frequency * t);
        break;
      case 'square':
        sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
        break;
      case 'sawtooth':
        sample = 2 * (t * frequency - Math.floor(t * frequency + 0.5));
        break;
      case 'triangle':
        sample = 2 * Math.abs(2 * (t * frequency - Math.floor(t * frequency + 0.5))) - 1;
        break;
      case 'noise':
        sample = Math.random() * 2 - 1;
        break;
      }

      // 应用包络
      const envelope = this.applyEnvelope(t, duration);
      data[i] = sample * volume * envelope;
    }

    return buffer;
  }

  /**
     * 应用ADSR包络
     * @param {number} time - 当前时间
     * @param {number} duration - 总持续时间
     * @param {Object} adsr - ADSR参数
     * @returns {number} 包络值
     */
  applyEnvelope(time, duration, adsr = { attack: 0.1, decay: 0.1, sustain: 0.7, release: 0.2 }) {
    const { attack, decay, sustain, release } = adsr;
    const attackTime = duration * attack;
    const decayTime = duration * decay;
    const releaseTime = duration * release;
    const sustainTime = duration - attackTime - decayTime - releaseTime;

    if (time < attackTime) {
      // Attack phase
      return time / attackTime;
    } else if (time < attackTime + decayTime) {
      // Decay phase
      const decayProgress = (time - attackTime) / decayTime;
      return 1 - decayProgress * (1 - sustain);
    } else if (time < attackTime + decayTime + sustainTime) {
      // Sustain phase
      return sustain;
    } else {
      // Release phase
      const releaseProgress = (time - attackTime - decayTime - sustainTime) / releaseTime;
      return sustain * (1 - releaseProgress);
    }
  }

  /**
     * 生成爆炸音效
     * @param {number} duration - 持续时间
     * @param {number} volume - 音量
     * @returns {AudioBuffer} 音频缓冲区
     */
  generateExplosion(duration = 0.5, volume = 0.8) {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const progress = t / duration;
            
      // 混合噪声和低频音调
      const noise = (Math.random() * 2 - 1) * 0.7;
      const lowFreq = Math.sin(2 * Math.PI * (100 - progress * 80) * t) * 0.3;
            
      // 应用衰减包络
      const envelope = Math.exp(-progress * 5);
            
      data[i] = (noise + lowFreq) * volume * envelope;
    }

    return buffer;
  }

  /**
     * 生成射击音效
     * @param {number} duration - 持续时间
     * @param {number} volume - 音量
     * @returns {AudioBuffer} 音频缓冲区
     */
  generateShoot(duration = 0.1, volume = 0.6) {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const progress = t / duration;
            
      // 高频噪声 + 快速衰减的音调
      const noise = (Math.random() * 2 - 1) * 0.5;
      const tone = Math.sin(2 * Math.PI * (800 - progress * 400) * t) * 0.5;
            
      // 快速衰减
      const envelope = Math.exp(-progress * 20);
            
      data[i] = (noise + tone) * volume * envelope;
    }

    return buffer;
  }

  /**
     * 生成拾取音效
     * @param {number} duration - 持续时间
     * @param {number} volume - 音量
     * @returns {AudioBuffer} 音频缓冲区
     */
  generatePickup(duration = 0.3, volume = 0.5) {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const progress = t / duration;
            
      // 上升音调
      const frequency = 400 + progress * 400;
      const tone = Math.sin(2 * Math.PI * frequency * t);
            
      // 钟形包络
      const envelope = Math.sin(Math.PI * progress);
            
      data[i] = tone * volume * envelope;
    }

    return buffer;
  }

  /**
     * 生成受伤音效
     * @param {number} duration - 持续时间
     * @param {number} volume - 音量
     * @returns {AudioBuffer} 音频缓冲区
     */
  generateHurt(duration = 0.2, volume = 0.7) {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const progress = t / duration;
            
      // 下降音调 + 噪声
      const frequency = 300 - progress * 200;
      const tone = Math.sin(2 * Math.PI * frequency * t) * 0.7;
      const noise = (Math.random() * 2 - 1) * 0.3;
            
      // 快速衰减
      const envelope = Math.exp(-progress * 8);
            
      data[i] = (tone + noise) * volume * envelope;
    }

    return buffer;
  }

  /**
     * 生成升级音效
     * @param {number} duration - 持续时间
     * @param {number} volume - 音量
     * @returns {AudioBuffer} 音频缓冲区
     */
  generateLevelUp(duration = 0.8, volume = 0.6) {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const progress = t / duration;
            
      // 和弦音效
      const freq1 = 523.25; // C5
      const freq2 = 659.25; // E5
      const freq3 = 783.99; // G5
            
      const tone1 = Math.sin(2 * Math.PI * freq1 * t) * 0.33;
      const tone2 = Math.sin(2 * Math.PI * freq2 * t) * 0.33;
      const tone3 = Math.sin(2 * Math.PI * freq3 * t) * 0.33;
            
      // 缓慢衰减
      const envelope = Math.exp(-progress * 2);
            
      data[i] = (tone1 + tone2 + tone3) * volume * envelope;
    }

    return buffer;
  }

  /**
     * 添加混响效果
     * @param {AudioBuffer} buffer - 原始音频缓冲区
     * @param {number} roomSize - 房间大小 (0-1)
     * @param {number} damping - 阻尼 (0-1)
     * @returns {AudioBuffer} 处理后的音频缓冲区
     */
  addReverb(buffer, roomSize = 0.5, damping = 0.5) {
    const sampleRate = buffer.sampleRate;
    const length = buffer.length;
    const reverbBuffer = this.audioContext.createBuffer(1, length, sampleRate);
    const inputData = buffer.getChannelData(0);
    const outputData = reverbBuffer.getChannelData(0);
        
    // 简单的延迟线混响
    const delayTime = Math.floor(sampleRate * roomSize * 0.1);
    const feedback = 0.3 + roomSize * 0.4;
    const wetLevel = 0.3;
        
    const delayBuffer = new Float32Array(delayTime);
    let delayIndex = 0;
        
    for (let i = 0; i < length; i++) {
      const input = inputData[i];
      const delayed = delayBuffer[delayIndex];
            
      // 混合原始信号和延迟信号
      outputData[i] = input + delayed * wetLevel;
            
      // 更新延迟缓冲区
      delayBuffer[delayIndex] = input + delayed * feedback * (1 - damping);
      delayIndex = (delayIndex + 1) % delayTime;
    }
        
    return reverbBuffer;
  }

  /**
     * 添加失真效果
     * @param {AudioBuffer} buffer - 原始音频缓冲区
     * @param {number} amount - 失真程度 (0-1)
     * @returns {AudioBuffer} 处理后的音频缓冲区
     */
  addDistortion(buffer, amount = 0.5) {
    const length = buffer.length;
    const distortedBuffer = this.audioContext.createBuffer(1, length, buffer.sampleRate);
    const inputData = buffer.getChannelData(0);
    const outputData = distortedBuffer.getChannelData(0);
        
    const drive = 1 + amount * 50;
    const threshold = 1 / drive;
        
    for (let i = 0; i < length; i++) {
      let sample = inputData[i] * drive;
            
      if (sample > threshold) {
        sample = threshold + (sample - threshold) / (1 + Math.pow((sample - threshold) / (1 - threshold), 2));
      } else if (sample < -threshold) {
        sample = -threshold + (sample + threshold) / (1 + Math.pow((sample + threshold) / (1 - threshold), 2));
      }
            
      outputData[i] = sample / drive;
    }
        
    return distortedBuffer;
  }
}

/**
 * 音频工具函数
 */
export class AudioUtils {
  /**
     * 检测用户交互以启用音频
     * @param {AudioManager} audioManager - 音频管理器
     */
  static setupUserInteraction(audioManager) {
    const enableAudio = async () => {
      await audioManager.resume();
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    };
        
    document.addEventListener('click', enableAudio);
    document.addEventListener('keydown', enableAudio);
    document.addEventListener('touchstart', enableAudio);
  }

  /**
     * 创建音频可视化器
     * @param {AudioContext} audioContext - 音频上下文
     * @param {AudioNode} sourceNode - 音频源节点
     * @returns {AnalyserNode} 分析器节点
     */
  static createVisualizer(audioContext, sourceNode) {
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    sourceNode.connect(analyser);
    return analyser;
  }

  /**
     * 获取音频频谱数据
     * @param {AnalyserNode} analyser - 分析器节点
     * @returns {Uint8Array} 频谱数据
     */
  static getFrequencyData(analyser) {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  /**
     * 获取音频波形数据
     * @param {AnalyserNode} analyser - 分析器节点
     * @returns {Uint8Array} 波形数据
     */
  static getWaveformData(analyser) {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  /**
     * 计算音频RMS值（音量）
     * @param {Uint8Array} waveformData - 波形数据
     * @returns {number} RMS值 (0-1)
     */
  static calculateRMS(waveformData) {
    let sum = 0;
    for (let i = 0; i < waveformData.length; i++) {
      const sample = (waveformData[i] - 128) / 128;
      sum += sample * sample;
    }
    return Math.sqrt(sum / waveformData.length);
  }

  /**
     * 检测音频节拍
     * @param {Uint8Array} frequencyData - 频谱数据
     * @param {number} threshold - 阈值
     * @returns {boolean} 是否检测到节拍
     */
  static detectBeat(frequencyData, threshold = 200) {
    // 检测低频能量（节拍通常在低频）
    let lowFreqEnergy = 0;
    const lowFreqBins = Math.floor(frequencyData.length * 0.1);
        
    for (let i = 0; i < lowFreqBins; i++) {
      lowFreqEnergy += frequencyData[i];
    }
        
    return lowFreqEnergy / lowFreqBins > threshold;
  }

  /**
     * 音频淡入淡出
     * @param {GainNode} gainNode - 增益节点
     * @param {number} targetVolume - 目标音量
     * @param {number} duration - 持续时间（秒）
     * @param {AudioContext} audioContext - 音频上下文
     */
  static fadeVolume(gainNode, targetVolume, duration, audioContext) {
    const currentTime = audioContext.currentTime;
    gainNode.gain.linearRampToValueAtTime(targetVolume, currentTime + duration);
  }

  /**
     * 创建3D音频定位
     * @param {AudioContext} audioContext - 音频上下文
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} z - Z坐标
     * @returns {PannerNode} 3D音频节点
     */
  static create3DAudio(audioContext, x = 0, y = 0, z = 0) {
    const panner = audioContext.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 10000;
    panner.rolloffFactor = 1;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 0;
    panner.coneOuterGain = 0;
        
    panner.setPosition(x, y, z);
        
    return panner;
  }

  /**
     * 更新3D音频监听器位置
     * @param {AudioContext} audioContext - 音频上下文
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} z - Z坐标
     * @param {number} forwardX - 前方向X
     * @param {number} forwardY - 前方向Y
     * @param {number} forwardZ - 前方向Z
     * @param {number} upX - 上方向X
     * @param {number} upY - 上方向Y
     * @param {number} upZ - 上方向Z
     */
  static updateListener(audioContext, x, y, z, forwardX = 0, forwardY = 0, forwardZ = -1, upX = 0, upY = 1, upZ = 0) {
    const listener = audioContext.listener;
        
    if (listener.setPosition) {
      listener.setPosition(x, y, z);
    } else {
      listener.positionX.value = x;
      listener.positionY.value = y;
      listener.positionZ.value = z;
    }
        
    if (listener.setOrientation) {
      listener.setOrientation(forwardX, forwardY, forwardZ, upX, upY, upZ);
    } else {
      listener.forwardX.value = forwardX;
      listener.forwardY.value = forwardY;
      listener.forwardZ.value = forwardZ;
      listener.upX.value = upX;
      listener.upY.value = upY;
      listener.upZ.value = upZ;
    }
  }
}

/**
 * 默认导出音频管理器
 */
export default AudioManager;