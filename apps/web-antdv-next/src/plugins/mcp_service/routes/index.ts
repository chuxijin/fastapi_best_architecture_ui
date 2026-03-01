import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    name: 'PluginMcpConfigs',
    path: '/plugins/mcp/configs',
    component: () => import('#/plugins/mcp_service/views/index.vue'),
    meta: {
      title: $t('mcp_service.menu'),
      icon: 'mdi:cog-outline',
    },
  },
];

export default routes;
