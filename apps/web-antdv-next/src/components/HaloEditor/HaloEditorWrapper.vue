<script lang="ts" setup>
import type { JSONContent } from '@tiptap/core';

import { computed, onBeforeUnmount, watch, shallowRef } from 'vue';

// 引入全套 HaloEditor 核心能力
import {
  RichTextEditor as HaloEditor,
  VueEditor,
  ExtensionsKit,
} from '#/components/HaloEditor';

const props = withDefaults(
  defineProps<{
    height?: number | string;
    jsonValue?: JSONContent | null;
    modelValue?: string;
    placeholder?: string;
    value?: string;
  }>(),
  {
    jsonValue: undefined,
    modelValue: undefined,
    value: undefined,
    height: 400,
    placeholder: '请输入内容...',
  },
);

const emit = defineEmits<{
  change: [html: string];
  'update:jsonValue': [value: JSONContent];
  'update:modelValue': [value: string];
  'update:value': [value: string];
}>();

const currentValue = computed(() => {
  if (props.modelValue !== undefined) {
    return props.modelValue;
  }
  return props.value ?? '';
});

const useJsonValue = computed(() => props.jsonValue !== undefined);

const editor = shallowRef<VueEditor>();

const initEditor = () => {
  if (editor.value) return;

  editor.value = new VueEditor({
    content: useJsonValue.value
      ? (props.jsonValue ?? '')
      : currentValue.value || '',
    extensions: [
      ExtensionsKit.configure({
        placeholder: { placeholder: props.placeholder },
        codeBlock: {
          languages: [
            { label: 'Auto', value: 'auto' },
            { label: 'None', value: 'none' },
            { label: 'Plain Text', value: 'plaintext' },
            { label: 'ABAP', value: 'abap' },
            { label: 'ActionScript', value: 'actionscript' },
            { label: 'Ada', value: 'ada' },
            { label: 'Angular HTML', value: 'angular' },
            { label: 'Angular TypeScript', value: 'angular-ts' },
            { label: 'Bash', value: 'bash' },
            { label: 'C', value: 'c' },
            { label: 'C++', value: 'cpp' },
            { label: 'C#', value: 'csharp' },
            { label: 'CSS', value: 'css' },
            { label: 'Dart', value: 'dart' },
            { label: 'Go', value: 'go' },
            { label: 'HTML', value: 'xml' },
            { label: 'Java', value: 'java' },
            { label: 'JavaScript', value: 'javascript' },
            { label: 'JSON', value: 'json' },
            { label: 'Kotlin', value: 'kotlin' },
            { label: 'Markdown', value: 'markdown' },
            { label: 'PHP', value: 'php' },
            { label: 'Python', value: 'python' },
            { label: 'Ruby', value: 'ruby' },
            { label: 'Rust', value: 'rust' },
            { label: 'SQL', value: 'sql' },
            { label: 'Swift', value: 'swift' },
            { label: 'TypeScript', value: 'typescript' },
            { label: 'YAML', value: 'yaml' },
          ],
        },
      }),
    ],
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const json = ed.getJSON();
      emit('update:modelValue', html);
      emit('update:value', html);
      emit('update:jsonValue', json);
      emit('change', html);
    },
  });
};

initEditor();

watch([currentValue, () => props.jsonValue], ([val, jsonValue]) => {
  if (!editor.value) return;

  if (useJsonValue.value) {
    if (!jsonValue) {
      if (!editor.value.isEmpty) {
        editor.value.commands.setContent('', { emitUpdate: false });
      }
      return;
    }

    if (JSON.stringify(editor.value.getJSON()) !== JSON.stringify(jsonValue)) {
      editor.value.commands.setContent(jsonValue, { emitUpdate: false });
    }
    return;
  }

  if (editor.value.getHTML() !== val) {
    editor.value.commands.setContent(val || '', { emitUpdate: false });
  }
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});

const contentHeight = computed(() =>
  typeof props.height === 'number' ? `${props.height}px` : props.height,
);
</script>

<template>
  <div
    v-if="editor"
    class="legacy-halo-bridge flex flex-col overflow-hidden rounded-lg border border-gray-200"
    :style="{ height: contentHeight, minHeight: '300px' }"
  >
    <!-- 全面对接加载最新的 HaloEditor -->
    <HaloEditor :editor="editor" locale="zh-CN" />
  </div>
</template>

<style scoped>
.legacy-halo-bridge {
  background-color: #fff;
}
.legacy-halo-bridge :deep(.halo-rich-text-editor) {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
