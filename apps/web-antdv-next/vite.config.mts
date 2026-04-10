import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from '@vben/vite-config';

const __dirname = dirname(fileURLToPath(import.meta.url));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default defineConfig(async (): Promise<any> => {
  return {
    application: {},
    vite: {
      optimizeDeps: {
        exclude: ['@v-c/util', '@v-c/tabs', 'antdv-next', '@v-c/dropdown', '@v-c/menu', '@v-c/select'],
      },
      resolve: {
        alias: [
          {
            // antdv-next@1.1.0 的 dist/index.js 缺少 ./version/index.js，
            // 运行时改走完整 esm 入口，避免 dev import-analysis 直接报错。
            find: /^antdv-next$/,
            replacement: resolve(
              __dirname,
              '../../node_modules/.pnpm/antdv-next@1.1.0_vue@3.5.28_typescript@5.9.3_/node_modules/antdv-next/dist/antd.esm.js',
            ),
          },
          {
            find: '@halo-dev/api-client',
            replacement: resolve(__dirname, 'src/stubs/halo-api-client.ts'),
          },
          {
            find: '@halo-dev/components',
            replacement: resolve(__dirname, 'src/stubs/halo-components.ts'),
          },
          {
            find: '@halo-dev/ui-shared',
            replacement: resolve(__dirname, 'src/stubs/halo-ui-shared.ts'),
          },
          {
            find: '@codemirror/autocomplete',
            replacement: resolve(
              __dirname,
              '../../node_modules/.pnpm/@codemirror+autocomplete@6.20.0/node_modules/@codemirror/autocomplete',
            ),
          },
          {
            find: '@codemirror/commands',
            replacement: resolve(
              __dirname,
              '../../node_modules/.pnpm/@codemirror+commands@6.10.2/node_modules/@codemirror/commands',
            ),
          },
          {
            find: '@codemirror/lang-html',
            replacement: resolve(
              __dirname,
              '../../node_modules/.pnpm/@codemirror+lang-html@6.4.11/node_modules/@codemirror/lang-html',
            ),
          },
          {
            find: '@codemirror/lang-markdown',
            replacement: resolve(
              __dirname,
              '../../node_modules/.pnpm/@codemirror+lang-markdown@6.5.0/node_modules/@codemirror/lang-markdown',
            ),
          },
          {
            find: '@codemirror/language',
            replacement: resolve(
              __dirname,
              '../../node_modules/.pnpm/@codemirror+language@6.12.1/node_modules/@codemirror/language',
            ),
          },
          {
            find: '@codemirror/state',
            replacement: resolve(
              __dirname,
              '../../node_modules/.pnpm/@codemirror+state@6.5.4/node_modules/@codemirror/state',
            ),
          },
          {
            find: '@codemirror/view',
            replacement: resolve(
              __dirname,
              '../../node_modules/.pnpm/@codemirror+view@6.39.15/node_modules/@codemirror/view',
            ),
          },
        ],
      },
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path: string) => path.replace(/^\/api/, ''),
            // mock代理目标地址
            target: 'http://localhost:5320/api',
            ws: true,
          },
        },
      },
    },
  };
});
