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

const theme = computed(() => {
  const t = props.node.attrs.theme;
  if (t === "inline" || !t) return "regular";
  return t;
});

const customTitle = computed(() => props.node.attrs?.["custom-title"]);
const customDesc = computed(() => props.node.attrs?.["custom-description"]);
const customImage = computed(() => props.node.attrs?.["custom-image"]);

const displayTitle = computed(() => customTitle.value || siteData.value?.title || props.node.attrs.href);
const displayDesc = computed(() => customDesc.value || siteData.value?.description || "");
const displayImage = computed(() => customImage.value || siteData.value?.image || "");
const displayIcon = computed(() => siteData.value?.icon || siteData.value?.image || "");
const hasOnlyIcon = computed(() => !siteData.value?.image && siteData.value?.icon);
const normalizedHref = computed(() => {
  const href = props.node.attrs.href || "";
  if (!href) return "";
  if (/^https?:\/\//.test(href) || href.startsWith("/") || href.startsWith("#") || href.startsWith("mailto:")) return href;
  return `https://${href}`;
});
const relAttr = computed(() => props.node.attrs.target === "_blank" ? "noopener" : undefined);

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
  <node-view-wrapper
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
            <div class="hlc-skeleton-bar" style="height:0.75rem;width:33%"></div>
            <div style="display:flex;flex-direction:column;gap:0.25rem">
              <div class="hlc-skeleton-bar" style="height:1rem;width:80%"></div>
              <div class="hlc-skeleton-bar" style="height:1rem;width:60%"></div>
            </div>
            <div style="display:flex;flex-direction:column;gap:0.25rem">
              <div class="hlc-skeleton-bar" style="height:0.75rem;width:100%"></div>
              <div class="hlc-skeleton-bar" style="height:0.75rem;width:66%"></div>
            </div>
          </div>
        </div>
        <!-- Small loading -->
        <div v-else-if="theme === 'small'" class="hlc-skeleton-small">
          <div class="hlc-skeleton-bar" style="aspect-ratio:1/1;width:2rem;border-radius:0.5rem"></div>
          <div class="hlc-skeleton-bar" style="height:1rem;width:7.5rem"></div>
          <div class="hlc-skeleton-bar" style="height:0.75rem;width:10rem"></div>
        </div>
        <!-- Grid loading -->
        <div v-else class="hlc-skeleton-grid">
          <div class="hlc-skeleton-bar" style="aspect-ratio:16/9;width:100%;border-radius:0.5rem"></div>
          <div class="hlc-skeleton-grid__content">
            <div class="hlc-skeleton-bar" style="height:0.75rem;width:33%"></div>
            <div style="display:flex;flex-direction:column;gap:0.25rem">
              <div class="hlc-skeleton-bar" style="height:1rem;width:80%"></div>
              <div class="hlc-skeleton-bar" style="height:1rem;width:60%"></div>
            </div>
            <div style="display:flex;flex-direction:column;gap:0.25rem">
              <div class="hlc-skeleton-bar" style="height:0.75rem;width:100%"></div>
              <div class="hlc-skeleton-bar" style="height:0.75rem;width:66%"></div>
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
          :class="{ 'hlc-regular--icon-only': hasOnlyIcon, 'hlc-regular--has-image': !hasOnlyIcon }"
        >
          <!-- 背景模糊 + 大图 -->
          <template v-if="displayImage && !hasOnlyIcon">
            <div class="hlc-regular__bg" :style="{
              backgroundImage: `var(--halo-hyperlink-card-bg-gradient, linear-gradient(#f2f2f2, #f2f2f2), linear-gradient(#000000, #000000)), url('${displayImage}')`,
              backgroundBlendMode: 'luminosity, overlay, normal',
              transform: 'scale(1.5) translate3d(0, 0, 0)',
              filter: 'blur(64px) saturate(4) contrast(90%)',
            }"></div>
            <div class="hlc-regular__image-wrap hlc-regular__image-16-9">
              <img :src="displayImage" :alt="displayTitle" referrerpolicy="no-referrer" />
            </div>
          </template>
          <!-- 仅 icon -->
          <div v-if="hasOnlyIcon" class="hlc-regular__image-wrap hlc-regular__image-square">
            <img :src="displayIcon" :alt="displayTitle" referrerpolicy="no-referrer" />
          </div>
          <!-- 文本信息 -->
          <div class="hlc-regular__info">
            <div>
              <span class="hlc-regular__url">{{ siteData.url }}</span>
            </div>
            <div>
              <h2 class="hlc-regular__title">{{ displayTitle }}</h2>
            </div>
            <p class="hlc-regular__desc" :class="hasOnlyIcon ? 'hlc-clamp-1' : 'hlc-clamp-2'">{{ displayDesc }}</p>
          </div>
        </div>

        <!-- Small -->
        <div v-else-if="theme === 'small'" class="hlc-small">
          <img v-if="displayIcon" :src="displayIcon" :alt="displayTitle" class="hlc-small__icon" referrerpolicy="no-referrer" />
          <span class="hlc-small__title">{{ displayTitle }}</span>
          <span v-if="displayDesc" class="hlc-small__desc">{{ displayDesc }}</span>
        </div>

        <!-- Grid -->
        <div v-else class="hlc-grid">
          <template v-if="displayImage">
            <div class="hlc-grid__bg" :style="{
              backgroundImage: `var(--halo-hyperlink-card-bg-gradient, linear-gradient(#f2f2f2, #f2f2f2), linear-gradient(#000000, #000000)), url('${displayImage}')`,
              backgroundBlendMode: 'luminosity, overlay, normal',
              transform: 'scale(1.5) translate3d(0, 0, 0)',
              filter: 'blur(64px) saturate(4) contrast(90%)',
            }"></div>
            <div class="hlc-grid__image">
              <img :src="displayImage" :alt="displayTitle" referrerpolicy="no-referrer" />
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
  </node-view-wrapper>
