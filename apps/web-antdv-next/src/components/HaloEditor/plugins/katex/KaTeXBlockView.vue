<script lang="ts" setup>
import { NodeViewWrapper, nodeViewProps } from "#/components/HaloEditor";
import { computed, watch, ref } from "vue";
import { useMagicKeys } from "@vueuse/core";
import { renderKatex } from "./render-katex";
import IcOutlineTipsAndUpdates from "~icons/ic/outline-tips-and-updates";
import IcOutlineFullscreen from "~icons/ic/outline-fullscreen";
import IcOutlineFullscreenExit from "~icons/ic/outline-fullscreen-exit";

const props = defineProps(nodeViewProps);

const content = computed(() => {
  return props.node.attrs.content || "";
});

const renderedKatex = computed(() => {
  if (!content.value) {
    return "";
  }
  return renderKatex(content.value, false);
});

const fullscreen = ref(false);

const { escape } = useMagicKeys();

watch(() => escape?.value, (value) => {
  if (value && fullscreen.value) {
    fullscreen.value = false;
  }
});

function onEditorChange(e: Event) {
  const value = (e.target as HTMLTextAreaElement).value;
  props.updateAttributes({ content: value });
}
</script>

<template>
  <node-view-wrapper
    class="katex-block-container"
    :class="{ 'katex-block-fullscreen': fullscreen, 'border-none': !props.editor.isEditable }"
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
          <IcOutlineFullscreenExit class="size-5" v-if="fullscreen" v-tooltip="'退出全屏'" />
          <IcOutlineFullscreen class="size-5" v-else v-tooltip="'全屏'" />
        </div>
      </div>
    </div>
    <div :class="[props.editor.isEditable ? 'katex-block-editor-panel' : '']">
      <div class="katex-block-code" v-if="props.editor.isEditable">
        <textarea
          :value="content"
          style="width: 100%; height: 100%; outline: none; padding: 10px; resize: none; font-family: monospace; border: none; background: #fdfdfd;"
          placeholder="输入 LaTeX 公式"
          @input="onEditorChange"
        ></textarea>
      </div>
      <div
        class="katex-block-preview"
        v-html="renderedKatex"
      ></div>
    </div>
  </node-view-wrapper>
</template>

<style scoped>
.katex-block-container {
  display: flex;
  flex-direction: column;
  border: 1px #e7e7e7 solid;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 0.75em;
}

.katex-block-nav {
  border-bottom: 1px #e7e7e7 solid;
  display: flex;
  padding: 5px 10px;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 1;
  background: #fff;
}

.katex-block-nav-start {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
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
  padding: 5px;
  height: 100%;
}

.katex-block-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  z-index: 9999;
  width: 100%;
  height: 100%;
  background: #fff;
  margin-top: 0;
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
