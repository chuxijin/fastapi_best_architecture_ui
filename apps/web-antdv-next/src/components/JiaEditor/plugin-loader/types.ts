import type { AnyExtension } from "@tiptap/core";

export interface PluginExtensionPoint {
  "default:editor:extension:create"?: () =>
    | AnyExtension[]
    | Promise<AnyExtension[]>;
  [key: string]: ((...args: any[]) => any) | undefined;
}

export interface PluginModule {
  extensionPoints?: PluginExtensionPoint;
  components?: Record<string, any>;
  routes?: any[];
}

export interface PluginConfig {
  /** 插件名（对应 plugin.yaml 的 metadata.name） */
  name: string;
  /** 插件 JS 入口 URL（相对或绝对路径） */
  entry: string;
  /** 插件 CSS 的 URL（可选） */
  stylesheet?: string;
}
