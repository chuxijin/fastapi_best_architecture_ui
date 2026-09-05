<script setup lang="ts">
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { AnalyticsOverview, DailyTrend, DimensionItem } from '../api';

import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { getDimensionsApi, getOverviewApi, getTrendApi } from '../api';
import { formatDuration, formatMetric, useAnalyticsSites } from './shared';

const Activity = createIconifyIcon('carbon:activity');
const ArrowUpRight = createIconifyIcon('carbon:arrow-up-right');
const Cursor = createIconifyIcon('carbon:cursor-1');
const Network = createIconifyIcon('carbon:network-4');
const Renew = createIconifyIcon('carbon:renew');
const UserMultiple = createIconifyIcon('carbon:user-multiple');

const { loadSites, selectedSite, selectedSiteId, sites, sitesLoading } =
  useAnalyticsSites();
const loading = ref(false);
const days = ref(30);
const overview = ref<AnalyticsOverview>();
const trend = ref<DailyTrend[]>([]);
const pages = ref<DimensionItem[]>([]);
const referrers = ref<DimensionItem[]>([]);
const devices = ref<DimensionItem[]>([]);
const browsers = ref<DimensionItem[]>([]);
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

const range = computed(() => ({
  end: dayjs().endOf('day').toISOString(),
  end_date: dayjs().format('YYYY-MM-DD'),
  start: dayjs()
    .subtract(days.value - 1, 'day')
    .startOf('day')
    .toISOString(),
  start_date: dayjs()
    .subtract(days.value - 1, 'day')
    .format('YYYY-MM-DD'),
}));

const metricCards = computed(() => [
  {
    label: '页面浏览',
    value: overview.value?.pv ?? 0,
    helper: 'PV',
    icon: Cursor,
    tone: 'ink',
  },
  {
    label: '独立访客',
    value: overview.value?.uv ?? 0,
    helper: 'UV',
    icon: UserMultiple,
    tone: 'blue',
  },
  {
    label: '访问会话',
    value: overview.value?.sessions ?? 0,
    helper: 'SESSION',
    icon: Network,
    tone: 'violet',
  },
  {
    label: '当前在线',
    value: overview.value?.active_visitors ?? 0,
    helper: '5 MIN',
    icon: Activity,
    tone: 'green',
  },
]);

const secondaryMetrics = computed(() => [
  { label: '独立 IP', value: formatMetric(overview.value?.ip ?? 0) },
  { label: '互动事件', value: formatMetric(overview.value?.events ?? 0) },
  { label: '跳出率', value: `${overview.value?.bounce_rate ?? 0}%` },
  {
    label: '平均停留',
    value: formatDuration(overview.value?.average_duration_seconds ?? 0),
  },
]);

function renderTrend() {
  renderEcharts({
    animationDuration: 500,
    color: ['#111827', '#2563eb', '#a78bfa'],
    tooltip: { trigger: 'axis' },
    legend: { data: ['PV', 'UV', '会话'], right: 8, top: 0 },
    grid: { left: 8, right: 12, top: 42, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trend.value.map((item) => dayjs(item.date).format('MM/DD')),
      axisLine: { lineStyle: { color: '#d1d5db' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: '#eef0f3', type: 'dashed' } },
    },
    series: [
      {
        name: 'PV',
        type: 'line',
        smooth: 0.28,
        symbol: 'none',
        lineStyle: { width: 3 },
        data: trend.value.map((item) => item.pv),
      },
      {
        name: 'UV',
        type: 'line',
        smooth: 0.28,
        symbol: 'none',
        lineStyle: { width: 2 },
        data: trend.value.map((item) => item.uv),
      },
      {
        name: '会话',
        type: 'line',
        smooth: 0.28,
        symbol: 'none',
        lineStyle: { width: 2, type: 'dashed' },
        data: trend.value.map((item) => item.sessions),
      },
    ],
  });
}

