import type { Component, InjectionKey } from "vue";
import type { Attachment, UploadRequestConfig } from "@HaloEditor/utils/upload";

export interface EditorConfig {
  /**
   * 上传文件函数
   *
   * 宿主应用实现此函数来处理文件上传，返回 Attachment 对象。
   * 此函数会作为 image / video / audio / gallery 的全局默认上传实现。
   * 若单独在 ExtensionsKit.configure({ image: { uploadImage } }) 中指定，
   * 则优先使用 extension 级别的配置。
   */
  upload?: (file: File, options?: UploadRequestConfig) => Promise<Attachment>;

  /**
   * 附件选择器组件
   *
   * 提供后会在编辑器中显示「从附件库选择」按钮。
   * 组件需接收 props: { accepts: string[], min: number, max: number }
   * 并 emit: { select: (attachments: any[]) => void, close: () => void }
   */
  attachmentSelector?: Component;

  /**
   * 权限检查函数
   *
   * 默认返回 true（不做权限检查）。
   * 传入 false 可隐藏所有需要权限的操作按钮。
   */
  permissionCheck?: (...args: any[]) => boolean;
}

export const editorConfigKey: InjectionKey<EditorConfig> = Symbol("editorConfig");

export { type Attachment, type UploadRequestConfig } from "@HaloEditor/utils/upload";
