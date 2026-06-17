<script lang="ts" setup>
/* eslint-disable vue/no-mutating-props */
import type { PracticeSourceFormState } from '../common';

import type {
  BankResult,
  ChapterTreeResult,
  SysCategoryTreeResult,
} from '#/api';

import { computed, onMounted, ref, watch } from 'vue';

import { message, TreeSelect } from 'ant-design-vue';

import {
  getBankListApi,
  getChapterTreeApi,
  getSysCategoryTreeApi,
  previewStudyPlanPracticeSourceApi,
} from '#/api';

import {
  buildPracticePreviewPayload,
  parsePracticeQuestionIds,
  practiceQuestionTypeOptions,
  practiceSourceModeOptions,
  syncPracticeKnowledgePoints,
  validatePracticeSourceForm,
} from '../common';

interface NumberOption {
  label: string;
  value: number;
}

interface TreeOption extends NumberOption {
  children?: TreeOption[];
  key: number;
  title: string;
}

const props = defineProps<{
  form: PracticeSourceFormState;
}>();

const bankOptions = ref<NumberOption[]>([]);
const chapterTreeOptions = ref<TreeOption[]>([]);
const knowledgeTreeOptions = ref<TreeOption[]>([]);
const knowledgeNameMap = ref<Map<number, string>>(new Map());
const bankLoading = ref(false);
const chapterLoading = ref(false);
const knowledgeLoading = ref(false);
const previewLoading = ref(false);
const previewText = ref('');

const treeShowChildStrategy = TreeSelect.SHOW_CHILD;

const requiresBank = computed(() =>
  ['bank', 'chapter', 'chapter_type'].includes(props.form.practice_source_mode),
);

const showsBank = computed(() =>
  ['bank', 'chapter', 'chapter_type', 'question_ids'].includes(
    props.form.practice_source_mode,
  ),
);

const requiresChapter = computed(() =>
  ['chapter', 'chapter_type'].includes(props.form.practice_source_mode),
);

const usesKnowledgePoint = computed(
  () => props.form.practice_source_mode === 'knowledge_point',
);

const usesQuestionIds = computed(
  () => props.form.practice_source_mode === 'question_ids',
);

