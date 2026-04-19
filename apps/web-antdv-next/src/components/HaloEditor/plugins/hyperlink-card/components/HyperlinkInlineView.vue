<script lang="ts" setup>
import { NodeViewWrapper, nodeViewProps } from "../../..";
import { ref, watch, onMounted, computed } from "vue";

const props = defineProps(nodeViewProps);

interface SiteData {
  title: string;
  description: string;
  image: string;
  icon: string;
  url: string;
}

const loading = ref(false);
const siteData = ref<SiteData | null>(null);

const customTitle = computed(() => props.node.attrs?.["custom-title"]);
const customImage = computed(() => props.node.attrs?.["custom-image"]);

const displayTitle = computed(() => customTitle.value || siteData.value?.title || props.node.attrs.href);
const displayIcon = computed(() => customImage.value || siteData.value?.icon || siteData.value?.image || "");
const relAttr = computed(() => props.node.attrs.target === "_blank" ? "noopener" : undefined);
const normalizedHref = computed(() => {
  const href = props.node.attrs.href || "";
  if (!href) return "";
  if (/^https?:\/\//.test(href) || href.startsWith("/") || href.startsWith("#") || href.startsWith("mailto:")) return href;
  return `https://${href}`;
});
const isExternal = computed(() => {
  try {
    return !props.node.attrs.href?.startsWith(location.origin);
  } catch {
    return true;
  }
});

async function fetchSiteData(url: string) {
  if (!url) return;
  if (customTitle.value && customImage.value) {
    siteData.value = {
      title: customTitle.value,
      description: "",
      image: customImage.value,
      icon: customImage.value,
      url,
    };
    return;
  }
  loading.value = true;
  try {
    const res = await fetch(`${import.meta.env.VITE_GLOB_API_URL}/api/v1/content/link-detail?url=${encodeURIComponent(url)}`);
    if (res.ok) {
      siteData.value = await res.json();
    }
  } catch (e) {
    console.error("fetchSiteData error:", e);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (props.node.attrs.href) {
    fetchSiteData(props.node.attrs.href);
  }
});

watch(
  () => props.node.attrs.href,
  (value) => {
    if (value) {
      fetchSiteData(value);
    }
  }
);
</script>

<template>
  <node-view-wrapper as="span" class="hlic-host" :class="{ 'hlic-selected': selected }">
    <!-- Loading -->
    <span v-if="loading" class="hlic-wrapper hlic-loading">
      <span class="hlic-skeleton-icon"></span>
      <span class="hlic-skeleton-text"></span>
    </span>

    <!-- Has data -->
    <a
      v-else-if="siteData"
      class="hlic-wrapper hlic-link"
      :href="normalizedHref"
      :target="node.attrs.target || '_self'"
      :rel="relAttr"
    >
      <img
        v-if="displayIcon"
        :src="displayIcon"
        :alt="displayTitle"
        class="hlic-icon"
        referrerpolicy="no-referrer"
      />
      <span>{{ displayTitle }}</span>
      <span v-if="isExternal" class="hlic-external-icon"></span>
    </a>

    <!-- Fallback -->
    <a
      v-else
      class="hlic-fallback"
      :href="normalizedHref"
      :target="node.attrs.target || '_self'"
      :rel="relAttr"
    >{{ node.attrs.href }}</a>
  </node-view-wrapper>
</template>

<style scoped>
.hlic-host {
  display: inline-block;
  vertical-align: middle;
  pointer-events: none;
  user-select: none;
}

.hlic-selected {
  box-shadow: 0 0 0 1px var(--halo-hyperlink-card-border-hover-color, #a1a1aa);
  border-radius: 0.25rem;
}

/* 基础重置 */
.hlic-host *,
.hlic-host *::before,
.hlic-host *::after {
  box-sizing: border-box;
}

.hlic-host a {
  color: inherit;
  text-decoration: inherit;
}

.hlic-host img {
  display: block;
  max-width: 100%;
  height: auto;
}

/* 共用行内容器 */
.hlic-wrapper {
  margin-left: 0.25rem;
  margin-right: 0.25rem;
  display: inline-flex;
  align-items: center;
  border-radius: 0.25rem;
  background-color: var(--halo-hyperlink-card-inline-bg-color, #fafafa);
  padding: 0.125rem 0.375rem;
  font-size: 90%;
  color: var(--halo-hyperlink-card-inline-title-color, #27272a);
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.hlic-wrapper > :not([hidden]) ~ :not([hidden]) {
  margin-left: 0.375rem;
}

.hlic-link:hover {
  background-color: var(--halo-hyperlink-card-inline-hover-bg-color, #f4f4f5);
}

/* 图标 */
.hlic-icon {
  width: 1rem;
  height: 1rem;
  border-radius: 0.125rem;
}

/* 外链图标 */
.hlic-external-icon {
  --un-icon: url("data:image/svg+xml;utf8,%3Csvg viewBox='0 0 24 24' width='1em' height='1em' xmlns='http://www.w3.org/2000/svg' %3E%3Cpath fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6m-7 1l9-9m-5 0h5v5'/%3E%3C/svg%3E");
  -webkit-mask: var(--un-icon) no-repeat;
  mask: var(--un-icon) no-repeat;
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
  background-color: currentColor;
  color: inherit;
  width: 1em;
  height: 1em;
  color: var(--halo-hyperlink-card-inline-title-color, #27272a);
}

/* Fallback */
.hlic-fallback {
  color: rgb(79 70 229);
  text-decoration: none;
}

/* Loading skeleton */
.hlic-loading {
  pointer-events: none;
}

.hlic-skeleton-icon {
  width: 1rem;
  height: 1rem;
  animation: hlic-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  border-radius: 0.125rem;
  background-color: var(--halo-hyperlink-card-skeleton-color, #e4e4e7);
}

.hlic-skeleton-text {
  height: 0.75rem;
  width: 4rem;
  animation: hlic-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  border-radius: 0.25rem;
  background-color: var(--halo-hyperlink-card-skeleton-color, #e4e4e7);
}

@keyframes hlic-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
