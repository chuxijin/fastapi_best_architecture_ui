<script setup lang="ts">
import { computed } from 'vue';

import { createIconifyIcon } from '@vben/icons';

export interface FileContextMenuAction {
  danger?: boolean;
  icon: string;
  key: string;
  label: string;
}

const props = defineProps<{
  groups: FileContextMenuAction[][];
  open: boolean;
  x: number;
  y: number;
}>();

const emit = defineEmits<{
  action: [key: string];
  'update:open': [open: boolean];
}>();

const menuStyle = computed(() => {
  const width = 188;
  const estimatedHeight = props.groups.reduce(
    (total, group) => total + group.length * 40 + 8,
    0,
  );
  const left = Math.min(props.x, window.innerWidth - width - 12);
  const top = Math.min(props.y, window.innerHeight - estimatedHeight - 12);
  return {
    left: `${Math.max(12, left)}px`,
    top: `${Math.max(12, top)}px`,
  };
});

function closeMenu(): void {
  emit('update:open', false);
}

function emitAction(key: string): void {
  emit('action', key);
  closeMenu();
}

function getIcon(name: string) {
  return createIconifyIcon(name);
}
</script>

<template>
  <div
    v-if="open && groups.length > 0"
    class="fixed inset-0 z-[3000]"
    @click="closeMenu"
    @contextmenu.prevent="closeMenu"
  >
    <div
      class="fixed w-[188px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-xl shadow-slate-900/10"
      :style="menuStyle"
      @click.stop
      @contextmenu.prevent.stop
    >
      <template v-for="(group, groupIndex) in groups" :key="groupIndex">
        <div v-if="groupIndex > 0" class="my-1 border-t border-slate-100"></div>
        <button
          v-for="item in group"
          :key="item.key"
          class="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-indigo-50"
          :class="
            item.danger
              ? 'text-red-600 hover:bg-red-50'
              : 'text-slate-700 hover:text-indigo-700'
          "
          @click="emitAction(item.key)"
        >
          <component :is="getIcon(item.icon)" class="shrink-0 text-lg" />
          <span class="truncate">{{ item.label }}</span>
        </button>
      </template>
    </div>
  </div>
</template>
