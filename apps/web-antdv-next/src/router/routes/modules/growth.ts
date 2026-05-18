import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'Growth',
    path: '/growth',
    meta: {
      title: '成长体系',
      icon: 'material-symbols:trending-up',
      order: 4,
    },
    children: [
      {
        name: 'GrowthExperienceRule',
        path: 'experience-rule',
        component: () => import('#/views/growth/experience-rule/index.vue'),
        meta: {
          title: '经验规则',
          icon: 'material-symbols:rule',
        },
      },
      {
        name: 'GrowthExperienceAccount',
        path: 'experience-account',
        component: () => import('#/views/growth/experience-account/index.vue'),
        meta: {
          title: '经验账户',
          icon: 'material-symbols:account-balance-wallet',
        },
      },
    ],
  },
];

export default routes;
