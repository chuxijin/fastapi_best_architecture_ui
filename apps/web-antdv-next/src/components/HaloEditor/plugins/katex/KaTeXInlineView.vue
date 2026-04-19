<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { nodeViewProps, NodeViewWrapper } from "#/components/HaloEditor";
import { VDropdown } from "#/stubs/halo-components";
import { renderKatex } from "./render-katex";

const props = defineProps(nodeViewProps);

const content = computed(() => {
  return props.node.attrs.content || "";
});

const renderedKatex = computed(() => {
  if (!content.value) {
    return "";
  }
  return renderKatex(content.value, true);
});

const showEditor = ref(false);

onMounted(() => {
  showEditor.value = props.node.attrs.editMode;
});

function onEditorChange(e: Event) {
  const value = (e.target as HTMLTextAreaElement).value;
  props.updateAttributes({ content: value });
}
</script>
<template>
  <node-view-wrapper
    class="katex-inline-container"
    as="span"
    contenteditable="false"
    :class="{ 'katex-node-view-selected': props.selected }"
    :style="!props.editor.isEditable ? 'padding: 0; background: transparent;' : ''"
  >
    <!-- 如果不可编辑，直接渲染纯净 HTML，丢弃掉外层 VDropdown 的交互包袱 -->
    <span v-if="!props.editor.isEditable" v-html="renderedKatex"></span>

    <!-- 编辑模式时保持原样 -->
    <VDropdown
      v-else
      :classes="['no-padding']"
      :distance="12"
      placement="bottom"
      :shown="showEditor"
    >
      <div class="katex-node-view-content-wrapper">
        <span
          v-if="node.attrs.content"
          contenteditable="false"
          v-html="renderedKatex"
        ></span>
        <span v-else> 添加LaTeX公式 </span>
      </div>
      <template #popper>
        <div class="katex-inline-view-code">
          <textarea
            :value="content"
            class="w-full h-[180px] p-2 outline-none font-mono resize-none border-b border-gray-100"
            placeholder="输入 LaTeX 公式"
            @input="onEditorChange"
          ></textarea>
        </div>
      </template>
    </VDropdown>
  </node-view-wrapper>
</template>
<style>
.katex-inline-container {
  cursor: pointer;
  padding: 0 0.25rem;
  transition: background 0.2s;
  display: inline-block;
}

.katex-node-view-selected .katex-node-view-content-wrapper {
  background: #f2f2f2;
}

.katex-node-view-content-wrapper {
  background: #f6f5f5;
  display: inline-block;
  padding: 3px;
  border-radius: 3px;
  &:hover {
    background: #f2f2f2;
  }
}

.katex-inline-view-code {
  width: 300px;
}

.no-padding {
  padding: 0 !important;
}
</style>
