/**
 * 该文件可自行根据业务逻辑进行调整
 */
import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  authenticateResponseInterceptor,
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import { useAuthStore } from '#/store';

import { refreshTokenApi } from './core';

// ==================== 缓存系统 ====================

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number; // 缓存时间（毫秒）
  key?: string; // 自定义缓存键
  enabled?: boolean; // 是否启用缓存
}

class RequestCache {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTtl = 5 * 60 * 1000; // 5分钟默认缓存

  // 生成缓存键
  generateKey(url: string, method: string, params?: any, data?: any, headers?: any): string {
    const keyParts = [
      method.toUpperCase(),
      url,
      JSON.stringify(params || {}),
      JSON.stringify(data || {}),
      JSON.stringify(headers || {}),
    ];
    return keyParts.join('|');
  }

  // 获取缓存
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  // 设置缓存
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl,
    });
  }

  // 清除缓存
  clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // 获取缓存统计
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

const requestCache = new RequestCache();

// 默认缓存配置
const DEFAULT_CACHE_CONFIGS: Record<string, CacheOptions> = {
  // GET 请求默认缓存配置
  'GET:/api/v1/coulduser/userinfo': { ttl: 10 * 60 * 1000 }, // 用户信息 10分钟
  'GET:/api/v1/couldfile/list': { ttl: 3 * 60 * 1000 }, // 文件列表 3分钟
  'GET:/api/v1/template/list': { ttl: 30 * 60 * 1000 }, // 规则模板 30分钟
  'GET:/api/v1/couldsync/config': { ttl: 5 * 60 * 1000 }, // 同步配置 5分钟
  'GET:/api/v1/coulduser/relationshiplist': { ttl: 15 * 60 * 1000 }, // 关系列表 15分钟
  'GET:/api/v1/coulduser/userlist': { ttl: 10 * 60 * 1000 }, // 用户列表 10分钟
};



const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

  // 重写请求方法以支持缓存管理
  const originalGet = client.get.bind(client);
  const originalPost = client.post.bind(client);
  const originalPut = client.put.bind(client);
  const originalDelete = client.delete.bind(client);

  // 重写 get 方法以支持缓存
  client.get = async function<T = any>(url: string, config: any = {}) {
    // 检查缓存配置
    const cacheOptions: CacheOptions = config.cache || {};

    // 如果禁用缓存，直接调用原方法
    if (cacheOptions.enabled === false) {
      return originalGet<T>(url, config);
    }

    // 获取默认缓存配置
    const configKey = `GET:${url}`;
    const defaultConfig = DEFAULT_CACHE_CONFIGS[configKey] || {};
    const finalCacheOptions = { ...defaultConfig, ...cacheOptions };

    // 如果没有缓存配置，直接调用原方法
    if (!finalCacheOptions.ttl) {
      return originalGet<T>(url, config);
    }

    // 生成缓存键
    const cacheKey = cacheOptions.key || requestCache.generateKey(
      url,
      'GET',
      config.params,
      config.data,
      config.headers,
    );

    // 检查缓存
    const cachedData = requestCache.get<T>(cacheKey);
    if (cachedData) {
      console.log(
        `%c🚀 Cache Hit`,
        'color: #10b981; font-weight: bold;',
        `GET ${url}`,
        {
          params: config.params,
          cacheKey: cacheKey.substring(0, 100) + '...',
          ttl: finalCacheOptions.ttl,
        }
      );
      return Promise.resolve(cachedData);
    }

    // 调用原方法并缓存结果
    try {
      const result = await originalGet<T>(url, config);

      // 存储到缓存
      requestCache.set(cacheKey, result, finalCacheOptions.ttl);

      console.log(
        `%c💾 Cache Stored`,
        'color: #3b82f6; font-weight: bold;',
        `GET ${url}`,
        {
          params: config.params,
          cacheKey: cacheKey.substring(0, 100) + '...',
          ttl: finalCacheOptions.ttl,
          expiresAt: new Date(Date.now() + finalCacheOptions.ttl).toLocaleTimeString(),
        }
      );

      return result;
    } catch (error) {
      throw error;
    }
  };

  // 自动缓存失效的URL模式
  const CACHE_INVALIDATION_PATTERNS: Record<string, string[]> = {
    // 规则模板相关
    '/api/v1/template': ['/api/v1/template'],
    // 用户相关
    '/api/v1/coulduser': ['/api/v1/coulduser'],
    // 文件相关
    '/api/v1/couldfile': ['/api/v1/couldfile'],
    // 同步配置相关
    '/api/v1/couldsync': ['/api/v1/couldsync'],
  };

  // 根据URL获取需要清除的缓存模式
  function getCacheInvalidationPatterns(url: string): string[] {
    for (const [pattern, invalidatePatterns] of Object.entries(CACHE_INVALIDATION_PATTERNS)) {
      if (url.includes(pattern)) {
        return invalidatePatterns;
      }
    }
    return [];
  }

  // 重写 POST 方法以支持缓存失效
  client.post = async function<T = any>(url: string, data?: any, config: any = {}) {
    try {
      const result = await originalPost<T>(url, data, config);

      // 清除相关缓存
      const invalidatePatterns = getCacheInvalidationPatterns(url);
      invalidatePatterns.forEach(pattern => {
        requestCache.clear(pattern);
        console.log(
          `%c🗑️ Cache Invalidated`,
          'color: #ef4444; font-weight: bold;',
          `POST ${url} -> cleared cache pattern: ${pattern}`
        );
      });

      return result;
    } catch (error) {
      throw error;
    }
  };

  // 重写 PUT 方法以支持缓存失效
  client.put = async function<T = any>(url: string, data?: any, config: any = {}) {
    try {
      const result = await originalPut<T>(url, data, config);

      // 清除相关缓存
      const invalidatePatterns = getCacheInvalidationPatterns(url);
      invalidatePatterns.forEach(pattern => {
        requestCache.clear(pattern);
        console.log(
          `%c🗑️ Cache Invalidated`,
          'color: #ef4444; font-weight: bold;',
          `PUT ${url} -> cleared cache pattern: ${pattern}`
        );
      });

      return result;
    } catch (error) {
      throw error;
    }
  };

  // 重写 DELETE 方法以支持缓存失效
  client.delete = async function<T = any>(url: string, config: any = {}) {
    try {
      const result = await originalDelete<T>(url, config);

      // 清除相关缓存
      const invalidatePatterns = getCacheInvalidationPatterns(url);
      invalidatePatterns.forEach(pattern => {
        requestCache.clear(pattern);
        console.log(
          `%c🗑️ Cache Invalidated`,
          'color: #ef4444; font-weight: bold;',
          `DELETE ${url} -> cleared cache pattern: ${pattern}`
        );
      });

      return result;
    } catch (error) {
      throw error;
    }
  };

  /**
   * 重新认证逻辑
   */
  async function doReAuthenticate() {
    console.warn('Access token or refresh token is invalid or expired. ');
    const accessStore = useAccessStore();
    const authStore = useAuthStore();
    const oldAccessToken = accessStore.accessToken;
    accessStore.setAccessToken(null);
    accessStore.setAccessSessionUuid(null);
    if (
      preferences.app.loginExpiredMode === 'modal' &&
      accessStore.isAccessChecked
    ) {
      accessStore.setLoginExpired(true);
    } else {
      await authStore.logout(oldAccessToken);
    }
  }

  /**
   * 刷新token逻辑
   */
  async function doRefreshToken() {
    const accessStore = useAccessStore();
    const resp = await refreshTokenApi();
    const newToken = resp.access_token;
    accessStore.setAccessToken(newToken);
    accessStore.setAccessSessionUuid(resp.session_uuid);
    return newToken;
  }

  function formatToken(token: null | string) {
    return token ? `Bearer ${token}` : null;
  }

  // 请求头处理
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();

      config.headers.Authorization = formatToken(accessStore.accessToken);
      config.headers['Accept-Language'] = preferences.app.locale;
      return config;
    },
  });

  // 处理返回的响应数据格式
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 200,
    }),
  );

  // token过期的处理
  client.addResponseInterceptor(
    authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken,
      enableRefreshToken: preferences.app.enableRefreshToken,
      formatToken,
    }),
  );

  // 通用的错误处理,如果没有进入上面的错误处理逻辑，就会进入这里
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      // 这里可以根据业务进行定制,你可以拿到 error 内的信息进行定制化处理，根据不同的 code 做不同的提示，而不是直接使用 message.error 提示 msg
      // 当前mock接口返回的错误字段是 error 或者 message
      const responseData = error?.response?.data ?? {};
      const errorMessage = responseData?.error ?? responseData?.msg ?? '';
      // 如果没有错误信息，则会根据状态码进行提示
      message.error(errorMessage || msg);
    }),
  );

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

