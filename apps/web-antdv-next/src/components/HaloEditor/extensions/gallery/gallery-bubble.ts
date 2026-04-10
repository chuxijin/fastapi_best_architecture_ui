import type { Attachment, UploadRequestConfig } from "@HaloEditor/utils/upload";
import { markRaw } from "vue";
import MdiImagePlus from "~icons/mdi/image-plus";
import { i18n } from "@HaloEditor/locales";
import { Extension } from "@HaloEditor/tiptap";
import type { ExtensionOptions } from "@HaloEditor/types";
import { GALLERY_BUBBLE_MENU_KEY } from ".";
import BubbleItemAddImage from "./BubbleItemAddImage.vue";

export type ExtensionGalleryBubbleOptions = ExtensionOptions & {
  uploadImage?: (
    file: File,
    options?: UploadRequestConfig
  ) => Promise<Attachment>;
};

export const ExtensionGalleryBubble =
  Extension.create<ExtensionGalleryBubbleOptions>({
    name: "gallery-bubble",
    addOptions() {
      const { parent } = this;
      return {
        ...parent?.(),
        uploadImage: undefined,
        getBubbleMenu: () => {
          return {
            extendsKey: GALLERY_BUBBLE_MENU_KEY,
            items: [
              {
                priority: 10,
                component: markRaw(BubbleItemAddImage),
                key: "add-image",
                props: {
                  icon: markRaw(MdiImagePlus),
                  title: i18n.global.t("editor.extensions.gallery.add_image"),
                },
              },
            ],
          };
        },
      };
    },
  });
