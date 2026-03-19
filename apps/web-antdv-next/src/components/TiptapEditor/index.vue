<script lang="ts" setup>
import type { JSONContent } from '@tiptap/core';

import { computed, onBeforeUnmount, watch } from 'vue';

import { EditorContent, useEditor } from '@tiptap/vue-3';

import EditorBubbleMenu from './EditorBubbleMenu.vue';
import EditorToolbar from './EditorToolbar.vue';
import { createExtensions } from './extensions';

import 'floating-vue/dist/style.css';
import 'katex/dist/katex.min.css';

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

const editor = useEditor({
  extensions: createExtensions(props.placeholder),
  content: useJsonValue.value
    ? (props.jsonValue ?? '')
    : currentValue.value || '',
  onUpdate: ({ editor: ed }) => {
    const html = ed.getHTML();
    const json = ed.getJSON();
    emit('update:modelValue', html);
    emit('update:value', html);
    emit('update:jsonValue', json);
    emit('change', html);
  },
});

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

const handleBodyClick = (e: MouseEvent) => {
  if (!editor.value) return;
  const target = e.target as HTMLElement;
  if (
    target.classList.contains('editor-body') ||
    target.classList.contains('editor-content') ||
    target.classList.contains('tiptap')
  ) {
    editor.value.chain().focus('end').run();
  }
};
</script>

<template>
  <div v-if="editor" class="halo-rich-text-editor">
    <EditorBubbleMenu :editor="editor" />
    <EditorToolbar :editor="editor" />
    <div
      class="editor-body"
      :style="{ height: contentHeight }"
      @click="handleBodyClick"
    >
      <EditorContent :editor="editor" class="editor-content" />
    </div>
  </div>
</template>

<style>
@keyframes ProseMirror-cursor-blink {
  to {
    visibility: hidden;
  }
}

