<script lang="ts" setup>
/**
 * 色板下拉选择器 - 参考 Halo ColorPickerDropdown.vue
 * 不依赖 tailwindcss，直接内置 72 色色板
 */
import { Menu as VMenu } from 'floating-vue';

defineEmits<{
  (e: 'update:modelValue', color?: string): void;
}>();

// 颜色色板：8个色系 × 9个深浅
const COLOR_PALETTE = [
  // gray
  '#111827',
  '#1f2937',
  '#374151',
  '#4b5563',
  '#6b7280',
  '#9ca3af',
  '#d1d5db',
  '#e5e7eb',
  '#f3f4f6',
  // red
  '#7f1d1d',
  '#991b1b',
  '#b91c1c',
  '#dc2626',
  '#ef4444',
  '#f87171',
  '#fca5a5',
  '#fecaca',
  '#fee2e2',
  // orange
  '#7c2d12',
  '#9a3412',
  '#c2410c',
  '#ea580c',
  '#f97316',
  '#fb923c',
  '#fdba74',
  '#fed7aa',
  '#ffedd5',
  // yellow
  '#713f12',
  '#854d0e',
  '#a16207',
  '#ca8a04',
  '#eab308',
  '#facc15',
  '#fde047',
  '#fef08a',
  '#fef9c3',
  // green
  '#14532d',
  '#166534',
  '#15803d',
  '#16a34a',
  '#22c55e',
  '#4ade80',
  '#86efac',
  '#bbf7d0',
  '#dcfce7',
  // blue
  '#1e3a5f',
  '#1e40af',
  '#1d4ed8',
  '#2563eb',
  '#3b82f6',
  '#60a5fa',
  '#93c5fd',
  '#bfdbfe',
  '#dbeafe',
  // purple
  '#3b0764',
  '#581c87',
  '#6b21a8',
  '#7c3aed',
  '#8b5cf6',
  '#a78bfa',
  '#c4b5fd',
  '#ddd6fe',
  '#ede9fe',
  // pink
  '#831843',
  '#9d174d',
  '#be185d',
  '#db2777',
  '#ec4899',
  '#f472b6',
  '#f9a8d4',
  '#fbcfe8',
  '#fce7f3',
];
</script>

<template>
  <VMenu
    :triggers="['click']"
    :popper-triggers="['click']"
    class="color-picker-wrapper"
  >
    <slot></slot>
    <template #popper>
      <div class="color-picker-panel">
        <!-- 前缀插槽（如"恢复默认"） -->
        <slot name="prefix"></slot>
        <!-- 色板网格 -->
        <div class="color-grid">
          <div
            v-for="color in COLOR_PALETTE"
            :key="color"
            class="color-swatch"
            :style="{ backgroundColor: color }"
            :title="color"
            @click="$emit('update:modelValue', color)"
          ></div>
        </div>
      </div>
    </template>
  </VMenu>
</template>

<style scoped>
.color-picker-wrapper {
  display: inline-flex;
  align-items: center;
}

.color-picker-panel {
  min-width: 0;
  padding: 4px;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 5px;
  padding: 8px;
}

.color-swatch {
  width: 20px;
  height: 20px;
  cursor: pointer;
  border-radius: 3px;
  transition:
    transform 0.1s,
    box-shadow 0.1s;
}

.color-swatch:hover {
  z-index: 1;
  box-shadow:
    0 0 0 2px #fff,
    0 0 0 3px #9ca3af;
  transform: scale(1.2);
}
</style>
