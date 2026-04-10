import TiptapStrike, { type StrikeOptions } from "@tiptap/extension-strike";
import { markRaw } from "vue";
import MingcuteStrikethroughLine from "~icons/mingcute/strikethrough-line";
import ToolbarItem from "@HaloEditor/components/toolbar/ToolbarItem.vue";
import { i18n } from "@HaloEditor/locales";
import type { Editor } from "@HaloEditor/tiptap";
import type { ExtensionOptions } from "@HaloEditor/types";

export type ExtensionStrikeOptions = ExtensionOptions & Partial<StrikeOptions>;

export const ExtensionStrike = TiptapStrike.extend<ExtensionStrikeOptions>({
  addOptions() {
    return {
      ...this.parent?.(),
      getToolbarItems({ editor }: { editor: Editor }) {
        return {
          priority: 70,
          component: markRaw(ToolbarItem),
          props: {
            editor,
            isActive: editor.isActive(TiptapStrike.name),
            icon: markRaw(MingcuteStrikethroughLine),
            title: i18n.global.t("editor.common.strike"),
            action: () => editor.chain().focus().toggleStrike().run(),
          },
        };
      },
    };
  },
});
