<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';

import { nodeViewProps, NodeViewWrapper } from '../../..';

const props = defineProps(nodeViewProps);

interface SiteData {
  title: string;
  description: string;
  image: string;
  icon: string;
  url: string;
}

const loading = ref(false);
const siteData = ref<null | SiteData>(null);

const theme = computed(() => {
  const t = props.node.attrs.theme;
  if (t === 'inline' || !t) return 'regular';
  return t;
});

const customTitle = computed(() => props.node.attrs?.['custom-title']);
const customDesc = computed(() => props.node.attrs?.['custom-description']);
const customImage = computed(() => props.node.attrs?.['custom-image']);

const displayTitle = computed(
  () => customTitle.value || siteData.value?.title || props.node.attrs.href,
);
const displayDesc = computed(
  () => customDesc.value || siteData.value?.description || '',
);
const displayImage = computed(
  () => customImage.value || siteData.value?.image || '',
);
const displayIcon = computed(
  () => siteData.value?.icon || siteData.value?.image || '',
);
const hasOnlyIcon = computed(
  () => !siteData.value?.image && siteData.value?.icon,
);
const normalizedHref = computed(() => {
  const href = props.node.attrs.href || '';
  if (!href) return '';
  if (
    /^https?:\/\//.test(href) ||
    href.startsWith('/') ||
    href.startsWith('#') ||
    href.startsWith('mailto:')
  )
    return href;
  return `https://${href}`;
});
const relAttr = computed(() =>
  props.node.attrs.target === '_blank' ? 'noopener' : undefined,
);

async function fetchSiteData(url: string) {
  if (!url) return;
  if (customTitle.value && customImage.value && customDesc.value) {
    siteData.value = {
      title: customTitle.value,
      description: customDesc.value,
      image: customImage.value,
      icon: customImage.value,
      url,
    };
    return;
  }
  loading.value = true;
  try {
    const res = await fetch(
      `${import.meta.env.VITE_GLOB_API_URL}/api/v1/content/link-detail?url=${encodeURIComponent(url)}`,
    );
    if (res.ok) {
      siteData.value = await res.json();
    }
  } catch (error) {
    console.error('fetchSiteData error:', error);
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
  },
);
</script>

