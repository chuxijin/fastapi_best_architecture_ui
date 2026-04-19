<script lang="ts" setup>
import type { LinkViewType } from "../editor/link-view-type";
import {
  BlockActionSeparator,
  type BubbleItemComponentProps,
  type Editor,
} from "../../..";
import LinkViewBubbleMenuItem from "./LinkViewBubbleMenuItem.vue";

interface Props {
  editor: any;
  isActive?: (args?: any) => boolean;
  visible?: (args?: any) => boolean;
  action?: (args?: any) => void;
  type?: ({ editor }: { editor: any }) => any;
}

const props = withDefaults(
  defineProps<Props>(),
  {
    isActive: () => false,
    // @unocss-skip-start
    visible: () => true,
    // @unocss-skip-end
    action: undefined,
    type: undefined,
  }
);
</script>
<template>
  <template v-if="visible({ editor })">
    <BlockActionSeparator :editor="editor" />
    <LinkViewBubbleMenuItem v-bind="props" />
    <BlockActionSeparator :editor="editor" />
  </template>
</template>
