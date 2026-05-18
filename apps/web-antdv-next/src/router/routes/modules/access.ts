import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'Access',
    path: '/access',
    meta: {
      title: 'Web/小程序订阅',
      icon: 'material-symbols:lock-person',
      order: 3,
    },
    children: [
      {
        name: 'AccessDashboard',
        path: 'dashboard',
        component: () => import('#/views/access/dashboard/index.vue'),
        meta: {
          title: '总览',
          icon: 'material-symbols:dashboard',
        },
      },
      {
        name: 'AccessSubscriptionTemplate',
        path: 'subscription-template',
        component: () =>
          import('#/views/access/subscription-template/index.vue'),
        meta: {
          title: '订阅模板',
          icon: 'material-symbols:subscriptions',
        },
      },
      {
        name: 'AccessSubscriptionTemplateDetail',
        path: 'subscription-template/:id',
        component: () =>
          import('#/views/access/subscription-template/detail.vue'),
        meta: {
          title: '订阅模板详情',
          hideInMenu: true,
          activePath: '/access/subscription-template',
        },
      },
      {
        name: 'AccessUserSubscription',
        path: 'user-subscription',
        component: () => import('#/views/access/user-subscription/index.vue'),
        meta: {
          title: '用户订阅',
          icon: 'material-symbols:assignment-ind',
        },
      },
      {
        name: 'AccessPack',
        path: 'pack',
        component: () => import('#/views/access/pack/index.vue'),
        meta: {
          title: '权益包',
          icon: 'material-symbols:inventory',
        },
      },
      {
        name: 'AccessRedeem',
        path: 'redeem',
        component: () => import('#/views/access/redeem/index.vue'),
        meta: {
          title: '兑换配置',
          icon: 'material-symbols:redeem',
        },
      },
      {
        name: 'AccessEntitlement',
        path: 'entitlement',
        component: () => import('#/views/access/entitlement/index.vue'),
        meta: {
          title: '权益编码',
          icon: 'material-symbols:key',
        },
      },
      {
        name: 'AccessDomain',
        path: 'domain',
        component: () => import('#/views/access/domain/index.vue'),
        meta: {
          title: '领域配置',
          icon: 'material-symbols:domain',
        },
      },
      {
        name: 'AccessDecideDebug',
        path: 'decide-debug',
        component: () => import('#/views/access/decide-debug/index.vue'),
        meta: {
          title: '决策调试',
          icon: 'material-symbols:bug-report',
        },
      },
    ],
  },
];

export default routes;
