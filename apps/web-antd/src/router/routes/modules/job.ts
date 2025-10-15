import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'Job',
    path: '/job',
    meta: {
      title: '岗位管理',
      icon: 'material-symbols:work',
      order: 3,
    },
    children: [
      {
        name: 'JobPosting',
        path: '/job/posting',
        component: () => import('#/views/job/posting/index.vue'),
        meta: {
          title: '岗位管理',
          icon: 'material-symbols:work',
        },
      },
    ],
  },
];

export default routes;
