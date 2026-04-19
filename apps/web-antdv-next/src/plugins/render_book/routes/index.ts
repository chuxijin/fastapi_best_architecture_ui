import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'PluginRenderBook',
    path: '/plugins/render-book',
    component: () => import('#/plugins/render_book/views/index.vue'),
    meta: {
      title: '题本模板预览',
      icon: 'carbon:book',
    },
  },
];

export default routes;
