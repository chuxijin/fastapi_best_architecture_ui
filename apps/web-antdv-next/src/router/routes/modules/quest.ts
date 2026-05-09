import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'Quest',
    path: '/quest',
    meta: {
      title: '悬赏任务',
      icon: 'mdi:trophy-outline',
      order: 12,
    },
    children: [
      {
        name: 'QuestManage',
        path: '/quest/manage',
        component: () => import('#/views/quest/quest/index.vue'),
        meta: {
          title: '任务管理',
          icon: 'mdi:clipboard-list-outline',
        },
      },
      {
        name: 'QuestClaim',
        path: '/quest/claim',
        component: () => import('#/views/quest/claim/index.vue'),
        meta: {
          title: '领取审核',
          icon: 'mdi:check-decagram-outline',
        },
      },
    ],
  },
];

export default routes;
