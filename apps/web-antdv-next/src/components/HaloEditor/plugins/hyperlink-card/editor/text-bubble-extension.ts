import type { ExtensionOptions, NodeBubbleMenuType } from '../../..';

import { markRaw } from 'vue';

import {
  Editor,
  Extension,
  ExtensionLink,
  isActive,
  TEXT_BUBBLE_MENU_KEY,
} from '../../..';
import TextExtensionMenuItem from '../components/TextExtensionMenuItem.vue';
import linkViewTypes from './link-view-type';

const TextBubbleExtension = Extension.create<ExtensionOptions>({
  name: 'textHyperlinkCardExtension',

  addOptions() {
    return {
      getBubbleMenu(): NodeBubbleMenuType {
        return {
          extendsKey: TEXT_BUBBLE_MENU_KEY,
          items: [
            {
              priority: 115,
              component: markRaw(TextExtensionMenuItem),
              props: {
                type: () => {
                  return linkViewTypes[0];
                },
                visible: ({ editor }: { editor: Editor }) => {
                  return isActive(editor.state, ExtensionLink.name);
                },
              },
            },
          ],
        };
      },
    };
  },
});

export default TextBubbleExtension;
