import type { AnalyticsSite } from '../api';

import { computed, ref } from 'vue';

import { listSitesApi } from '../api';

const sites = ref<AnalyticsSite[]>([]);
const selectedSiteId = ref<number>();
const sitesLoading = ref(false);

export function useAnalyticsSites() {
  const selectedSite = computed(() =>
    sites.value.find((site) => site.id === selectedSiteId.value),
  );

  async function loadSites(force = false) {
    if (sitesLoading.value || (sites.value.length > 0 && !force)) return;
    sitesLoading.value = true;
    try {
      sites.value = await listSitesApi();
      if (!sites.value.some((site) => site.id === selectedSiteId.value)) {
        selectedSiteId.value = sites.value[0]?.id;
      }
    } finally {
      sitesLoading.value = false;
    }
  }

  return {
    loadSites,
    selectedSite,
    selectedSiteId,
    sites,
    sitesLoading,
  };
}

export function formatMetric(value: number) {
  return new Intl.NumberFormat('zh-CN', { notation: 'compact' }).format(value);
}

export function formatDuration(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)} 秒`;
  if (seconds < 3600)
    return `${Math.floor(seconds / 60)} 分 ${Math.round(seconds % 60)} 秒`;
  return `${Math.floor(seconds / 3600)} 小时 ${Math.round((seconds % 3600) / 60)} 分`;
}
