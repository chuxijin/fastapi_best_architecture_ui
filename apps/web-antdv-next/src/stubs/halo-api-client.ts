/**
 * @halo-dev/api-client 的轻量级 stub
 *
 * 编辑器中附件上传相关功能使用了 ucApiClient，
 * 在脱离 Halo 后端的环境下提供空实现。
 */

export const ucApiClient = {
  storage: {
    attachment: {
      uploadAttachmentForUc: async (payload: { file?: File; url?: string }) => {
        const permalink = payload.file
          ? URL.createObjectURL(payload.file)
          : payload.url || '';
        const displayName = payload.file?.name || payload.url || '资源文件';
        const mediaType = payload.file?.type || 'application/octet-stream';
        const size = payload.file?.size || 0;

        return {
          data: {
            spec: {
              displayName,
              mediaType,
              size,
            },
            status: {
              permalink,
            },
          },
        };
      },
    },
  },
};

export interface Attachment {
  metadata: { name: string };
  spec: {
    displayName: string;
    mediaType: string;
    size: number;
  };
  status?: {
    permalink: string;
  };
}

export default {};