const knowledgeTextTags = computed<string[]>({
  get() {
    return props.form.practice_knowledge_points_text
      .split(/[\s,，、;；]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  },
  set(value) {
    props.form.practice_knowledge_points_text = value.join('、');
    syncPracticeKnowledgePoints(props.form, knowledgeNameMap.value);
  },
});

function formatBankType(value: number) {
  if (value === 1) {
    return '习题';
  }
  if (value === 2) {
    return '试卷';
  }
  if (value === 3) {
    return '合集';
  }
  return '题库';
}

function flattenBankOptions(items: BankResult[], level = 0): NumberOption[] {
  return items.flatMap((item) => {
    const prefix = level > 0 ? `${'　'.repeat(level)}` : '';
    const countText = item.q_count_cache ? ` · ${item.q_count_cache}题` : '';
    const option = {
      label: `${prefix}${item.name}（${formatBankType(item.bank_type)}${countText}）`,
      value: item.id,
    };
    const children = item.children?.length
      ? flattenBankOptions(item.children, level + 1)
      : [];
    return [option, ...children];
  });
}

function convertChapterTree(items: ChapterTreeResult[]): TreeOption[] {
  return items.map((item) => {
    const countText = item.q_count_cache ? ` · ${item.q_count_cache}题` : '';
    return {
      key: item.id,
      label: `${item.name}${countText}`,
      title: `${item.name}${countText}`,
      value: item.id,
      children: item.children?.length
        ? convertChapterTree(item.children)
        : undefined,
    };
  });
}

function convertKnowledgeTree(items: SysCategoryTreeResult[]) {
  const nameMap = new Map<number, string>();

  const walk = (nodes: SysCategoryTreeResult[]): TreeOption[] =>
    nodes.map((item) => {
      nameMap.set(item.id, item.name);
      return {
        key: item.id,
        label: item.name,
        title: item.name,
        value: item.id,
        children: item.children?.length ? walk(item.children) : undefined,
      };
    });

  const tree = walk(items);
  knowledgeNameMap.value = nameMap;
  syncPracticeKnowledgePoints(props.form, nameMap);
  return tree;
}

function findTreeTitle(items: TreeOption[], value?: null | number): string {
  if (!value) {
    return '';
  }

  for (const item of items) {
    if (item.value === value) {
      return item.title.replace(/\s+·\s+\d+题$/, '');
    }
    const childTitle = findTreeTitle(item.children ?? [], value);
    if (childTitle) {
      return childTitle;
    }
  }

  return '';
}

function syncBankLabel() {
  const option = bankOptions.value.find(
    (item) => item.value === props.form.practice_bank_id,
  );
  props.form.practice_bank_label = option?.label.replace(/（.*$/, '') ?? '';
}

function syncChapterLabel() {
  props.form.practice_chapter_label = findTreeTitle(
    chapterTreeOptions.value,
    props.form.practice_chapter_id,
  );
}

async function loadBankOptions() {
  bankLoading.value = true;
  try {
    const list = await getBankListApi({ status: 1 });
    bankOptions.value = flattenBankOptions(list);
    syncBankLabel();
  } catch {
    bankOptions.value = [];
    message.warning('题库列表加载失败');
  } finally {
    bankLoading.value = false;
  }
}

async function loadChapterOptions(bankId: number) {
  chapterLoading.value = true;
  try {
    const tree = await getChapterTreeApi({ bank_id: bankId });
    chapterTreeOptions.value = convertChapterTree(tree);
    syncChapterLabel();
  } catch {
    chapterTreeOptions.value = [];
    message.warning('题库篇章加载失败');
  } finally {
    chapterLoading.value = false;
  }
}

async function loadKnowledgeOptions() {
  knowledgeLoading.value = true;
  try {
    const tree = await getSysCategoryTreeApi({
      app_code: 'youanshang',
      status: true,
      type: 'knowledge_point',
    });
    knowledgeTreeOptions.value = convertKnowledgeTree(tree);
  } catch {
    knowledgeTreeOptions.value = [];
    knowledgeNameMap.value = new Map();
    message.warning('知识点列表加载失败');
  } finally {
    knowledgeLoading.value = false;
  }
}

async function previewPracticeSource() {
  previewLoading.value = true;
  previewText.value = '';
  try {
    validatePracticeSourceForm(props.form);
    const result = await previewStudyPlanPracticeSourceApi(
      buildPracticePreviewPayload(props.form),
    );
    const sampleText =
      result.sample_question_ids.length > 0
        ? ` · 样例 ${result.sample_question_ids.slice(0, 8).join(',')}`
        : '';
    previewText.value = `可用 ${result.available_count} 题，计划选 ${result.selected_count} 题${sampleText}`;
  } catch (error: any) {
    previewText.value = '';
    message.warning(error?.message || '预览题量失败');
  } finally {
    previewLoading.value = false;
  }
}

watch(
  () => props.form.practice_source_mode,
  () => {
    previewText.value = '';
  },
);

watch(
  () => props.form.practice_bank_id,
  async (bankId, oldBankId) => {
    previewText.value = '';
    syncBankLabel();
    if (oldBankId !== undefined && oldBankId !== bankId) {
      props.form.practice_chapter_id = null;
      props.form.practice_chapter_label = '';
    }
    if (bankId) {
      await loadChapterOptions(bankId);
    } else {
      chapterTreeOptions.value = [];
    }
  },
  { immediate: true },
);

watch(
  () => props.form.practice_chapter_id,
  () => {
    previewText.value = '';
    syncChapterLabel();
  },
);

watch(
  () => [
    props.form.practice_knowledge_point_ids,
    props.form.practice_knowledge_points_text,
  ],
  () => {
    previewText.value = '';
    syncPracticeKnowledgePoints(props.form, knowledgeNameMap.value);
  },
  { deep: true },
);

watch(
  () => props.form.practice_question_ids_text,
  () => {
    previewText.value = '';
    if (usesQuestionIds.value && !props.form.target_question_count) {
      try {
        props.form.target_question_count =
          parsePracticeQuestionIds(props.form.practice_question_ids_text)
            .length || null;
      } catch {
        props.form.target_question_count = null;
      }
    }
  },
);

onMounted(() => {
  void loadBankOptions();
  void loadKnowledgeOptions();
});
</script>

<template>
  <div class="practice-builder">
    <a-form-item label="来源方式" required>
      <a-segmented
        v-model:value="form.practice_source_mode"
        :options="practiceSourceModeOptions"
      />
    </a-form-item>

    <div class="form-grid">
      <a-form-item label="目标题数">
        <a-input-number
          v-model:value="form.target_question_count"
          :min="1"
          :precision="0"
          style="width: 100%"
        />
      </a-form-item>
      <a-form-item label="目标正确率（%）">
        <a-input-number
          v-model:value="form.target_accuracy_percent"
          :max="100"
          :min="0"
          :precision="1"
          style="width: 100%"
        />
      </a-form-item>
    </div>

    <a-form-item
      v-if="showsBank"
      :label="usesQuestionIds ? '题库（可选）' : '题库'"
      :required="requiresBank"
    >
      <a-select
        v-model:value="form.practice_bank_id"
        :allow-clear="true"
        :loading="bankLoading"
        :options="bankOptions"
        option-filter-prop="label"
        placeholder="选择题库/试卷/合集"
        show-search
      />
    </a-form-item>

    <a-form-item v-if="requiresChapter" label="题库篇章" required>
      <a-tree-select
        v-model:value="form.practice_chapter_id"
        :allow-clear="true"
        :loading="chapterLoading"
        :tree-data="chapterTreeOptions"
        placeholder="选择篇章"
        style="width: 100%"
        tree-default-expand-all
        tree-node-filter-prop="title"
        show-search
      />
    </a-form-item>

    <a-form-item
      v-if="form.practice_source_mode === 'chapter_type'"
      label="题型"
      required
    >
      <a-checkbox-group
        v-model:value="form.practice_question_types"
        :options="practiceQuestionTypeOptions"
      />
    </a-form-item>

    <template v-if="usesKnowledgePoint">
      <a-form-item label="知识点">
        <a-tree-select
          v-model:value="form.practice_knowledge_point_ids"
          :allow-clear="true"
          :loading="knowledgeLoading"
          :show-checked-strategy="treeShowChildStrategy"
          :tree-checkable="true"
          :tree-data="knowledgeTreeOptions"
          placeholder="选择知识点"
          style="width: 100%"
          tree-default-expand-all
          tree-node-filter-prop="title"
          show-search
        />
      </a-form-item>
      <a-form-item label="补充知识点">
        <a-select
          v-model:value="knowledgeTextTags"
          :open="false"
          mode="tags"
          placeholder="输入名称后回车，可补充树外知识点"
        />
      </a-form-item>
    </template>

    <a-form-item v-if="usesQuestionIds" label="题目 ID" required>
      <a-textarea
        v-model:value="form.practice_question_ids_text"
        :rows="3"
        placeholder="用逗号、空格或换行分隔，如 1001,1002,1003"
      />
    </a-form-item>

    <div v-if="!usesQuestionIds" class="form-grid">
      <a-form-item label="起始年份">
        <a-input-number
          v-model:value="form.practice_year_start"
          :min="1900"
          :precision="0"
          style="width: 100%"
        />
      </a-form-item>
      <a-form-item label="结束年份">
        <a-input-number
          v-model:value="form.practice_year_end"
          :min="1900"
          :precision="0"
          style="width: 100%"
        />
      </a-form-item>
      <a-form-item label="地区关键字">
        <a-input v-model:value="form.practice_region" allow-clear />
      </a-form-item>
      <a-form-item label="限时分钟">
        <a-input-number
          v-model:value="form.practice_time_limit"
          :min="1"
          :precision="0"
          style="width: 100%"
        />
      </a-form-item>
    </div>

    <div v-if="!usesQuestionIds" class="builder-actions">
      <a-checkbox v-model:checked="form.practice_shuffle">
        打乱题序
      </a-checkbox>
      <a-button
        :loading="previewLoading"
        size="small"
        type="primary"
        @click="previewPracticeSource"
      >
        预览题量
      </a-button>
      <span v-if="previewText" class="preview-text">{{ previewText }}</span>
    </div>
    <div v-else class="builder-actions">
      <a-button
        :loading="previewLoading"
        size="small"
        type="primary"
        @click="previewPracticeSource"
      >
        预览题量
      </a-button>
      <span v-if="previewText" class="preview-text">{{ previewText }}</span>
    </div>
  </div>
</template>

<style scoped>
.practice-builder {
  padding: 12px;
  margin-bottom: 16px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.builder-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.preview-text {
  font-size: 13px;
  color: #595959;
}
</style>
