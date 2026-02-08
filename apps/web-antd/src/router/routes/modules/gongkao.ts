import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'Gongkao',
    path: '/gongkao',
    meta: {
      title: '公考管理',
      icon: 'mdi:school-outline',
      order: 10,
    },
    children: [
      {
        name: 'GongkaoCiyu',
        path: '/gongkao/ciyu',
        component: () => import('#/views/gongkao/ciyu/index.vue'),
        meta: {
          title: '词语管理',
          icon: 'mdi:book-alphabet',
        },
      },
      {
        name: 'GongkaoJingyan',
        path: '/gongkao/jingyan',
        component: () => import('#/views/gongkao/jingyan/index.vue'),
        meta: {
          title: '经验管理',
          icon: 'mdi:lightbulb-on-outline',
        },
      },
      {
        name: 'GongkaoGangwei',
        path: '/gongkao/gangwei',
        component: () => import('#/views/gongkao/gangwei/index.vue'),
        meta: {
          title: '岗位管理',
          icon: 'mdi:briefcase-outline',
        },
      },
      {
        name: 'GongkaoShiping',
        path: '/gongkao/shiping',
        component: () => import('#/views/gongkao/shiping/index.vue'),
        meta: {
          title: '时评管理',
          icon: 'mdi:newspaper-variant-outline',
        },
      },
      {
        name: 'GongkaoShizhen',
        path: '/gongkao/shizhen',
        component: () => import('#/views/gongkao/shizhen/index.vue'),
        meta: {
          title: '时政管理',
          icon: 'mdi:calendar-text-outline',
        },
      },
      {
        name: 'GongkaoGuanmei',
        path: '/gongkao/guanmei',
        component: () => import('#/views/gongkao/guanmei/index.vue'),
        meta: {
          title: '官媒学言语',
          icon: 'mdi:text-box-check-outline',
        },
      },
      {
        name: 'GongkaoZhenti',
        path: '/gongkao/zhenti',
        component: () => import('#/views/gongkao/zhenti/index.vue'),
        meta: {
          title: '真题管理',
          icon: 'mdi:file-document-edit-outline',
        },
      },
      {
        name: 'GongkaoCategory',
        path: '/gongkao/category',
        component: () => import('#/views/gongkao/category/index.vue'),
        meta: {
          title: '分类管理',
          icon: 'mdi:tag-multiple-outline',
        },
      },
    ],
  },
];

export default routes;