<template>
  <NodeViewWrapper
    as="div"
    class=":uno: mb-0 mt-[0.75em] first:mt-0"
    :class="{ ':uno: rounded-xl ring-1': selected }"
  >
    <a
      class="hlc-container"
      :href="normalizedHref"
      :target="node.attrs.target || '_blank'"
      :rel="relAttr"
    >
      <!-- ===== Loading ===== -->
      <template v-if="loading">
        <!-- Regular loading -->
        <div v-if="theme === 'regular'" class="hlc-skeleton-regular">
          <div class="hlc-skeleton-regular__image"></div>
          <div class="hlc-skeleton-regular__content">
            <div
              class="hlc-skeleton-bar"
              style="width: 33%; height: 0.75rem"
            ></div>
            <div style="display: flex; flex-direction: column; gap: 0.25rem">
              <div
                class="hlc-skeleton-bar"
                style="width: 80%; height: 1rem"
              ></div>
              <div
                class="hlc-skeleton-bar"
                style="width: 60%; height: 1rem"
              ></div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.25rem">
              <div
                class="hlc-skeleton-bar"
                style="width: 100%; height: 0.75rem"
              ></div>
              <div
                class="hlc-skeleton-bar"
                style="width: 66%; height: 0.75rem"
              ></div>
            </div>
          </div>
        </div>
        <!-- Small loading -->
        <div v-else-if="theme === 'small'" class="hlc-skeleton-small">
          <div
            class="hlc-skeleton-bar"
            style="width: 2rem; aspect-ratio: 1/1; border-radius: 0.5rem"
          ></div>
          <div
            class="hlc-skeleton-bar"
            style="width: 7.5rem; height: 1rem"
          ></div>
          <div
            class="hlc-skeleton-bar"
            style="width: 10rem; height: 0.75rem"
          ></div>
        </div>
        <!-- Grid loading -->
        <div v-else class="hlc-skeleton-grid">
          <div
            class="hlc-skeleton-bar"
            style="width: 100%; aspect-ratio: 16/9; border-radius: 0.5rem"
          ></div>
          <div class="hlc-skeleton-grid__content">
            <div
              class="hlc-skeleton-bar"
              style="width: 33%; height: 0.75rem"
            ></div>
            <div style="display: flex; flex-direction: column; gap: 0.25rem">
              <div
                class="hlc-skeleton-bar"
                style="width: 80%; height: 1rem"
              ></div>
              <div
                class="hlc-skeleton-bar"
                style="width: 60%; height: 1rem"
              ></div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.25rem">
              <div
                class="hlc-skeleton-bar"
                style="width: 100%; height: 0.75rem"
              ></div>
              <div
                class="hlc-skeleton-bar"
                style="width: 66%; height: 0.75rem"
              ></div>
            </div>
          </div>
        </div>
      </template>

      <!-- ===== Has Data ===== -->
      <template v-else-if="siteData">
        <!-- Regular -->
        <div
          v-if="theme === 'regular'"
          class="hlc-regular"
          :class="{
            'hlc-regular--icon-only': hasOnlyIcon,
            'hlc-regular--has-image': !hasOnlyIcon,
          }"
        >
          <!-- 背景模糊 + 大图 -->
          <template v-if="displayImage && !hasOnlyIcon">
            <div
              class="hlc-regular__bg"
              :style="{
                backgroundImage: `var(--halo-hyperlink-card-bg-gradient, linear-gradient(#f2f2f2, #f2f2f2), linear-gradient(#000000, #000000)), url('${displayImage}')`,
                backgroundBlendMode: 'luminosity, overlay, normal',
                transform: 'scale(1.5) translate3d(0, 0, 0)',
                filter: 'blur(64px) saturate(4) contrast(90%)',
              }"
            ></div>
            <div class="hlc-regular__image-wrap hlc-regular__image-16-9">
              <img
                :src="displayImage"
                :alt="displayTitle"
                referrerpolicy="no-referrer"
              />
            </div>
          </template>
          <!-- 仅 icon -->
          <div
            v-if="hasOnlyIcon"
            class="hlc-regular__image-wrap hlc-regular__image-square"
          >
            <img
              :src="displayIcon"
              :alt="displayTitle"
              referrerpolicy="no-referrer"
            />
          </div>
          <!-- 文本信息 -->
          <div class="hlc-regular__info">
            <div>
              <span class="hlc-regular__url">{{ siteData.url }}</span>
            </div>
            <div>
              <h2 class="hlc-regular__title">{{ displayTitle }}</h2>
            </div>
            <p
              class="hlc-regular__desc"
              :class="hasOnlyIcon ? 'hlc-clamp-1' : 'hlc-clamp-2'"
            >
              {{ displayDesc }}
            </p>
          </div>
        </div>

        <!-- Small -->
        <div v-else-if="theme === 'small'" class="hlc-small">
          <img
            v-if="displayIcon"
            :src="displayIcon"
            :alt="displayTitle"
            class="hlc-small__icon"
            referrerpolicy="no-referrer"
          />
          <span class="hlc-small__title">{{ displayTitle }}</span>
          <span v-if="displayDesc" class="hlc-small__desc">{{
            displayDesc
          }}</span>
        </div>

        <!-- Grid -->
        <div v-else class="hlc-grid">
          <template v-if="displayImage">
            <div
              class="hlc-grid__bg"
              :style="{
                backgroundImage: `var(--halo-hyperlink-card-bg-gradient, linear-gradient(#f2f2f2, #f2f2f2), linear-gradient(#000000, #000000)), url('${displayImage}')`,
                backgroundBlendMode: 'luminosity, overlay, normal',
                transform: 'scale(1.5) translate3d(0, 0, 0)',
                filter: 'blur(64px) saturate(4) contrast(90%)',
              }"
            ></div>
            <div class="hlc-grid__image">
              <img
                :src="displayImage"
                :alt="displayTitle"
                referrerpolicy="no-referrer"
              />
            </div>
          </template>
          <div class="hlc-grid__info">
            <div>
              <span class="hlc-regular__url">{{ siteData.url }}</span>
            </div>
            <div>
              <h2 class="hlc-regular__title">{{ displayTitle }}</h2>
            </div>
            <p class="hlc-regular__desc hlc-clamp-2">{{ displayDesc }}</p>
          </div>
        </div>
      </template>

      <!-- ===== Fallback ===== -->
      <template v-else>
        <span class="hlc-fallback">{{ node.attrs.href }}</span>
      </template>
    </a>
  </NodeViewWrapper>
</template>

<style scoped>
/* 基础重置 */
.hlc-container *,
.hlc-container *::before,
.hlc-container *::after {
  box-sizing: border-box;
  border-style: solid;
  border-width: 0;
}

