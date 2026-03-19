import type { Editor } from '@tiptap/vue-3';

import type { ExtensionOptions } from './types';

import { markRaw } from 'vue';

import { mergeAttributes, Node, VueNodeViewRenderer } from '@tiptap/vue-3';

import { iconifyIcon } from './icons';
import InlineMathView from './InlineMathView.vue';
import ToolboxItem from './ToolboxItem.vue';

const IconMath = iconifyIcon('lucide:sigma');

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    inlineMath: {
      insertInlineMath: (attrs?: { latex: string }) => ReturnType;
    };
  }
}

export interface InlineMathOptions extends ExtensionOptions {
  HTMLAttributes: Record<string, any>;
}

export const ExtensionInlineMath = Node.create<InlineMathOptions>({
  name: 'inlineMath',
  group: 'inline',
  inline: true,
  atom: true, // 作为原子节点，不可被光标进入

  addOptions() {
    return {
      HTMLAttributes: {},
      getToolboxItems({ editor }: { editor: Editor }) {
        return [
          {
            priority: 80,
            component: markRaw(ToolboxItem),
            props: {
              editor,
              icon: markRaw(IconMath),
              title: '行内公式',
              description: '插入 LaTeX 行内数学公式',
              action: () => {
                editor.chain().focus().insertInlineMath({ latex: '' }).run();
              },
            },
          },
        ];
      },
    };
  },

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: (element) =>
          element.dataset.latex || element.textContent || '',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="inline-math"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'inline-math',
        'data-latex': HTMLAttributes.latex || '',
      }),
      HTMLAttributes.latex || '',
    ];
  },

  addCommands() {
    return {
      insertInlineMath:
        (attrs) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: { latex: attrs?.latex || '' },
            })
            .run();
        },
    };
  },

  addNodeView() {
    return VueNodeViewRenderer(InlineMathView as any, { as: 'span' } as any);
  },
});
