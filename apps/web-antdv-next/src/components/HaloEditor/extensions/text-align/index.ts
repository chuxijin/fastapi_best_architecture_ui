import type { ExtensionOptions } from '@HaloEditor/types';
import type { TextAlignOptions } from '@tiptap/extension-text-align';

import TiptapTextAlign from '@tiptap/extension-text-align';

export type ExtensionTextAlignOptions = ExtensionOptions &
  Partial<TextAlignOptions>;

export const ExtensionTextAlign =
  TiptapTextAlign.extend<ExtensionTextAlignOptions>().configure({
    types: ['heading', 'paragraph'],
  });
