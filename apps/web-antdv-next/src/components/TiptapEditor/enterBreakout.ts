import type { Editor } from '@tiptap/core';

import { TextSelection } from '@tiptap/pm/state';
import { Extension } from '@tiptap/vue-3';

/**
 * 增强 Enter 键行为，参考 Halo 的 gap-cursor 处理：
 * 1. GapCursor 上回车 → 插入真实空行
 * 2. 光标在块级容器（callout/columns/table 等）最开头 → 在容器前面插空行
 *
 * ArrowUp / ArrowLeft 在文档开头的块级容器前自动插入段落
 */

const CONTAINER_TYPES = new Set(['callout', 'column', 'columns', 'table']);
const FIRST_BLOCK_TYPES = new Set([
  'callout',
  'codeBlock',
  'columns',
  'horizontalRule',
  'table',
]);

/** 独立函数：在文档开头块级容器前插段落 */
function handleArrowAtDocStart(editor: Editor): boolean {
  const { state } = editor;
  const { selection, doc, schema } = state;
  const { $from, empty } = selection;

  if (!empty) return false;

  const firstChild = doc.firstChild;
  if (!firstChild) return false;
  if (!FIRST_BLOCK_TYPES.has(firstChild.type.name)) return false;

  const paragraphType = schema.nodes.paragraph;
  if (!paragraphType) return false;

  // 光标在第一个块内的最开始位置
  if ($from.pos <= firstChild.nodeSize && $from.parentOffset === 0) {
    const tr = state.tr.insert(0, paragraphType.create());
    tr.setSelection(TextSelection.create(tr.doc, 1));
    editor.view.dispatch(tr);
    return true;
  }

  return false;
}

export const ExtensionEnterBreakout = Extension.create({
  name: 'enterBreakout',
  priority: 200,

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { state } = this.editor;
        const { selection, tr, schema } = state;

        // 1. GapCursor 回车 → 插入真实空行
        if (
          selection.constructor.name === 'GapCursorSelection' ||
          (selection as any).toJSON?.()?.type === 'gapcursor'
        ) {
          const pos = selection.$from.pos;
          const paragraphType = schema.nodes.paragraph;
          if (!paragraphType) return false;
          const node = paragraphType.create();
          tr.insert(pos, node);
          tr.setSelection(TextSelection.create(tr.doc, pos + 1));
          this.editor.view.dispatch(tr);
          return true;
        }

        // 2. 光标在块级容器最开头 → 在容器前面插空行
        const { $from, empty } = selection;
        if (!empty) return false;

        for (let d = $from.depth - 1; d > 0; d--) {
          const node = $from.node(d);
          if (CONTAINER_TYPES.has(node.type.name)) {
            if ($from.parentOffset === 0 && $from.index(d) === 0) {
              const posBefore = $from.before(d);
              this.editor
                .chain()
                .insertContentAt(posBefore, { type: 'paragraph' })
                .focus(posBefore + 1)
                .run();
              return true;
            }
            break;
          }
        }

        return false;
      },

      ArrowUp: () => handleArrowAtDocStart(this.editor),
      ArrowLeft: () => handleArrowAtDocStart(this.editor),
    };
  },
});
