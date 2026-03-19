import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Extension } from '@tiptap/vue-3';

function nodeEqualsType({ types, node }: { node: any; types: any }) {
  if (!node) return false;
  return (
    (Array.isArray(types) && types.includes(node.type)) || node.type === types
  );
}

export const ExtensionLeadingNode = Extension.create({
  name: 'leadingNode',

  addOptions() {
    return {
      node: 'paragraph',
      notBefore: [
        'paragraph',
        'heading',
        'bulletList',
        'orderedList',
        'taskList',
        'blockquote',
        'codeBlock',
      ],
    };
  },

  addProseMirrorPlugins() {
    const plugin = new PluginKey(this.name);
    const disabledNodes = Object.entries(this.editor.schema.nodes)
      .map(([, value]) => value)
      .filter((node) => this.options.notBefore.includes(node.name));

    const isEditable = this.editor.isEditable;

    return [
      new Plugin({
        key: plugin,
        appendTransaction: (_, __, state) => {
          if (!isEditable) return;

          const { tr, schema } = state;
          const shouldInsertNodeAtStart = plugin.getState(state);
          const type = schema.nodes[this.options.node];

          if (!shouldInsertNodeAtStart || !type) {
            return;
          }

          return tr.insert(0, type.create());
        },
        state: {
          init: (_, state) => {
            if (!isEditable) return false;
            const firstNode = state.tr.doc.firstChild;
            return !nodeEqualsType({ node: firstNode, types: disabledNodes });
          },
          apply: (tr, value) => {
            if (!isEditable) return value;

            if (!tr.docChanged) {
              return value;
            }

            const firstNode = tr.doc.firstChild;
            return !nodeEqualsType({ node: firstNode, types: disabledNodes });
          },
        },
      }),
    ];
  },
});