export const baseRequestClient = new RequestClient({ baseURL: apiURL });

// 开发环境下启用缓存调试
if (import.meta.env.DEV) {
  enableCacheDebug(true);
}

// ==================== 缓存管理工具函数 ====================

/**
 * 清除请求缓存
 */
export function clearRequestCache(pattern?: string) {
  requestCache.clear(pattern);
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats() {
  return requestCache.getStats();
}

/**
 * 在数据变更后清除相关缓存
 */
export function invalidateCache(type: 'user' | 'file' | 'config' | 'template' | 'all') {
  switch (type) {
    case 'user':
      requestCache.clear('/api/v1/coulduser');
      break;
    case 'file':
      requestCache.clear('/api/v1/couldfile');
      break;
    case 'config':
      requestCache.clear('/api/v1/couldsync');
      break;
    case 'template':
      requestCache.clear('/api/v1/template');
      break;
    case 'all':
      requestCache.clear();
      break;
  }
}

/**
 * 手动设置缓存
 */
export function setCache<T>(key: string, data: T, ttl?: number) {
  requestCache.set(key, data, ttl);
}

/**
 * 手动获取缓存
 */
export function getCache<T>(key: string): T | null {
  return requestCache.get<T>(key);
}

/**
 * 开发调试：显示所有缓存信息
 */
export function debugCache() {
  const stats = requestCache.getStats();
  console.group('🔍 Cache Debug Info');
  console.log(`📊 Total cache entries: ${stats.size}`);

  if (stats.size > 0) {
    console.table(
      stats.keys.map(key => {
        const item = requestCache.get(key);
        const parts = key.split('|');
        return {
          Method: parts[0],
          URL: parts[1],
          HasData: !!item,
          CacheKey: key.substring(0, 80) + (key.length > 80 ? '...' : ''),
        };
      })
    );
  } else {
    console.log('📭 No cache entries found');
  }

  console.groupEnd();
}

/**
 * 开发调试：监听缓存事件
 */
export function enableCacheDebug(enable: boolean = true) {
  if (enable) {
    console.log(
      '%c🔧 Cache Debug Mode Enabled',
      'color: #f59e0b; font-weight: bold; font-size: 12px;',
      '\nUse debugCache() to inspect cache state'
    );
  }

  // 将调试函数挂载到全局对象上，方便在控制台调用
  if (typeof window !== 'undefined') {
    (window as any).debugCache = debugCache;
    (window as any).clearRequestCache = clearRequestCache;
    (window as any).invalidateCache = invalidateCache;
    (window as any).getCacheStats = getCacheStats;
  }
}
