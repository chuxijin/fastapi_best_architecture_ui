import type { Editor } from '@tiptap/vue-3';

import type { ExtensionOptions } from './types';

import { markRaw } from 'vue';

import { mergeAttributes, Node, VueNodeViewRenderer } from '@tiptap/vue-3';

import BlockMathView from './BlockMathView.vue';
import { iconifyIcon } from './icons';
import ToolboxItem from './ToolboxItem.vue';

const IconBlockMath = iconifyIcon('lucide:square-sigma');

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blockMath: {
      insertBlockMath: (attrs?: { latex: string }) => ReturnType;
    };
  }
}

export interface BlockMathOptions extends ExtensionOptions {
  HTMLAttributes: Record<string, any>;
}

export const ExtensionBlockMath = Node.create<BlockMathOptions>({
  name: 'blockMath',
  group: 'block',
  atom: true,
  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      getToolboxItems({ editor }: { editor: Editor }) {
        return [
          {
            priority: 85,
            component: markRaw(ToolboxItem),
            props: {
              editor,
              icon: markRaw(IconBlockMath),
              title: '块级公式',
              description: '插入独占一行的 LaTeX 公式',
              action: () => {
                editor.chain().focus().insertBlockMath({ latex: '' }).run();
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
    return [{ tag: 'div[data-type="block-math"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'block-math',
        'data-latex': HTMLAttributes.latex || '',
        style: 'text-align: center; padding: 12px 0;',
      }),
      HTMLAttributes.latex || '',
    ];
  },

  addCommands() {
    return {
      insertBlockMath:
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
    return VueNodeViewRenderer(BlockMathView as any);
  },
});
