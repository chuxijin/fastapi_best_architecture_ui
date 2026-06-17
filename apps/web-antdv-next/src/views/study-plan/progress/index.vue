<script lang="ts" setup>
import type {
  StudyPlanDetail,
  StudyPlanItemDetail,
  StudyPlanProgress,
} from '#/api/study-plan';

import { computed, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import {
  getMentorStudyPlanItemsApi,
  getMentorStudyPlanProgressApi,
  getMentorStudyPlansApi,
} from '#/api/study-plan';

import {
  findOption,
  formatAccuracy,
  formatDurationSeconds,
  formatModuleTarget,
  itemStatusOptions,
  moduleOptions,
  planStatusOptions,
} from '../common';

const studentId = ref<null | number>(null);
const selectedPlanId = ref<null | number>(null);
const plans = ref<StudyPlanDetail[]>([]);
const items = ref<StudyPlanItemDetail[]>([]);
const progress = ref<null | StudyPlanProgress>(null);
const loadingPlans = ref(false);
const loadingDetail = ref(false);

const selectedPlan = computed(() =>
  plans.value.find((item) => item.id === selectedPlanId.value),
);

const planOptions = computed(() =>
  plans.value.map((item) => ({
    label: `${item.id} · ${item.title}（${item.start_date} ~ ${item.end_date}）`,
    value: item.id,
  })),
);

const totalMinutes = computed(() =>
  items.value.reduce((sum, item) => sum + item.expected_minutes, 0),
);

const completedMinutes = computed(() =>
  items.value
    .filter((item) => item.status === 'completed')
    .reduce((sum, item) => sum + item.expected_minutes, 0),
);

const groupedItems = computed(() => {
  const groups = new Map<string, StudyPlanItemDetail[]>();
  for (const item of items.value) {
    const list = groups.get(item.plan_date) ?? [];
    list.push(item);
    groups.set(item.plan_date, list);
  }

  return [...groups.entries()]
    .toSorted(([left], [right]) => left.localeCompare(right))
    .map(([date, list]) => ({
      completed: list.filter((item) => item.status === 'completed').length,
      date,
      items: list.toSorted(
        (left, right) => left.order_index - right.order_index,
      ),
      total: list.length,
    }));
});

const itemColumns = [
  { dataIndex: 'order_index', title: '顺序', width: 70 },
  { dataIndex: 'module_type', title: '模块', width: 110 },
  { dataIndex: 'title', title: '标题', minWidth: 260 },
  { dataIndex: 'expected_minutes', title: '预计分钟', width: 100 },
  { dataIndex: 'target', title: '目标', width: 150 },
  { dataIndex: 'actual_duration', title: '实际耗时', width: 120 },
  { dataIndex: 'accuracy', title: '正确率', width: 150 },
  { dataIndex: 'status', title: '状态', width: 100 },
  { dataIndex: 'ref', title: '引用', width: 180 },
];

async function queryPlans() {
  if (!studentId.value) {
    message.warning('请填写学员 ID');
    return;
  }

  loadingPlans.value = true;
  try {
    plans.value = await getMentorStudyPlansApi(studentId.value);
    selectedPlanId.value =
      plans.value.find((item) => item.status === 'active')?.id ??
      plans.value[0]?.id ??
      null;
    if (selectedPlanId.value === null) {
      items.value = [];
      progress.value = null;
    } else {
      await loadPlanDetail();
    }
  } finally {
    loadingPlans.value = false;
  }
}

async function loadPlanDetail() {
  if (!selectedPlanId.value) {
    message.warning('请选择计划');
    return;
  }

  loadingDetail.value = true;
  try {
    const [itemList, planProgress] = await Promise.all([
      getMentorStudyPlanItemsApi(selectedPlanId.value),
      getMentorStudyPlanProgressApi(selectedPlanId.value),
    ]);
    items.value = itemList;
    progress.value = planProgress;
  } finally {
    loadingDetail.value = false;
  }
}
</script>

<template>
  <Page>
    <div class="progress-page">
      <a-card size="small">
        <div class="toolbar">
          <a-input-number
            v-model:value="studentId"
            :min="1"
            placeholder="学员用户 ID"
            style="width: 180px"
            @press-enter="queryPlans"
          />
          <a-button :loading="loadingPlans" type="primary" @click="queryPlans">
            查询计划
          </a-button>
          <a-select
            v-model:value="selectedPlanId"
            :disabled="plans.length === 0"
            :options="planOptions"
            option-filter-prop="label"
            placeholder="选择计划"
            show-search
            style="min-width: 360px"
            @change="loadPlanDetail"
          />
        </div>
      </a-card>

      <template v-if="selectedPlan">
        <div class="summary-grid">
          <a-card size="small" title="计划进度">
            <div class="progress-ring">
              <a-progress
                :percent="progress?.percent ?? 0"
                type="circle"
                :width="118"
              />
              <div class="summary-text">
                <div class="summary-title">{{ selectedPlan.title }}</div>
                <div class="summary-meta">
                  {{ selectedPlan.start_date }} ~ {{ selectedPlan.end_date }}
                </div>
                <a-tag
                  :color="
                    findOption(planStatusOptions, selectedPlan.status)?.color
                  "
                >
                  {{
                    findOption(planStatusOptions, selectedPlan.status)?.label ??
                    selectedPlan.status
                  }}
                </a-tag>
              </div>
            </div>
          </a-card>

          <a-card size="small" title="完成概览">
            <a-statistic
              title="完成模块"
              :value="progress?.completed ?? 0"
              :suffix="`/ ${progress?.total ?? 0}`"
            />
          </a-card>

          <a-card size="small" title="学习时长">
            <a-statistic
              title="预计已完成"
              :value="completedMinutes"
              :suffix="`/ ${totalMinutes} 分钟`"
            />
          </a-card>
        </div>

        <a-card class="detail-card" size="small" title="每日明细">
          <template #extra>
            <span v-if="groupedItems.length > 0" class="detail-count">
              共 {{ groupedItems.length }} 天 / {{ items.length }} 项
            </span>
          </template>
          <a-spin :spinning="loadingDetail">
            <div v-if="groupedItems.length > 0" class="day-list">
              <section
                v-for="group in groupedItems"
                :key="group.date"
                class="day-section"
              >
                <div class="day-header">
                  <span class="day-date">{{ group.date }}</span>
                  <a-progress
                    :percent="
                      group.total
                        ? Math.floor((group.completed * 100) / group.total)
                        : 0
                    "
                    size="small"
                    style="width: 180px"
                  />
                  <span class="day-count">
                    {{ group.completed }}/{{ group.total }}
                  </span>
                </div>
                <a-table
                  :columns="itemColumns"
                  :data-source="group.items"
                  :pagination="false"
                  row-key="id"
                  size="small"
                  :scroll="{ x: 1210 }"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.dataIndex === 'module_type'">
                      <a-tag
                        :color="
                          findOption(moduleOptions, record.module_type)?.color
                        "
                      >
                        {{
                          findOption(moduleOptions, record.module_type)
                            ?.label ?? record.module_type
                        }}
                      </a-tag>
                    </template>
                    <template v-else-if="column.dataIndex === 'status'">
                      <a-tag
                        :color="
                          findOption(itemStatusOptions, record.status)?.color
                        "
                      >
                        {{
                          findOption(itemStatusOptions, record.status)?.label ??
                          record.status
                        }}
                      </a-tag>
                    </template>
                    <template
                      v-else-if="column.dataIndex === 'actual_duration'"
                    >
                      {{
                        formatDurationSeconds(
                          record.latest_record?.duration_seconds,
                        )
                      }}
                    </template>
                    <template v-else-if="column.dataIndex === 'target'">
                      {{ formatModuleTarget(record.module_type, record.extra) }}
                    </template>
                    <template v-else-if="column.dataIndex === 'accuracy'">
                      {{
                        formatAccuracy(
                          record.latest_record?.correct_count,
                          record.latest_record?.total_count,
                        )
                      }}
                    </template>
                    <template v-else-if="column.dataIndex === 'ref'">
                      {{ record.ref_type }} #{{ record.ref_id ?? '-' }}
                    </template>
                  </template>
                </a-table>
              </section>
            </div>
            <a-empty v-else description="暂无计划项" />
          </a-spin>
        </a-card>
      </template>

      <a-card v-else size="small">
        <a-empty description="请输入学员 ID 查询学习计划" />
      </a-card>
    </div>
  </Page>
</template>

<style scoped>
.progress-page {
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

.summary-grid {
  display: grid;
  grid-template-columns: minmax(280px, 1.4fr) minmax(200px, 1fr) minmax(
      220px,
      1fr
    );
  gap: 12px;
}

.progress-ring {
  display: flex;
  gap: 18px;
  align-items: center;
}

.summary-text {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-title {
  font-size: 16px;
  font-weight: 600;
}

.summary-meta,
.day-count {
  color: #8c8c8c;
}

.day-header {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.detail-card :deep(.ant-card-body) {
  min-height: 220px;
}

.detail-count {
  color: #8c8c8c;
}

.day-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.day-section {
  padding: 12px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
}

.day-date {
  min-width: 96px;
  font-weight: 600;
}

@media (max-width: 900px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
