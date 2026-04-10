import type { AnyExtension } from "@tiptap/core";
import type { PluginModule } from "./types";

/**
 * 从已加载的插件模块中收集编辑器扩展
 *
 * :param pluginModules: 已加载的插件模块列表
 * :return:
 */
export async function collectEditorExtensions(
  pluginModules: PluginModule[],
): Promise<AnyExtension[]> {
  const extensions: AnyExtension[] = [];

  for (const module of pluginModules) {
    try {
      const fn =
        module?.extensionPoints?.["default:editor:extension:create"];

      if (typeof fn !== "function") {
        continue;
      }

      const exts = await fn();
      extensions.push(...exts);
    } catch (e) {
      console.error("[Plugin] Failed to collect extensions:", e);
    }
  }

  return extensions;
}
