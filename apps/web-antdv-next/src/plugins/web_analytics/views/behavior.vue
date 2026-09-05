<script setup lang="ts">
import type { HeatmapPoint, ReplayChunk, ReplayItem } from '../api';

import { computed, onMounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';

import { message } from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  getDimensionsApi,
  getHeatmapApi,
  getReplayChunksApi,
  getReplaysApi,
} from '../api';
import { formatDuration, useAnalyticsSites } from './shared';

const Play = createIconifyIcon('carbon:play-filled');
const Renew = createIconifyIcon('carbon:renew');
const { loadSites, selectedSiteId, sites, sitesLoading } = useAnalyticsSites();
const loading = ref(false);
const path = ref('/');
const pageOptions = ref<{ label: string; value: string }[]>([]);
const heatmap = ref<HeatmapPoint[]>([]);
const replays = ref<ReplayItem[]>([]);
const selectedReplay = ref<ReplayItem>();
const replayChunks = ref<ReplayChunk[]>([]);
const replayOpen = ref(false);

const maxHeat = computed(() =>
  Math.max(1, ...heatmap.value.map((item) => item.count)),
);
const replayEvents = computed(() =>
  replayChunks.value.flatMap((chunk) => chunk.events),
);

function heatStyle(point: HeatmapPoint) {
  const intensity = point.count / maxHeat.value;
  const size = 18 + intensity * 38;
  return {
    left: `${point.x_ratio * 100}%`,
    top: `${point.y_ratio * 100}%`,
    width: `${size}px`,
    height: `${size}px`,
    opacity: `${0.28 + intensity * 0.58}`,
  };
}

async function loadBehavior() {
  if (!selectedSiteId.value) return;
  loading.value = true;
  try {
    const end = dayjs().endOf('day').toISOString();
    const start = dayjs().subtract(29, 'day').startOf('day').toISOString();
    const siteId = selectedSiteId.value;
    const [pageItems, heatPoints, replayItems] = await Promise.all([
      getDimensionsApi(siteId, { dimension: 'page', start, end, limit: 100 }),
      getHeatmapApi(siteId, { path: path.value, start, end }),
      getReplaysApi(siteId, 50),
    ]);
    pageOptions.value = pageItems.map((item) => ({
      label: `${item.name} · ${item.value}`,
      value: item.name,
    }));
    heatmap.value = heatPoints;
    replays.value = replayItems;
  } catch {
    message.error('加载行为分析失败');
  } finally {
    loading.value = false;
  }
}

async function openReplay(item: ReplayItem) {
  if (!selectedSiteId.value) return;
  selectedReplay.value = item;
  replayChunks.value = await getReplayChunksApi(
    selectedSiteId.value,
    item.replay_key,
  );
  replayOpen.value = true;
}

watch(selectedSiteId, loadBehavior);
watch(path, async () => {
  if (!selectedSiteId.value) return;
  const end = dayjs().endOf('day').toISOString();
  const start = dayjs().subtract(29, 'day').startOf('day').toISOString();
  heatmap.value = await getHeatmapApi(selectedSiteId.value, {
    path: path.value,
    start,
    end,
  });
});
onMounted(async () => {
  await loadSites();
  await loadBehavior();
});
</script>

<template>
  <Page auto-content-height>
    <div class="behavior-page">
      <header class="behavior-header">
        <div>
          <span>BEHAVIOR LAB</span>
          <h1>行为分析</h1>
          <p>观察点击密度，定位真实的访问会话</p>
        </div>
        <div class="header-actions">
          <a-select
            v-model:value="selectedSiteId"
            :loading="sitesLoading"
            class="site-select"
          >
            <a-select-option
              v-for="site in sites"
              :key="site.id"
              :value="site.id"
            >
              {{ site.name }}
            </a-select-option>
