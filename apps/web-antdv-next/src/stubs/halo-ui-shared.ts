/**
 * @halo-dev/ui-shared 的轻量级 stub
 *
 * 编辑器使用了 utils（附件工具）、stores（Pinia 存储）、definePlugin。
 * 提供空实现，附件/上传功能在脱离 Halo 后将不可用。
 */

export interface AttachmentLike {
  url: string;
  type: string;
}

export interface AttachmentSimple {
  alt?: string;
  caption?: string;
  name: string;
  permalink: string;
  size: number;
  mediaType: string;
  url: string;
}

function toSimpleAttachment(attachment: any): AttachmentSimple | null {
  if (!attachment) {
    return null;
  }

  if (typeof attachment === 'string') {
    return {
      alt: '资源文件',
      caption: '',
      name: '资源文件',
      permalink: attachment,
      size: 0,
      mediaType: '',
      url: attachment,
    };
  }

  const permalink =
    attachment.url ||
    attachment.permalink ||
    attachment.status?.permalink ||
    attachment.spec?.url ||
    '';

  return {
    alt: attachment.alt || attachment.spec?.displayName || attachment.metadata?.name || '',
    caption: attachment.caption || '',
    name:
      attachment.alt ||
      attachment.name ||
      attachment.spec?.displayName ||
      attachment.metadata?.name ||
      '资源文件',
    permalink,
    size: attachment.size || attachment.spec?.size || 0,
    mediaType: attachment.type || attachment.mediaType || attachment.spec?.mediaType || '',
    url: permalink,
  };
}

export const utils = {
  attachment: {
    convertToSimple: (attachment: any) => toSimpleAttachment(attachment),
    getAttachmentUrl: (attachment: any) => attachment?.status?.permalink || attachment?.permalink || attachment?.url || '',
    getUrl: (attachment: any) => attachment?.status?.permalink || attachment?.permalink || attachment?.url || '',
    isImage: (mediaType: string) => mediaType?.startsWith('image/'),
    isVideo: (mediaType: string) => mediaType?.startsWith('video/'),
    isAudio: (mediaType: string) => mediaType?.startsWith('audio/'),
  },
  id: {
    uuid: () =>
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  },
  permission: {
    has: () => true,
  },
};

export const stores = {
  useAttachmentSelect: () => ({
    onSelect: () => {},
  }),
  globalInfo: () => ({
    globalInfo: {
      externalUrl: typeof window === 'undefined' ? '' : window.location.origin,
    },
  }),
};

export function definePlugin<T>(plugin: T): T {
  return plugin;
}

export default {};