.halo-rich-text-editor {
  overflow: hidden;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.editor-body {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  cursor: text;
}

.editor-content {
  flex: 1;
  padding: 20px 24px;
}

/* ===== ProseMirror 缂栬緫鍖哄煙鏍峰紡 ===== */
.editor-content .tiptap {
  min-height: 100%;
  outline: none;
}

/* ---- 闂撮殭鍏夋爣 (GapCursor) ---- */
.ProseMirror-gapcursor {
  position: absolute;
  display: none;
  pointer-events: none;
}

.ProseMirror-gapcursor::after {
  position: absolute;
  top: -2px;
  display: block;
  width: 20px;
  content: '';
  border-top: 1px solid black;
  animation: ProseMirror-cursor-blink 1.1s steps(2, start) infinite;
}

.ProseMirror-focused .ProseMirror-gapcursor {
  display: block;
}

/* ---- 闂磋窛绛栫暐锛氬弬鑰?Halo base.scss锛屾钀藉拰鏍囬鍚勮嚜鎺у埗闂磋窛 ---- */
.editor-content .tiptap > *:first-child {
  margin-top: 0;
}

.editor-content .tiptap p {
  margin-top: 0.75em;
  margin-bottom: 0;
  line-height: 1.75;
}

/* ---- 鏍囬 ---- */
.editor-content .tiptap h1 {
  margin: 0.75em 0 0.25em;
  font-size: 1.75em;
  font-weight: 700;
  line-height: 1.3;
}

.editor-content .tiptap h2 {
  margin: 0.6em 0 0.2em;
  font-size: 1.5em;
  font-weight: 600;
  line-height: 1.35;
}

.editor-content .tiptap h3 {
  margin: 0.5em 0 0.15em;
  font-size: 1.25em;
  font-weight: 600;
}

.editor-content .tiptap h4 {
  margin: 0.4em 0 0.1em;
  font-size: 1.1em;
  font-weight: 600;
}

.editor-content .tiptap h5 {
  margin: 0.3em 0 0.1em;
  font-size: 1em;
  font-weight: 600;
}

.editor-content .tiptap h6 {
  margin: 0.3em 0 0.1em;
  font-size: 0.875em;
  font-weight: 600;
  color: #6b7280;
}

/* ---- 寮曠敤 ---- */
.editor-content .tiptap blockquote {
  padding-left: 16px;
  margin: 0.75em 0;
  color: #6b7280;
  border-left: 4px solid #e5e7eb;
}

/* ---- 琛屽唴浠ｇ爜 ---- */
.editor-content .tiptap code {
  padding: 2px 6px;
  font-family: 'Fira Code', Consolas, monospace;
  font-size: 0.875em;
  color: #dc2626;
  background: #f3f4f6;
  border-radius: 4px;
}

/* ---- 浠ｇ爜鍧?---- */
.editor-content .tiptap pre {
  padding: 16px 20px;
  margin: 0.75em 0;
  overflow-x: auto;
  font-family: 'Fira Code', Consolas, monospace;
  font-size: 0.875em;
  line-height: 1.6;
  color: #cdd6f4;
  background: #1e1e2e;
  border-radius: 8px;
}

.editor-content .tiptap pre code {
  padding: 0;
  font-size: inherit;
  color: inherit;
  background: none;
}

/* ---- 鍒楄〃 ---- */
.editor-content .tiptap ul {
  padding-left: 1.25rem;
  margin: 0.2rem 0;
  list-style-type: disc;
}

.editor-content .tiptap ol {
  padding-left: 1.25rem;
  margin: 0.2rem 0;
  list-style-type: decimal;
}

.editor-content .tiptap li {
  margin: 0.2em 0;
}

.editor-content .tiptap li > p {
  margin: 0;
}

/* ---- 浠诲姟鍒楄〃 ---- */
.editor-content .tiptap ul[data-type='taskList'] {
  padding-left: 0;
  list-style: none;
}

.editor-content .tiptap ul[data-type='taskList'] li {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin: 0.25em 0;
}

.editor-content .tiptap ul[data-type='taskList'] li > label {
  flex-shrink: 0;
  margin-top: 3px;
}

.editor-content
  .tiptap
  ul[data-type='taskList']
  li
  > label
  input[type='checkbox'] {
  width: 16px;
  height: 16px;
  accent-color: #4f46e5;
  cursor: pointer;
}

.editor-content .tiptap ul[data-type='taskList'] li > div {
  flex: 1;
}

.editor-content
  .tiptap
  ul[data-type='taskList']
  li[data-checked='true']
  > div
  p {
  color: #9ca3af;
  text-decoration: line-through;
}

/* ---- 鍥剧墖 ---- */
.editor-content .tiptap img {
  max-width: 100%;
  margin: 0.75em 0;
  border-radius: 8px;
}

/* ---- 鍒嗗壊绾?---- */
.editor-content .tiptap hr {
  margin: 1.5em 0;
  border: none;
  border-top: 2px solid #e5e7eb;
}

/* ---- 閾炬帴 ---- */
.editor-content .tiptap a {
  color: #4338ca;
  text-decoration: underline;
  text-decoration-color: #c7d2fe;
  text-underline-offset: 3px;
}

.editor-content .tiptap a:hover {
  text-decoration-color: #4338ca;
}

/* ---- 楂樹寒 ---- */
.editor-content .tiptap mark {
  padding: 1px 4px;
  border-radius: 3px;
}

/* ---- 涓婃爣/涓嬫爣 ---- */
.editor-content .tiptap sup {
  font-size: 0.75em;
}

.editor-content .tiptap sub {
  font-size: 0.75em;
}

/* ---- 琛ㄦ牸 ---- */
.editor-content .tiptap table {
  width: 100%;
  margin: 0.75em 0;
  overflow: hidden;
  table-layout: fixed;
  border-collapse: collapse;
}

.editor-content .tiptap table td,
.editor-content .tiptap table th {
  position: relative;
  box-sizing: border-box;
  min-width: 80px;
  padding: 8px 12px;
  vertical-align: top;
  border: 1px solid #d1d5db;
}

.editor-content .tiptap table th {
  font-weight: 600;
  text-align: left;
  background: #f9fafb;
}

.editor-content .tiptap table .selectedCell::after {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  content: '';
  background: rgb(79 70 229 / 8%);
}

.editor-content .tiptap table .column-resize-handle {
  position: absolute;
  top: 0;
  right: -2px;
  bottom: -2px;
  width: 4px;
  pointer-events: none;
  background-color: #4f46e5;
}

.editor-content .tiptap .tableWrapper {
  padding: 1rem 0;
  overflow-x: auto;
}

.editor-content .tiptap.resize-cursor {
  cursor: ew-resize;
  cursor: col-resize;
}

/* ---- 鍗犱綅绗?---- */
.editor-content .tiptap p.is-editor-empty:first-child::before {
  float: left;
  height: 0;
  color: #9ca3af;
  pointer-events: none;
  content: attr(data-placeholder);
}

/* ---- 鍒嗘爮 (Columns) ---- */

/* 娉ㄦ剰锛歠lex 甯冨眬鐜板湪鐢?ColumnsView.vue 鐨?.columns-content 鎺у埗 */

.editor-content .tiptap .column {
  position: relative;
  min-width: 0;
  padding: 0.5rem;
  border: 1px dashed #d1d5db;
  border-radius: 4px;
  transition: border-color 0.2s;
}

.editor-content .tiptap .column:hover {
  border-color: #9ca3af;
}

.editor-content .tiptap .column:focus-within {
  background-color: #f8fafc;
  border-color: #4f46e5;
}

.editor-content .tiptap .column > *:first-child {
  margin-top: 0;
}

.editor-content .tiptap .column > *:last-child {
  margin-bottom: 0;
}

/* ===== 缂栬緫鍣ㄥ鍣?===== */
</style>
