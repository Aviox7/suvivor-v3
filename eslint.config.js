export default {
  languageOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    globals: {
      // Browser globals
      window: 'readonly',
      document: 'readonly',
      console: 'readonly',
      setTimeout: 'readonly',
      setInterval: 'readonly',
      clearTimeout: 'readonly',
      clearInterval: 'readonly',
      requestAnimationFrame: 'readonly',
      cancelAnimationFrame: 'readonly',
      Image: 'readonly',
      Audio: 'readonly',
      Date: 'readonly',
      Math: 'readonly',
      JSON: 'readonly',
      localStorage: 'readonly',
       sessionStorage: 'readonly',
       performance: 'readonly',
       // Node.js globals
       process: 'readonly',
       Buffer: 'readonly',
       global: 'readonly',
       __dirname: 'readonly',
       __filename: 'readonly',
       // Custom globals
       G: 'writable',
       canvas: 'readonly',
       ctx: 'readonly',
       ENABLE_ANALYTICS: 'readonly'
    }
  },
  rules: {
    // 错误级别
    'no-unused-vars': ['warn', { 
      'varsIgnorePattern': '^(G|canvas|ctx|ENABLE_ANALYTICS)$',
      'argsIgnorePattern': '^_'
    }],
    'no-console': 'off', // 游戏开发中console很有用
    'no-debugger': 'warn',
    'no-undef': 'error',
    
    // 代码风格
    'prefer-const': 'error',
    'no-var': 'error',
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    
    // 最佳实践
    'eqeqeq': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    
    // ES6+
    'arrow-spacing': 'error',
    'template-curly-spacing': 'error',
    'object-shorthand': 'warn',
    
    // 游戏开发特定
    'no-magic-numbers': ['warn', { 
      'ignore': [-1, 0, 1, 2, 5, 10, 20, 30, 45, 60, 100, 360, 1000, 1024, 5000],
      'ignoreArrayIndexes': true 
    }]
  }
};