<script lang="ts" setup>
import { NodeViewWrapper, NodeViewContent, nodeViewProps } from "@tiptap/vue-3";
import { VDropdown, VButton } from "#/stubs/halo-components";
import MingcutePaletteLine from "~icons/mingcute/palette-line";
import { i18n } from "@HaloEditor/locales";

const props = defineProps(nodeViewProps);

// Basic color palette
const textColors = ["#000000", "#9CA3AF", "#EF4444", "#F97316", "#EAB308", "#22C55E", "#3B82F6", "#A855F7"];
const borderColors = ["transparent", "#E5E7EB", "#FCA5A5", "#FDBA74", "#FDE047", "#86EFAC", "#93C5FD", "#D8B4FE"];
const bgColors = ["transparent", "#F3F4F6", "#FEE2E2", "#FFEDD5", "#FEF9C3", "#DCFCE7", "#DBEAFE", "#F3E8FF"];

const setAttr = (type: "textColor" | "borderColor" | "backgroundColor" | "icon", value: string) => {
  props.updateAttributes({ [type]: value });
};

const restoreDefault = () => {
  props.updateAttributes({
    textColor: "inherit",
    borderColor: "#fb923c",
    backgroundColor: "#fff7ed",
  });
};
</script>

<template>
  <NodeViewWrapper
    class="group relative my-1 flex items-start rounded border border-solid px-4 py-3 transition-colors duration-300"
    :style="{
      color: node.attrs.textColor,
      borderColor: node.attrs.borderColor,
      backgroundColor: node.attrs.backgroundColor,
    }"
  >
    <!-- 左侧 Emoji 控制 -->
    <VDropdown placement="bottom-start" :distance="4">
      <div
        class="mr-3 mt-1 cursor-pointer select-none text-xl leading-none transition-transform hover:scale-110"
        title="点击更换图标"
      >
        {{ node.attrs.icon }}
      </div>
      <template #popper>
        <div class="grid grid-cols-6 gap-2 p-3 text-xl w-48">
          <div
            v-for="emoji in ['💡', '🏕️', '📝', '⚠️', '🔥', '✨', '📌', '✅', '🚀', '💬', '🎉', '🌟', 'ℹ️', '📖', '❤️', '👍', '👀', '🔔']"
            :key="emoji"
            class="flex size-8 cursor-pointer items-center justify-center rounded hover:bg-gray-100"
            @click="() => { setAttr('icon', emoji) }"
          >
            {{ emoji }}
          </div>
        </div>
      </template>
    </VDropdown>

    <!-- 文本内容录入区 -->
    <div class="flex-1 w-0">
      <NodeViewContent class="w-full highlight-content-inner outline-none min-w-[50px] leading-[1.6]" />
    </div>

    <!-- 悬浮调色盘工具 -->
    <div
      v-if="editor.isEditable"
      class="absolute right-2 top-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
    >
      <VDropdown placement="bottom-end">
        <button
          class="flex size-6 cursor-pointer items-center justify-center rounded bg-white text-gray-400 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 hover:text-gray-700"
        >
          <MingcutePaletteLine class="size-4" />
        </button>

        <template #popper>
          <div class="w-64 p-3 space-y-4 text-sm text-gray-700">
            <!-- 字体颜色 -->
            <div>
              <div class="mb-2 flex items-center justify-between">
                <span class="text-xs text-gray-500">字体颜色</span>
                <span class="cursor-pointer text-xs text-blue-500 hover:text-blue-600" @click="setAttr('textColor', 'inherit')">重置</span>
              </div>
              <div class="grid grid-cols-8 gap-1.5">
                <div
                  v-for="color in textColors"
                  :key="color"
                  class="flex size-6 cursor-pointer items-center justify-center rounded-sm font-serif outline-none ring-1 ring-inset ring-gray-200 hover:ring-2 hover:ring-blue-400 font-bold"
                  :style="{ color: color === 'transparent' ? '#000' : color }"
                  @click="setAttr('textColor', color)"
                >A</div>
              </div>
            </div>

            <!-- 边框颜色 -->
            <div>
              <div class="mb-2 flex items-center justify-between">
                <span class="text-xs text-gray-500">边框颜色</span>
                <span class="text-xs cursor-pointer text-gray-300 hover:text-gray-500" @click="setAttr('borderColor', 'transparent')">清空</span>
              </div>
              <div class="grid grid-cols-8 gap-1.5">
                <div
                  v-for="border in borderColors"
                  :key="border"
                  class="size-6 cursor-pointer rounded-sm outline-none ring-1 ring-inset ring-gray-200 hover:ring-2 hover:ring-blue-400"
                  :style="{ backgroundColor: border }"
                  @click="setAttr('borderColor', border)"
                ></div>
              </div>
            </div>

            <!-- 填充颜色 -->
            <div>
              <div class="mb-2 flex items-center justify-between">
                <span class="text-xs text-gray-500">填充颜色</span>
                <span class="text-xs cursor-pointer text-gray-300 hover:text-gray-500" @click="setAttr('backgroundColor', 'transparent')">清空</span>
              </div>
              <div class="grid grid-cols-8 gap-1.5">
                <div
                  v-for="bg in bgColors"
                  :key="bg"
                  class="size-6 cursor-pointer rounded-sm outline-none ring-1 ring-inset ring-gray-200 hover:ring-2 hover:ring-blue-400"
                  :style="{ backgroundColor: bg }"
                  @click="setAttr('backgroundColor', bg)"
                ></div>
              </div>
            </div>

            <VButton class="w-full !mt-5 border-gray-200 text-xs" size="sm" @click="restoreDefault">
              恢复默认
            </VButton>
          </div>
        </template>
      </VDropdown>
    </div>
  </NodeViewWrapper>
</template>

<style>
/* 防止段落自带外边距导致居中异常 */
.highlight-content-inner p {
  margin: 0 !important;
}
</style>
