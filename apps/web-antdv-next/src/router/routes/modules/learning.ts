import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'Learning',
    path: '/learning',
    meta: {
      title: '学习管理',
      icon: 'mdi:book-clock-outline',
      order: 11,
    },
    children: [
      {
        name: 'LearningTemplate',
        path: 'templates',
        component: () => import('#/views/learning/template/index.vue'),
        meta: {
          title: '计划模板',
          icon: 'mdi:clipboard-text-multiple-outline',
          authority: ['learning:template:read'],
        },
      },
      {
        name: 'LearningPlan',
        path: 'plans',
        component: () => import('#/views/learning/plan/index.vue'),
        meta: {
          title: '计划管理',
          icon: 'mdi:clipboard-text-clock-outline',
          authority: ['learning:plan:read'],
        },
      },
      {
        name: 'LearningDelivery',
        path: 'deliveries',
        component: () => import('#/views/learning/delivery/index.vue'),
        meta: {
          title: '交付管理',
          icon: 'mdi:package-variant-closed-check',
          authority: ['learning:delivery:read'],
        },
      },
    ],
  },
];

export default routes;
