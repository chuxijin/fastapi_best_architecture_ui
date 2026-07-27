<script setup lang="ts">
import type {
  ChallengeCompletionMode,
  ChallengeLevel,
  ChallengeLevelPayload,
  ChallengeLevelStatus,
  ChallengeSection,
  ChallengeStage,
} from '#/api';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';

import { message, Modal } from 'ant-design-vue';

import {
  createChallengeLevelApi,
  getChallengeLevelListApi,
  publishChallengeLevelApi,
  updateChallengeLevelApi,
} from '#/api';

interface SectionForm extends ChallengeSection {
  source_config_text: string;
}

interface LevelForm {
  challenge_key: string;
  completion_max_total_time: null | number;
  completion_min_accuracy_rate: null | number;
  completion_mode: ChallengeCompletionMode;
  completion_required_attempts: number;
  description: string;
  display_config_text: string;
  global_no: number;
  level_no: number;
  pass_rate: number;
  previous_level_id: null | number;
  question_count: number;
  sections: SectionForm[];
  sort_order: number;
  stage: ChallengeStage;
  star_three_rate: number;
  star_two_rate: number;
  status: ChallengeLevelStatus;
  time_limit: number;
  title: string;
}

const stageOptions = [
  { label: '初窥门径', value: 'stage_1' },
  { label: '得心应手', value: 'stage_2' },
  { label: '行云流水', value: 'stage_3' },
  { label: '登峰造极', value: 'stage_4' },
];
const sourceTypeOptions = [
  { label: '固定题 fixed', value: 'fixed' },
  { label: '题库池 pool', value: 'pool' },
  { label: '手动题 manual', value: 'manual' },
  { label: '自动生成 generator', value: 'generator' },
];
const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
  { label: '已停用', value: 'disabled' },
];
const completionModeOptions = [
  { label: '单次达标', value: 'single_attempt' },
  { label: '连续达标', value: 'consecutive_attempts' },
];

const levels = ref<ChallengeLevel[]>([]);
const loading = ref(false);
const saving = ref(false);
const drawerOpen = ref(false);
const editingId = ref<null | number>(null);
const filterStatus = ref<ChallengeLevelStatus>();
const form = reactive<LevelForm>(createDefaultForm());

const tableColumns = [
  { dataIndex: 'global_no', key: 'global_no', title: '全局序号', width: 100 },
  { dataIndex: 'stage', key: 'stage', title: '阶段', width: 120 },
  { dataIndex: 'level_no', key: 'level_no', title: '阶段关卡', width: 100 },
  { dataIndex: 'title', key: 'title', title: '关卡名称', width: 220 },
  {
    dataIndex: 'question_count',
    key: 'question_count',
    title: '题量',
    width: 80,
  },
  { dataIndex: 'status', key: 'status', title: '状态', width: 100 },
  { key: 'operation', title: '操作', width: 180 },
];

const drawerTitle = computed(() =>
  editingId.value ? '编辑闯关关卡' : '新增闯关关卡',
);

function createDefaultSection(seqNo = 1): SectionForm {
  return {
    enabled: true,
    name: `题目分组 ${seqNo}`,
    question_count: 1,
    required_correct_count: null,
    seq_no: seqNo,
    source_config: {},
    source_config_text: '{}',
    source_type: 'generator',
  };
}

function createDefaultForm(): LevelForm {
  return {
    challenge_key: 'data_analysis',
    completion_max_total_time: null,
    completion_min_accuracy_rate: 80,
    completion_mode: 'single_attempt',
    completion_required_attempts: 1,
    description: '',
    display_config_text: '{}',
    global_no: 1,
    level_no: 1,
    pass_rate: 80,
    previous_level_id: null,
    question_count: 5,
    sections: [createDefaultSection()],
    sort_order: 1,
    stage: 'stage_1',
    star_three_rate: 100,
    star_two_rate: 90,
    status: 'draft',
    time_limit: 120,
    title: '',
  };
}

function prettyJson(value: unknown): string {
  return JSON.stringify(value ?? {}, null, 2);
}

