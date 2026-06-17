import type {
  RouteLocationNormalized,
  RouteRecordNameGeneric,
} from 'vue-router';

import type { RouteMeta } from './vue-router';

interface TabRouteMatched {
  meta: RouteMeta;
  name: RouteRecordNameGeneric;
  path: string;
}

export interface TabDefinition {
  /**
   * 标签页的key
   */
  key?: string;
  fullPath?: string;
  hash: string;
  matched: TabRouteMatched[];
  meta: RouteMeta;
  name: RouteRecordNameGeneric;
  params?: RouteLocationNormalized['params'];
  path: string;
  query?: RouteLocationNormalized['query'];
}

export type { TabRouteMatched };
