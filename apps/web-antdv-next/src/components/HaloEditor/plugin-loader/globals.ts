import * as Vue from "vue";
import type { PluginModule } from "./types";

/**
 * 注入插件运行时所需的全局变量
 *
 * 插件构建产物是 IIFE 格式，通过 window 全局变量访问宿主依赖。
 * 在加载插件之前必须调用此函数。
 *
 * :param editorExports: 编辑器的导出对象（import * as RTE from "@halo-dev/richtext-editor"）
 * :param extras: 额外需要注入到 window 的全局变量
 * :return:
 */
export function injectPluginGlobals(
  editorExports: Record<string, any>,
  extras?: Record<string, any>,
): void {
  const globals = window as any;

  // Vue — 所有插件都需要
  if (!globals.Vue) {
    globals.Vue = Vue;
  }

  // RichTextEditor — 编辑器插件需要（如 Node.create, Extension.create 等）
  if (!globals.RichTextEditor) {
    globals.RichTextEditor = editorExports;
  }

  // HaloUiShared — 提供 definePlugin 等基础函数
  // definePlugin 实际上只是 (plugin) => plugin 的透传函数
  if (!globals.HaloUiShared) {
    globals.HaloUiShared = {
      definePlugin: (plugin: PluginModule) => plugin,
    };
  }

  // HaloComponents — 部分插件可能引用 #/stubs/halo-components
  // 提供空对象作为 fallback，避免报错
  if (!globals.HaloComponents) {
    globals.HaloComponents = {};
  }

  // HaloApiClient — 部分插件可能引用 @halo-dev/api-client
  if (!globals.HaloApiClient) {
    globals.HaloApiClient = {};
  }

  // 注入额外的全局变量
  if (extras) {
    for (const [key, value] of Object.entries(extras)) {
      globals[key] = value;
    }
  }
}