</a-select
          ><a-button :loading="loading" @click="loadBehavior">
            <Renew class="size-4" />刷新
          </a-button>
        </div>
      </header>

      <section class="behavior-grid">
        <article class="panel heat-panel">
          <div class="panel-head">
            <div>
              <span>CLICK MAP / 30 DAYS</span>
              <h2>点击热力图</h2>
            </div>
            <a-select
              v-model:value="path"
              show-search
              class="path-select"
              :options="pageOptions"
            />
          </div>
          <div class="heat-canvas">
            <div class="browser-bar">
              <i></i><i></i><i></i><code>{{ path }}</code>
            </div>
            <div class="page-wireframe">
              <div class="wire-nav"></div>
              <div class="wire-hero">
                <b></b><span></span><span></span><button></button>
              </div>
              <div class="wire-grid"><i></i><i></i><i></i></div>
            </div>
            <i
              v-for="(point, index) in heatmap"
              :key="`${point.x_ratio}-${point.y_ratio}-${index}`"
              class="heat-point"
              :style="heatStyle(point)"
              ><b>{{ point.count }}</b></i
            >
            <a-empty
              v-if="heatmap.length === 0"
              class="heat-empty"
              :image="false"
              description="该页面还没有点击数据"
            />
          </div>
          <div class="heat-legend">
            <span>低</span><i></i><span>高</span
            ><b
              >{{
                heatmap.reduce((sum, item) => sum + item.count, 0)
              }}
              次点击</b
            >
          </div>
        </article>

        <article class="panel replay-panel">
          <div class="panel-head">
            <div>
              <span>SESSION REPLAY</span>
              <h2>最近回放</h2>
            </div>
            <small>{{ replays.length }} 条</small>
          </div>
          <div class="replay-list">
            <button
              v-for="item in replays"
              :key="item.replay_key"
              @click="openReplay(item)"
            >
              <span class="play-mark"><Play class="size-4" /></span
              ><span class="replay-main"
                ><b>{{ item.path }}</b
                ><small>{{
                  dayjs(item.started_at).format('MM-DD HH:mm:ss')
                }}</small></span
              ><span class="replay-meta"
                ><b>{{ item.chunk_count }} 段</b
                ><small
                  >{{ (item.total_bytes / 1024).toFixed(1) }} KB</small
                ></span
              >
            </button>
            <a-empty
              v-if="replays.length === 0"
              :image="false"
              description="暂无会话回放；接入 rrweb 后将在这里出现"
            />
          </div>
        </article>
      </section>
    </div>

    <a-drawer v-model:open="replayOpen" width="720" title="会话回放数据">
      <template v-if="selectedReplay">
        <div class="replay-summary">
          <div>
            <span>页面</span><b>{{ selectedReplay.path }}</b>
          </div>
          <div>
            <span>开始时间</span
            ><b>{{
              dayjs(selectedReplay.started_at).format('YYYY-MM-DD HH:mm:ss')
            }}</b>
          </div>
          <div>
            <span>持续时间</span
            ><b>{{
              formatDuration(
                dayjs(selectedReplay.last_event_at).diff(
                  selectedReplay.started_at,
                  'second',
                ),
              )
            }}</b>
          </div>
          <div>
            <span>事件数量</span><b>{{ replayEvents.length }}</b>
          </div>
        </div>
        <a-alert
          class="my-4"
          type="info"
          show-icon
          message="当前展示脱敏后的 rrweb 原始事件；接入 rrweb-player 后可直接可视化播放"
        />
        <a-collapse>
          <a-collapse-panel
            v-for="chunk in replayChunks"
            :key="chunk.sequence"
            :header="`分片 ${chunk.sequence} · ${chunk.events.length} 个事件`"
          >
            <pre>{{ JSON.stringify(chunk.events, null, 2) }}</pre>
          </a-collapse-panel>
        </a-collapse>
      </template>
    </a-drawer>
  </Page>
</template>

<style scoped>
.behavior-page {
  min-height: 100%;
}

.behavior-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding-bottom: 16px;
  margin-bottom: 18px;
  border-bottom: 1px solid #e2e5e9;
}

.behavior-header > div > span,
.panel-head span {
  font:
    600 11px ui-monospace,
    monospace;
  color: #7d8590;
  letter-spacing: 0.13em;
}

.behavior-header h1 {
  margin: 4px 0 2px;
  font-size: 29px;
  letter-spacing: -0.04em;
}

.behavior-header p {
  margin: 0;
  color: #737b85;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.site-select {
  width: 220px;
}

.behavior-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(330px, 0.75fr);
  gap: 14px;
}

