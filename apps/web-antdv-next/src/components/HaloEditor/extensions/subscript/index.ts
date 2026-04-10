import TiptapSubscript, {
  type SubscriptExtensionOptions,
} from "@tiptap/extension-subscript";
import { markRaw } from "vue";
import PhTextSubscript from "~icons/ph/text-subscript";
import ToolbarItem from "@HaloEditor/components/toolbar/ToolbarItem.vue";
import { i18n } from "@HaloEditor/locales";
import type { Editor } from "@HaloEditor/tiptap";
import type { ExtensionOptions } from "@HaloEditor/types";

export type ExtensionSubscriptOptions = Partial<SubscriptExtensionOptions> &
  ExtensionOptions;

export const ExtensionSubscript =
  TiptapSubscript.extend<ExtensionSubscriptOptions>({
    addOptions() {
      return {
        ...this.parent?.(),
        getToolbarItems({ editor }: { editor: Editor }) {
          return {
            priority: 120,
            component: markRaw(ToolbarItem),
            props: {
              editor,
              isActive: editor.isActive(TiptapSubscript.name),
              icon: markRaw(PhTextSubscript),
              title: i18n.global.t("editor.common.subscript"),
              action: () => editor.chain().focus().toggleSubscript().run(),
            },
          };
        },
      };
    },
  });
