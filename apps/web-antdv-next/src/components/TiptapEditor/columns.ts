import type { NodeType, Schema } from '@tiptap/pm/model';

import type { ExtensionOptions } from './types';

import { markRaw } from 'vue';

import { Node as PMNode } from '@tiptap/pm/model';
import { EditorState, TextSelection } from '@tiptap/pm/state';
import {
  Editor,
  findParentNode,
  mergeAttributes,
  Node,
  VueNodeViewRenderer,
} from '@tiptap/vue-3';

import { ExtensionColumn } from './column';
import ColumnsView from './ColumnsView.vue';
import { IconColumns } from './icons';
import ToolboxItem from './ToolboxItem.vue';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    columns: {
      addColAfter: () => ReturnType;
      addColBefore: () => ReturnType;
      deleteCol: () => ReturnType;
      insertColumns: (attrs?: { cols: number }) => ReturnType;
    };
  }
}

const createColumns = (schema: Schema, colsCount: number) => {
  const types = getColumnsNodeTypes(schema);
  const cols = [];

  for (let index = 0; index < colsCount; index += 1) {
    const col = types.column.createAndFill({ index });

    if (col) {
      cols.push(col);
    }
  }
  return types.columns.createChecked({ cols: colsCount }, cols);
};

const getColumnsNodeTypes = (
  schema: Schema,
): {
  column: NodeType;
  columns: NodeType;
} => {
  if ((schema.cached as any).columnsNodeTypes) {
    return (schema.cached as any).columnsNodeTypes;
  }

  const columnsNode = schema.nodes.columns;
  const columnNode = schema.nodes.column;
  if (!columnsNode || !columnNode) {
    throw new Error('columns node types are not registered in schema');
  }

  const roles = {
    columns: columnsNode,
    column: columnNode,
  };

  (schema.cached as any).columnsNodeTypes = roles;

  return roles;
};

type ColOperateType = 'addAfter' | 'addBefore' | 'delete';
const addOrDeleteCol = (
  dispatch: any,
  state: EditorState,
  type: ColOperateType,
) => {
  const maybeColumns = findParentNode(
    (node) => node.type.name === ExtensionColumns.name,
  )(state.selection);
  const maybeColumn = findParentNode(
    (node) => node.type.name === ExtensionColumn.name,
  )(state.selection);

  if (dispatch && maybeColumns && maybeColumn) {
    const cols = maybeColumns.node;
    const colIndex = maybeColumn.node.attrs.index;
    const colsJSON = cols.toJSON();

    let nextIndex = colIndex;

    if (type === 'delete') {
      nextIndex = colIndex - 1;
      colsJSON.content.splice(colIndex, 1);
    } else {
      nextIndex = type === 'addBefore' ? colIndex : colIndex + 1;
      colsJSON.content.splice(nextIndex, 0, {
        type: 'column',
        attrs: {
          index: colIndex,
        },
        content: [
          {
            type: 'paragraph',
          },
        ],
      });
    }

    colsJSON.attrs.cols = colsJSON.content.length;

    colsJSON.content.forEach((colJSON: any, index: number) => {
      colJSON.attrs.index = index;
    });

    const nextCols = PMNode.fromJSON(state.schema, colsJSON);

    let nextSelectPos = maybeColumns.pos;
    nextCols.content.forEach((col: PMNode, _pos: any, index: number) => {
      if (index < nextIndex) {
        nextSelectPos += col.nodeSize;
      }
    });

    const tr = state.tr.setTime(Date.now());

    tr.replaceWith(
      maybeColumns.pos,
      maybeColumns.pos + maybeColumns.node.nodeSize,
      nextCols,
    ).setSelection(TextSelection.near(tr.doc.resolve(nextSelectPos)));

    dispatch(tr);
  }
  return true;
};

type GotoColType = 'after' | 'before';
const gotoCol = (state: EditorState, dispatch: any, type: GotoColType) => {
  const maybeColumns = findParentNode(
    (node) => node.type.name === ExtensionColumns.name,
  )(state.selection);
  const maybeColumn = findParentNode(
    (node) => node.type.name === ExtensionColumn.name,
  )(state.selection);

  if (dispatch && maybeColumns && maybeColumn) {
    const cols = maybeColumns.node;
    const colIndex = maybeColumn.node.attrs.index;

    let nextIndex = 0;

    nextIndex =
      type === 'before'
        ? (colIndex - 1 + cols.attrs.cols) % cols.attrs.cols
        : (colIndex + 1) % cols.attrs.cols;

    let nextSelectPos = maybeColumns.pos;
    cols.content.forEach((col: PMNode, _pos: any, index: number) => {
      if (index < nextIndex) {
        nextSelectPos += col.nodeSize;
      }
    });

    const tr = state.tr.setTime(Date.now());

    tr.setSelection(TextSelection.near(tr.doc.resolve(nextSelectPos)));
    dispatch(tr);
    return true;
  }

  return false;
};

export interface ExtensionColumnsOptions extends ExtensionOptions {
  HTMLAttributes: {
    class: string;
  };
}

export const ExtensionColumns = Node.create<ExtensionColumnsOptions>({
  name: 'columns',
  group: 'block',
  priority: 10,
  defining: true,
  isolating: true,
  allowGapCursor: true,

  content: 'column{1,}',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'columns',
      },
      getToolboxItems({ editor }: { editor: Editor }) {
        return [
          {
            priority: 70,
            component: markRaw(ToolboxItem),
            props: {
              editor,
              icon: markRaw(IconColumns),
              title: '分栏',
              description: '插入一个两栏布局',
              action: () => {
                editor
                  .chain()
                  .focus()
                  .insertColumns({
                    cols: 2,
                  })
                  .run();
              },
            },
          },
        ];
      },
    };
  },

  addAttributes() {
    return {
      cols: {
        default: 2,
        parseHTML: (element) => element.getAttribute('cols'),
      },
      style: {
        default: 'display: flex;width: 100%;gap: 1em;',
        parseHTML: (element) => element.getAttribute('style'),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      insertColumns:
        (attrs?: { cols: number }) =>
        ({ tr, dispatch, editor }) => {
          const node = createColumns(editor.schema, attrs?.cols || 2);

          if (dispatch) {
            const offset = tr.selection.anchor + 1;

            tr.replaceSelectionWith(node)
              .scrollIntoView()
              .setSelection(TextSelection.near(tr.doc.resolve(offset)));
          }

          return true;
        },
      addColBefore:
        () =>
        ({ dispatch, state }) => {
          return addOrDeleteCol(dispatch, state, 'addBefore');
        },
      addColAfter:
        () =>
        ({ dispatch, state }) => {
          return addOrDeleteCol(dispatch, state, 'addAfter');
        },
      deleteCol:
        () =>
        ({ dispatch, state }) => {
          return addOrDeleteCol(dispatch, state, 'delete');
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Alt-G': () => this.editor.commands.insertColumns(),
      Tab: () => {
        return gotoCol(this.editor.state, this.editor.view.dispatch, 'after');
      },
      'Shift-Tab': () => {
        return gotoCol(this.editor.state, this.editor.view.dispatch, 'before');
      },
    };
  },
  addNodeView() {
    return VueNodeViewRenderer(ColumnsView as any);
  },
  addExtensions() {
    return [ExtensionColumn];
  },
});
