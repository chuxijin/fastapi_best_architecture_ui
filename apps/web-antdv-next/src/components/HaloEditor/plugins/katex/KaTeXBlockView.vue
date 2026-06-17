<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { useMagicKeys } from '@vueuse/core';
import IcOutlineFullscreen from '~icons/ic/outline-fullscreen';
import IcOutlineFullscreenExit from '~icons/ic/outline-fullscreen-exit';
import IcOutlineTipsAndUpdates from '~icons/ic/outline-tips-and-updates';

import { nodeViewProps, NodeViewWrapper } from '#/components/HaloEditor';

import { renderKatex } from './render-katex';

const props = defineProps(nodeViewProps);

const content = computed(() => {
  return props.node.attrs.content || '';
});

const renderedKatex = computed(() => {
  if (!content.value) {
    return '';
  }
  return renderKatex(content.value, false);
});

const fullscreen = ref(false);

const { escape } = useMagicKeys();

watch(
  () => escape?.value,
  (value) => {
    if (value && fullscreen.value) {
      fullscreen.value = false;
    }
  },
);

function onEditorChange(e: Event) {
  const value = (e.target as HTMLTextAreaElement).value;
  props.updateAttributes({ content: value });
}
</script>

<template>
  <NodeViewWrapper
    class="katex-block-container"
    :class="{
      'katex-block-fullscreen': fullscreen,
      'border-none': !props.editor.isEditable,
    }"
    :style="!props.editor.isEditable ? 'border: none; margin-top: 0;' : ''"
    as="div"
  >
    <div class="katex-block-nav" v-if="props.editor.isEditable">
      <div class="katex-block-nav-start">
        <div>KaTeX 公式</div>
        <a
          v-tooltip="`查阅 KaTeX 的文档`"
          href="https://katex.org/"
          target="_blank"
          class="flex items-center text-gray-400 hover:text-primary transition-colors"
        >
          <IcOutlineTipsAndUpdates class="size-4" />
        </a>
      </div>
      <div class="katex-block-nav-end">
        <div
          class="katex-block-fullscreen-icon text-gray-500 hover:text-primary transition-colors flex items-center justify-center p-1 rounded hover:bg-gray-100"
          @click="fullscreen = !fullscreen"
        >
          <IcOutlineFullscreenExit
            class="size-5"
            v-if="fullscreen"
            v-tooltip="'退出全屏'"
          />
          <IcOutlineFullscreen class="size-5" v-else v-tooltip="'全屏'" />
        </div>
      </div>
    </div>
    <div :class="[props.editor.isEditable ? 'katex-block-editor-panel' : '']">
      <div class="katex-block-code" v-if="props.editor.isEditable">
        <textarea
          :value="content"
          style="
            width: 100%;
            height: 100%;
            padding: 10px;
            font-family: monospace;
            resize: none;
            outline: none;
            background: #fdfdfd;
            border: none;
          "
          placeholder="输入 LaTeX 公式"
          @input="onEditorChange"
        ></textarea>
      </div>
      <div class="katex-block-preview" v-html="renderedKatex"></div>
    </div>
  </NodeViewWrapper>
</template>

<style scoped>
.katex-block-container {
  display: flex;
  flex-direction: column;
  margin-top: 0.75em;
  overflow: hidden;
  border: 1px #e7e7e7 solid;
  border-radius: 4px;
}

.katex-block-nav {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  padding: 5px 10px;
  background: #fff;
  border-bottom: 1px #e7e7e7 solid;
}

.katex-block-nav-start {
  display: flex;
  flex: 1;
  gap: 10px;
  align-items: center;
  font-size: 14px;
}

.katex-block-nav-end {
  justify-content: flex-end;
}

.katex-block-editor-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  height: 100%;
  overflow: auto;
}

.katex-block-code {
  height: 100%;
  border-right: 1px #e7e7e7 solid;
}

.katex-block-preview {
  height: 100%;
  padding: 5px;
}

.katex-block-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  width: 100%;
  height: 100%;
  margin-top: 0;
  background: #fff;
}

.katex-block-fullscreen-icon {
  cursor: pointer;
}

.katex-block-fullscreen-icon svg {
  font-size: 18px;
}

.katex-block-fullscreen-icon:hover {
  color: #999;
}
</style>
