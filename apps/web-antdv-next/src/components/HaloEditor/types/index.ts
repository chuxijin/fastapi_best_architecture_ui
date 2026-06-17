/* eslint-disable @typescript-eslint/no-invalid-void-type */
import type {
  arrow,
  autoPlacement,
  flip,
  hide,
  inline,
  offset,
  shift,
  size,
  VirtualElement,
} from '@floating-ui/dom';
import type {
  Editor,
  EditorState,
  EditorView,
  PluginKey,
  PMNode,
  Range,
  ResolvedPos,
} from '@HaloEditor/tiptap';

import type { Component } from 'vue';

export interface ToolbarItemType {
  priority: number;
  component: Component;
  props: Omit<ToolbarItemComponentProps, 'children'> & Record<string, unknown>;
  children?: ToolbarItemType[];
}

export interface ToolbarItemComponentProps {
  editor: Editor;
  isActive: boolean;
  disabled?: boolean;
  icon?: Component;
  title?: string;
  action?: () => void;
  children?: ToolbarItemType[];
}

export interface BubbleMenuOptions {
  strategy?: 'absolute' | 'fixed';
  placement?:
    | 'bottom'
    | 'bottom-end'
    | 'bottom-start'
    | 'left'
    | 'left-end'
    | 'left-start'
    | 'right'
    | 'right-end'
    | 'right-start'
    | 'top'
    | 'top-end'
    | 'top-start';
  offset?: boolean | Parameters<typeof offset>[0];
  flip?: boolean | Parameters<typeof flip>[0];
  shift?: boolean | Parameters<typeof shift>[0];
  arrow?: false | Parameters<typeof arrow>[0];
  size?: boolean | Parameters<typeof size>[0];
  autoPlacement?: boolean | Parameters<typeof autoPlacement>[0];
  hide?: boolean | Parameters<typeof hide>[0];
  inline?: boolean | Parameters<typeof inline>[0];
  onShow?: () => void;
  onHide?: () => void;
  onUpdate?: () => void;
  onDestroy?: () => void;
  /**
   * The scrollable element that should be listened to when updating the position of the bubble menu.
   * If not provided, the window will be used.
   * @type {HTMLElement | Window}
   */
  scrollTarget?: HTMLElement | Window;
}

export interface DragButtonItemProps {
  extendsKey?: string;
  priority?: number;
  title?:
    | (({
        editor,
        node,
        pos,
      }: {
        editor: Editor;
        node: null | PMNode;
        pos: number;
      }) => string)
    | string;
  icon?: Component;
  key?: string;
  action?: ({
    editor,
    node,
    pos,
    close,
  }: {
    close: () => void;
    editor: Editor;
    node: null | PMNode;
    pos: number;
  }) => boolean | Component | Promise<boolean | Component | void> | void;
  iconStyle?: string;
  class?: string;
  visible?: ({
    editor,
    node,
    pos,
  }: {
    editor: Editor;
    node: null | PMNode;
    pos: number;
  }) => boolean;
  isActive?: ({
    editor,
    node,
    pos,
  }: {
    editor: Editor;
    node: null | PMNode;
    pos: number;
  }) => boolean;
  disabled?: ({
    editor,
    node,
    pos,
  }: {
    editor: Editor;
    node: null | PMNode;
    pos: number;
  }) => boolean;
  keyboard?: string;
  component?: Component;
  [key: string]: unknown;
}
export interface DragButtonType extends DragButtonItemProps {
  children?: {
    component?: Component;
    items?: DragButtonItemProps[];
  };
}

export interface BubbleMenuProps {
  pluginKey?: PluginKey | string;
  editor?: Editor;
  shouldShow?: (props: {
    editor: Editor;
    element: HTMLElement;
    from: number;
    oldState?: EditorState;
    state: EditorState;
    to: number;
    view: EditorView;
  }) => boolean;
  appendTo?: (() => HTMLElement) | HTMLElement | undefined;
  getReferencedVirtualElement?: () => null | VirtualElement;
  options?: BubbleMenuOptions | null;
}

export interface NodeBubbleMenuType extends BubbleMenuProps {
  component?: Component;
  items?: BubbleItemType[];
  extendsKey?: PluginKey | string;
}

export interface BubbleItemType {
  priority: number;
  component?: Component;
  key?: string;
  props?: Omit<BubbleItemComponentProps, 'editor'> & Record<string, unknown>;
}

export interface BubbleItemComponentProps {
  editor: Editor;
  isActive?: ({ editor }: { editor: Editor }) => boolean;
  visible?: ({ editor }: { editor: Editor }) => boolean;
  icon?: Component;
  iconStyle?: string;
  title?: string;
  action?: ({ editor }: { editor: Editor }) => boolean | Component | void;
}

export interface ToolboxItemType {
  priority: number;
  component: Component;
  props: Record<string, unknown> & ToolboxItemComponentProps;
}

export interface ToolboxItemComponentProps {
  editor: Editor;
  icon?: Component;
  title?: string;
  description?: string;
  action?: () => void;
}

export interface ExtensionOptions {
  getToolbarItems?: ({
    editor,
  }: {
    editor: Editor;
  }) => ToolbarItemType | ToolbarItemType[];

  getCommandMenuItems?: () => CommandMenuItemType | CommandMenuItemType[];

  getBubbleMenu?: ({ editor }: { editor: Editor }) => NodeBubbleMenuType;

  getToolboxItems?: ({
    editor,
  }: {
    editor: Editor;
  }) => ToolboxItemType | ToolboxItemType[];

  getDraggableMenuItems?: ({
    editor,
  }: {
    editor: Editor;
  }) => DragButtonType | DragButtonType[];
}

export interface CommandMenuItemType {
  priority: number;
  icon: Component;
  title: string;
  keywords: string[];
  command: ({ editor, range }: { editor: Editor; range: Range }) => void;
}

export interface DragSelectionNodeType {
  $pos?: ResolvedPos;
  node?: PMNode;
  el: HTMLElement;
  nodeOffset?: number;
  dragDomOffset?: {
    x?: number;
    y?: number;
  };
}
