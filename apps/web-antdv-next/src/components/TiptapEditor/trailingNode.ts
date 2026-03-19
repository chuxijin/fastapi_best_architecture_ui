import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Extension } from '@tiptap/vue-3';

function nodeEqualsType({ types, node }: { node: any; types: any }) {
  return (
    (Array.isArray(types) && types.includes(node.type)) || node.type === types
  );
}

export const ExtensionTrailingNode = Extension.create({
  name: 'trailingNode',

  addOptions() {
    return {
      node: 'paragraph',
      notAfter: ['paragraph'],
    };
  },

  addProseMirrorPlugins() {
    const plugin = new PluginKey(this.name);
    const disabledNodes = Object.entries(this.editor.schema.nodes)
      .map(([, value]) => value)
      .filter((node) => this.options.notAfter.includes(node.name));

    const isEditable = this.editor.isEditable;

    return [
      new Plugin({
        key: plugin,
        appendTransaction: (_, __, state) => {
          if (!isEditable) return;

          const { doc, tr, schema } = state;
          const shouldInsertNodeAtEnd = plugin.getState(state);
          const endPosition = doc.content.size;
          const type = schema.nodes[this.options.node];

          if (!shouldInsertNodeAtEnd || !type) {
            return;
          }

          return tr.insert(endPosition, type.create());
        },
        state: {
          init: (_, state) => {
            if (!isEditable) return false;
            const lastNode = state.tr.doc.lastChild;
            return !nodeEqualsType({ node: lastNode, types: disabledNodes });
          },
          apply: (tr, value) => {
            if (!isEditable) return value;

            if (!tr.docChanged) {
              return value;
            }

            const lastNode = tr.doc.lastChild;
            return !nodeEqualsType({ node: lastNode, types: disabledNodes });
          },
        },
      }),
    ];
  },
});
