<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { SysCategoryTreeResult } from '#/api/category';
import type {
  CreateStudyPlanItemParams,
  GetMentorStudyAbilityProfileParams,
  MentorStudentOption,
  StudyAbilityProfileSourceType,
  StudyPlanDetail,
  StudyPlanItemRecommendation,
  StudyPlanRecommendationModuleType,
  StudyUserCategoryProfileDetail,
} from '#/api/study-plan';

import { computed, nextTick, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { message } from 'ant-design-vue';

import { getSysCategoryTreeApi } from '#/api/category';
import {
  createStudyPlanItemApi,
  getMentorStudyAbilityProfileApi,
  getMentorStudyPlanItemRecommendationsApi,
  getMentorStudyPlansApi,
  getMentorStudyStudentsApi,
} from '#/api/study-plan';

import { findOption, formatModuleTarget, moduleOptions } from '../common';

type ProfileSourceFilter = 'combined' | StudyAbilityProfileSourceType;
type RecommendationModuleFilter = 'all' | StudyPlanRecommendationModuleType;

interface CategoryTreeOption {
  children?: CategoryTreeOption[];
  key: number;
  label: string;
  title: string;
  value: number;
}

interface ProfileView {
  accuracy_rate: number;
  algorithm_version: string;
  attempt_count: number;
  avg_seconds?: null | number;
  category_code?: null | string;
  category_id: number;
  category_name?: null | string;
  category_type?: null | string;
  confidence_score: number;
  correct_count: number;
  duration_seconds: number;
  key: string;
  last_attempt_at?: null | string;
  mastery_score: number;
  raw_profiles: StudyUserCategoryProfileDetail[];
  source_type: string;
  source_types: string[];
  speed_score: number;
  total_count: number;
  trend_score: number;
  updated_time?: null | string;
  user_id: number;
  weakness_score: number;
}

interface RecommendationForm {
  order_index: number;
  plan_date: string;
  plan_id: null | number;
}

const SOURCE_LABEL_MAP: Record<string, string> = {
  ability: '能力练习',
  combined: '综合',
  question_bank: '题库刷题',
};

const CATEGORY_TYPE_LABEL_MAP: Record<string, string> = {
  ability: '能力节点',
  knowledge_point: '知识点',
  solution_method: '解题思路',
};

const sourceOptions: Array<{ label: string; value: ProfileSourceFilter }> = [
  { label: '综合', value: 'combined' },
  { label: '能力练习', value: 'ability' },
  { label: '题库刷题', value: 'question_bank' },
];

const recommendationModuleOptions: Array<{
  label: string;
  value: RecommendationModuleFilter;
}> = [
  { label: '全部推荐', value: 'all' },
  { label: '能力练习', value: 'ability' },
  { label: '刷题任务', value: 'practice' },
];

const columns: any[] = [
  { dataIndex: 'category_name', title: '分类节点', minWidth: 240 },
  { dataIndex: 'category_type', title: '类型', width: 120 },
  { dataIndex: 'source_type', title: '来源', width: 150 },
  { dataIndex: 'mastery_score', title: '掌握度', width: 180 },
  { dataIndex: 'weakness_score', title: '薄弱度', width: 180 },
  { dataIndex: 'accuracy_rate', title: '正确率', width: 120 },
  { dataIndex: 'speed_score', title: '速度分', width: 120 },
  { dataIndex: 'confidence_score', title: '可信度', width: 120 },
  { dataIndex: 'sample', title: '样本量', width: 150 },
  { dataIndex: 'avg_seconds', title: '平均用时', width: 120 },
  { dataIndex: 'last_attempt_at', title: '最近练习', width: 180 },
  { dataIndex: 'operation', fixed: 'right' as const, title: '操作', width: 90 },
];

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

const selectedStudentId = ref<null | number>(null);
const sourceType = ref<ProfileSourceFilter>('combined');
const selectedCategoryId = ref<null | number>(null);
const includeChildren = ref(true);

const mentorStudents = ref<MentorStudentOption[]>([]);
const categoryTree = ref<CategoryTreeOption[]>([]);
const rawProfiles = ref<StudyUserCategoryProfileDetail[]>([]);
const plans = ref<StudyPlanDetail[]>([]);
const recommendations = ref<StudyPlanItemRecommendation[]>([]);
const selectedProfileKey = ref('');
const selectedRecommendation = ref<null | StudyPlanItemRecommendation>(null);
const recommendationModuleType = ref<RecommendationModuleFilter>('all');

const loading = ref(false);
const studentsLoading = ref(false);
const categoryLoading = ref(false);
const plansLoading = ref(false);
const recommendationLoading = ref(false);
const recommendationModalOpen = ref(false);
const recommendationSubmitting = ref(false);

const today = new Date().toISOString().slice(0, 10);

const recommendationForm = reactive<RecommendationForm>({
  order_index: 0,
  plan_date: today,
  plan_id: null,
});

const studentOptions = computed(() =>
  mentorStudents.value.map((item) => ({
    label: getStudentLabel(item),
    value: item.student_id,
  })),
);

const selectedStudent = computed(() =>
  mentorStudents.value.find(
    (item) => item.student_id === selectedStudentId.value,
  ),
);

const availablePlans = computed(() => {
  const activePlans = plans.value.filter((item) => item.status === 'active');
  if (activePlans.length > 0) {
    return activePlans;
  }
  return plans.value;
});

const planOptions = computed(() =>
  availablePlans.value.map((item) => ({
    label: `${item.title} · ${item.start_date} ~ ${item.end_date}`,
    value: item.id,
  })),
);

const selectedRecommendationPlan = computed(
  () =>
    plans.value.find((item) => item.id === recommendationForm.plan_id) ?? null,
);

const displayProfiles = computed(() => {
  if (sourceType.value === 'combined') {
    return mergeProfiles(rawProfiles.value);
  }
  return rawProfiles.value.map((p) => toProfileView(p));
});

const selectedProfile = computed(() => {
  if (displayProfiles.value.length === 0) {
    return null;
  }
  return (
    displayProfiles.value.find(
      (item) => item.key === selectedProfileKey.value,
    ) ?? displayProfiles.value[0]
  );
});

const summary = computed(() => {
  const totalNodes = displayProfiles.value.length;
  const totalQuestions = displayProfiles.value.reduce(
    (sum, item) => sum + item.total_count,
    0,
  );
  const totalCorrect = displayProfiles.value.reduce(
    (sum, item) => sum + item.correct_count,
    0,
  );
  const avgMastery = weightedAverage(displayProfiles.value, 'mastery_score');
  const avgAccuracy = totalQuestions
    ? (totalCorrect * 100) / totalQuestions
    : 0;
  const weakNodes = displayProfiles.value.filter(
    (item) => item.mastery_score < 60,
  ).length;

  return {
    avgAccuracy,
    avgMastery,
    totalNodes,
    totalQuestions,
    weakNodes,
  };
});

const radarNodes = computed(() =>
  [...displayProfiles.value]
    .toSorted((left, right) => right.weakness_score - left.weakness_score)
    .slice(0, 8),
);

const topWeakProfiles = computed(() =>
  [...displayProfiles.value]
    .toSorted((left, right) => right.weakness_score - left.weakness_score)
    .slice(0, 6),
);

const selectedRawProfiles = computed(
  () =>
    selectedProfile.value?.raw_profiles
      .slice()
      .toSorted((left, right) =>
        left.source_type.localeCompare(right.source_type),
      ) ?? [],
);

function getStudentLabel(student: MentorStudentOption) {
  const name =
    student.student_nickname ||
    student.student_username ||
    `学员 ${student.student_id}`;
  const username =
    student.student_username && student.student_username !== name
      ? ` / ${student.student_username}`
      : '';
  return `${name}${username}（${student.student_id}）`;
}

function getCategoryTypeLabel(value?: null | string) {
  if (!value) {
    return '-';
  }
  return CATEGORY_TYPE_LABEL_MAP[value] ?? value;
}

function getSourceLabel(value?: null | string) {
  if (!value) {
    return '-';
  }
  return SOURCE_LABEL_MAP[value] ?? value;
}

function getNodeLabel(
  record: Partial<ProfileView | StudyUserCategoryProfileDetail>,
) {
  return (
    record.category_name ||
    record.category_code ||
    `分类 #${record.category_id}`
  );
}

function getShortNodeLabel(
  record: Partial<ProfileView | StudyUserCategoryProfileDetail>,
) {
  const label = getNodeLabel(record);
  if (label.length <= 8) {
    return label;
  }
  return `${label.slice(0, 8)}...`;
}

function formatPercent(value?: null | number) {
  if (value === null || value === undefined) {
    return '-';
  }
  return `${Math.round(value * 10) / 10}%`;
}

function formatScore(value?: null | number) {
  if (value === null || value === undefined) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatSeconds(value?: null | number) {
  if (value === null || value === undefined) {
    return '-';
  }
  return `${Math.round(value * 10) / 10}s`;
}

function formatDateTime(value?: null | string) {
  return value ? value.replace('T', ' ').slice(0, 19) : '-';
}

function getMasteryColor(value: number) {
  if (value >= 80) {
    return '#52c41a';
  }
  if (value >= 60) {
    return '#1677ff';
  }
  if (value >= 40) {
    return '#faad14';
  }
  return '#ff4d4f';
}

function getWeaknessColor(value: number) {
  if (value >= 60) {
    return '#ff4d4f';
  }
  if (value >= 35) {
    return '#faad14';
  }
  return '#52c41a';
}

function getSourceTagColor(value: string) {
  if (value === 'ability') {
    return 'blue';
  }
  if (value === 'question_bank') {
    return 'green';
  }
  return 'purple';
}

function toNumber(value?: null | number) {
  return value ?? 0;
}

function getLatestTime(values: Array<null | string | undefined>) {
  const sorted = values
    .filter(Boolean)
    .toSorted((left, right) => right.localeCompare(left));
  return sorted[0] ?? null;
}

function weightedAverage(items: ProfileView[], field: keyof ProfileView) {
  if (items.length === 0) {
    return 0;
  }

  let totalWeight = 0;
  for (const item of items) {
    totalWeight += Math.max(1, item.total_count);
  }
  if (!totalWeight) {
    return 0;
  }

  let weightedSum = 0;
  for (const item of items) {
    const value = Number(item[field] ?? 0);
    weightedSum += value * Math.max(1, item.total_count);
  }
  return weightedSum / totalWeight;
}

function weightedRawAverage(
  items: StudyUserCategoryProfileDetail[],
  field: keyof StudyUserCategoryProfileDetail,
) {
  if (items.length === 0) {
    return 0;
  }

  let totalWeight = 0;
  for (const item of items) {
    totalWeight += Math.max(1, item.total_count);
  }
  let weightedSum = 0;
  for (const item of items) {
    const value = Number(item[field] ?? 0);
    weightedSum += value * Math.max(1, item.total_count);
  }
  return weightedSum / totalWeight;
}

function toProfileView(item: StudyUserCategoryProfileDetail): ProfileView {
  return {
    ...item,
    key: `${item.source_type}-${item.id}`,
    raw_profiles: [item],
    source_types: [item.source_type],
  };
}

function mergeProfiles(items: StudyUserCategoryProfileDetail[]) {
  const groupMap = new Map<number, StudyUserCategoryProfileDetail[]>();
  for (const item of items) {
    const group = groupMap.get(item.category_id) ?? [];
    group.push(item);
    groupMap.set(item.category_id, group);
  }

  return [...groupMap.entries()]
    .map(([categoryId, group]) => {
      const base = group[0];
      const totalCount = group.reduce((sum, item) => sum + item.total_count, 0);
      const correctCount = group.reduce(
        (sum, item) => sum + item.correct_count,
        0,
      );
      const durationSeconds = group.reduce(
        (sum, item) => sum + item.duration_seconds,
        0,
      );
      const attemptCount = group.reduce(
        (sum, item) => sum + item.attempt_count,
        0,
      );
      const masteryScore = weightedRawAverage(group, 'mastery_score');

      return {
        accuracy_rate: totalCount ? (correctCount * 100) / totalCount : 0,
        algorithm_version: 'combined',
        attempt_count: attemptCount,
        avg_seconds: totalCount ? durationSeconds / totalCount : null,
        category_code: base.category_code,
        category_id: categoryId,
        category_name: base.category_name,
        category_type: base.category_type,
        confidence_score: weightedRawAverage(group, 'confidence_score'),
        correct_count: correctCount,
        duration_seconds: durationSeconds,
        key: `combined-${categoryId}`,
        last_attempt_at: getLatestTime(
          group.map((item) => item.last_attempt_at),
        ),
        mastery_score: masteryScore,
        raw_profiles: group,
        source_type: 'combined',
        source_types: [...new Set(group.map((item) => item.source_type))],
        speed_score: weightedRawAverage(group, 'speed_score'),
        total_count: totalCount,
        trend_score: weightedRawAverage(group, 'trend_score'),
        updated_time: getLatestTime(group.map((item) => item.updated_time)),
        user_id: base.user_id,
        weakness_score: Math.max(0, 100 - masteryScore),
      } satisfies ProfileView;
    })
    .toSorted((left, right) => right.weakness_score - left.weakness_score);
}

function convertCategoryTree(
  items: SysCategoryTreeResult[],
): CategoryTreeOption[] {
  return items.map((item) => {
    const typeLabel = getCategoryTypeLabel(item.type);
    const title = `${item.name}${typeLabel === '-' ? '' : ` · ${typeLabel}`}`;
    return {
      children: item.children ? convertCategoryTree(item.children) : undefined,
      key: item.id,
      label: title,
      title,
      value: item.id,
    };
  });
}

function buildQueryParams(): GetMentorStudyAbilityProfileParams {
  const params: GetMentorStudyAbilityProfileParams = {
    include_children: includeChildren.value,
  };
  if (sourceType.value !== 'combined') {
    params.source_type = sourceType.value;
  }
  if (selectedCategoryId.value) {
    params.category_id = selectedCategoryId.value;
  }
  return params;
}

function buildRecommendationQueryParams() {
  const params = {
    ...buildQueryParams(),
    limit: 10,
    module_type:
      recommendationModuleType.value === 'all'
        ? null
        : recommendationModuleType.value,
  };
  return params;
}

function getModuleTagColor(value: CreateStudyPlanItemParams['module_type']) {
  return findOption(moduleOptions, value)?.color ?? 'default';
}

function getModuleLabel(value: CreateStudyPlanItemParams['module_type']) {
  return findOption(moduleOptions, value)?.label ?? value;
}

function formatPriority(value: number) {
  return Math.round(value * 10) / 10;
}

function formatTargetAccuracy(value?: null | number) {
  if (value === null || value === undefined) {
    return '-';
  }
  return `${Math.round(value * 1000) / 10}%`;
}

function clampDateToPlan(plan: StudyPlanDetail) {
  if (today >= plan.start_date && today <= plan.end_date) {
    return today;
  }
  return plan.start_date;
}

function applyDefaultRecommendationPlan() {
  const plan = availablePlans.value[0];
  recommendationForm.plan_id = plan?.id ?? null;
  recommendationForm.plan_date = plan ? clampDateToPlan(plan) : today;
  recommendationForm.order_index = 0;
}

function handleRecommendationPlanChange() {
  const plan = selectedRecommendationPlan.value;
  if (!plan) {
    return;
  }
  recommendationForm.plan_date = clampDateToPlan(plan);
}

function selectProfile(profile: ProfileView | Record<string, unknown>) {
  selectedProfileKey.value = String((profile as ProfileView).key || '');
}

function resetSelectedProfile() {
  selectedProfileKey.value = displayProfiles.value[0]?.key ?? '';
}

async function loadStudents() {
  studentsLoading.value = true;
  try {
    mentorStudents.value = await getMentorStudyStudentsApi();
    if (!selectedStudentId.value) {
      selectedStudentId.value = mentorStudents.value[0]?.student_id ?? null;
    }
  } catch {
    mentorStudents.value = [];
    message.warning('学员列表加载失败');
  } finally {
    studentsLoading.value = false;
  }
}

async function loadCategoryTree() {
  categoryLoading.value = true;
  try {
    const tree = await getSysCategoryTreeApi({
      app_code: 'youanshang',
      status: true,
    });
    categoryTree.value = convertCategoryTree(tree);
  } catch {
    categoryTree.value = [];
    message.warning('分类树加载失败');
  } finally {
    categoryLoading.value = false;
  }
}

async function loadPlans() {
  if (!selectedStudentId.value) {
    plans.value = [];
    applyDefaultRecommendationPlan();
    return;
  }

  plansLoading.value = true;
  try {
    plans.value = await getMentorStudyPlansApi(selectedStudentId.value);
    applyDefaultRecommendationPlan();
  } catch {
    plans.value = [];
    applyDefaultRecommendationPlan();
    message.warning('学员计划加载失败');
  } finally {
    plansLoading.value = false;
  }
}

async function updateRadarChart() {
  const nodes = radarNodes.value;
  if (nodes.length === 0) {
    await renderEcharts({
      title: {
        left: 'center',
        text: '暂无画像数据',
        textStyle: {
          color: '#8c8c8c',
          fontSize: 14,
          fontWeight: 400,
        },
        top: 'middle',
      },
    });
    return;
  }

  const chartOption: Parameters<typeof renderEcharts>[0] = {
    legend: {
      bottom: 0,
      data: ['掌握度', '正确率'],
    },
    radar: {
      axisName: {
        color: '#595959',
        fontSize: 12,
      },
      center: ['50%', '48%'],
      indicator: nodes.map((item) => ({
        max: 100,
        name: getShortNodeLabel(item),
      })),
      radius: '62%',
      splitNumber: 5,
      triggerEvent: true,
    },
    series: [
      {
        areaStyle: {
          color: 'rgba(22, 119, 255, 0.14)',
        },
        data: [
          {
            name: '掌握度',
            value: nodes.map((item) => formatScore(item.mastery_score)),
          },
          {
            name: '正确率',
            value: nodes.map((item) => formatScore(item.accuracy_rate)),
          },
        ],
        emphasis: {
          lineStyle: {
            width: 3,
          },
        },
        type: 'radar',
      },
    ],
    tooltip: {
      trigger: 'item',
    },
  };

  const instance = await renderEcharts(chartOption);
  instance?.off('click');
  instance?.on('click', (params: any) => {
    if (!params?.name) {
      return;
    }
    const target = nodes.find(
      (item) => getShortNodeLabel(item) === params.name,
    );
    if (target) {
      selectProfile(target);
    }
  });
}

async function queryProfile(showWarning = true) {
  if (!selectedStudentId.value) {
    if (showWarning) {
      message.warning('请选择学员');
    }
    return;
  }

  loading.value = true;
  try {
    rawProfiles.value = await getMentorStudyAbilityProfileApi(
      selectedStudentId.value,
      buildQueryParams(),
    );
    resetSelectedProfile();
    await nextTick();
    await updateRadarChart();
  } finally {
    loading.value = false;
  }
}

async function queryRecommendations(showWarning = true) {
  if (!selectedStudentId.value) {
    recommendations.value = [];
    if (showWarning) {
      message.warning('请选择学员');
    }
    return;
  }

  recommendationLoading.value = true;
  try {
    recommendations.value = await getMentorStudyPlanItemRecommendationsApi(
      selectedStudentId.value,
      buildRecommendationQueryParams(),
    );
  } catch {
    recommendations.value = [];
    if (showWarning) {
      message.warning('推荐计划项加载失败');
    }
  } finally {
    recommendationLoading.value = false;
  }
}

async function refreshProfileAndRecommendations(showWarning = true) {
  await Promise.all([
    queryProfile(showWarning),
    queryRecommendations(showWarning),
  ]);
}

async function handleFilterChange() {
  await refreshProfileAndRecommendations(false);
}

async function handleStudentChange() {
  await loadPlans();
  await refreshProfileAndRecommendations(false);
}

async function openRecommendationModal(record: StudyPlanItemRecommendation) {
  selectedRecommendation.value = record;
  if (plans.value.length === 0 && selectedStudentId.value) {
    await loadPlans();
  }
  applyDefaultRecommendationPlan();
  recommendationModalOpen.value = true;
}

async function submitRecommendationItem() {
  if (!selectedRecommendation.value) {
    message.warning('请选择推荐项');
    return;
  }
  if (!recommendationForm.plan_id) {
    message.warning('请选择计划');
    return;
  }
  if (!recommendationForm.plan_date) {
    message.warning('请选择计划日期');
    return;
  }

  const plan = selectedRecommendationPlan.value;
  if (!plan) {
    message.warning('计划不存在或已不可用');
    return;
  }
  if (
    recommendationForm.plan_date < plan.start_date ||
    recommendationForm.plan_date > plan.end_date
  ) {
    message.warning('计划日期必须在计划周期内');
    return;
  }

  const item = selectedRecommendation.value.item;
  const payload: CreateStudyPlanItemParams = {
    expected_minutes: item.expected_minutes,
    extra: item.extra ?? null,
    module_type: item.module_type,
    order_index: recommendationForm.order_index,
    plan_date: recommendationForm.plan_date,
    plan_id: recommendationForm.plan_id,
    ref_id: item.ref_id ?? null,
    ref_type: item.ref_type,
    title: item.title,
  };

  recommendationSubmitting.value = true;
  try {
    await createStudyPlanItemApi(payload);
    message.success('推荐计划项已加入');
    recommendationModalOpen.value = false;
  } catch (error: any) {
    message.warning(error?.message || '加入计划失败');
  } finally {
    recommendationSubmitting.value = false;
  }
}

onMounted(async () => {
  await Promise.all([loadStudents(), loadCategoryTree()]);
  if (selectedStudentId.value) {
    await loadPlans();
    await refreshProfileAndRecommendations(false);
  } else {
    await nextTick();
    await updateRadarChart();
  }
});
</script>

<template>
  <Page>
    <div class="ability-profile-page">
      <a-card size="small">
        <div class="toolbar">
          <a-select
            v-model:value="selectedStudentId"
            :loading="studentsLoading"
            :options="studentOptions"
            option-filter-prop="label"
            placeholder="选择学员"
            show-search
            style="min-width: 280px"
            @change="handleStudentChange"
          />
          <a-segmented
            v-model:value="sourceType"
            :options="sourceOptions"
            @change="handleFilterChange"
          />
          <a-tree-select
            v-model:value="selectedCategoryId"
            :allow-clear="true"
            :loading="categoryLoading"
            :tree-data="categoryTree"
            placeholder="按分类节点筛选"
            show-search
            style="min-width: 280px"
            tree-default-expand-all
            tree-node-filter-prop="title"
            @change="handleFilterChange"
          />
          <a-checkbox
            v-model:checked="includeChildren"
            @change="handleFilterChange"
          >
            包含子节点
          </a-checkbox>
          <a-button
            :loading="loading || recommendationLoading"
            type="primary"
            @click="refreshProfileAndRecommendations(true)"
          >
            刷新画像
          </a-button>
        </div>
      </a-card>

      <div class="student-strip" v-if="selectedStudent">
        <div>
          <span class="student-name">
            {{
              selectedStudent.student_nickname ||
              selectedStudent.student_username ||
              `学员 ${selectedStudent.student_id}`
            }}
          </span>
          <span class="student-meta">
            ID {{ selectedStudent.student_id }}
            <template v-if="selectedStudent.student_username">
              · {{ selectedStudent.student_username }}
            </template>
          </span>
        </div>
        <a-tag color="green">active</a-tag>
      </div>

      <div class="summary-grid">
        <a-card size="small" title="画像节点">
          <a-statistic :value="summary.totalNodes" suffix="个" />
        </a-card>
        <a-card size="small" title="平均掌握度">
          <a-statistic :precision="1" :value="summary.avgMastery" suffix="%" />
        </a-card>
        <a-card size="small" title="整体正确率">
          <a-statistic :precision="1" :value="summary.avgAccuracy" suffix="%" />
        </a-card>
        <a-card size="small" title="薄弱节点">
          <a-statistic :value="summary.weakNodes" suffix="个" />
        </a-card>
      </div>

      <div class="dashboard-grid">
        <a-card size="small" title="能力雷达">
          <EchartsUI ref="chartRef" class="radar-chart" />
        </a-card>

        <a-card size="small" title="节点详情">
          <template v-if="selectedProfile">
            <div class="detail-head">
              <div>
                <div class="detail-title">
                  {{ getNodeLabel(selectedProfile) }}
                </div>
                <div class="detail-meta">
                  {{ getCategoryTypeLabel(selectedProfile.category_type) }}
                  <template v-if="selectedProfile.category_code">
                    · {{ selectedProfile.category_code }}
                  </template>
                </div>
              </div>
              <div class="source-tags">
                <a-tag
                  v-for="source in selectedProfile.source_types"
                  :key="source"
                  :color="getSourceTagColor(source)"
                >
                  {{ getSourceLabel(source) }}
                </a-tag>
              </div>
            </div>

            <div class="detail-metrics">
              <div class="metric-box">
                <span>掌握度</span>
                <strong>{{
                  formatPercent(selectedProfile.mastery_score)
                }}</strong>
              </div>
              <div class="metric-box">
                <span>正确率</span>
                <strong>{{
                  formatPercent(selectedProfile.accuracy_rate)
                }}</strong>
              </div>
              <div class="metric-box">
                <span>速度分</span>
                <strong>{{
                  formatPercent(selectedProfile.speed_score)
                }}</strong>
              </div>
              <div class="metric-box">
                <span>样本量</span>
                <strong>{{ selectedProfile.total_count }} 题</strong>
              </div>
            </div>

            <a-progress
              :percent="formatScore(selectedProfile.weakness_score)"
              :stroke-color="getWeaknessColor(selectedProfile.weakness_score)"
              size="small"
            />
            <div class="detail-foot">
              最近练习 {{ formatDateTime(selectedProfile.last_attempt_at) }} ·
              平均用时 {{ formatSeconds(selectedProfile.avg_seconds) }}
            </div>

            <div class="source-breakdown">
              <div
                v-for="item in selectedRawProfiles"
                :key="`${item.source_type}-${item.id}`"
                class="source-row"
              >
                <a-tag :color="getSourceTagColor(item.source_type)">
                  {{ getSourceLabel(item.source_type) }}
                </a-tag>
                <span>掌握 {{ formatPercent(item.mastery_score) }}</span>
                <span
                  >正确 {{ item.correct_count }}/{{ item.total_count }}</span
                >
                <span>{{ item.attempt_count }} 次</span>
              </div>
            </div>
          </template>
          <a-empty v-else description="暂无节点详情" />
        </a-card>
      </div>

      <a-card size="small" title="推荐计划项">
        <template #extra>
          <div class="recommendation-toolbar">
            <a-segmented
              v-model:value="recommendationModuleType"
              :options="recommendationModuleOptions"
              @change="queryRecommendations(false)"
            />
            <a-button
              :loading="recommendationLoading"
              size="small"
              @click="queryRecommendations(true)"
            >
              刷新推荐
            </a-button>
          </div>
        </template>

        <a-spin :spinning="recommendationLoading">
          <div v-if="recommendations.length > 0" class="recommendation-list">
            <div
              v-for="item in recommendations"
              :key="item.recommendation_key"
              class="recommendation-item"
            >
              <div class="recommendation-main">
                <div class="recommendation-head">
                  <a-tag :color="getModuleTagColor(item.item.module_type)">
                    {{ getModuleLabel(item.item.module_type) }}
                  </a-tag>
                  <span class="recommendation-title">
                    {{ item.item.title }}
                  </span>
                  <a-tag color="orange">
                    优先级 {{ formatPriority(item.priority_score) }}
                  </a-tag>
                </div>
                <div class="recommendation-meta">
                  {{ item.category_name || `分类 #${item.category_id}` }}
                  <template v-if="item.category_type">
                    · {{ getCategoryTypeLabel(item.category_type) }}
                  </template>
                  · {{ item.reason }}
                </div>
                <div class="recommendation-tags">
                  <a-tag
                    v-for="source in item.source_types"
                    :key="source"
                    :color="getSourceTagColor(source)"
                  >
                    {{ getSourceLabel(source) }}
                  </a-tag>
                  <a-tag v-for="code in item.reason_codes" :key="code">
                    {{ code }}
                  </a-tag>
                  <a-tag color="blue">
                    {{ item.strategy_version }}
                  </a-tag>
                </div>
                <div class="recommendation-target">
                  目标
                  {{
                    formatModuleTarget(item.item.module_type, item.item.extra)
                  }}
                  · {{ item.item.expected_minutes }} 分钟
                  <template v-if="item.target_question_count">
                    · {{ item.target_question_count }} 题
                  </template>
                  <template v-if="item.target_accuracy">
                    · {{ formatTargetAccuracy(item.target_accuracy) }}
                  </template>
                </div>
              </div>
              <a-button
                :disabled="plansLoading"
                type="primary"
                @click="openRecommendationModal(item)"
              >
                加入计划
              </a-button>
            </div>
          </div>
          <a-empty v-else description="暂无推荐计划项" />
        </a-spin>
      </a-card>

      <a-card size="small" title="优先关注">
        <div v-if="topWeakProfiles.length > 0" class="weak-list">
          <button
            v-for="item in topWeakProfiles"
            :key="item.key"
            class="weak-item"
            :class="[{ active: selectedProfile?.key === item.key }]"
            type="button"
            @click="selectProfile(item)"
          >
            <div class="weak-title">{{ getNodeLabel(item) }}</div>
            <a-progress
              :percent="formatScore(item.weakness_score)"
              :stroke-color="getWeaknessColor(item.weakness_score)"
              size="small"
            />
            <div class="weak-meta">
              掌握度 {{ formatPercent(item.mastery_score) }} · 正确率
              {{ formatPercent(item.accuracy_rate) }}
            </div>
          </button>
        </div>
        <a-empty v-else description="暂无薄弱点数据" />
      </a-card>

      <a-card size="small" title="画像明细">
        <a-table
          :columns="columns"
          :data-source="displayProfiles"
          :loading="loading"
          :pagination="{ pageSize: 20, showSizeChanger: true }"
          row-key="key"
          size="small"
          :scroll="{ x: 1520 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'category_name'">
              <div class="node-cell">
                <span>{{ getNodeLabel(record) }}</span>
                <a-tag v-if="record.category_code" color="blue">
                  {{ record.category_code }}
                </a-tag>
              </div>
            </template>
            <template v-else-if="column.dataIndex === 'category_type'">
              <a-tag>{{ getCategoryTypeLabel(record.category_type) }}</a-tag>
            </template>
            <template v-else-if="column.dataIndex === 'source_type'">
              <a-tag
                v-for="source in record.source_types"
                :key="source"
                :color="getSourceTagColor(source)"
              >
                {{ getSourceLabel(source) }}
              </a-tag>
            </template>
            <template v-else-if="column.dataIndex === 'mastery_score'">
              <a-progress
                :percent="formatScore(record.mastery_score)"
                :stroke-color="getMasteryColor(record.mastery_score)"
                size="small"
              />
            </template>
            <template v-else-if="column.dataIndex === 'weakness_score'">
              <a-progress
                :percent="formatScore(record.weakness_score)"
                :stroke-color="getWeaknessColor(record.weakness_score)"
                size="small"
              />
            </template>
            <template v-else-if="column.dataIndex === 'accuracy_rate'">
              {{ formatPercent(record.accuracy_rate) }}
            </template>
            <template v-else-if="column.dataIndex === 'speed_score'">
              {{ formatPercent(record.speed_score) }}
            </template>
            <template v-else-if="column.dataIndex === 'confidence_score'">
              {{ formatPercent(record.confidence_score) }}
            </template>
            <template v-else-if="column.dataIndex === 'sample'">
              {{ record.correct_count }}/{{ record.total_count }} ·
              {{ record.attempt_count }} 次
            </template>
            <template v-else-if="column.dataIndex === 'avg_seconds'">
              {{ formatSeconds(record.avg_seconds) }}
            </template>
            <template v-else-if="column.dataIndex === 'last_attempt_at'">
              {{ formatDateTime(record.last_attempt_at) }}
            </template>
            <template v-else-if="column.dataIndex === 'operation'">
              <a-button type="link" @click="selectProfile(record)">
                详情
              </a-button>
            </template>
          </template>
        </a-table>
      </a-card>

      <a-modal
        v-model:open="recommendationModalOpen"
        :confirm-loading="recommendationSubmitting"
        title="加入推荐计划项"
        width="640px"
        @ok="submitRecommendationItem"
      >
        <template v-if="selectedRecommendation">
          <a-form layout="vertical">
            <a-form-item label="计划" required>
              <a-select
                v-model:value="recommendationForm.plan_id"
                :loading="plansLoading"
                :options="planOptions"
                option-filter-prop="label"
                placeholder="选择要加入的计划"
                show-search
                @change="handleRecommendationPlanChange"
              />
            </a-form-item>
            <div class="form-grid">
              <a-form-item label="计划日期" required>
                <a-date-picker
                  v-model:value="recommendationForm.plan_date"
                  style="width: 100%"
                  value-format="YYYY-MM-DD"
                />
              </a-form-item>
              <a-form-item label="当日顺序" required>
                <a-input-number
                  v-model:value="recommendationForm.order_index"
                  :min="0"
                  style="width: 100%"
                />
              </a-form-item>
            </div>
            <div class="recommendation-preview">
              <div class="preview-title">
                {{ selectedRecommendation.item.title }}
              </div>
              <div class="preview-meta">
                {{ getModuleLabel(selectedRecommendation.item.module_type) }}
                · {{ selectedRecommendation.item.expected_minutes }} 分钟 ·
                {{
                  formatModuleTarget(
                    selectedRecommendation.item.module_type,
                    selectedRecommendation.item.extra,
                  )
                }}
              </div>
              <div class="preview-reason">
                {{ selectedRecommendation.reason }}
              </div>
            </div>
          </a-form>
        </template>
      </a-modal>
    </div>
  </Page>
</template>

<style scoped>
.ability-profile-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  padding-bottom: 16px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.student-strip {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #edf0f5;
  border-radius: 6px;
}

.student-name {
  font-weight: 600;
}

.student-meta,
.detail-meta,
.detail-foot,
.weak-meta {
  font-size: 12px;
  color: #8c8c8c;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(360px, 1.25fr) minmax(320px, 0.75fr);
  gap: 12px;
}

.radar-chart {
  width: 100%;
  min-height: 360px;
}

.detail-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
}

.detail-title {
  font-size: 16px;
  font-weight: 600;
}

.source-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: flex-end;
}

