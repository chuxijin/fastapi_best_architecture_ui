<script lang="ts" setup>
import type { FormInstance } from 'antdv-next';

import type {
  MemoryContentParam,
  MemoryDeckResult,
  MemoryGroupNode,
} from '#/api/memory-card';

import { computed, reactive, ref, watch } from 'vue';

import { message } from 'antdv-next';

import {
  createMemoryCardApi,
  getMemoryDeckListApi,
  updateMemoryCardApi,
} from '#/api/memory-card';

const props = defineProps<{
  deckId?: number;
  groups?: MemoryGroupNode[];
  record: null | Record<string, any>;
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'success'): void;
}>();

interface PointForm {
  end: number;
  hint: string;
  options: string;
  start: number;
  wrong: string;
}

const formRef = ref<FormInstance>();
const sourceInputRef = ref<any>();
const form = reactive({
  deck_id: 0,
  group_id: null as null | number,
  title: '',
  status: 'active',
  sort_order: 0,
  source_text: '',
  points: [] as PointForm[],
});

const rules: Record<string, unknown[]> = {
  deck_id: [{ required: true, message: '请选择卡组' }],
  title: [{ required: true, message: '请输入标题' }],
  source_text: [{ required: true, message: '请输入完整句子' }],
};

const deckOptions = ref<Array<{ label: string; value: number }>>([]);
const editingId = ref(0);
const saving = ref(false);
const selection = ref<null | { end: number; start: number; text: string }>(
  null,
);

const availableModes = computed(() => {
  if (form.points.length === 0) return [];
  return ['输入填空', '点击揭晓', '选择填空', '纠错'];
});

async function loadDecks() {
  try {
    const data = await getMemoryDeckListApi({ page: 1, size: 200 });
    deckOptions.value = (data.items ?? []).map((item: MemoryDeckResult) => ({
      label: item.name,
      value: item.id,
    }));
  } catch {
    deckOptions.value = [];
  }
}

function splitList(value: string): string[] {
  return value
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function emptyForm() {
  editingId.value = 0;
  form.deck_id = props.deckId ?? 0;
  form.group_id = null;
  form.title = '';
  form.status = 'active';
  form.sort_order = 0;
  form.source_text = '';
  form.points = [];
  selection.value = null;
}

function resetForm(record?: Record<string, any>) {
  emptyForm();
  editingId.value = record?.id ?? 0;
  form.deck_id = record?.deck_id ?? props.deckId ?? 0;
  form.group_id = record?.group_id ?? null;
  form.title = record?.title ?? '';
  form.status = record?.status ?? 'active';
  form.sort_order = record?.sort_order ?? 0;

  const segments = record?.content?.segments ?? [];
  let offset = 0;
  for (const segment of segments) {
    if (segment.type === 'text') {
      form.source_text += segment.text ?? '';
      offset += String(segment.text ?? '').length;
      continue;
    }
    const correct = String(segment.correct ?? '');
    form.points.push({
      start: offset,
      end: offset + correct.length,
      wrong: String(segment.wrong ?? ''),
      options: (segment.options ?? []).join(', '),
      hint: String(segment.hint ?? ''),
    });
    form.source_text += correct;
    offset += correct.length;
  }
}

function captureSelection(event: Event) {
  const target = event.target as HTMLTextAreaElement | null;
  if (!target || target.selectionStart === target.selectionEnd) {
    selection.value = null;
    return;
  }
  selection.value = {
    start: target.selectionStart,
    end: target.selectionEnd,
    text: target.value.slice(target.selectionStart, target.selectionEnd),
  };
}

function addSelectedPoint() {
  const current = selection.value;
  if (!current) {
    message.warning('请先在完整句子中选中需要记忆的内容');
    return;
  }
  const overlap = form.points.some(
    (point) => current.start < point.end && current.end > point.start,
  );
  if (overlap) {
    message.warning('选中的内容与已有记忆点重叠');
    return;
  }
  form.points.push({
    start: current.start,
    end: current.end,
    wrong: '',
    options: '',
    hint: '',
  });
  form.points = form.points.toSorted((a, b) => a.start - b.start);
  selection.value = null;
}

function removePoint(index: number) {
  form.points.splice(index, 1);
}

function buildContent(): MemoryContentParam {
  const points = form.points.toSorted((a, b) => a.start - b.start);
  const segments: MemoryContentParam['segments'] = [];
  let cursor = 0;
  points.forEach((point, index) => {
    if (point.start > cursor) {
      segments.push({
        type: 'text',
        text: form.source_text.slice(cursor, point.start),
      });
    }
    const correct = form.source_text.slice(point.start, point.end);
    segments.push({
      type: 'point',
      id: `p${index + 1}`,
      correct,
      wrong: point.wrong.trim(),
      options: splitList(point.options),
      hint: point.hint.trim() || null,
    });
    cursor = point.end;
  });
  if (cursor < form.source_text.length) {
    segments.push({ type: 'text', text: form.source_text.slice(cursor) });
  }
  return { segments, settings: {} };
}

function groupOptions(): Array<{ label: string; value: number }> {
  const flatten = (
    nodes: MemoryGroupNode[],
    depth = 0,
  ): Array<{ label: string; value: number }> => {
    const result: Array<{ label: string; value: number }> = [];
    for (const node of nodes) {
      result.push({
        label: `${'　'.repeat(depth)}${node.name}`,
        value: node.id,
      });
      if (node.children?.length)
        result.push(...flatten(node.children, depth + 1));
    }
    return result;
  };
  return flatten(props.groups ?? []);
}

async function save() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  if (form.points.length === 0) {
    message.warning('请至少添加一个记忆点');
    return;
  }
  if (form.points.some((point) => !point.wrong.trim())) {
    message.warning('每个记忆点都需要填写错误内容');
    return;
  }
  const payload = {
    deck_id: form.deck_id,
    group_id: form.group_id ?? undefined,
    title: form.title,
    card_type: 'cloze',
    response_mode: 'input',
    status: form.status,
    sort_order: form.sort_order,
    content: buildContent(),
  };
  saving.value = true;
  try {
    if (editingId.value) {
      await updateMemoryCardApi(editingId.value, payload);
      message.success('更新成功');
    } else {
      await createMemoryCardApi(payload);
      message.success('创建成功');
    }
    emit('update:visible', false);
    emit('success');
  } catch (error) {
    console.error(error);
  } finally {
    saving.value = false;
  }
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      void loadDecks();
      resetForm(props.record ?? undefined);
    }
  },
);
</script>

