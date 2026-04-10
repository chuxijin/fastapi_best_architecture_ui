import TiptapSuperscript, {
  type SuperscriptExtensionOptions,
} from "@tiptap/extension-superscript";
import { markRaw } from "vue";
import PhTextSuperscript from "~icons/ph/text-superscript";
import ToolbarItem from "#/components/JiaEditor/components/toolbar/ToolbarItem.vue";
import { i18n } from "#/components/JiaEditor/locales";
import type { Editor } from "#/components/JiaEditor/tiptap";
import type { ExtensionOptions } from "#/components/JiaEditor/types";

export type ExtensionSuperscriptOptions = Partial<SuperscriptExtensionOptions> &
  ExtensionOptions;

export const ExtensionSuperscript =
  TiptapSuperscript.extend<ExtensionSuperscriptOptions>({
    addOptions() {
      return {
        ...this.parent?.(),
        getToolbarItems({ editor }: { editor: Editor }) {
          return {
            priority: 110,
            component: markRaw(ToolbarItem),
            props: {
              editor,
              isActive: editor.isActive(TiptapSuperscript.name),
              icon: markRaw(PhTextSuperscript),
              title: i18n.global.t("editor.common.superscript"),
              action: () => editor.chain().focus().toggleSuperscript().run(),
            },
          };
        },
      };
    },
  });

