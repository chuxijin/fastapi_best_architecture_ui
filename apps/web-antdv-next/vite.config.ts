import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from '@vben/vite-config';
import Icons from 'unplugin-icons/vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default defineConfig(async (): Promise<any> => {
  return {
    application: {},
    vite: {
      plugins: [Icons({ compiler: 'vue3' })],
      optimizeDeps: {
        exclude: [
          '@v-c/util',
          '@v-c/tabs',
          'antdv-next',
          '@v-c/dropdown',
          '@v-c/menu',
          '@v-c/select',
        ],
      },
      resolve: {
        alias: [
          {
            // antdv-next@1.1.0 的 dist/index.js 缺少 ./version/index.js，
            // 运行时改走完整 esm 入口，避免 dev import-analysis 直接报错。
            find: /^antdv-next$/,
            replacement: resolve(
              __dirname,
              'node_modules/antdv-next/dist/antd.esm.js',
            ),
          },
          {
            find: '@HaloEditor',
            replacement: resolve(__dirname, 'src/components/HaloEditor'),
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
