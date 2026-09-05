import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'mdi:creation-outline',
      title: '媒体工坊',
      order: 400,
    },
    name: 'MediaStudio',
    path: '/media-studio',
    children: [
      {
        meta: {
          icon: 'mdi:auto-fix',
          title: '作品解析与二创',
        },
        name: 'MediaStudioIndex',
        path: '/media-studio/index',
        component: () => import('#/views/media-studio/index.vue'),
      },
    ],
  },
];

export default routes;
