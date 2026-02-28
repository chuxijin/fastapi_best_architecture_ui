import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'Social',
    path: '/social',
    meta: {
      title: 'Social 社媒管理',
      icon: 'mdi:account-voice',
      order: 3,
    },
    children: [
      {
        name: 'SocialAccount',
        path: 'account',
        component: () => import('../../../views/social/account/index.vue'),
        meta: {
          title: '账号管理',
          icon: 'mdi:account',
        },
      },
      {
        name: 'SocialWork',
        path: 'work',
        component: () => import('../../../views/social/work/index.vue'),
        meta: {
          title: '作品管理',
          icon: 'mdi:video',
        },
      },
      {
        name: 'SocialMetric',
        path: 'metric',
        component: () => import('../../../views/social/metric/index.vue'),
        meta: {
          title: '数据快照',
          icon: 'mdi:chart-line',
        },
      },
    ],
  },
];

export default routes;
