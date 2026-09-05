import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:shield-alert',
      title: '内容安全',
      order: 16,
    },
    name: 'SensitiveWord',
    path: '/sensitive-word',
    children: [
      {
        meta: {
          title: '敏感词管理',
        },
        name: 'SensitiveWordIndex',
        path: '/sensitive-word/index',
        component: () => import('#/views/sensitive-word/index.vue'),
      },
      {
        meta: {
          title: '命中日志',
        },
        name: 'SensitiveWordLog',
        path: '/sensitive-word/log',
        component: () => import('#/views/sensitive-word/log/index.vue'),
      },
    ],
  },
];

export default routes;
