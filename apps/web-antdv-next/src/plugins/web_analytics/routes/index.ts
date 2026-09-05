import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'PluginWebAnalyticsOverview',
    path: '/plugins/web-analytics',
    component: () => import('#/plugins/web_analytics/views/overview.vue'),
    meta: { title: '流量总览', icon: 'carbon:analytics' },
  },
  {
    name: 'PluginWebAnalyticsBehavior',
    path: '/plugins/web-analytics/behavior',
    component: () => import('#/plugins/web_analytics/views/behavior.vue'),
    meta: { title: '行为分析', icon: 'carbon:heat-map' },
  },
  {
    name: 'PluginWebAnalyticsSites',
    path: '/plugins/web-analytics/sites',
    component: () => import('#/plugins/web_analytics/views/sites.vue'),
    meta: { title: '站点管理', icon: 'carbon:web-services-container' },
  },
];

export default routes;
