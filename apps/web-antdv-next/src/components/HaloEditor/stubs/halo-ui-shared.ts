import { h } from "vue";
export interface AttachmentSimple { url?: string; mediaType?: string; alt?: string; caption?: string; [key: string]: any; }
export type AttachmentLike = string | Record<string, any>;
export const utils = {
  id: { uuid: () => Math.random().toString(36).slice(2) },
  permission: { has: (..._args: any[]) => true },
  attachment: {
    convertToSimple: (attachment: AttachmentLike): AttachmentSimple | undefined => {
      if (typeof attachment === "string") return { url: attachment };
      if (!attachment) return undefined;
      return { url: attachment.status?.permalink || attachment.url || attachment.permalink, mediaType: attachment.spec?.mediaType || attachment.mediaType, alt: attachment.spec?.displayName || attachment.name || attachment.alt, caption: attachment.caption };
    },
    getUrl: (attachment: AttachmentLike): string | undefined => {
      if (typeof attachment === "string") return attachment;
      if (!attachment) return undefined;
      return attachment.status?.permalink || attachment.url || attachment.permalink;
    },
  }
};
export const stores = { globalInfo: () => ({ globalInfo: { externalUrl: '' }}) };
export const Dialog = { info: (opts: any) => { if (window.confirm(opts.description)) opts.onConfirm?.(); } };
export const AttachmentUploader = { name: "AttachmentUploader", setup(props:any, {slots}:any) { return () => h("div", null, slots.default?.()); } };
export const AttachmentSelector = { name: "AttachmentSelector", setup(props:any, {slots}:any) { return () => h("div", null, slots.default?.()); } };
