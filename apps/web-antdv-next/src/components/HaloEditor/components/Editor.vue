<script lang="ts" setup>
import { provide, watch, type CSSProperties, type PropType } from "vue";
import { editorConfigKey, type EditorConfig } from "@HaloEditor/config";
import { i18n } from "@HaloEditor/locales";
import { EditorContent, VueEditor } from "@HaloEditor/tiptap";
import EditorBubbleMenu from "./bubble/EditorBubbleMenu.vue";
import EditorDragHandle from "./drag/EditorDragHandle.vue";
import EditorHeader from "./EditorHeader.vue";

const props = defineProps({
  editor: {
    type: Object as PropType<VueEditor>,
    required: true,
  },
  contentStyles: {
    type: Object as PropType<CSSProperties>,
    required: false,
    default: () => ({}),
  },
  locale: {
    type: String as PropType<"zh-CN" | "en" | "zh" | "en-US">,
    required: false,
    default: "zh-CN",
  },
  config: {
    type: Object as PropType<EditorConfig>,
    required: false,
    default: () => ({}),
  },
});

provide(editorConfigKey, props.config);

watch(
  () => props.locale,
  () => {
    i18n.global.locale.value = props.locale;
  },
  {
    immediate: true,
  }
);
</script>
<template>
  <div v-if="editor" class="halo-rich-text-editor">
    <editor-bubble-menu :editor="editor" />
    <editor-drag-handle :editor="editor" />
    <editor-header :editor="editor" />
    <div class="editor-entry">
      <div class="editor-main">
        <div v-if="$slots.content" class="editor-main-extra">
          <slot name="content" />
        </div>

        <editor-content
          :editor="editor"
          :style="contentStyles"
          class="editor-main-content markdown-body"
        />
      </div>
      <div v-if="$slots.extra" class="editor-entry-extra">
        <slot name="extra"></slot>
      </div>
    </div>
  </div>
</template>
