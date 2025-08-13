// @ts-check

import { defineConfig } from '@vben/eslint-config';

export default defineConfig([
  {
    files: ['**/*.vue'],
    rules: {
      // 避免与 Prettier 的换行策略冲突
      'vue/html-closing-bracket-newline': 'off',
      'vue/html-quotes': 'off',

      // 放宽在模板/脚本中常见的调试与三元表达式用法
      'no-console': 'off',
      'unicorn/no-nested-ternary': 'off',
      'unicorn/prefer-ternary': 'off',

      // 减少未使用变量在 .vue 文件中的干扰（如解构、模板引用等）
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-vars': 'off',
    },
  },
]);
