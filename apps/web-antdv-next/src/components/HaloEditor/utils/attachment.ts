import { Editor, generateJSON, type Content } from "@HaloEditor/tiptap";

export interface AttachmentSimple {
  url?: string;
  mediaType?: string;
  alt?: string;
  caption?: string;
}

export type AttachmentLike = string | Record<string, any>;

function convertToSimple(attachment: AttachmentLike): AttachmentSimple | null {
  if (typeof attachment === "string") return null;
  if (!attachment) return null;
  return {
    url: attachment.status?.permalink || attachment.url || attachment.permalink,
    mediaType: attachment.spec?.mediaType || attachment.mediaType,
    alt: attachment.spec?.displayName || attachment.name || attachment.alt,
    caption: attachment.caption,
  };
}

export function convertToMediaContents(
  editor: Editor,
  attachments: AttachmentLike[]
): Content[] {
  return attachments
    .map((attachment) => {
      if (typeof attachment === "string") {
        return {
          type: "image",
          attrs: {
            src: attachment,
          },
        };
      }

      const attachmentSimple = convertToSimple(attachment);

      if (!attachmentSimple) {
        return;
      }

      const { mediaType, alt, url, caption } = attachmentSimple;

      if (mediaType?.startsWith("image/")) {
        return createFigureContent(editor, {
          contentType: "image",
          url,
          alt,
          caption,
        });
      }

      if (mediaType?.startsWith("video/")) {
        return createFigureContent(editor, {
          contentType: "video",
          url,
          caption,
        });
      }

      if (mediaType?.startsWith("audio/")) {
        return createFigureContent(editor, {
          contentType: "audio",
          url,
          caption,
        });
      }

      return {
        type: "text",
        marks: [
          {
            type: "link",
            attrs: {
              href: url,
            },
          },
        ],
        text: alt || url,
      };
    })
    .filter(Boolean) as Content[];
}

function createFigureContent(
  editor: Editor,
  {
    contentType,
    url,
    alt,
    caption,
  }: {
    contentType: "image" | "video" | "audio";
    url?: string;
    alt?: string;
    caption?: string;
  }
) {
  const baseContent: Content = {
    type: "figure",
    attrs: {
      contentType,
    },
    content: [
      {
        type: contentType,
        attrs: {
          src: url,
          alt,
        },
      },
    ],
  };

  if (caption) {
    const captionContent = generateJSON(
      caption,
      editor.extensionManager.extensions
    );
    baseContent.content?.push({
      type: "figureCaption",
      content: captionContent.content[0].content,
    });
  }

  return baseContent;
}
