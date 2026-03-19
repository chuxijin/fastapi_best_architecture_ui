<script lang="ts" setup>
import type { PropType } from 'vue';

/**
 * Slash Commands 下拉视图 - 搬自 Halo CommandsView.vue
 * 键盘上下选择 + 回车确认
 */
import { ref, watch } from 'vue';

export interface CommandMenuItem {
  priority: number;
  icon: any;
  title: string;
  keywords: string[];
  command: (ctx: { editor: any; range: any }) => void;
}

const props = defineProps({
  items: {
    type: Array as PropType<CommandMenuItem[]>,
    required: true,
  },
  command: {
    type: Function as PropType<(item: CommandMenuItem) => void>,
    required: true,
  },
});

const selectedIndex = ref(0);

watch(
  () => props.items,
  () => {
    selectedIndex.value = 0;
  },
);

function onKeyDown({ event }: { event: KeyboardEvent }) {
  if (event.key === 'ArrowUp' || (event.key === 'k' && event.ctrlKey)) {
    handleKeyUp();
    return true;
  }

  if (event.key === 'ArrowDown' || (event.key === 'j' && event.ctrlKey)) {
    handleKeyDown();
    return true;
  }

  if (event.key === 'Enter') {
    handleKeyEnter();
    return true;
  }

  return false;
}

function handleKeyUp() {
  selectedIndex.value =
    (selectedIndex.value + props.items.length - 1) % props.items.length;
}

function handleKeyDown() {
  selectedIndex.value = (selectedIndex.value + 1) % props.items.length;
}

function handleKeyEnter() {
  handleSelectItem(selectedIndex.value);
}

function handleSelectItem(index: number) {
  const item = props.items[index];
  if (item) {
    props.command(item);
  }
}

watch(
  () => selectedIndex.value,
  () => {
    const selected = document.querySelector<HTMLElement>(
      `#command-item-${selectedIndex.value}`,
    );
    if (selected) {
      selected.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  },
);

defineExpose({
  onKeyDown,
});
</script>

<template>
  <div class="commands-view">
    <template v-if="items.length > 0">
      <button
        v-for="(item, index) in items"
        :id="`command-item-${index}`"
        :key="index"
        type="button"
        class="commands-view__item"
        :class="[{ 'commands-view__item--selected': index === selectedIndex }]"
        @click="handleSelectItem(index)"
      >
        <div
          class="commands-view__icon"
          :class="[
            { 'commands-view__icon--selected': index === selectedIndex },
          ]"
        >
          <component :is="item.icon" />
        </div>
        <div
          class="commands-view__title"
          :class="[
            { 'commands-view__title--selected': index === selectedIndex },
          ]"
        >
          {{ item.title }}
        </div>
      </button>
    </template>
    <div v-else class="commands-view__empty">没有匹配的命令</div>
  </div>
</template>

<style scoped>
.commands-view {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 240px;
  max-height: 288px;
  padding: 6px;
  overflow: hidden auto;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgb(0 0 0 / 12%);
}

.commands-view__item {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
  padding: 6px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 6px;
  transition: background 0.15s;
}

.commands-view__item:hover,
.commands-view__item--selected {
  background: #f3f4f6;
}

.commands-view__icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 3px;
  background: #f3f4f6;
  border-radius: 4px;
}

.commands-view__icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.commands-view__icon--selected,
.commands-view__item:hover .commands-view__icon {
  background: #fff;
}

.commands-view__title {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: #4b5563;
}

.commands-view__title--selected,
.commands-view__item:hover .commands-view__title {
  font-weight: 500;
  color: #111827;
}

.commands-view__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  font-size: 13px;
  color: #6b7280;
}
</style>
