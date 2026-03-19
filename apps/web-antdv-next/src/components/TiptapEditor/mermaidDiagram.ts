import type { Editor } from '@tiptap/vue-3';

import type { ExtensionOptions } from './types';

import { markRaw } from 'vue';

import { mergeAttributes, Node, VueNodeViewRenderer } from '@tiptap/vue-3';

import { iconifyIcon } from './icons';
import MermaidView from './MermaidView.vue';
import ToolboxItem from './ToolboxItem.vue';

const IconMermaid = iconifyIcon('lucide:workflow');

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mermaidDiagram: {
      insertMermaid: (attrs?: { code: string }) => ReturnType;
    };
  }
}

export interface MermaidOptions extends ExtensionOptions {
  HTMLAttributes: Record<string, any>;
}

export const ExtensionMermaid = Node.create<MermaidOptions>({
  name: 'mermaidDiagram',
  group: 'block',
  atom: true,
  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      getToolboxItems({ editor }: { editor: Editor }) {
        return [
          {
            priority: 90,
            component: markRaw(ToolboxItem),
            props: {
              editor,
              icon: markRaw(IconMermaid),
              title: 'Mermaid 绘图',
              description: '流程图、思维导图、时序图等',
              action: () => {
                editor.chain().focus().insertMermaid({ code: '' }).run();
              },
            },
          },
        ];
      },
    };
  },

  addAttributes() {
    return {
      code: {
        default: '',
        parseHTML: (element) =>
          element.dataset.code || element.textContent || '',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="mermaid-diagram"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'mermaid-diagram',
        'data-code': HTMLAttributes.code || '',
        class: 'mermaid',
      }),
      HTMLAttributes.code || '',
    ];
  },

  addCommands() {
    return {
      insertMermaid:
        (attrs) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: { code: attrs?.code || '' },
            })
            .run();
        },
    };
  },

  addNodeView() {
    return VueNodeViewRenderer(MermaidView as any);
  },
});
