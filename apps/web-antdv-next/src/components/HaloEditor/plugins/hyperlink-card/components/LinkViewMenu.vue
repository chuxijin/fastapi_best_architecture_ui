<script setup lang="ts">
import linkViewTypes, { type LinkViewType } from "../editor/link-view-type";
import {
  DropdownItem,
  type BubbleItemComponentProps,
  type Editor,
} from "../../..";

interface Props {
  editor: any;
  isActive?: (args?: any) => boolean;
  visible?: (args?: any) => boolean;
  action?: (args?: any) => void;
  type?: ({ editor }: { editor: any }) => any;
}

const props = defineProps<Props>();

const handleSwitchLinkViewType = (item: LinkViewType) => {
  if (isActiveType(item)) {
    return;
  }
  item.action({ editor: props.editor });
};

const isActiveType = (item: LinkViewType) => {
  return props.type?.({ editor: props.editor }).key === item.key || false;
};
</script>
<template>
  <DropdownItem
    v-for="item in linkViewTypes"
    :key="item.key"
    :is-active="isActiveType(item)"
    @click="handleSwitchLinkViewType(item)"
  >
    <template #icon>
      <component :is="item.icon" />
    </template>
    {{ item.title }}
  </DropdownItem>
</template>