</template>

<style scoped>
/* 基础重置 */
.hlc-container *,
.hlc-container *::before,
.hlc-container *::after {
  box-sizing: border-box;
  border-width: 0;
  border-style: solid;
}

.hlc-container {
  position: relative;
  width: 100%;
  display: flex;
  overflow: hidden;
  border: 1px solid var(--halo-hyperlink-card-border-color, #e4e4e7);
  border-radius: 0.75rem;
  background-color: var(--halo-hyperlink-card-bg-color, #fff);
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
  color: inherit;
  pointer-events: none;
  user-select: none;
}

.hlc-container:hover {
  border-color: var(--halo-hyperlink-card-border-hover-color, #818cf8);
}

.hlc-container a { color: inherit; text-decoration: inherit; }
.hlc-container img { display: block; max-width: 100%; height: auto; }
.hlc-container h2, .hlc-container p { margin: 0; font-size: inherit; font-weight: inherit; }

/* ===== Regular ===== */
.hlc-regular {
  position: relative;
  z-index: 0;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
}

.hlc-regular--icon-only { flex-direction: row; }
.hlc-regular--has-image { flex-direction: column; }
@media (min-width: 640px) { .hlc-regular--has-image { flex-direction: row; } }

.hlc-regular__bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  height: 100%;
  width: 100%;
  border-radius: 0.375rem;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.hlc-regular__image-wrap img {
  width: 100%;
  height: 100%;
  border-radius: 0.5rem;
  object-fit: cover;
}

.hlc-regular__image-16-9 {
  aspect-ratio: 16/9;
  width: 100%;
  flex: none;
}

@media (min-width: 640px) { .hlc-regular__image-16-9 { width: 14rem; } }

.hlc-regular__image-square {
  aspect-ratio: 1/1;
  width: 4.5rem;
  flex: none;
}

.hlc-regular__info {
  width: 100%;
  flex: 1 1 auto;
  flex-shrink: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hlc-regular__info > :not([hidden]) ~ :not([hidden]) {
  margin-top: 0.25rem;
}

.hlc-regular__url {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  font-size: 0.75rem;
  line-height: 1rem;
  color: var(--halo-hyperlink-card-link-color, #4f46e5);
}

.hlc-regular__title {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: 1rem;
  line-height: 1.5rem;
  color: var(--halo-hyperlink-card-title-color, #18181b);
  font-weight: 600;
}

@media (min-width: 1024px) { .hlc-regular__title { -webkit-line-clamp: 1; } }

.hlc-regular__desc {
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: var(--halo-hyperlink-card-description-color, #71717a);
}

.hlc-clamp-1 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.hlc-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

/* ===== Small ===== */
.hlc-small {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
}

.hlc-small__icon {
  z-index: 1;
  aspect-ratio: 1/1;
  width: 2rem;
  flex: none;
  border-radius: 0.5rem;
  object-fit: cover;
}

.hlc-small__title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--halo-hyperlink-card-title-color, #18181b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hlc-small__desc {
  font-size: 0.75rem;
  color: var(--halo-hyperlink-card-description-color, #71717a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== Grid ===== */
.hlc-grid {
  position: relative;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
}

.hlc-grid__bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  height: 100%;
  width: 100%;
  border-radius: 0.375rem;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.hlc-grid__image {
  z-index: 1;
  grid-column: span 12 / span 12;
}

.hlc-grid__image img {
  aspect-ratio: 16/9;
  width: 100%;
  height: 100%;
  border-radius: 0.5rem;
  object-fit: cover;
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
  animation: hlc-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  border-radius: 0.25rem;
  background-color: var(--halo-hyperlink-card-skeleton-color, #e4e4e7);
}

.hlc-skeleton-regular {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
}

@media (min-width: 640px) {
  .hlc-skeleton-regular { flex-direction: row; }
  .hlc-skeleton-regular__image { width: 14rem; }
}

.hlc-skeleton-regular__image {
  z-index: 1;
  aspect-ratio: 16/9;
  width: 100%;
  flex: none;
  animation: hlc-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  border-radius: 0.5rem;
  background-color: var(--halo-hyperlink-card-skeleton-color, #e4e4e7);
}

.hlc-skeleton-regular__content {
  z-index: 1;
  width: 100%;
  flex: 1 1 auto;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.hlc-skeleton-small {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
}

.hlc-skeleton-grid {
  position: relative;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  align-items: center;
  gap: 0.75rem;
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
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
