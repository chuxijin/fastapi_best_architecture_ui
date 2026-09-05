<script setup lang="ts">
import type { VisualFieldRow, VisualFieldType } from '../utils';

import { createVisualField } from '../utils';

const rows = defineModel<VisualFieldRow[]>({ default: () => [] });

const typeOptions = [
  { label: '文本', value: 'text' },
  { label: '数字', value: 'number' },
  { label: '是/否', value: 'boolean' },
  { label: '多值标签', value: 'tags' },
];

function addRow() {
  rows.value.push(createVisualField());
}

function changeType(row: VisualFieldRow, type: VisualFieldType) {
  row.type = type;
  switch (type) {
    case 'boolean': {
      row.value = false;
      break;
    }
    case 'number': {
      row.value = 0;
      break;
    }
    case 'tags': {
      row.value = [];
      break;
    }
    default: {
      row.value = '';
    }
  }
}

function updateTags(row: VisualFieldRow, value: unknown) {
  row.value = Array.isArray(value) ? value.map(String) : [];
}
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="(row, index) in rows"
      :key="row.rowKey"
      class="grid grid-cols-12 gap-2 rounded border p-2"
    >
      <a-input
        v-model:value="row.key"
        class="col-span-4"
        placeholder="字段名称，例如：教材版本"
      />
      <a-select
        :value="row.type"
        class="col-span-2"
        :options="typeOptions"
        @change="changeType(row, $event as VisualFieldType)"
      />
      <a-switch
        v-if="row.type === 'boolean'"
        :checked="Boolean(row.value)"
        class="col-span-5 mt-1"
        @update:checked="row.value = Boolean($event)"
      />
      <a-input-number
        v-else-if="row.type === 'number'"
        :value="Number(row.value)"
        class="col-span-5"
        style="width: 100%"
        @update:value="row.value = $event ?? 0"
      />
      <a-select
        v-else-if="row.type === 'tags'"
        :value="Array.isArray(row.value) ? row.value : []"
        class="col-span-5"
        mode="tags"
        placeholder="输入后回车，可添加多个值"
        :token-separators="[',', '，']"
        @update:value="updateTags(row, $event)"
      />
      <a-input
        v-else
        :value="String(row.value ?? '')"
        class="col-span-5"
        placeholder="字段值"
        @update:value="row.value = $event"
      />
      <a-button danger type="link" @click="rows.splice(index, 1)"
        >
删除
</a-button
      >
    </div>
    <a-button block type="dashed" @click="addRow">添加自定义字段</a-button>
  </div>
</template>
