import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'StudyPlan',
    path: '/study-plan',
    meta: {
      title: '学习规划',
      icon: 'mdi:calendar-check-outline',
      order: 11,
    },
    children: [
      {
        name: 'StudyPlanPlan',
        path: 'plans',
        component: () => import('#/views/study-plan/plan/index.vue'),
        meta: {
          title: '计划管理',
          icon: 'mdi:clipboard-list-outline',
        },
      },
      {
        name: 'StudyPlanTemplate',
        path: 'templates',
        component: () => import('#/views/study-plan/template/index.vue'),
        meta: {
          title: '模板管理',
          icon: 'mdi:file-document-multiple-outline',
        },
      },
      {
        name: 'StudyPlanMentor',
        path: 'mentors',
        component: () => import('#/views/study-plan/mentor/index.vue'),
        meta: {
          title: '导师分配',
          icon: 'mdi:account-multiple-check-outline',
        },
      },
      {
        name: 'StudyPlanProgress',
        path: 'progress',
        component: () => import('#/views/study-plan/progress/index.vue'),
        meta: {
          title: '进度查看',
          icon: 'mdi:chart-donut',
        },
      },
      {
        name: 'StudyPlanAbilityProfile',
        path: 'ability-profile',
        component: () => import('#/views/study-plan/ability-profile/index.vue'),
        meta: {
          title: '能力画像',
          icon: 'mdi:account-school-outline',
        },
      },
      {
        name: 'StudyPlanAbilityCatalog',
        path: 'ability-catalog',
        component: () => import('#/views/study-plan/ability-catalog/index.vue'),
        meta: {
          title: '能力运营',
          icon: 'mdi:vector-link',
        },
      },
    ],
  },
];

export default routes;
