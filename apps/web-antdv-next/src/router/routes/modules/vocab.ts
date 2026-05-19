import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:book-open',
      title: '词库管理',
      order: 300,
    },
    name: 'Vocab',
    path: '/vocab',
    children: [
      {
        meta: {
          title: '词书管理',
        },
        name: 'VocabBook',
        path: '/vocab/book',
        component: () => import('#/views/vocab/book/index.vue'),
      },
      {
        meta: {
          title: '单词管理',
        },
        name: 'VocabWord',
        path: '/vocab/word',
        component: () => import('#/views/vocab/word/index.vue'),
      },
    ],
  },
]

export default routes
