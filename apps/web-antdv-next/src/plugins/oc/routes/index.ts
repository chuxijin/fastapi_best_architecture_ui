import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'OcRecruit',
    path: '/oc',
    meta: {
      title: 'OC 招聘',
      icon: 'mdi:briefcase-search-outline',
      order: 34,
    },
    children: [
      {
        name: 'OcCompany',
        path: 'company',
        component: () => import('#/plugins/oc/views/company.vue'),
        meta: {
          title: '公司列表',
          icon: 'mdi:office-building-outline',
        },
      },
      {
        name: 'OcWebsite',
        path: 'website',
        component: () => import('#/plugins/oc/views/website.vue'),
        meta: {
          title: '网站列表',
          icon: 'mdi:web',
        },
      },
    ],
  },
];

export default routes;
