<script setup lang="ts">
import { computed } from "vue";
import Input from "#/components/JiaEditor/components/base/Input.vue";
import { i18n } from "#/components/JiaEditor/locales";
import type { BubbleItemComponentProps } from "#/components/JiaEditor/types";
import { ExtensionVideo } from "./index";

const props = defineProps<BubbleItemComponentProps>();

const src = computed({
  get: () => {
    return props.editor.getAttributes(ExtensionVideo.name).src;
  },
  set: (src: string) => {
    props.editor
      .chain()
      .updateAttributes(ExtensionVideo.name, { src: src })
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
      :label="i18n.global.t('editor.extensions.video.src_input_label')"
    />
  </div>
</template>

