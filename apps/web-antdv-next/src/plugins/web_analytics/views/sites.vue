<script setup lang="ts">
import type { AnalyticsSite, SiteInput } from '../api';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAppConfig } from '@vben/hooks';
import { createIconifyIcon } from '@vben/icons';

import { message, Modal } from 'ant-design-vue';

import {
  createSiteApi,
  listSitesApi,
  runMaintenanceApi,
  updateSiteApi,
} from '../api';

const Add = createIconifyIcon('carbon:add');
const Code = createIconifyIcon('carbon:code');
const Copy = createIconifyIcon('carbon:copy');
const DataBase = createIconifyIcon('carbon:data-base');
const Edit = createIconifyIcon('carbon:edit');
const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

const loading = ref(false);
const saving = ref(false);
const modalOpen = ref(false);
const currentSite = ref<AnalyticsSite>();
const sites = ref<AnalyticsSite[]>([]);
const form = reactive<SiteInput>({
  name: '',
  domains: [],
  timezone: 'Asia/Shanghai',
  is_active: true,
  is_public: false,
  heatmap_enabled: true,
  replay_enabled: true,
  replay_sample_rate: 0.05,
  event_retention_days: 180,
  replay_retention_days: 30,
});

const modalTitle = computed(() =>
  currentSite.value ? `编辑 ${currentSite.value.name}` : '创建统计站点',
);

function resetForm(site?: AnalyticsSite) {
  Object.assign(
    form,
    site
      ? {
          name: site.name,
          domains: [...site.domains],
          timezone: site.timezone,
          is_active: site.is_active,
          is_public: site.is_public,
          heatmap_enabled: site.heatmap_enabled,
          replay_enabled: site.replay_enabled,
          replay_sample_rate: site.replay_sample_rate,
          event_retention_days: site.event_retention_days,
          replay_retention_days: site.replay_retention_days,
        }
      : {
          name: '',
          domains: [],
          timezone: 'Asia/Shanghai',
          is_active: true,
          is_public: false,
          heatmap_enabled: true,
          replay_enabled: true,
          replay_sample_rate: 0.05,
          event_retention_days: 180,
          replay_retention_days: 30,
        },
  );
}

async function loadSites() {
  loading.value = true;
  try {
    sites.value = await listSitesApi();
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  currentSite.value = undefined;
  resetForm();
  modalOpen.value = true;
}

function openEdit(site: AnalyticsSite) {
  currentSite.value = site;
  resetForm(site);
  modalOpen.value = true;
}

async function saveSite() {
  if (!form.name.trim() || form.domains.length === 0) {
    message.warning('请填写站点名称和至少一个允许域名');
    return;
  }
  saving.value = true;
  try {
    const payload = {
      ...form,
      domains: form.domains.map((item) => item.trim().toLowerCase()),
    };
    if (currentSite.value) await updateSiteApi(currentSite.value.id, payload);
    else await createSiteApi(payload);
    message.success(currentSite.value ? '站点配置已更新' : '统计站点已创建');
    modalOpen.value = false;
    await loadSites();
  } finally {
    saving.value = false;
  }
}

function snippet(site: AnalyticsSite) {
  const base = `${apiURL.replace(/\/$/, '')}/api/v1/analytics`;
  const closingTag = '</scr' + 'ipt>';
  return `<script defer src="${base}/script.js" data-site="${site.site_key}" data-endpoint="${base}">${closingTag}`;
}

async function copyText(value: string, label: string) {
  await navigator.clipboard.writeText(value);
  message.success(`${label}已复制`);
}

async function runMaintenance() {
  Modal.confirm({
    title: '执行统计维护',
    content: '将生成昨日汇总并清理超过各站点保留期的事件和回放数据',
    async onOk() {
      const result = await runMaintenanceApi();
      message.success(
        `已汇总 ${result.aggregated} 个站点，清理 ${result.events} 条事件、${result.replays} 条回放数据`,
      );
    },
  });
}

onMounted(loadSites);
</script>

<template>
  <Page auto-content-height>
    <div class="sites-page">
      <header class="sites-header">
        <div>
          <span>SITE REGISTRY</span>
          <h1>站点管理</h1>
          <p>一个统计中心，管理多个网站的数据边界与采集策略</p>
        </div>
        <div class="actions">
          <a-button @click="runMaintenance">
            <DataBase class="size-4" />执行维护 </a-button
          ><a-button type="primary" @click="openCreate">
            <Add class="size-4" />新增站点
          </a-button>
        </div>
      </header>

      <a-spin :spinning="loading">
        <div v-if="sites.length > 0" class="site-grid">
          <article v-for="site in sites" :key="site.id" class="site-card">
            <div class="site-card-head">
              <div class="site-identity">
                <div class="site-mark">{{ site.name.slice(0, 1) }}</div>
                <div>
                  <h2>{{ site.name }}</h2>
                  <code>{{ site.site_key }}</code>
                </div>
              </div>
              <a-tag :color="site.is_active ? 'green' : 'default'">
                {{ site.is_active ? '运行中' : '已停用' }}
              </a-tag>
            </div>
            <div class="domain-list">
              <span v-for="domain in site.domains" :key="domain">{{
                domain
              }}</span>
            </div>
            <div class="site-specs">
              <div>
                <span>时区</span><strong>{{ site.timezone }}</strong>
              </div>
              <div>
                <span>回放采样</span
                ><strong
                  >{{ (site.replay_sample_rate * 100).toFixed(0) }}%</strong
                >
              </div>
              <div>
                <span>事件保留</span
                ><strong>{{ site.event_retention_days }} 天</strong>
              </div>
              <div>
                <span>回放保留</span
                ><strong>{{ site.replay_retention_days }} 天</strong>
              </div>
            </div>
            <div class="feature-flags">
              <a-tag>{{ site.is_public ? '公开计数' : '私有计数' }}</a-tag
              ><a-tag>
                {{ site.heatmap_enabled ? '热力图开启' : '热力图关闭' }} </a-tag
              ><a-tag>
                {{ site.replay_enabled ? '回放开启' : '回放关闭' }}
              </a-tag>
            </div>
            <div class="site-actions">
              <a-button
                size="small"
                @click="copyText(site.site_key, 'Site Key')"
              >
                <Copy class="size-4" />Key </a-button
              ><a-button
                size="small"
                @click="copyText(snippet(site), '接入代码')"
              >
                <Code class="size-4" />接入代码 </a-button
              ><a-button size="small" @click="openEdit(site)">
                <Edit class="size-4" />配置
              </a-button>
            </div>
          </article>
        </div>
        <a-empty v-else description="还没有统计站点">
          <a-button type="primary" @click="openCreate">
            创建第一个站点
          </a-button>
        </a-empty>
      </a-spin>
    </div>

    <a-modal
      v-model:open="modalOpen"
      :title="modalTitle"
      :confirm-loading="saving"
      width="680px"
      @ok="saveSite"
    >
      <a-form layout="vertical" class="site-form">
        <div class="form-grid">
          <a-form-item label="站点名称" required>
            <a-input
              v-model:value="form.name"
              placeholder="例如：启航学堂"
            /> </a-form-item
          ><a-form-item label="统计时区">
            <a-select v-model:value="form.timezone">
              <a-select-option value="Asia/Shanghai">
                Asia/Shanghai </a-select-option
              ><a-select-option value="UTC">UTC</a-select-option
              ><a-select-option value="Asia/Hong_Kong">
                Asia/Hong_Kong
              </a-select-option>
            </a-select>
          </a-form-item>
        </div>
        <a-form-item
          label="允许上报的域名"
          required
          extra="只填写域名，不包含协议、端口和路径"
        >
          <a-select
            v-model:value="form.domains"
            mode="tags"
            placeholder="example.com"
          />
        </a-form-item>
        <div class="form-grid">
          <a-form-item label="回放采样率">
            <a-input-number
              v-model:value="form.replay_sample_rate"
              :min="0"
              :max="1"
              :step="0.01"
              class="w-full"
            /><small>0.05 表示 5%</small> </a-form-item
          ><a-form-item label="事件保留天数">
            <a-input-number
              v-model:value="form.event_retention_days"
              :min="1"
              :max="3650"
              class="w-full"
            /> </a-form-item
          ><a-form-item label="回放保留天数">
            <a-input-number
              v-model:value="form.replay_retention_days"
              :min="1"
              :max="365"
              class="w-full"
            />
          </a-form-item>
        </div>
        <div class="switch-grid">
          <div>
            <span>站点启用</span><a-switch v-model:checked="form.is_active" />
          </div>
          <div>
            <span>公开计数器</span><a-switch v-model:checked="form.is_public" />
          </div>
          <div>
            <span>点击热力图</span
            ><a-switch v-model:checked="form.heatmap_enabled" />
          </div>
          <div>
            <span>会话回放</span
            ><a-switch v-model:checked="form.replay_enabled" />
          </div>
        </div>
      </a-form>
    </a-modal>
  </Page>
</template>

<style scoped>
.sites-page {
  min-height: 100%;
}

.sites-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding-bottom: 16px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e3e6ea;
}

