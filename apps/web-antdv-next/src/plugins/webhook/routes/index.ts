import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'PluginWebhookEndpoint',
    path: '/plugins/webhook/endpoints',
    component: () => import('#/plugins/webhook/views/endpoint.vue'),
    meta: {
      title: '出站端点',
      icon: 'mdi:webhook',
    },
  },
  {
    name: 'PluginWebhookDelivery',
    path: '/plugins/webhook/deliveries',
    component: () => import('#/plugins/webhook/views/delivery.vue'),
    meta: {
      title: '投递记录',
      icon: 'mdi:send-clock',
    },
  },
  {
    name: 'PluginWebhookInbound',
    path: '/plugins/webhook/inbound',
    component: () => import('#/plugins/webhook/views/inbound.vue'),
    meta: {
      title: '入站事件',
      icon: 'mdi:inbox-arrow-down',
    },
  },
  {
    name: 'PluginWebhookEventType',
    path: '/plugins/webhook/event-types',
    component: () => import('#/plugins/webhook/views/event-type.vue'),
    meta: {
      title: '事件类型',
      icon: 'mdi:tag-multiple',
    },
  },
];

export default routes;
