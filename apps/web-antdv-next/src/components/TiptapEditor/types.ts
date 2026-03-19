/**
 * 编辑器类型定义 - 摘自 Halo types/index.ts
 */
import type { Editor } from '@tiptap/vue-3';

import type { Component } from 'vue';

export interface ToolbarItem {
  priority: number;
  component: Component;
  props: {
    action?: () => void;
    disabled?: boolean;
    editor: Editor;
    icon?: Component;
    isActive: boolean;
    title?: string;
  };
  children?: ToolbarItem[];
}

export interface ToolboxItem {
  priority: number;
  component: Component;
  props: {
    action?: () => void;
    description?: string;
    editor: Editor;
    icon?: Component;
    title?: string;
  };
}

export interface ExtensionOptions {
  getToolbarItems?: ({
    editor,
  }: {
    editor: Editor;
  }) => ToolbarItem | ToolbarItem[];

  getToolboxItems?: ({
    editor,
  }: {
    editor: Editor;
  }) => ToolboxItem | ToolboxItem[];
}
