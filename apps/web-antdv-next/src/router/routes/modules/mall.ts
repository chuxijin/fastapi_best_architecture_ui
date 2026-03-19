import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'Mall',
    path: '/mall',
    meta: {
      title: '商城管理',
      icon: 'mdi:shopping-outline',
      order: 11,
    },
    children: [
      {
        name: 'MallProduct',
        path: '/mall/product',
        component: () => import('#/views/mall/product/index.vue'),
        meta: {
          title: '商品管理',
          icon: 'mdi:package-variant',
        },
      },
      {
        name: 'MallActivity',
        path: '/mall/activity',
        component: () => import('#/views/mall/activity/index.vue'),
        meta: {
          title: '拼团活动',
          icon: 'mdi:account-group',
        },
      },
      {
        name: 'MallTeam',
        path: '/mall/team',
        component: () => import('#/views/mall/team/index.vue'),
        meta: {
          title: '拼团团队',
          icon: 'mdi:account-multiple',
        },
      },
      {
        name: 'MallOrder',
        path: '/mall/order',
        component: () => import('#/views/mall/order/index.vue'),
        meta: {
          title: '订单管理',
          icon: 'mdi:file-document-outline',
        },
      },
    ],
  },
];

export default routes;
