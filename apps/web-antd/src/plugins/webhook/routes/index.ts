import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    name: 'PluginWebhook',
    path: '/plugins/webhook',
    component: () => import('#/plugins/webhook/views/index.vue'),
    meta: {
      title: $t('webhook.menu'),
      icon: 'mdi:webhook',
    },
  },
  {
    name: 'PluginWebhookConfig',
    path: '/system/webhook/config',
    component: () => import('#/plugins/webhook/views/config.vue'),
    meta: {
      title: 'Webhook配置管理',
      icon: 'mdi:cog',
    },
  },
];

export default routes;
