import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    name: 'System',
    path: '/system',
    meta: {
      title: $t('page.menu.system'),
      icon: 'grommet-icons:system',
      order: 1,
    },
    children: [
      {
        name: 'SysDept',
        path: '/system/dept',
        component: () => import('#/views/system/dept/index.vue'),
        meta: {
          title: $t('page.menu.sysDept'),
          icon: 'mingcute:department-line',
        },
      },
      {
        name: 'SysCategory',
        path: '/system/category',
        component: () => import('#/views/system/category/index.vue'),
        meta: {
          title: '分类管理',
          icon: 'material-symbols:category',
        },
      },
      {
        name: 'SysUser',
        path: '/system/user',
        component: () => import('#/views/system/user/index.vue'),
        meta: {
          title: $t('page.menu.sysUser'),
          icon: 'ant-design:user-outlined',
        },
      },
      {
        name: 'SysRole',
        path: '/system/role',
        component: () => import('#/views/system/role/index.vue'),
        meta: {
          title: $t('page.menu.sysRole'),
          icon: 'carbon:user-role',
        },
      },
      {
        name: 'SysMenu',
        path: '/system/menu',
        component: () => import('#/views/system/menu/index.vue'),
        meta: {
          title: $t('page.menu.sysMenu'),
          icon: 'material-symbols:menu',
        },
      },
      {
        name: 'SysLinks',
        path: '/system/links',
        meta: {
          title: '链接管理',
          icon: 'material-symbols:link',
        },
        children: [
          {
            name: 'SysLinksDomain',
            path: '/system/links/domain',
            component: () => import('#/views/system/links/domain/index.vue'),
            meta: {
              title: '域名管理',
              icon: 'material-symbols:dns-outline',
            },
          },
          {
            name: 'SysLinksDwz',
            path: '/system/links/dwz',
            component: () => import('#/views/system/links/dwz/index.vue'),
            meta: {
              title: '短网址',
              icon: 'material-symbols:link-rounded',
            },
          },
          {
            name: 'SysLinksQun',
            path: '/system/links/qun',
            component: () => import('#/views/system/links/qun/index.vue'),
            meta: {
              title: '群活码',
              icon: 'material-symbols:group-outline',
            },
          },
          {
            name: 'SysLinksKf',
            path: '/system/links/kf',
            component: () => import('#/views/system/links/kf/index.vue'),
            meta: {
              title: '客服码',
              icon: 'material-symbols:support-agent',
            },
          },
          {
            name: 'SysLinksPage',
            path: '/system/links/page',
            component: () => import('#/views/system/links/page/index.vue'),
            meta: {
              title: '页面管理',
              icon: 'material-symbols:file-present-outline',
            },
          },
        ],
      },
      {
        name: 'SysDataPermission',
        path: '/system/data-permission',
        meta: {
          title: $t('page.menu.sysDataPermission'),
          icon: 'icon-park-outline:permissions',
        },
        children: [
          {
            name: 'SysDataScope',
            path: '/system/data-scope',
            component: () =>
              import('#/views/system/data-permission/scope/index.vue'),
            meta: {
              title: $t('page.menu.sysDataScope'),
              icon: 'cuida:scope-outline',
            },
          },
          {
            name: 'SysDataRule',
            path: '/system/data-rule',
            component: () =>
              import('#/views/system/data-permission/rule/index.vue'),
            meta: {
              title: $t('page.menu.sysDataRule'),
              icon: 'material-symbols:rule',
            },
          },
        ],
      },
      {
        name: 'SysPlugin',
        path: '/system/plugin',
        component: () => import('#/views/system/plugin/index.vue'),
        meta: {
          title: $t('page.menu.sysPlugin'),
          icon: 'clarity:plugin-line',
        },
      },
      {
        name: 'SysGrayscale',
        path: '/system/grayscale',
        component: () => import('#/views/system/grayscale/index.vue'),
        meta: {
          title: '灰度管理',
          icon: 'carbon:load-balancer-vpc',
        },
      },
    ],
  },
];

export default routes;
