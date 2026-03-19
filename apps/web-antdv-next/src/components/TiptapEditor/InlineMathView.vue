<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';

/**
 * 行内公式 NodeView
 * - 未选中时：渲染 KaTeX 公式
 * - 选中/点击时：显示 LaTeX 输入框
 */
import { NodeViewWrapper } from '@tiptap/vue-3';
import katex from 'katex';

const props = defineProps<{
  decorations: any;
  deleteNode: () => void;
  editor: any;
  extension: any;
  getPos: () => number;
  node: any;
  selected: boolean;
  updateAttributes: (attrs: Record<string, any>) => void;
}>();

const editing = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);
const latex = computed(() => props.node.attrs.latex || '');

/** KaTeX 渲染结果 */
const renderedHtml = computed(() => {
  if (!latex.value) return '<span style="color:#9ca3af">公式</span>';
  try {
    return katex.renderToString(latex.value, {
      throwOnError: false,
      displayMode: false,
    });
  } catch {
    return `<span style="color:#dc2626">${latex.value}</span>`;
  }
});

function startEdit() {
  editing.value = true;
  nextTick(() => inputRef.value?.focus());
}

function finishEdit() {
  editing.value = false;
}

function onInputChange(e: Event) {
  const val = (e.target as HTMLInputElement).value;
  props.updateAttributes({ latex: val });
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === 'Escape') {
    e.preventDefault();
    finishEdit();
    // 将光标移到公式后面
    const pos = props.getPos() + props.node.nodeSize;
    props.editor.chain().focus(pos).run();
  }
}

// 当节点被选中时自动进入编辑
watch(
  () => props.selected,
  (sel) => {
    if (sel && !editing.value) {
      startEdit();
    }
  },
);
</script>

<template>
  <NodeViewWrapper
    as="span"
    class="inline-math-wrapper"
    :class="{ 'is-editing': editing }"
  >
    <!-- 编辑模式：LaTeX 输入框 -->
    <span v-if="editing" class="inline-math-editor" contenteditable="false">
      <span class="inline-math-label">𝑓</span>
      <input
        ref="inputRef"
        class="inline-math-input"
        :value="latex"
        placeholder="输入 LaTeX..."
        spellcheck="false"
        @input="onInputChange"
        @keydown="onKeydown"
        @blur="finishEdit"
        @click.stop
        @mousedown.stop
      />
    </span>
    <!-- 预览模式：KaTeX 渲染 -->
    <span
      v-else
      class="inline-math-preview"
      contenteditable="false"
      @click.stop="startEdit"
      v-html="renderedHtml"
    ></span>
  </NodeViewWrapper>
</template>

<style scoped>
.inline-math-wrapper {
  display: inline;
  cursor: pointer;
}

.inline-math-preview {
  display: inline;
  padding: 0 2px;
  border-radius: 3px;
  transition: background 0.15s;
}

.inline-math-preview:hover {
  background: #f0f0ff;
}

.inline-math-editor {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 1px 6px;
  vertical-align: baseline;
  background: #f5f3ff;
  border: 1px solid #c7d2fe;
  border-radius: 4px;
}

.inline-math-label {
  font-size: 12px;
  font-style: italic;
  color: #6366f1;
  user-select: none;
}

.inline-math-input {
  width: auto;
  min-width: 80px;
  font-family: 'Fira Code', Consolas, monospace;
  font-size: 13px;
  color: #374151;
  outline: none;
  background: transparent;
  border: none;
}

.inline-math-input::placeholder {
  color: #9ca3af;
}
</style>
