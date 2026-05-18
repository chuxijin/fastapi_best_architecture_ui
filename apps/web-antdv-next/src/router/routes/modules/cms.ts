import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'Cms',
    path: '/cms',
    meta: {
      title: '内容运营',
      icon: 'mdi:advertisements',
      order: 13,
    },
    children: [
      {
        name: 'CmsSlot',
        path: '/cms/slot',
        component: () => import('#/views/cms/slot/index.vue'),
        meta: {
          title: '运营位管理',
          icon: 'mdi:image-multiple-outline',
        },
      },
      {
        name: 'CmsMessage',
        path: '/cms/message',
        component: () => import('#/views/cms/message/index.vue'),
        meta: {
          title: '消息管理',
          icon: 'mdi:message-text-outline',
        },
      },
    ],
  },
];

export default routes;