.panel {
  padding: 18px;
  background: #fff;
  border: 1px solid #dfe3e7;
  border-radius: 10px;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.panel-head h2 {
  margin: 2px 0 0;
  font-size: 18px;
}

.panel-head small {
  color: #8c939c;
}

.path-select {
  width: 310px;
}

.heat-canvas {
  position: relative;
  height: 570px;
  margin-top: 16px;
  overflow: hidden;
  background: #f8f9fa;
  border: 1px solid #d9dde2;
  border-radius: 6px;
}

.browser-bar {
  display: flex;
  gap: 6px;
  align-items: center;
  height: 35px;
  padding: 0 10px;
  background: #eef0f2;
  border-bottom: 1px solid #dfe3e7;
}

.browser-bar i {
  width: 7px;
  height: 7px;
  background: #b8bec6;
  border-radius: 50%;
}

.browser-bar code {
  margin-left: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 10px;
  color: #858d96;
  white-space: nowrap;
}

.page-wireframe {
  padding: 22px;
}

.wire-nav {
  height: 18px;
  background: #dfe3e7;
  border-radius: 3px;
}

.wire-hero {
  display: flex;
  flex-direction: column;
  gap: 13px;
  align-items: center;
  justify-content: center;
  height: 220px;
  margin-top: 20px;
  border: 1px dashed #d6dbe1;
}

.wire-hero b {
  width: 46%;
  height: 24px;
  background: #d9dee4;
}

.wire-hero span {
  width: 62%;
  height: 8px;
  background: #e5e8eb;
}

.wire-hero button {
  width: 100px;
  height: 30px;
  background: #cfd5dc;
  border: 0;
  border-radius: 3px;
}

.wire-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 18px;
}

.wire-grid i {
  height: 135px;
  background: #f1f3f5;
  border: 1px solid #dde1e6;
}

.heat-point {
  position: absolute;
  z-index: 2;
  display: grid;
  place-items: center;
  background: radial-gradient(
    circle,
    #ef4444 0,
    #fb923c 38%,
    rgb(250 204 21 / 18%) 70%
  );
  border-radius: 50%;
  box-shadow: 0 0 18px rgb(239 68 68 / 25%);
  transform: translate(-50%, -50%);
}

.heat-point b {
  font:
    700 9px ui-monospace,
    monospace;
  color: #7f1d1d;
}

.heat-empty {
  position: absolute;
  inset: 45% 0 auto;
}

.heat-legend {
  display: flex;
  gap: 7px;
  align-items: center;
  margin-top: 10px;
  font-size: 11px;
  color: #8a929c;
}

.heat-legend i {
  width: 100px;
  height: 7px;
  background: linear-gradient(90deg, #fde68a, #fb923c, #ef4444);
  border-radius: 10px;
}

.heat-legend b {
  margin-left: auto;
  color: #343a42;
}

.replay-list {
  margin-top: 15px;
}

.replay-list button {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 13px 0;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-top: 1px solid #edf0f2;
}

.replay-list button:hover .replay-main b {
  color: #2563eb;
}

.play-mark {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  color: #fff;
  background: #15191e;
  border-radius: 50%;
}

.replay-main,
.replay-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.replay-main b {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.replay-main small,
.replay-meta small {
  color: #9299a2;
}

.replay-meta {
  text-align: right;
}

.replay-meta b {
  font-size: 11px;
}

.replay-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.replay-summary div {
  display: flex;
  flex-direction: column;
  padding: 12px;
  border: 1px solid #e4e7eb;
  border-radius: 5px;
}

.replay-summary span {
  font-size: 11px;
  color: #8a929b;
}

.replay-summary b {
  margin-top: 3px;
}

pre {
  max-height: 380px;
  padding: 12px;
  margin: 0;
  overflow: auto;
  font-size: 11px;
  color: #d5d9df;
  background: #101317;
}

@media (max-width: 1100px) {
  .behavior-grid {
    grid-template-columns: 1fr;
  }

  .heat-canvas {
    height: 500px;
  }
}

@media (max-width: 720px) {
  .behavior-header {
    flex-direction: column;
    gap: 14px;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
  }

  .site-select,
  .path-select {
    width: 100%;
  }

  .panel-head {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
