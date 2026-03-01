<script setup lang="ts">
import { computed } from 'vue';

import { MaterialSymbolsAdd, MaterialSymbolsDelete } from '@vben/icons';

import { AutoComplete, Button, message, Tag, Tooltip } from 'ant-design-vue';

import WangEditor from '#/components/WangEditor/index.vue';

interface ShortAnswerVersion {
  type: string;
  answer: string;
  analysis: string;
  is_default: boolean;
}

const props = defineProps<{
  value: ShortAnswerVersion[];
}>();

const emit = defineEmits(['update:value']);

const versions = computed({
  get: () => props.value || [],
  set: (val) => emit('update:value', val),
});

const answerTypeOptions = [
  { value: '官方' },
  { value: '名师' },
  { value: '用户' },
];

function addVersion() {
  const newVersions = [...versions.value];
  // 如果是第一个版本，默认设为官方且默认展示
  if (newVersions.length === 0) {
    newVersions.push({
      type: '官方',
      answer: '',
      analysis: '',
      is_default: true,
    });
  } else {
    newVersions.push({
      type: '名师',
      answer: '',
      analysis: '',
      is_default: false,
    });
  }
  versions.value = newVersions;
}

function removeVersion(index: number) {
  if (versions.value.length <= 1) {
    message.warning('至少保留1个版本');
    return;
  }
  const newVersions = [...versions.value];
  const wasDefault = newVersions[index].is_default;
  newVersions.splice(index, 1);
  // 如果删除了默认版本，且还有其他版本，将第一个设为默认
  if (wasDefault && newVersions.length > 0) {
    newVersions[0].is_default = true;
  }
  versions.value = newVersions;
}

function setDefault(index: number) {
  const newVersions = versions.value.map((v, i) => ({
    ...v,
    is_default: i === index,
  }));
  versions.value = newVersions;
}
</script>

<template>
  <div>
    <div
      v-for="(version, index) in versions"
      :key="index"
      class="mb-4 rounded border p-4"
    >
      <!-- Header -->
      <div class="mb-2 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <AutoComplete
            v-model:value="version.type"
            :options="answerTypeOptions"
            class="w-32"
            placeholder="版本类型"
          />
          <Tag v-if="version.is_default" color="blue">默认展示</Tag>
          <Tooltip v-else title="设为默认展示">
            <Button size="small" type="text" @click="setDefault(index)">
              设为默认
            </Button>
          </Tooltip>
        </div>
        <div class="flex items-center gap-2">
          <Button type="text" danger @click="removeVersion(index)">
            <MaterialSymbolsDelete class="size-4" />
          </Button>
        </div>
      </div>

      <!-- Body -->
      <div class="flex gap-4">
        <div class="flex-1">
          <div class="mb-1 text-xs text-gray-500">参考答案：</div>
          <WangEditor v-model="version.answer" :height="200" />
        </div>
        <div class="flex-1">
          <div class="mb-1 text-xs text-gray-500">解析：</div>
          <WangEditor v-model="version.analysis" :height="200" />
        </div>
      </div>
    </div>

    <Button type="dashed" block @click="addVersion">
      <MaterialSymbolsAdd class="mr-1 size-4" />
      添加版本
    </Button>
  </div>
</template>
