import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'MyDrive',
    path: '/mydrive',
    meta: {
      title: '我的网盘',
      icon: 'mdi:cloud-outline',
      order: 2,
    },
    children: [
      {
        name: 'MyDriveAccounts',
        path: 'accounts',
        component: () => import('#/views/mydrive/accounts/index.vue'),
        meta: {
          title: '账号管理',
          icon: 'mdi:account-cloud-outline',
        },
      },
      {
        name: 'MyDriveSpaces',
        path: 'spaces',
        component: () => import('#/views/mydrive/spaces/index.vue'),
        meta: {
          title: '文件空间',
          icon: 'mdi:folder-multiple-outline',
        },
      },
      {
        name: 'MyDriveSyncConfigs',
        path: 'sync-configs',
        component: () => import('#/views/mydrive/sync-configs/index.vue'),
        meta: {
          title: '同步配置',
          icon: 'mdi:sync',
        },
      },
      {
        name: 'MyDriveResources',
        path: 'resources',
        component: () => import('#/views/mydrive/resources/index.vue'),
        meta: {
          title: '资源管理',
          icon: 'mdi:database-outline',
        },
      },
      {
        name: 'MyDriveFeishuSheets',
        path: 'feishu-sheets',
        component: () => import('#/views/mydrive/feishu-sheets/index.vue'),
        meta: {
          title: '飞书表导出',
          icon: 'mdi:table-arrow-right',
        },
      },
    ],
  },
];

export default routes;
