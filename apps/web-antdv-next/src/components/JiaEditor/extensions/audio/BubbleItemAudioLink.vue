<script lang="ts" setup>
import { computed } from "vue";
import Input from "#/components/JiaEditor/components/base/Input.vue";
import { i18n } from "#/components/JiaEditor/locales";
import type { BubbleItemComponentProps } from "#/components/JiaEditor/types";
import { ExtensionAudio } from "./index";

const props = defineProps<BubbleItemComponentProps>();

const src = computed({
  get: () => {
    return props.editor.getAttributes(ExtensionAudio.name)?.src;
  },
  set: (src: string) => {
    props.editor
      .chain()
      .updateAttributes(ExtensionAudio.name, { src: src })
      .setNodeSelection(props.editor.state.selection.from)
      .focus()
      .run();
  },
});
</script>

<template>
  <div class="w-80">
    <Input
      v-model="src"
      auto-focus
      :placeholder="i18n.global.t('editor.common.placeholder.link_input')"
      :label="i18n.global.t('editor.extensions.audio.src_input_label')"
    />
  </div>
</template>

