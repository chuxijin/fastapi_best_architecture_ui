import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:brain',
      title: '记忆卡管理',
      order: 350,
    },
    name: 'MemoryCard',
    path: '/memory-card',
    children: [
      {
        meta: {
          title: '卡组管理',
        },
        name: 'MemoryCardDeck',
        path: '/memory-card/deck',
        component: () => import('#/views/memory-card/deck/index.vue'),
      },
      {
        meta: {
          title: '卡片管理',
        },
        name: 'MemoryCardCard',
        path: '/memory-card/card',
        component: () => import('#/views/memory-card/card/index.vue'),
      },
    ],
  },
];

export default routes;
