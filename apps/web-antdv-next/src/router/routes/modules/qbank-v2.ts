import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'QbankV2',
    path: '/qbank-v2',
    meta: { title: '题库 V2', icon: 'mdi:book-open-page-variant', order: 5 },
    children: [
      {
        name: 'QbankV2Bank',
        path: '/qbank-v2/bank',
        component: () => import('#/views/qbank-v2/bank/index.vue'),
        meta: { title: '题库管理', icon: 'mdi:bookshelf' },
      },
      {
        name: 'QbankV2BankDetail',
        path: '/qbank-v2/bank/:id',
        component: () => import('#/views/qbank-v2/bank/detail.vue'),
        meta: { title: '题库详情', icon: 'mdi:book-open', hideInMenu: true },
      },
      {
        name: 'QbankV2Question',
        path: '/qbank-v2/question',
        component: () => import('#/views/qbank-v2/question/index.vue'),
        meta: { title: '题目管理', icon: 'mdi:order-bool-ascending-variant' },
      },
      {
        name: 'QbankV2QuestionDetail',
        path: '/qbank-v2/question/:id',
        component: () => import('#/views/qbank-v2/question/detail.vue'),
        meta: {
          title: '题目详情',
          icon: 'mdi:file-document-edit',
          hideInMenu: true,
        },
      },
      {
        name: 'QbankV2Knowledge',
        path: '/qbank-v2/knowledge',
        component: () => import('#/views/qbank-v2/knowledge/index.vue'),
        meta: { title: '知识体系', icon: 'mdi:family-tree' },
      },
      {
        name: 'QbankV2Catalog',
        path: '/qbank-v2/catalog',
        component: () => import('#/views/qbank-v2/catalog/index.vue'),
        meta: { title: '合集管理', icon: 'mdi:folder-multiple-outline' },
      },
      {
        name: 'QbankV2Material',
        path: '/qbank-v2/material',
        component: () => import('#/views/qbank-v2/material/index.vue'),
        meta: { title: '材料管理', icon: 'mdi:file-document-multiple' },
      },
      {
        name: 'QbankV2Annotation',
        path: '/qbank-v2/annotation',
        meta: { title: '标注管理', icon: 'mdi:label-multiple' },
        children: [
          {
            name: 'QbankV2KnowledgeLabel',
            path: '/qbank-v2/annotation/knowledge-label',
            component: () =>
              import('#/views/qbank-v2/annotation/knowledge-label/index.vue'),
            meta: { title: '知识点标注', icon: 'mdi:tag-multiple' },
          },
          {
            name: 'QbankV2Interaction',
            path: '/qbank-v2/annotation/question-interaction',
            component: () =>
              import('#/views/qbank-v2/annotation/question-interaction/index.vue'),
            meta: { title: '交互标注', icon: 'mdi:crosshairs-gps' },
          },
        ],
      },
    ],
  },
];

export default routes;