function parseObject(value: string, label: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value || '{}');
  } catch {
    throw new Error(`${label}不是有效 JSON`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label}必须是 JSON 对象`);
  }
  return parsed as Record<string, unknown>;
}

function resetForm() {
  Object.assign(form, createDefaultForm());
}

function fillForm(level: ChallengeLevel) {
  resetForm();
  Object.assign(form, {
    challenge_key: level.challenge_key,
    completion_max_total_time: level.completion_rule.max_total_time ?? null,
    completion_min_accuracy_rate:
      level.completion_rule.min_accuracy_rate === null ||
      level.completion_rule.min_accuracy_rate === undefined
        ? null
        : Number(level.completion_rule.min_accuracy_rate),
    completion_mode: level.completion_rule.mode,
    completion_required_attempts: level.completion_rule.required_attempts,
    description: level.description ?? '',
    display_config_text: prettyJson(level.display_config),
    global_no: level.global_no,
    level_no: level.level_no,
    pass_rate: Number(level.pass_rate),
    previous_level_id: level.previous_level_id ?? null,
    question_count: level.question_count,
    sections: level.sections.map((section) => ({
      ...section,
      source_config_text: prettyJson(section.source_config),
    })),
    sort_order: level.sort_order,
    stage: level.stage,
    star_three_rate: Number(level.star_three_rate),
    star_two_rate: Number(level.star_two_rate),
    status: level.status,
    time_limit: level.time_limit,
    title: level.title,
  });
}

function buildPayload(includeStatus: boolean): ChallengeLevelPayload {
  const sections = form.sections.map((section) => ({
    enabled: section.enabled,
    name: section.name || null,
    question_count: Number(section.question_count),
    required_correct_count: section.required_correct_count ?? null,
    seq_no: Number(section.seq_no),
    source_config: parseObject(
      section.source_config_text,
      `第 ${section.seq_no} 组题源配置`,
    ),
    source_type: section.source_type,
  }));
  const payload: ChallengeLevelPayload = {
    challenge_key: form.challenge_key.trim(),
    completion_rule: {
      attempt_requirements: [],
      max_total_time: form.completion_max_total_time,
      min_accuracy_rate: form.completion_min_accuracy_rate,
      mode: form.completion_mode,
      required_attempts: Number(form.completion_required_attempts),
    },
    description: form.description.trim() || null,
    display_config: parseObject(form.display_config_text, '展示配置'),
    global_no: Number(form.global_no),
    level_no: Number(form.level_no),
    pass_rate: Number(form.pass_rate),
    previous_level_id: form.previous_level_id,
    question_count: Number(form.question_count),
    sections,
    sort_order: Number(form.sort_order),
    stage: form.stage,
    star_three_rate: Number(form.star_three_rate),
    star_two_rate: Number(form.star_two_rate),
    time_limit: Number(form.time_limit),
    title: form.title.trim(),
  };
  if (includeStatus) payload.status = form.status;
  return payload;
}

async function loadLevels() {
  loading.value = true;
  try {
    levels.value = await getChallengeLevelListApi({
      challenge_key: 'data_analysis',
      status: filterStatus.value,
    });
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingId.value = null;
  resetForm();
  let maxGlobalNo = 0;
  for (const level of levels.value) {
    maxGlobalNo = Math.max(maxGlobalNo, level.global_no);
  }
  form.global_no = maxGlobalNo + 1;
  form.sort_order = form.global_no;
  drawerOpen.value = true;
}

function openEdit(level: ChallengeLevel) {
  editingId.value = level.id;
  fillForm(level);
  drawerOpen.value = true;
}

function editRow(row: unknown) {
  openEdit(row as ChallengeLevel);
}

function addSection() {
  form.sections.push(createDefaultSection(form.sections.length + 1));
}

function removeSection(index: number) {
  if (form.sections.length <= 1) {
    message.warning('至少保留一个题目分组');
    return;
  }
  form.sections.splice(index, 1);
  form.sections.forEach((section, sectionIndex) => {
    section.seq_no = sectionIndex + 1;
  });
}

async function saveLevel() {
  if (!form.title.trim()) {
    message.warning('请填写关卡名称');
    return;
  }
  saving.value = true;
  try {
    const payload = buildPayload(Boolean(editingId.value));
    if (editingId.value) {
      await updateChallengeLevelApi(editingId.value, payload);
      message.success('关卡配置已更新');
    } else {
      await createChallengeLevelApi(payload);
      message.success('关卡配置已创建');
    }
    drawerOpen.value = false;
    await loadLevels();
  } catch (error) {
    message.error(error instanceof Error ? error.message : '保存关卡失败');
  } finally {
    saving.value = false;
  }
}

function publishLevel(level: ChallengeLevel) {
  Modal.confirm({
    title: '确认发布关卡？',
    content: `发布后小程序可能会读取“${level.title}”配置。`,
    okText: '发布',
    cancelText: '取消',
    async onOk() {
      await publishChallengeLevelApi(level.id);
      message.success('关卡已发布');
      await loadLevels();
    },
  });
}

function publishRow(row: unknown) {
  publishLevel(row as ChallengeLevel);
}

function getStageLabel(stage: ChallengeStage): string {
  return stageOptions.find((item) => item.value === stage)?.label || stage;
}

function getStatusLabel(status: ChallengeLevelStatus): string {
  return statusOptions.find((item) => item.value === status)?.label || status;
}

onMounted(() => {
  void loadLevels();
});
</script>

<template>
  <Page title="闯关配置">
    <template #extra>
      <a-space>
        <a-select
          v-model:value="filterStatus"
          allow-clear
          :options="statusOptions"
          placeholder="全部状态"
          style="width: 130px"
          @change="loadLevels"
        />
        <VbenButton type="primary" @click="openCreate">
          <MaterialSymbolsAdd class="size-5" />
          新增关卡
        </VbenButton>
      </a-space>
    </template>

    <a-card class="h-full" :bordered="false">
      <a-alert
        class="mb-4"
        description="stage_1 初窥门径 → stage_2 得心应手 → stage_3 行云流水 → stage_4 登峰造极。关卡数量由实际配置决定。"
        message="阶段顺序"
        show-icon
        type="info"
      />
      <a-table
        :columns="tableColumns"
        :data-source="levels"
        :loading="loading"
        row-key="id"
        :scroll="{ x: 1000 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'stage'">
            <a-tag color="blue">{{ getStageLabel(record.stage) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 'published' ? 'green' : 'default'">
              {{ getStatusLabel(record.status) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'operation'">
            <a-space>
              <a-button type="link" @click="editRow(record)">编辑</a-button>
              <a-button
                v-if="record.status !== 'published'"
                type="link"
                @click="publishRow(record)"
              >
                发布
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-drawer
      v-model:open="drawerOpen"
      :destroy-on-close="true"
      :title="drawerTitle"
      width="960"
    >
      <a-form layout="vertical">
        <a-card class="mb-4" size="small" title="基础信息">
          <div class="grid grid-cols-1 gap-x-4 md:grid-cols-3">
            <a-form-item label="闯关标识">
              <a-input v-model:value="form.challenge_key" disabled />
            </a-form-item>
            <a-form-item label="阶段" required>
              <a-select
                v-model:value="form.stage"
                :disabled="Boolean(editingId)"
                :options="stageOptions"
              />
            </a-form-item>
            <a-form-item label="关卡名称" required>
              <a-input
                v-model:value="form.title"
                placeholder="例如：四概念识别"
              />
            </a-form-item>
            <a-form-item label="阶段内序号" required>
              <a-input-number
                v-model:value="form.level_no"
                class="w-full"
                :disabled="Boolean(editingId)"
                :min="1"
              />
            </a-form-item>
            <a-form-item label="全局序号" required>
              <a-input-number
                v-model:value="form.global_no"
                class="w-full"
                :disabled="Boolean(editingId)"
                :min="1"
              />
            </a-form-item>
            <a-form-item label="前置关卡 ID">
              <a-input-number
                v-model:value="form.previous_level_id"
                allow-clear
                class="w-full"
                :min="1"
              />
            </a-form-item>
            <a-form-item class="md:col-span-3" label="关卡说明">
              <a-textarea v-model:value="form.description" :rows="2" />
            </a-form-item>
          </div>
        </a-card>

        <a-card class="mb-4" size="small" title="题目与通关条件">
          <div class="grid grid-cols-1 gap-x-4 md:grid-cols-4">
            <a-form-item label="题目数量"
              >
<a-input-number
                v-model:value="form.question_count"
                class="w-full"
                :min="1"
            />
</a-form-item>
            <a-form-item label="建议用时（秒）"
              >
<a-input-number
                v-model:value="form.time_limit"
                class="w-full"
                :min="0"
            />
</a-form-item>
            <a-form-item label="通关正确率"
              >
<a-input-number
                v-model:value="form.pass_rate"
                class="w-full"
                :max="100"
                :min="0"
            />
</a-form-item>
            <a-form-item label="状态"
              >
<a-select
                v-model:value="form.status"
                :disabled="!editingId"
                :options="statusOptions"
            />
</a-form-item>
            <a-form-item label="通关模式"
              >
<a-select
                v-model:value="form.completion_mode"
                :options="completionModeOptions"
            />
</a-form-item>
            <a-form-item label="要求达标次数"
              >
<a-input-number
                v-model:value="form.completion_required_attempts"
                class="w-full"
                :min="1"
            />
</a-form-item>
            <a-form-item label="单次最低正确率"
              >
<a-input-number
                v-model:value="form.completion_min_accuracy_rate"
                allow-clear
                class="w-full"
                :max="100"
                :min="0"
            />
</a-form-item>
            <a-form-item label="单次最长用时（秒）"
              >
<a-input-number
                v-model:value="form.completion_max_total_time"
                allow-clear
                class="w-full"
                :min="1"
            />
</a-form-item>
          </div>
        </a-card>

        <a-card class="mb-4" size="small" title="题目分组">
          <template #extra
            >
<a-button size="small" type="dashed" @click="addSection"
              >
新增分组
</a-button
            >
</template
          >
          <div class="space-y-4">
            <a-card
              v-for="(section, index) in form.sections"
              :key="section.seq_no"
              size="small"
            >
              <template #title>第 {{ section.seq_no }} 组</template>
              <template #extra
                >
<a-button
                  danger
                  size="small"
                  type="link"
                  @click="removeSection(index)"
                  >
移除
</a-button
                >
</template
              >
              <div class="grid grid-cols-1 gap-x-4 md:grid-cols-4">
                <a-form-item label="分组名称"
                  >
<a-input v-model:value="section.name"
                />
</a-form-item>
                <a-form-item label="题源类型"
                  >
<a-select
                    v-model:value="section.source_type"
                    :options="sourceTypeOptions"
                />
</a-form-item>
                <a-form-item label="题目数量"
                  >
<a-input-number
                    v-model:value="section.question_count"
                    class="w-full"
                    :min="1"
                />
</a-form-item>
                <a-form-item label="最低答对数"
                  >
<a-input-number
                    v-model:value="section.required_correct_count"
                    allow-clear
                    class="w-full"
                    :min="0"
                />
</a-form-item>
                <a-form-item class="md:col-span-4" label="题源配置 JSON"
                  >
<a-textarea
                    v-model:value="section.source_config_text"
                    :rows="4"
                />
</a-form-item>
              </div>
            </a-card>
          </div>
        </a-card>

        <a-card size="small" title="场景展示配置 JSON">
          <a-textarea v-model:value="form.display_config_text" :rows="6" />
        </a-card>
      </a-form>
      <template #footer>
        <a-space>
          <a-button @click="drawerOpen = false">取消</a-button>
          <a-button type="primary" :loading="saving" @click="saveLevel"
            >
保存配置
</a-button
          >
        </a-space>
      </template>
    </a-drawer>
  </Page>
</template>
