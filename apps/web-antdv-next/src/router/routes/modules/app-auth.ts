import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'AppAuth',
    path: '/app-auth',
    meta: {
      title: '应用授权',
      icon: 'material-symbols:verified-user',
      order: 2,
    },
    children: [
      {
        name: 'AppAuthDashboard',
        path: 'dashboard',
        component: () => import('#/views/app-auth/index.vue'),
        meta: {
          title: '授权概览',
          icon: 'material-symbols:dashboard',
        },
      },
      {
        name: 'AppAuthApplication',
        path: 'application',
        component: () => import('#/views/app-auth/application/index.vue'),
        meta: {
          title: '应用管理',
          icon: 'material-symbols:apps',
        },
      },
      {
        name: 'AppAuthDevice',
        path: 'device',
        component: () => import('#/views/app-auth/device/index.vue'),
        meta: {
          title: '设备管理',
          icon: 'material-symbols:devices',
        },
      },
      {
        name: 'AppAuthPackage',
        path: 'package',
        component: () => import('#/views/app-auth/package/index.vue'),
        meta: {
          title: '套餐管理',
          icon: 'material-symbols:package-2',
        },
      },
      {
        name: 'AppAuthOrder',
        path: 'order',
        component: () => import('#/views/app-auth/order/index.vue'),
        meta: {
          title: '订单管理',
          icon: 'material-symbols:shopping-cart',
        },
      },
      {
        name: 'AppAuthRedeemCode',
        path: 'redeem-code',
        component: () => import('#/views/app-auth/redeem-code/index.vue'),
        meta: {
          title: '兑换码管理',
          icon: 'material-symbols:card-giftcard',
        },
      },
      {
        name: 'AppAuthVersion',
        path: 'version',
        component: () => import('#/views/app-auth/version/index.vue'),
        meta: {
          title: '版本管理',
          icon: 'material-symbols:new-releases',
        },
      },
      {
        name: 'AppAuthAuthorization',
        path: 'authorization',
        component: () => import('#/views/app-auth/authorization/index.vue'),
        meta: {
          title: '授权管理',
          icon: 'material-symbols:verified-user',
        },
      },
    ],
  },
];

export default routes;