.detail-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.metric-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
}

.metric-box span {
  font-size: 12px;
  color: #8c8c8c;
}

.metric-box strong {
  font-size: 18px;
}

.detail-foot {
  margin-top: 8px;
}

.source-breakdown {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
}

.source-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  color: #595959;
}

.weak-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.recommendation-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.recommendation-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.recommendation-item {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
}

.recommendation-main {
  min-width: 0;
}

.recommendation-head,
.recommendation-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.recommendation-title {
  font-weight: 600;
}

.recommendation-meta,
.recommendation-target,
.preview-meta,
.preview-reason {
  margin-top: 6px;
  font-size: 12px;
  color: #8c8c8c;
}

.recommendation-target {
  color: #595959;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.recommendation-preview {
  padding: 12px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
}

.preview-title {
  font-weight: 600;
}

.weak-item {
  padding: 12px;
  text-align: left;
  cursor: pointer;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.weak-item.active,
.weak-item:hover {
  border-color: #1677ff;
  box-shadow: 0 4px 14px rgb(22 119 255 / 10%);
}

.weak-title {
  margin-bottom: 8px;
  font-weight: 600;
}

.node-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

@media (max-width: 1100px) {
  .form-grid,
  .summary-grid,
  .dashboard-grid,
  .weak-list {
    grid-template-columns: 1fr;
  }

  .recommendation-item {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