async function loadData() {
  if (!selectedSiteId.value) return;
  loading.value = true;
  try {
    const siteId = selectedSiteId.value;
    const timeParams = { start: range.value.start, end: range.value.end };
    [
      overview.value,
      trend.value,
      pages.value,
      referrers.value,
      devices.value,
      browsers.value,
    ] = await Promise.all([
      getOverviewApi(siteId, timeParams),
      getTrendApi(siteId, {
        start_date: range.value.start_date,
        end_date: range.value.end_date,
      }),
      getDimensionsApi(siteId, { ...timeParams, dimension: 'page', limit: 8 }),
      getDimensionsApi(siteId, {
        ...timeParams,
        dimension: 'referrer',
        limit: 8,
      }),
      getDimensionsApi(siteId, {
        ...timeParams,
        dimension: 'device',
        limit: 6,
      }),
      getDimensionsApi(siteId, {
        ...timeParams,
        dimension: 'browser',
        limit: 6,
      }),
    ]);
    await nextTick();
    renderTrend();
  } catch {
    message.error('加载网站统计失败');
  } finally {
    loading.value = false;
  }
}

watch([selectedSiteId, days], loadData);
onMounted(async () => {
  await loadSites();
  await loadData();
});
</script>

<template>
  <Page auto-content-height>
    <div class="analytics-page" :class="{ 'is-loading': loading }">
      <header class="analytics-header">
        <div>
          <div class="eyebrow">WEB ANALYTICS / REALTIME</div>
          <h1>{{ selectedSite?.name || '网站统计' }}</h1>
          <p>从一次访问，到完整的来源、设备和行为路径</p>
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
          </a-select>
          <a-segmented
            v-model:value="days"
            :options="[
              { label: '7 天', value: 7 },
              { label: '30 天', value: 30 },
              { label: '90 天', value: 90 },
            ]"
          />
          <a-button :loading="loading" @click="loadData">
            <Renew class="size-4" />刷新
          </a-button>
        </div>
      </header>

      <a-empty
        v-if="sites.length === 0 && !sitesLoading"
        description="还没有统计站点，请先到站点管理创建"
      />
      <template v-else>
        <section class="metric-grid">
          <article
            v-for="metric in metricCards"
            :key="metric.label"
            class="metric-card"
            :data-tone="metric.tone"
          >
            <div class="metric-top">
              <span>{{ metric.helper }}</span
              ><component :is="metric.icon" class="size-5" />
            </div>
            <strong>{{ formatMetric(metric.value) }}</strong>
            <div class="metric-label">
              {{ metric.label }}<ArrowUpRight class="size-4" />
            </div>
          </article>
        </section>

        <section class="secondary-strip">
          <div v-for="item in secondaryMetrics" :key="item.label">
            <span>{{ item.label }}</span
            ><strong>{{ item.value }}</strong>
          </div>
        </section>

        <section class="panel trend-panel">
          <div class="panel-head">
            <div>
              <span>TRAFFIC CURVE</span>
              <h2>访问趋势</h2>
            </div>
            <small>{{ days }} 天窗口</small>
          </div>
          <EchartsUI ref="chartRef" class="trend-chart" />
        </section>

        <section class="ranking-grid">
          <article class="panel ranking-panel">
            <div class="panel-head">
              <div>
                <span>CONTENT</span>
                <h2>热门页面</h2>
              </div>
            </div>
            <div class="rank-list">
              <div
                v-for="(item, index) in pages"
                :key="item.name"
                class="rank-row"
              >
                <i>{{ String(index + 1).padStart(2, '0') }}</i
                ><span :title="item.name">{{ item.name }}</span
                ><strong>{{ formatMetric(item.value) }}</strong>
              </div>
              <a-empty
                v-if="pages.length === 0"
                :image="false"
                description="暂无数据"
              />
            </div>
          </article>
          <article class="panel ranking-panel">
            <div class="panel-head">
              <div>
                <span>ACQUISITION</span>
                <h2>访问来源</h2>
              </div>
            </div>
            <div class="rank-list">
              <div
                v-for="(item, index) in referrers"
                :key="item.name"
                class="rank-row"
              >
                <i>{{ String(index + 1).padStart(2, '0') }}</i
                ><span>{{ item.name }}</span
                ><strong>{{ formatMetric(item.value) }}</strong>
              </div>
              <a-empty
                v-if="referrers.length === 0"
                :image="false"
                description="暂无来源"
              />
            </div>
          </article>
          <article class="panel ranking-panel compact">
            <div class="panel-head">
              <div>
                <span>ENVIRONMENT</span>
                <h2>设备与浏览器</h2>
              </div>
            </div>
            <div class="dimension-block">
              <h3>设备</h3>
              <div v-for="item in devices" :key="item.name">
                <span>{{ item.name }}</span
                ><b>{{ item.value }}</b>
              </div>
            </div>
            <div class="dimension-block">
              <h3>浏览器</h3>
              <div v-for="item in browsers" :key="item.name">
                <span>{{ item.name }}</span
                ><b>{{ item.value }}</b>
              </div>
            </div>
          </article>
        </section>
      </template>
    </div>
  </Page>
