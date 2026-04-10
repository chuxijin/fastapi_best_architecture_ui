import type { ConfigProviderProps } from 'antdv-next';

import type { App } from 'vue';

import type { LocaleSetupOptions, SupportedLanguagesType } from '@vben/locales';

import { ref } from 'vue';

import {
  $t,
  setupI18n as coreSetup,
  loadLocalesMapFromDir,
} from '@vben/locales';
import { preferences } from '@vben/preferences';

import dayjs from 'dayjs';

type AntdvLocale = NonNullable<ConfigProviderProps['locale']>;

const antdLocale = ref<AntdvLocale>({} as AntdvLocale);
let antdLocalesCache: null | Record<string, AntdvLocale> = null;

const modules = import.meta.glob('./langs/**/*.json');

const pluginModules = import.meta.glob('../plugins/**/langs/**/*.json');

const localesMap = loadLocalesMapFromDir(
  /\.\/langs\/([^/]+)\/(.*)\.json$/,
  modules,
);

const pluginLocalesMap = loadLocalesMapFromDir(
  /\/plugins\/[^/]+\/langs\/([^/]+)\/([^/]+)\.json$/,
  pluginModules,
);
/**
 * 加载应用特有的语言包
 * 这里也可以改造为从服务端获取翻译数据
 * @param lang
 */
async function loadMessages(lang: SupportedLanguagesType) {
  const [appLocaleMessages, pluginLocalMessages] = await Promise.all([
    localesMap[lang]?.(),
    pluginLocalesMap[lang]?.(),
    loadThirdPartyMessage(lang),
  ]);
  return { ...appLocaleMessages?.default, ...pluginLocalMessages?.default };
}

/**
 * 加载第三方组件库的语言包
 * @param lang
 */
async function loadThirdPartyMessage(lang: SupportedLanguagesType) {
  await Promise.all([loadAntdLocale(lang), loadDayjsLocale(lang)]);
}

/**
 * 加载dayjs的语言包
 * @param lang
 */
async function loadDayjsLocale(lang: SupportedLanguagesType) {
  let locale;
  switch (lang) {
    case 'en-US': {
      locale = await import('dayjs/locale/en');
      break;
    }
    case 'zh-CN': {
      locale = await import('dayjs/locale/zh-cn');
      break;
    }
    // 默认使用英语
    default: {
      locale = await import('dayjs/locale/en');
    }
  }
  if (locale) {
    dayjs.locale(locale);
  } else {
    console.error(`Failed to load dayjs locale for ${lang}`);
  }
}

/**
 * 加载antd的语言包
 * @param lang
 */
async function loadAntdLocale(lang: SupportedLanguagesType) {
  if (!antdLocalesCache) {
    const localesModule = await import('antdv-next/dist/antd-with-locales.esm.js');
    antdLocalesCache = localesModule.locales;
  }

  const fallbackLocale =
    antdLocalesCache?.zh_CN ?? antdLocalesCache?.en_US ?? ({} as AntdvLocale);

  switch (lang) {
    case 'en-US': {
      antdLocale.value = antdLocalesCache?.en_US ?? fallbackLocale;
      break;
    }
    case 'zh-CN': {
      antdLocale.value = antdLocalesCache?.zh_CN ?? fallbackLocale;
      break;
    }
    default: {
      antdLocale.value = fallbackLocale;
      break;
    }
  }
}

async function setupI18n(app: App, options: LocaleSetupOptions = {}) {
  await coreSetup(app, {
    defaultLocale: preferences.app.locale,
    loadMessages,
    missingWarn: !import.meta.env.PROD,
    ...options,
  });
}

export { $t, antdLocale, setupI18n };
