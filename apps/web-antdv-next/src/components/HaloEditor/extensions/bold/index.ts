import TiptapBold, { type BoldOptions } from "@tiptap/extension-bold";
import { markRaw } from "vue";
import MingcuteBoldLine from "~icons/mingcute/bold-line";
import ToolbarItem from "@HaloEditor/components/toolbar/ToolbarItem.vue";
import { i18n } from "@HaloEditor/locales";
import type { Editor } from "@HaloEditor/tiptap";
import type { ExtensionOptions } from "@HaloEditor/types";

export type ExtensionBoldOptions = Partial<BoldOptions> & ExtensionOptions;

export const ExtensionBold = TiptapBold.extend<ExtensionBoldOptions>({
  addOptions() {
    return {
      ...this.parent?.(),
      getToolbarItems({ editor }: { editor: Editor }) {
        return {
          priority: 40,
          component: markRaw(ToolbarItem),
          props: {
            editor,
            isActive: editor.isActive(TiptapBold.name),
            icon: markRaw(MingcuteBoldLine),
            title: i18n.global.t("editor.common.bold"),
            action: () => {
              editor.chain().focus().toggleBold().run();
            },
          },
        };
      },
    };
  },
});