</template>

<style scoped>
.analytics-page {
  --ink: #101318;
  --line: #e3e6ea;

  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 100%;
  color: var(--ink);
  transition: opacity 0.2s;
}

.analytics-page.is-loading {
  opacity: 0.72;
}

.analytics-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 6px 2px 14px;
  border-bottom: 1px solid var(--line);
}

.eyebrow,
.panel-head span {
  font:
    600 11px/1.4 ui-monospace,
    monospace;
  color: #77808c;
  letter-spacing: 0.13em;
}

.analytics-header h1 {
  margin: 4px 0 2px;
  font-size: 30px;
  line-height: 1.1;
  letter-spacing: -0.04em;
}

.analytics-header p {
  margin: 0;
  color: #707782;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.site-select {
  width: 210px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.metric-card {
  min-height: 154px;
  padding: 18px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 10px;
}

.metric-card[data-tone='ink'] {
  color: #fff;
  background: #12151a;
}

.metric-card[data-tone='blue'] {
  background: #e8f0ff;
}

.metric-card[data-tone='violet'] {
  background: #f1edff;
}

.metric-card[data-tone='green'] {
  background: #e6f7ee;
}

.metric-top,
.metric-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.metric-top span {
  font:
    600 10px ui-monospace,
    monospace;
  letter-spacing: 0.12em;
  opacity: 0.65;
}

.metric-card strong {
  display: block;
  margin: 24px 0 10px;
  font-size: 36px;
  line-height: 1;
  letter-spacing: -0.05em;
}

.metric-label {
  font-size: 14px;
  font-weight: 600;
}

.secondary-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 8px;
}

.secondary-strip div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 18px;
  border-right: 1px solid var(--line);
}

.secondary-strip div:last-child {
  border: 0;
}

.secondary-strip span {
  color: #78808a;
}

.panel {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 10px;
}

.trend-panel {
  padding: 18px;
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
  color: #8b929b;
}

.trend-chart {
  height: 310px;
}

.ranking-grid {
  display: grid;
  grid-template-columns: 1.25fr 1fr 0.85fr;
  gap: 12px;
}

.ranking-panel {
  min-height: 320px;
  padding: 18px;
}

.rank-list {
  margin-top: 15px;
}

.rank-row {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  padding: 10px 0;
  border-top: 1px solid #edf0f2;
}

.rank-row i {
  font:
    500 11px ui-monospace,
    monospace;
  color: #9ca3ad;
}

.rank-row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-row strong {
  font-size: 13px;
}

.dimension-block {
  margin-top: 16px;
}

.dimension-block h3 {
  margin: 0 0 7px;
  font-size: 12px;
  color: #8a919a;
}

.dimension-block div {
  display: flex;
  justify-content: space-between;
  padding: 7px 0;
  border-top: 1px solid #edf0f2;
}

.dimension-block b {
  font:
    600 12px ui-monospace,
    monospace;
}

@media (max-width: 1100px) {
  .analytics-header {
    flex-direction: column;
    gap: 14px;
    align-items: flex-start;
  }

  .metric-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .ranking-grid {
    grid-template-columns: 1fr 1fr;
  }

  .ranking-grid .compact {
    grid-column: 1/-1;
  }
}

@media (max-width: 720px) {
  .header-actions {
    flex-wrap: wrap;
    width: 100%;
  }

  .site-select {
    flex: 1;
  }

  .metric-grid,
  .secondary-strip,
  .ranking-grid {
    grid-template-columns: 1fr;
  }

  .secondary-strip div {
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }

  .ranking-grid .compact {
    grid-column: auto;
  }
}
</style>
