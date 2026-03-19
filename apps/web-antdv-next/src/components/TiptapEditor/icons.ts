import type { Component } from 'vue';

/**
 * 编辑器图标组件
 * 用 @iconify/vue 渲染图标，替代 Halo 的 unplugin-icons
 * 同时支持 mdi / mingcute / lucide / ph 等图标集
 */
import { h } from 'vue';

import { Icon } from '@iconify/vue';

/** 通用图标工厂 */
export function iconifyIcon(icon: string, size = '18'): Component {
  return {
    name: `Icon-${icon.replaceAll(/[:/]/g, '-')}`,
    render() {
      return h(Icon, { icon, width: size, height: size });
    },
  };
}

/** MDI 快捷方式 */
export const mdiIcon = (name: string) => iconifyIcon(`mdi:${name}`);

// ========== 撤销/重做 ==========
export const IconUndo = mdiIcon('undo-variant');
export const IconRedo = mdiIcon('redo-variant');

// ========== 文本格式 ==========
export const IconBold = iconifyIcon('mingcute:bold-line');
export const IconItalic = iconifyIcon('mingcute:italic-line');
export const IconUnderline = iconifyIcon('mingcute:underline-line');
export const IconStrike = iconifyIcon('mingcute:strikethrough-line');
export const IconCode = iconifyIcon('mingcute:code-line');
export const IconSuperscript = iconifyIcon('ph:text-superscript');
export const IconSubscript = iconifyIcon('ph:text-subscript');

// ========== 清除格式 & 格式刷 ==========
export const IconClearFormat = iconifyIcon('mingcute:eraser-line');
export const IconFormatBrush = iconifyIcon('mingcute:brush-3-line');

// ========== 标题 ==========
export const IconParagraph = iconifyIcon('mingcute:paragraph-line');
export const IconHeading = iconifyIcon('mingcute:paragraph-line'); // 默认图标，动态切换
export const IconH1 = iconifyIcon('lucide:heading-1');
export const IconH2 = iconifyIcon('lucide:heading-2');
export const IconH3 = iconifyIcon('lucide:heading-3');
export const IconH4 = iconifyIcon('lucide:heading-4');
export const IconH5 = iconifyIcon('lucide:heading-5');
export const IconH6 = iconifyIcon('lucide:heading-6');

// ========== 字号 ==========
export const IconFontSize = iconifyIcon('mingcute:font-size-line');

// ========== 颜色 ==========
export const IconHighlight = iconifyIcon('mingcute:mark-pen-line');
export const IconColor = iconifyIcon('mingcute:text-color-line');

// ========== 对齐 ==========
export const IconAlignLeft = mdiIcon('format-align-left');
export const IconAlignCenter = mdiIcon('format-align-center');
export const IconAlignRight = mdiIcon('format-align-right');
export const IconAlignJustify = mdiIcon('format-align-justify');

// ========== 列表 ==========
export const IconBulletList = iconifyIcon('lucide:list');
export const IconOrderedList = iconifyIcon('lucide:list-ordered');
export const IconTaskList = iconifyIcon('lucide:list-checks');

// ========== 块级元素 ==========
export const IconQuote = iconifyIcon('mingcute:quote-left-line');
export const IconCodeBlock = mdiIcon('code-braces');
export const IconHorizontalRule = mdiIcon('minus');

// ========== 链接 & 图片 ==========
export const IconLink = mdiIcon('link-variant');
export const IconImage = mdiIcon('image-outline');

// ========== 表格 ==========
export const IconTable = mdiIcon('table');
export const IconTablePlus = mdiIcon('table-plus');
export const IconTableRemove = mdiIcon('table-remove');
export const IconTableColumnPlusBefore = mdiIcon('table-column-plus-before');
export const IconTableColumnPlusAfter = mdiIcon('table-column-plus-after');
export const IconTableColumnRemove = mdiIcon('table-column-remove');
export const IconTableRowPlusBefore = mdiIcon('table-row-plus-before');
export const IconTableRowPlusAfter = mdiIcon('table-row-plus-after');
export const IconTableRowRemove = mdiIcon('table-row-remove');
export const IconTableMergeCells = mdiIcon('table-merge-cells');
export const IconTableSplitCell = mdiIcon('table-split-cell');
export const IconTableHeadersEye = mdiIcon('table-headers-eye');

// ========== UI 图标 ==========
export const IconPlusCircle = iconifyIcon('mingcute:add-circle-fill');
export const IconDropdownArrow = iconifyIcon('mingcute:down-small-fill');
export const IconCheckCircle = iconifyIcon('mingcute:check-circle-line');
export const IconColumns = iconifyIcon('mingcute:columns-2-line');
export const IconColumnAddLeft = iconifyIcon('lucide:columns-2');
export const IconColumnAddRight = iconifyIcon('lucide:columns-2');
export const IconColumnDelete = iconifyIcon('lucide:trash-2');

export const IconCallout = iconifyIcon('lucide:lightbulb');
