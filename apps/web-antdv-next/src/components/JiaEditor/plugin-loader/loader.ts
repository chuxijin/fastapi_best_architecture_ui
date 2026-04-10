import type { PluginConfig, PluginModule } from "./types";

/**
 * 加载远程 JS 脚本
 *
 * :param url: JS 文件 URL
 * :return:
 */
function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    document.head.appendChild(script);
  });
}

/**
 * 加载远程 CSS 样式
 *
 * :param url: CSS 文件 URL
 * :return:
 */
function loadStylesheet(url: string): void {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  document.head.appendChild(link);
}

/**
 * 加载单个插件
 *
 * :param config: 插件配置
 * :return:
 */
export async function loadPlugin(
  config: PluginConfig,
): Promise<PluginModule | undefined> {
  await loadScript(config.entry);

  if (config.stylesheet) {
    loadStylesheet(config.stylesheet);
  }

  const module = (window as any)[config.name] as PluginModule | undefined;

  if (!module) {
    console.warn(`[Plugin] Module "${config.name}" not found on window`);
  }

  return module;
}

/**
 * 批量加载插件
 *
 * :param configs: 插件配置列表
 * :return:
 */
export async function loadPlugins(
  configs: PluginConfig[],
): Promise<PluginModule[]> {
  const modules: PluginModule[] = [];

  for (const config of configs) {
    try {
      const module = await loadPlugin(config);
      if (module) {
        modules.push(module);
        console.log(`[Plugin] Loaded: ${config.name}`);
      }
    } catch (e) {
      console.error(`[Plugin] Failed to load: ${config.name}`, e);
    }
  }

  return modules;
}
