import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'KnowledgeStore',
    path: '/knowledge-store',
    meta: {
      title: '知识店铺',
      icon: 'mdi:store',
      order: 3,
    },
    children: [
      {
        name: 'KnowledgeStoreHome',
        path: '/knowledge-store/home',
        component: () => import('#/views/knowledge-store/home/index.vue'),
        meta: {
          title: '首页管理',
          icon: 'mdi:home',
        },
      },
      {
        name: 'KnowledgeStoreCategory',
        path: '/knowledge-store/category',
        meta: {
          title: '分类标签',
          icon: 'mdi:tag-multiple',
        },
        children: [
          {
            name: 'KnowledgeStoreCategories',
            path: '/knowledge-store/category/categories',
            component: () =>
              import('#/views/knowledge-store/category/categories/index.vue'),
            meta: {
              title: '分类管理',
              icon: 'mdi:folder-multiple',
            },
          },
          {
            name: 'KnowledgeStoreTags',
            path: '/knowledge-store/category/tags',
            component: () =>
              import('#/views/knowledge-store/category/tags/index.vue'),
            meta: {
              title: '标签管理',
              icon: 'mdi:tag',
            },
          },
        ],
      },
      {
        name: 'KnowledgeStoreResource',
        path: '/knowledge-store/resource',
        meta: {
          title: '教育资源',
          icon: 'mdi:book-education',
        },
        children: [
          {
            name: 'KnowledgeStoreQuestionBank',
            path: '/knowledge-store/resource/question-bank',
            component: () =>
              import(
                '#/views/knowledge-store/resource/question-bank/index.vue'
              ),
            meta: {
              title: '题库管理',
              icon: 'mdi:file-question',
            },
          },
          {
            name: 'KnowledgeStoreQuestionBankEdit',
            path: '/knowledge-store/resource/question-bank/edit',
            component: () =>
              import(
                '#/views/knowledge-store/resource/question-bank/edit/index.vue'
              ),
            meta: {
              title: '编辑题库',
              hideInMenu: true,
              activeMenu: '/knowledge-store/resource/question-bank',
            },
          },
          {
            name: 'KnowledgeStoreQuestionBankOperation',
            path: '/knowledge-store/resource/question-bank/operation',
            component: () =>
              import(
                '#/views/knowledge-store/resource/question-bank/operation/index.vue'
              ),
            meta: {
              title: '题库运营',
              hideInMenu: true,
              activeMenu: '/knowledge-store/resource/question-bank',
            },
          },
          {
            name: 'KnowledgeStoreMaterialPackage',
            path: '/knowledge-store/resource/material-package',
            component: () =>
              import(
                '#/views/knowledge-store/resource/material-package/index.vue'
              ),
            meta: {
              title: '资料包管理',
              icon: 'mdi:package-variant',
            },
          },
        ],
      },
    ],
  },
];

export default routes;
