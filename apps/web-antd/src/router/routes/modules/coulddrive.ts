import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'Coulddrive',
    path: '/coulddrive',
    meta: {
      title: 'Coulddrive 云盘管理',
      icon: 'mdi:cloud-sync',
      order: 2,
    },
    children: [
      {
        name: 'CoulddriveOverview',
        path: 'overview',
        component: () => import('#/views/coulddrive/overview/index.vue'),
        meta: {
          title: '概览',
          icon: 'mdi:view-dashboard',
        },
      },
      {
        name: 'CoulddriveFileManager',
        path: 'file-manager',
        component: () => import('#/views/coulddrive/file-manager/index.vue'),
        meta: {
          title: '文件管理',
          icon: 'mdi:folder-multiple',
        },
      },
      {
        name: 'CoulddriveUserManager',
        path: 'user-manager',
        component: () => import('#/views/coulddrive/user-manager/index.vue'),
        meta: {
          title: '用户管理',
          icon: 'mdi:account-group',
        },
      },
      {
        name: 'CoulddriveSyncManager',
        path: 'sync-manager',
        component: () => import('#/views/coulddrive/sync-manager/index.vue'),
        meta: {
          title: '同步任务',
          icon: 'mdi:sync',
        },
      },
      {
        name: 'CoulddriveTemplateManager',
        path: 'template-manager',
        component: () => import('#/views/coulddrive/template-manager/index.vue'),
        meta: {
          title: '规则模板',
          icon: 'mdi:file-document-multiple',
        },
      },
      {
        name: 'CoulddriveResourceManager',
        path: 'resource-manager',
        component: () => import('#/views/coulddrive/resource-manager/index.vue'),
        meta: {
          title: '资源管理',
          icon: 'mdi:database',
        },
      },
    ],
  },
];

export default routes;