<template>
  <a-modal
    :open="visible"
    :title="editingId ? '编辑记忆素材' : '新建记忆素材'"
    :confirm-loading="saving"
    width="760px"
    @ok="save"
    @cancel="emit('update:visible', false)"
  >
    <div class="max-h-[70vh] overflow-y-auto px-1 py-2">
      <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">
        <div class="grid grid-cols-2 gap-3">
          <a-form-item label="所属卡组" name="deck_id">
            <a-select
              v-model:value="form.deck_id"
              :options="deckOptions"
              placeholder="请选择卡组"
              show-search
              option-filter-prop="label"
            />
          </a-form-item>
          <a-form-item label="所属分组">
            <a-select
              v-model:value="form.group_id"
              :options="groupOptions()"
              placeholder="根目录"
              allow-clear
            />
          </a-form-item>
        </div>

        <a-form-item label="标题" name="title">
          <a-input v-model:value="form.title" placeholder="如：人的本质" />
        </a-form-item>

        <a-form-item label="完整正确句子" name="source_text">
          <a-textarea
            ref="sourceInputRef"
            v-model:value="form.source_text"
            :rows="4"
            placeholder="先输入完整正确句子，例如：我是一个好人，然后选中需要记忆的内容"
            @select="captureSelection"
          />
        </a-form-item>

        <div class="mb-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
          在上方句子中选中文字后，点击“添加记忆点”，再为它填写错误内容。可以添加多个记忆点。
        </div>
        <div
          v-if="selection"
          class="mb-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2"
        >
          <span
            >当前选中：<strong>{{ selection.text }}</strong></span
          >
          <a-button type="primary" size="small" @click="addSelectedPoint">
            添加记忆点
          </a-button>
        </div>

        <a-form-item :label="`记忆点（${form.points.length} 个）`">
          <div
            v-if="form.points.length === 0"
            class="rounded-lg border border-dashed px-3 py-5 text-center text-gray-400"
          >
            还没有记忆点，请在句子中选中文字添加
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="(point, index) in form.points"
              :key="`${point.start}-${point.end}`"
              class="rounded-lg border border-dashed p-3"
            >
              <div class="mb-2 flex items-center justify-between">
                <span class="text-sm font-medium"
                  >记忆点 {{ index + 1 }}：{{
                    form.source_text.slice(point.start, point.end)
                  }}</span
                >
                <a-button
                  type="text"
                  danger
                  size="small"
                  @click="removePoint(index)"
                >
                  删除
                </a-button>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <a-form-item label="错误内容" required>
                  <a-input v-model:value="point.wrong" placeholder="例如：坏" />
                </a-form-item>
                <a-form-item label="选择项（可选）">
                  <a-input
                    v-model:value="point.options"
                    placeholder="留空自动使用正确/错误内容"
                  />
                </a-form-item>
              </div>
              <a-input v-model:value="point.hint" placeholder="提示（可选）" />
            </div>
          </div>
        </a-form-item>

        <div
          v-if="availableModes.length > 0"
          class="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700"
        >
          支持玩法：{{ availableModes.join(' / ') }}。用户学习时可以切换玩法。
        </div>

        <a-form-item label="状态">
          <a-select
            v-model:value="form.status"
            :options="[
              { label: '上架', value: 'active' },
              { label: '下架', value: 'disabled' },
            ]"
          />
        </a-form-item>
      </a-form>
    </div>
  </a-modal>
</template>
