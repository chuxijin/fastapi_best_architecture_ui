<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';
import type { EchartsUIType } from '@vben/plugins/echarts';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  AppApplicationResult,
  ApplicationTrendData,
  CreateAppApplicationParams,
} from '#/api';

import { computed, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createAppApplicationApi,
  deleteAppApplicationApi,
  getAppApplicationListApi,
  getApplicationRegistrationTrendApi,
  updateAppApplicationApi,
} from '#/api';

import { querySchema, schema, useColumns } from './data';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: $t('common.search'),
  },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<AppApplicationResult> = {
  rowConfig: {
    keyField: 'id',
  },
  checkboxConfig: {
    highlight: true,
  },
  height: 'auto',
  exportConfig: {},
  printConfig: {},
  toolbarConfig: {
    export: true,
    print: true,
    refresh: { code: 'query' },
    custom: true,
    zoom: true,
  },
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getAppApplicationListApi({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

function onRefresh() {
  gridApi.query();
}

function onActionClick({
  code,
  row,
}: OnActionClickParams<AppApplicationResult>) {
  switch (code) {
    case 'delete': {
      deleteAppApplicationApi(row.id).then(() => {
        message.success({
          content: $t('ui.actionMessage.deleteSuccess', [row.name]),
          key: 'action_process_msg',
        });
        onRefresh();
      });
      break;
    }
    case 'edit': {
      modalApi.setData(row).open();
      break;
    }
    case 'view': {
      showTrendModal(row);
      break;
    }
  }
}

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema,
});

interface FormAppApplicationParams extends CreateAppApplicationParams {
  id?: number;
}

const formData = ref<FormAppApplicationParams>();

const modalTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['应用'])
    : $t('ui.actionTitle.create', ['应用']);
});

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = await formApi.getValues<CreateAppApplicationParams>();
      try {
        await (formData.value?.id
          ? updateAppApplicationApi(formData.value?.id, data)
          : createAppApplicationApi(data));
        await modalApi.close();
        onRefresh();
      } finally {
        modalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<FormAppApplicationParams>();
      formApi.resetForm();
      if (data) {
        formData.value = data;
        formApi.setValues(data);
      }
    }
  },
});

// 趋势图相关
const trendData = ref<ApplicationTrendData | null>(null);
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

const [TrendModal, trendModalApi] = useVbenModal({
  title: '应用注册趋势',
  destroyOnClose: true,
  onOpenChange(isOpen) {
    if (isOpen && trendData.value) {
      // 延迟渲染图表，确保DOM已挂载
      setTimeout(() => {
        renderTrendChart();
      }, 100);
    }
  },
});

async function showTrendModal(app: AppApplicationResult) {
  try {
    const data = await getApplicationRegistrationTrendApi(app.id, 30);
    trendData.value = data;
    trendModalApi.open();
  } catch {
    message.error('获取趋势数据失败');
  }
}

function renderTrendChart() {
  if (!trendData.value) return;

  const dates = trendData.value.trend_data.map((item) => item.date);
  const counts = trendData.value.trend_data.map((item) => item.count);
  const maxCount = Math.max(...counts);

  renderEcharts({
    title: {
      text: `${trendData.value.application_name} - 注册趋势`,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
      },
    },
    grid: {
      bottom: '10%',
      containLabel: true,
      left: '3%',
      right: '4%',
      top: '15%',
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const data = params[0];
        return `${data.axisValue}<br/>注册数量: ${data.value}`;
      },
      axisPointer: {
        lineStyle: {
          color: '#1890ff',
          width: 1,
        },
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisTick: {
        show: false,
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
          color: '#e8e8e8',
        },
      },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      max: maxCount > 0 ? Math.ceil(maxCount * 1.2) : 10,
      axisTick: {
        show: false,
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(250,250,250,0.1)', 'rgba(200,200,200,0.1)'],
        },
      },
      splitNumber: 4,
    },
    series: [
      {
        name: '注册数量',
        type: 'line',
        smooth: true,
        data: counts,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(24, 144, 255, 0.3)',
              },
              {
                offset: 1,
                color: 'rgba(24, 144, 255, 0.1)',
              },
            ],
          },
        },
        itemStyle: {
          color: '#1890ff',
        },
        lineStyle: {
          width: 2,
        },
        symbol: 'circle',
        symbolSize: 6,
      },
    ],
  });
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="() => modalApi.setData(null).open()">
          <MaterialSymbolsAdd class="size-5" />
          新增应用
        </VbenButton>
      </template>
    </Grid>

    <Modal :title="modalTitle">
      <Form />
    </Modal>

    <!-- 趋势图弹窗 -->
    <TrendModal>
      <div v-if="trendData" class="trend-container">
        <!-- 统计信息 -->
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">应用名称</div>
            <div class="stat-value">{{ trendData.application_name }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">总注册数</div>
            <div class="stat-value">{{ trendData.total_registrations }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">活跃设备</div>
            <div class="stat-value">{{ trendData.active_devices }}</div>
          </div>
        </div>

        <!-- 趋势图表 -->
        <div class="chart-container">
          <EchartsUI ref="chartRef" />
        </div>
      </div>
    </TrendModal>
  </Page>
</template>

<style scoped>
.trend-container {
  padding: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  padding: 16px;
  text-align: center;
  background: #f5f5f5;
  border-radius: 8px;
}

.stat-label {
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #1890ff;
}

.chart-container {
  height: 400px;
  margin-top: 16px;
}
</style>