.hlc-container {
  position: relative;
  display: flex;
  width: 100%;
  overflow: hidden;
  color: inherit;
  text-decoration: none;
  pointer-events: none;
  user-select: none;
  background-color: var(--halo-hyperlink-card-bg-color, #fff);
  border: 1px solid var(--halo-hyperlink-card-border-color, #e4e4e7);
  border-radius: 0.75rem;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.hlc-container:hover {
  border-color: var(--halo-hyperlink-card-border-hover-color, #818cf8);
}

.hlc-container a {
  color: inherit;
  text-decoration: inherit;
}

.hlc-container img {
  display: block;
  max-width: 100%;
  height: auto;
}

.hlc-container h2,
.hlc-container p {
  margin: 0;
  font-size: inherit;
  font-weight: inherit;
}

/* ===== Regular ===== */
.hlc-regular {
  position: relative;
  z-index: 0;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  width: 100%;
  padding: 0.5rem;
}

.hlc-regular--icon-only {
  flex-direction: row;
}

.hlc-regular--has-image {
  flex-direction: column;
}

@media (min-width: 640px) {
  .hlc-regular--has-image {
    flex-direction: row;
  }
}

.hlc-regular__bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  width: 100%;
  height: 100%;
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  border-radius: 0.375rem;
}

.hlc-regular__image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.5rem;
}

.hlc-regular__image-16-9 {
  flex: none;
  width: 100%;
  aspect-ratio: 16/9;
}

@media (min-width: 640px) {
  .hlc-regular__image-16-9 {
    width: 14rem;
  }
}

.hlc-regular__image-square {
  flex: none;
  width: 4.5rem;
  aspect-ratio: 1/1;
}

.hlc-regular__info {
  flex: 1 1 auto;
  flex-shrink: 1;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hlc-regular__info > :not([hidden]) ~ :not([hidden]) {
  margin-top: 0.25rem;
}

.hlc-regular__url {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 1;
  font-size: 0.75rem;
  line-height: 1rem;
  color: var(--halo-hyperlink-card-link-color, #4f46e5);
  -webkit-box-orient: vertical;
}

.hlc-regular__title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.5rem;
  color: var(--halo-hyperlink-card-title-color, #18181b);
  -webkit-box-orient: vertical;
}

@media (min-width: 1024px) {
  .hlc-regular__title {
    -webkit-line-clamp: 1;
  }
}

.hlc-regular__desc {
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: var(--halo-hyperlink-card-description-color, #71717a);
}

.hlc-clamp-1 {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.hlc-clamp-2 {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* ===== Small ===== */
.hlc-small {
  position: relative;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  width: 100%;
  padding: 0.5rem;
}

.hlc-small__icon {
  z-index: 1;
  flex: none;
  width: 2rem;
  aspect-ratio: 1/1;
  object-fit: cover;
  border-radius: 0.5rem;
}

.hlc-small__title {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 1rem;
  font-weight: 600;
  color: var(--halo-hyperlink-card-title-color, #18181b);
  white-space: nowrap;
}

.hlc-small__desc {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.75rem;
  color: var(--halo-hyperlink-card-description-color, #71717a);
  white-space: nowrap;
}

/* ===== Grid ===== */
.hlc-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 0.75rem;
  align-items: center;
  width: 100%;
  padding: 0.5rem;
}

.hlc-grid__bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  width: 100%;
  height: 100%;
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  border-radius: 0.375rem;
}

.hlc-grid__image {
  z-index: 1;
  grid-column: span 12 / span 12;
}

.hlc-grid__image img {
  width: 100%;
  height: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  border-radius: 0.5rem;
}

.hlc-grid__info {
  z-index: 1;
  grid-column: span 12 / span 12;
  overflow: hidden;
}

.hlc-grid__info > :not([hidden]) ~ :not([hidden]) {
  margin-top: 0.25rem;
}

/* ===== Fallback ===== */
.hlc-fallback {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  line-height: 1rem;
  color: var(--halo-hyperlink-card-link-color, #4f46e5);
}

/* ===== Skeleton ===== */
.hlc-skeleton-bar {
  background-color: var(--halo-hyperlink-card-skeleton-color, #e4e4e7);
  border-radius: 0.25rem;
  animation: hlc-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.hlc-skeleton-regular {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
  width: 100%;
  padding: 0.5rem;
}

@media (min-width: 640px) {
  .hlc-skeleton-regular {
    flex-direction: row;
  }

  .hlc-skeleton-regular__image {
    width: 14rem;
  }
}

.hlc-skeleton-regular__image {
  z-index: 1;
  flex: none;
  width: 100%;
  aspect-ratio: 16/9;
  background-color: var(--halo-hyperlink-card-skeleton-color, #e4e4e7);
  border-radius: 0.5rem;
  animation: hlc-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.hlc-skeleton-regular__content {
  z-index: 1;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 0.25rem;
  width: 100%;
  overflow: hidden;
}

.hlc-skeleton-small {
  position: relative;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  width: 100%;
  padding: 0.5rem;
}

.hlc-skeleton-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 0.75rem;
  align-items: center;
  width: 100%;
  padding: 0.5rem;
}

.hlc-skeleton-grid > * {
  grid-column: span 12 / span 12;
}

.hlc-skeleton-grid__content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

@keyframes hlc-pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}
</style>
