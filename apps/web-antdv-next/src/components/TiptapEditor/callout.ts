import type { Editor } from '@tiptap/vue-3';

import { markRaw } from 'vue';

import { mergeAttributes, Node, VueNodeViewRenderer } from '@tiptap/vue-3';

import CalloutComponent from './CalloutComponent.vue';
import { IconCallout } from './icons';
import ToolboxItem from './ToolboxItem.vue';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (attributes?: { backgroundColor?: string }) => ReturnType;
      toggleCallout: (attributes?: { backgroundColor?: string }) => ReturnType;
    };
  }
}

export const ExtensionCallout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  allowGapCursor: true,

  addOptions() {
    return {
      getToolboxItems({ editor }: { editor: Editor }) {
        return [
          {
            priority: 80,
            component: markRaw(ToolboxItem),
            props: {
              editor,
              icon: markRaw(IconCallout),
              title: '提示框',
              description: '插入一个多彩信息提示框',
              action: () => {
                editor.chain().focus().toggleCallout().run();
              },
            },
          },
        ];
      },
    };
  },

  addAttributes() {
    return {
      backgroundColor: {
        default: '#fffbeb', // 默认黄色
        parseHTML: (element: any) =>
          element.dataset.bgColor || element.style.backgroundColor || '#fffbeb',
        renderHTML: (attributes: any) => {
          return {
            'data-bg-color': attributes.backgroundColor,
            style: `background-color: ${attributes.backgroundColor}`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }: any) {
    return [
      'div',
      mergeAttributes(
        { 'data-type': 'callout', class: 'editor-callout-block' },
        HTMLAttributes,
      ),
      0,
    ];
  },

  addNodeView() {
    return VueNodeViewRenderer(CalloutComponent);
  },

  addCommands() {
    return {
      setCallout:
        (attributes?: any) =>
        ({ commands }: any) => {
          return commands.wrapIn(this.name, attributes);
        },
      toggleCallout:
        (attributes?: any) =>
        ({ commands }: any) => {
          return commands.toggleWrap(this.name, attributes);
        },
    };
  },
});