.sites-header span {
  font:
    600 11px ui-monospace,
    monospace;
  color: #7b8490;
  letter-spacing: 0.13em;
}

.sites-header h1 {
  margin: 4px 0 2px;
  font-size: 29px;
  letter-spacing: -0.04em;
}

.sites-header p {
  margin: 0;
  color: #737b85;
}

.actions,
.site-actions {
  display: flex;
  gap: 8px;
}

.site-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.site-card {
  padding: 20px;
  background: #fff;
  border: 1px solid #dfe3e8;
  border-radius: 10px;
}

.site-card-head,
.site-identity {
  display: flex;
  align-items: center;
}

.site-card-head {
  justify-content: space-between;
}

.site-identity {
  gap: 12px;
}

.site-mark {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  font-size: 19px;
  font-weight: 700;
  color: white;
  background: #11151a;
  border-radius: 8px;
}

.site-card h2 {
  margin: 0;
  font-size: 17px;
}

.site-card code {
  font-size: 11px;
  color: #858d97;
}

.domain-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-content: flex-start;
  min-height: 57px;
  margin: 18px 0 14px;
}

.domain-list span {
  padding: 4px 8px;
  font:
    500 11px ui-monospace,
    monospace;
  background: #f8f9fa;
  border: 1px solid #e2e6ea;
  border-radius: 4px;
}

.site-specs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-block: 1px solid #e8ebee;
}

.site-specs div {
  padding: 13px 8px;
  border-right: 1px solid #e8ebee;
}

.site-specs div:last-child {
  border: 0;
}

.site-specs span,
.site-specs strong {
  display: block;
}

.site-specs span {
  font-size: 11px;
  color: #8a929c;
}

.site-specs strong {
  margin-top: 3px;
  font-size: 12px;
}

.feature-flags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 14px 0;
}

.site-actions {
  justify-content: flex-end;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.form-grid:has(> :nth-child(3)) {
  grid-template-columns: repeat(3, 1fr);
}

.switch-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.switch-grid div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid #e4e7eb;
  border-radius: 6px;
}

@media (max-width: 900px) {
  .site-grid {
    grid-template-columns: 1fr;
  }

  .sites-header {
    flex-direction: column;
    gap: 14px;
    align-items: flex-start;
  }

  .site-specs {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
