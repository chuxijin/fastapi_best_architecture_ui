import TiptapTextAlign, {
  type TextAlignOptions,
} from "@tiptap/extension-text-align";
import type { ExtensionOptions } from "#/components/JiaEditor/types";

export type ExtensionTextAlignOptions = ExtensionOptions &
  Partial<TextAlignOptions>;

export const ExtensionTextAlign =
  TiptapTextAlign.extend<ExtensionTextAlignOptions>().configure({
    types: ["heading", "paragraph"],
  });

