<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OnActionClickParams } from '#/adapter/vxe-table';
import type {
  ResourceDetail,
  ResourceListParams,
  CreateResourceParams,
  UpdateResourceParams,
  ResourceViewTrendData,
  CoulddriveDriveAccountDetail,
  CoulddriveUserListParams,
  ResourceStatistics,
  ResourceViewTrendResponse,
  SmartRecognitionResponse,
} from '#/api';

import { ref, computed, onMounted } from 'vue';

import { Page, VbenButton, useVbenModal } from '@vben/common-ui';
import { AddData } from '@vben/icons';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getResourceListApi,
  createResourceApi,
  updateResourceApi,
  deleteResourceApi,
  getResourceStatisticsApi,
  getResourceViewTrendApi,
  getDomainSubjectMappingApi,
  getSubjectsByDomainApi,
  getCoulddriveUserListApi,
  DOMAIN_SUBJECT_MAPPING,
  RESOURCE_TYPE_OPTIONS,
  DRIVE_TYPE_OPTIONS,
  refreshResourceShareInfoApi,
  smartRecognitionApi,
  TEACHER_MAPPINGS,
} from '#/api';
import {
  resourceQuerySchema,
  useResourceColumns,
  createResourceFormSchema,
} from './data';

// 创建图标组件
const Edit = createIconifyIcon('mdi:pencil');
const Delete = createIconifyIcon('mdi:delete');
const Eye = createIconifyIcon('mdi:eye');
const Database = createIconifyIcon('mdi:database');

// 编辑状态
const editingResourceId = ref<number | null>(null);

// 查看详情状态
const viewResourceData = ref<any>(null);

// 趋势图状态
const trendResourceData = ref<any>(null);
const trendChartData = ref<any[]>([]);
const chartRef = ref();
const { renderEcharts } = useEcharts(chartRef);

// 统计信息
const statsData = ref<ResourceStatistics | null>(null);

// 领域科目映射数据
const domainSubjectMapping = ref<any>(null);

// 智能识别相关状态
const recognitionUrl = ref('');
const isRecognizing = ref(false);

// 更新分享信息状态
const isRefreshing = ref(false);

// 账号选项
const accountOptions = ref<Array<{ label: string; value: number; cookies: string }>>([]);

// 查询表单配置
const queryFormOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: $t('page.form.query'),
  },
  schema: resourceQuerySchema,
};

// 表格配置
const gridOptions: VxeTableGridOptions = {
  rowConfig: {
    keyField: 'id',
  },
  checkboxConfig: {
    highlight: true,
  },
  height: 'auto',
  // 启用列宽自动调整
  columnConfig: {
    resizable: true,
    isCurrent: true,
  },
  // 设置最小高度
  minHeight: 400,
  exportConfig: {},
  printConfig: {},
  toolbarConfig: {
    export: true,
    print: true,
    refresh: { code: 'query' },
    custom: true,
    zoom: true,
  },
  columns: useResourceColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        try {
          const params: ResourceListParams = {
            page: page.currentPage,
            size: page.pageSize,
            ...formValues,
          };

          const response = await getResourceListApi(params);
          return response;
        } catch (error) {
          console.error('❌ 获取资源列表失败:', error);
          message.error('获取资源列表失败');
          return {
            items: [],
            total: 0,
          };
        }
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: queryFormOptions,
  gridOptions
});

// 编辑表单配置（用于模态框中的表单）
const [Form, formApi] = useVbenForm({
  wrapperClass: 'grid-cols-1 md:grid-cols-2',
  showDefaultActions: false,
  schema: createResourceFormSchema(),
});

// 表单数据
const formData = ref({
  domain: '',
  subject: '',
  main_name: '',
  resource_type: '',
  url: '',
  url_type: '',
  user_id: null as number | null,
  description: '',
  resource_intro: '',
  resource_image: '',
  extract_code: '',
  is_temp_file: false,
  price: undefined,
  suggested_price: undefined,
  sort: 0,
  remark: '',
});

// 创建编辑模态框
const [EditModal, editModalApi] = useVbenModal({
  class: 'w-[800px]',
  destroyOnClose: true,
  async onConfirm() {
    // 简单验证
    if (!formData.value.domain.trim()) {
      message.error('请选择领域');
      return;
    }
    if (!formData.value.subject.trim()) {
      message.error('请选择科目');
      return;
    }
    if (!formData.value.main_name.trim()) {
      message.error('请输入主要名字');
      return;
    }
    if (!formData.value.url.trim()) {
      message.error('请输入资源链接');
      return;
    }
    if (!formData.value.url_type.trim()) {
      message.error('请选择网盘类型');
      return;
    }
    if (!formData.value.user_id) {
      message.error('请选择关联账号');
      return;
    }

    editModalApi.lock();
    try {
      // 构造API需要的数据格式，过滤掉空字符串和 null 值
      const rawData = {
        domain: formData.value.domain,
        subject: formData.value.subject,
        main_name: formData.value.main_name,
        resource_type: formData.value.resource_type,
        url: formData.value.url,
        url_type: formData.value.url_type,
        user_id: formData.value.user_id,
        description: formData.value.description,
        resource_intro: formData.value.resource_intro,
        resource_image: formData.value.resource_image,
        extract_code: formData.value.extract_code,
        is_temp_file: formData.value.is_temp_file,
        price: formData.value.price,
        suggested_price: formData.value.suggested_price,
        sort: formData.value.sort,
        remark: formData.value.remark,
      };

      // 过滤掉空字符串、null 和 undefined 值
      const apiData: CreateResourceParams | UpdateResourceParams = {};
      Object.entries(rawData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          (apiData as any)[key] = value;
        }
      });

      // 确保必填字段存在（对于新增）
      if (!editingResourceId.value) {
        // 新增时必须包含 user_id
        if (formData.value.user_id) {
          (apiData as any).user_id = formData.value.user_id;
        }
      }

      if (editingResourceId.value) {
        await updateResourceApi(editingResourceId.value, apiData);
        message.success('资源更新成功');
      } else {
        await createResourceApi(apiData as CreateResourceParams);
        message.success('资源创建成功');
      }

      await editModalApi.close();
      onRefresh();
      await fetchStats();
    } catch (error) {
      message.error(editingResourceId.value ? '更新失败' : '创建失败');
    } finally {
      editModalApi.unlock();
    }
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = editModalApi.getData();
      if (data) {
        editingResourceId.value = data.id;
        Object.assign(formData.value, data);

        // 如果有领域数据，需要更新科目选项
        if (data.domain) {
          updateSubjectOptions(data.domain);
        }
      } else {
        editingResourceId.value = null;
        // 重置表单数据
        Object.assign(formData.value, {
          domain: '',
          subject: '',
          main_name: '',
          resource_type: '',
          url: '',
          url_type: '',
          user_id: null,
          description: '',
          resource_intro: '',
          resource_image: '',
          extract_code: '',
          is_temp_file: false,
          price: undefined,
          suggested_price: undefined,
          sort: 0,
          remark: '',
        });
      }
    }
  },
});

// 更新科目选项的函数
function updateSubjectOptions(domain: string) {
  if (domain && DOMAIN_SUBJECT_MAPPING[domain as keyof typeof DOMAIN_SUBJECT_MAPPING]) {
    const subjectOptions = DOMAIN_SUBJECT_MAPPING[domain as keyof typeof DOMAIN_SUBJECT_MAPPING];

    // 更新表单中科目字段的选项
    formApi.updateSchema([
      {
        fieldName: 'subject',
        componentProps: {
          options: subjectOptions,
          placeholder: '请选择科目',
        },
      },
    ]);
  }
}

// 监听领域变化
function onDomainChange(domain: string) {
  formData.value.subject = ''; // 清空科目
  updateSubjectOptions(domain);
}

// 创建查看详情模态框
const [ViewModal, viewModalApi] = useVbenModal({
  class: 'w-[900px]',
  destroyOnClose: true,
  closable: false, // 隐藏关闭按钮
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = viewModalApi.getData();
      if (data) {
        viewResourceData.value = data;
      }
    }
  },
});

// 创建趋势模态框
const [TrendModal, trendModalApi] = useVbenModal({
  class: 'w-[1000px]',
  destroyOnClose: true,
  closable: false, // 隐藏关闭按钮
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = trendModalApi.getData();
      if (data) {
        trendResourceData.value = data;
        trendChartData.value = []; // 重置图表数据
        // 注意：这里不要重复调用 fetchTrendData，在 onActionClick 中已经调用了
      }
    }
  },
});

// 操作处理
async function onActionClick({ code, row }: OnActionClickParams) {
  switch (code) {
    case 'edit':
      editingResourceId.value = row.id;
      Object.assign(formData.value, row);
      editModalApi.setData(row);
      editModalApi.open();
      break;
    case 'delete':
      await handleDelete(row);
      break;
    case 'view':
      // 查看详情功能
      viewResourceData.value = row;
      viewModalApi.setData(row);
      viewModalApi.open();
      break;
    case 'trend':
      // 查看趋势功能
      trendResourceData.value = row;
      trendChartData.value = []; // 重置图表数据
      trendModalApi.setData(row);
      trendModalApi.open();
      // 获取趋势数据
      await fetchTrendData(row);
      break;
  }
}

// 删除处理
async function handleDelete(row: any) {
  try {
    await deleteResourceApi(row.id);
    message.success('删除成功');
    onRefresh();
    await fetchStats();
  } catch (error) {
    message.error('删除失败');
  }
}

// 刷新表格
function onRefresh() {
  gridApi.query();
}

// 新增资源
function onCreate() {
  editingResourceId.value = null;
  recognitionUrl.value = ''; // 重置智能识别输入框
  Object.assign(formData.value, {
    domain: '',
    subject: '',
    main_name: '',
    resource_type: '',
    url: '',
    url_type: '',
    user_id: null,
    description: '',
    resource_intro: '',
    resource_image: '',
    extract_code: '',
    is_temp_file: false,
    price: undefined,
    suggested_price: undefined,
    sort: 0,
    remark: '',
  });
  editModalApi.setData(null);
  editModalApi.open();
}

// 获取统计信息
async function fetchStats() {
  try {
    const response = await getResourceStatisticsApi();
    statsData.value = response;
  } catch (error) {
    console.error('获取统计数据失败:', error);
    message.error('获取统计数据失败');
  }
}

// 获取领域科目映射
async function fetchDomainSubjectMapping() {
  try {
    const response = await getDomainSubjectMappingApi();
    domainSubjectMapping.value = response;
  } catch (error) {
    console.error('获取领域科目映射失败:', error);
  }
}

// 复制到剪贴板
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    message.success('已复制到剪贴板');
  } catch (error) {
    message.error('复制失败');
  }
}

// 从查看详情中编辑资源
function editResource(resourceData: any) {
  viewModalApi.close();
  editingResourceId.value = resourceData.id;
  Object.assign(formData.value, resourceData);
  editModalApi.setData(resourceData);
  editModalApi.open();
}

// 处理图片加载错误
function handleImageError(event: Event) {
  const target = event.target as HTMLImageElement;
  if (target) {
    target.style.display = 'none';
  }
}

// 格式化时间为项目标准格式 'YYYY-MM-DD HH:mm:ss'
function formatDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 获取趋势数据
async function fetchTrendData(resourceData: any) {
  try {
    if (!resourceData.pwd_id) {
      message.error('资源缺少必要的标识信息');
      return;
    }

    // 设置时间范围（最近30天）
    const endTime = new Date();
    endTime.setHours(23, 59, 59, 999); // 设置为当天的23:59:59.999

    const startTime = new Date();
    startTime.setDate(startTime.getDate() - 30);
    startTime.setHours(0, 0, 0, 0); // 设置为30天前的00:00:00.000

    // 调用真实的 API 获取趋势数据
    const trendResponse = await getResourceViewTrendApi({
      pwd_id: resourceData.pwd_id,
      start_time: formatDateTime(startTime),
      end_time: formatDateTime(endTime),
    });

    // 转换数据格式
    const chartData = trendResponse.trend_data.map((item: ResourceViewTrendData) => ({
      date: new Date(item.record_time).toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(/\//g, '-'),
      views: item.view_count,
    }));

    trendChartData.value = chartData;

    // 渲染图表
    setTimeout(() => {
      renderTrendChart();
    }, 100);
  } catch (error) {
    console.error('获取趋势数据失败:', error);
    message.error('获取趋势数据失败');
  }
}

// 渲染趋势图表
function renderTrendChart() {
  if (!chartRef.value) return;

  if (!trendChartData.value || trendChartData.value.length === 0) {
    // 没有数据时显示提示
    renderEcharts({
      title: {
        text: '浏览量趋势',
        left: 'center',
      },
      graphic: {
        type: 'text',
        left: 'center',
        top: 'middle',
        style: {
          text: '暂无浏览量历史数据',
          fontSize: 16,
          fill: '#999'
        }
      }
    });
    return;
  }

  const dates = trendChartData.value.map(item => item.date);
  const views = trendChartData.value.map(item => item.views);

  renderEcharts({
    title: {
      text: '浏览量趋势',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      },
      formatter: function(params: any) {
        const data = params[0];
        return `时间: ${data.axisValue}<br/>浏览量: ${data.value}`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        rotate: 45,
        fontSize: 10,
        margin: 15
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '浏览量',
        type: 'line',
        stack: 'Total',
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: 'rgba(24, 144, 255, 0.6)'
            }, {
              offset: 1, color: 'rgba(24, 144, 255, 0.1)'
            }]
          }
        },
        itemStyle: {
          color: '#1890ff'
        },
        data: views
      }
    ]
  });
}

// 获取账号列表
async function loadAccountOptions(type?: string) {
  if (!type) {
    accountOptions.value = [];
    return;
  }

  try {
    const params: CoulddriveUserListParams = {
      type,
      is_valid: true,
      page: 1,
      size: 100,
    };

    const response = await getCoulddriveUserListApi(params);
    const accounts = response.items || [];

    accountOptions.value = accounts.map((account: CoulddriveDriveAccountDetail) => ({
      label: `${account.username || account.user_id} (${account.type})`,
      value: account.id,
      cookies: account.cookies || '',
    }));
  } catch (error) {
    console.error('获取账号列表失败:', error);
    message.error('获取账号列表失败');
    accountOptions.value = [];
  }
}

// 处理网盘类型变化
function onUrlTypeChange(urlType: string) {
  formData.value.user_id = null; // 重置用户ID
  loadAccountOptions(urlType);
}

// 智能识别功能
async function handleSmartRecognition() {
  const urlToRecognize = recognitionUrl.value.trim() || formData.value.url.trim();

  if (!urlToRecognize) {
    message.error('请输入要识别的资源链接');
    return;
  }

  console.log('开始智能识别，输入内容:', urlToRecognize);

  isRecognizing.value = true;
  try {
    const response: SmartRecognitionResponse = await smartRecognitionApi(urlToRecognize);

    console.log('智能识别响应:', response);

    if (response.success) {
      // 根据识别结果自动填充表单
      if (response.domain) {
        formData.value.domain = response.domain;
        // 当领域改变时，更新科目选项
        updateSubjectOptions(response.domain);
      }

      if (response.subject) {
        formData.value.subject = response.subject;
      }

      if (response.main_name) {
        formData.value.main_name = response.main_name;
      }

      if (response.resource_type) {
        formData.value.resource_type = response.resource_type;
      }

      if (response.url) {
        formData.value.url = response.url;
      }

      if (response.url_type) {
        formData.value.url_type = response.url_type;
        // 当网盘类型改变时，加载对应的账号选项
        onUrlTypeChange(response.url_type);
      }

      if (response.extract_code) {
        formData.value.extract_code = response.extract_code;
      }

      if (response.description) {
        formData.value.description = response.description;
      }

      if (response.resource_intro) {
        formData.value.resource_intro = response.resource_intro;
      }

      // 设置排序值
      if (response.sort !== undefined) {
        formData.value.sort = response.sort;
      }

      // 清空识别输入框
      recognitionUrl.value = '';

      // 显示识别结果信息
      const confidencePercent = Math.round(response.confidence * 100);
      let successMessage = `智能识别完成！置信度: ${confidencePercent}%`;

      // 如果识别到了教师，显示额外信息
      if (response.sort && response.sort > 0) {
        const teacherName = Object.keys(TEACHER_MAPPINGS).find(name => {
          const mapping = TEACHER_MAPPINGS[name];
          if (!mapping) return false;

          const subjectMatch = response.subject?.includes('数学') ? '数学' :
                              response.subject?.includes('英语') ? '英语' :
                              response.subject?.includes('政治') ? '政治' : '';

          return mapping.sort === response.sort && mapping.subject === subjectMatch;
        });

        if (teacherName) {
          successMessage += ` - 识别到教师: ${teacherName}`;
        }
      }

      message.success(`${successMessage} - ${response.message || '识别成功'}`);

      // 如果置信度较低，给出提示
      if (response.confidence < 0.7) {
        message.warning('识别置信度较低，请检查并修正填充的信息');
      }
    } else {
      message.error(`智能识别失败: ${response.message || '未知错误'}`);
    }
  } catch (error: any) {
    console.error('智能识别失败:', error);
    message.error(`智能识别失败: ${error?.message || '网络错误，请稍后重试'}`);
  } finally {
    isRecognizing.value = false;
  }
}

// 更新分享信息功能
async function handleRefreshShareInfo() {
  if (!viewResourceData.value?.id) {
    message.error('无效的资源ID');
    return;
  }

  isRefreshing.value = true;
  try {
    const response = await refreshResourceShareInfoApi(viewResourceData.value.id);

    // 更新查看详情的数据
    if (response) {
      // 使用 Object.assign 确保响应式更新
      Object.assign(viewResourceData.value, response);

      // 强制触发响应式更新
      viewResourceData.value = { ...viewResourceData.value };

      message.success('分享信息更新成功');

      // 同时刷新列表数据
      onRefresh();

      // 重新获取统计信息
      await fetchStats();
    } else {
      message.warning('未获取到更新后的数据');
    }
  } catch (error: any) {
    message.error(`更新分享信息失败: ${error?.message || '未知错误'}`);
  } finally {
    isRefreshing.value = false;
  }
}

// 计算增长最快的连续端点
function getFastestGrowthPeriod() {
  if (!trendChartData.value || trendChartData.value.length < 2) {
    return null;
  }

  let maxGrowth = 0;
  let maxGrowthPeriod = null;

  for (let i = 0; i < trendChartData.value.length - 1; i++) {
    const current = trendChartData.value[i];
    const next = trendChartData.value[i + 1];
    const growth = next.views - current.views;

    if (growth > maxGrowth) {
      maxGrowth = growth;
      maxGrowthPeriod = {
        startDate: current.date,
        endDate: next.date,
        startViews: current.views,
        endViews: next.views,
        growth: growth
      };
    }
  }

  return maxGrowthPeriod;
}

// 初始化数据
onMounted(async () => {
  await fetchStats();
  await fetchDomainSubjectMapping();
});
</script>

<template>
  <Page auto-content-height>
    <!-- 统计卡片 -->
    <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
      <div class="rounded-lg bg-white p-4 shadow">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <Database class="h-8 w-8 text-blue-500" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">总资源数</p>
            <p class="text-2xl font-semibold text-gray-900">
              {{ statsData?.total_count || 0 }}
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white p-4 shadow">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <span class="text-green-600 text-sm font-medium">✓</span>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">正常状态</p>
            <p class="text-2xl font-semibold text-green-600">
              {{ statsData?.active_count || 0 }}
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white p-4 shadow">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
              <span class="text-orange-600 text-sm font-medium">📈</span>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">今日增长</p>
            <p class="text-2xl font-semibold text-orange-600">
              +{{ statsData?.today_growth || 0 }}
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white p-4 shadow">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <Eye class="h-8 w-8 text-purple-500" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">总浏览量</p>
            <p class="text-2xl font-semibold text-purple-600">
              {{ statsData?.total_views || 0 }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 表格 -->
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="onCreate" type="primary">
          <AddData class="mr-1" />
          新增资源
        </VbenButton>
      </template>
    </Grid>

    <!-- 编辑模态框 -->
    <EditModal :title="editingResourceId ? '编辑资源' : '新增资源'">
      <div class="space-y-4">
        <!-- 第一行：备注和是否为临时文件 -->
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <input
              v-model="formData.remark"
              type="text"
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="请输入备注"
            />
          </div>
          <div class="flex items-center justify-center">
            <div class="flex items-center">
              <input
                v-model="formData.is_temp_file"
                type="checkbox"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label class="ml-2 block text-sm text-gray-900">是否为临时文件</label>
            </div>
          </div>
        </div>

        <!-- 资源链接和提取码同一行 -->
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">资源链接 *</label>
            <input
              v-model="formData.url"
              type="url"
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="请输入资源链接"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">提取码</label>
            <input
              v-model="formData.extract_code"
              type="text"
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="请输入提取码"
            />
          </div>
        </div>

        <!-- 领域和科目 -->
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">领域 *</label>
            <select
              v-model="formData.domain"
              @change="(event: Event) => onDomainChange((event.target as HTMLSelectElement).value)"
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="">请选择领域</option>
              <option value="教育">教育</option>
              <option value="科技">科技</option>
              <option value="影视">影视</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">科目 *</label>
            <select
              v-model="formData.subject"
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              :disabled="!formData.domain"
            >
              <option value="">{{ formData.domain ? '请选择科目' : '请先选择领域' }}</option>
              <template v-if="formData.domain && (DOMAIN_SUBJECT_MAPPING as any)[formData.domain]">
                <option
                  v-for="subject in (DOMAIN_SUBJECT_MAPPING as any)[formData.domain]"
                  :key="subject.value"
                  :value="subject.value"
                >
                  {{ subject.label }}
                </option>
              </template>
            </select>
          </div>
        </div>

        <!-- 主要名字和资源类型 -->
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">主要名字 *</label>
            <input
              v-model="formData.main_name"
              type="text"
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="请输入主要名字"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">资源类型</label>
            <select
              v-model="formData.resource_type"
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="">请选择资源类型</option>
              <option
                v-for="type in RESOURCE_TYPE_OPTIONS"
                :key="type.value"
                :value="type.value"
              >
                {{ type.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- 网盘类型和关联账号 -->
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">网盘类型 *</label>
            <select
              v-model="formData.url_type"
              @change="(event: Event) => onUrlTypeChange((event.target as HTMLSelectElement).value)"
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="">请选择网盘类型</option>
              <option
                v-for="drive in DRIVE_TYPE_OPTIONS"
                :key="drive.value"
                :value="drive.value"
              >
                {{ drive.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">关联账号 *</label>
            <select
              v-model="formData.user_id"
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              :disabled="!accountOptions.length"
            >
              <option :value="null">{{ accountOptions.length ? '请选择关联账号' : '请先选择网盘类型' }}</option>
              <option
                v-for="account in accountOptions"
                :key="account.value"
                :value="account.value"
              >
                {{ account.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- 描述 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
          <textarea
            v-model="formData.description"
            rows="3"
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            placeholder="请输入描述"
          />
        </div>

        <!-- 资源介绍 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">资源介绍</label>
          <textarea
            v-model="formData.resource_intro"
            rows="3"
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            placeholder="请输入资源介绍"
          />
        </div>

        <!-- 资源图片 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">资源图片</label>
          <input
            v-model="formData.resource_image"
            type="url"
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            placeholder="请输入图片链接"
          />
        </div>

        <!-- 价格、建议价格、排序 -->
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">价格</label>
            <input
              v-model.number="formData.price"
              type="number"
              step="0.01"
              min="0"
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="请输入价格"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">建议价格</label>
            <input
              v-model.number="formData.suggested_price"
              type="number"
              step="0.01"
              min="0"
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="请输入建议价格"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">排序</label>
            <input
              v-model.number="formData.sort"
              type="number"
              min="0"
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="请输入排序值"
            />
          </div>
        </div>

        <!-- 智能识别功能（仅新增时显示） -->
        <div v-if="!editingResourceId" class="border-t pt-4">
          <div class="space-y-3">
            <div>
              <h4 class="text-sm font-medium text-gray-700 flex items-center">
                <svg class="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                智能识别
              </h4>
              <p class="text-xs text-gray-500 mt-1">根据分享文本自动识别并填充资源信息，支持夸克网盘、百度网盘等</p>
            </div>

            <div class="space-y-2">
              <!-- 示例文本提示 -->
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p class="text-xs font-medium text-blue-700 mb-1">📝 示例格式：</p>
                <p class="text-xs text-blue-600 leading-relaxed">
                  我用夸克网盘分享了「【20】26信号与系统」，点击链接即可保存。打开「夸克APP」，无需下载在线播放视频，畅享原画5倍速，支持电视投屏。<br/>
                  链接：https://pan.quark.cn/s/0a8af5b41c3c
                </p>
              </div>

              <textarea
                v-model="recognitionUrl"
                rows="4"
                class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none resize-none"
                placeholder="请粘贴完整的分享文本，包含资源名称和分享链接..."
              />

              <div class="flex justify-between items-center">
                <div class="text-xs text-gray-500">
                  <span class="inline-flex items-center">
                    <svg class="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    支持自动提取：资源名称、网盘类型、分享链接、提取码
                  </span>
                </div>

                <button
                  @click="handleSmartRecognition"
                  :disabled="isRecognizing || !recognitionUrl.trim()"
                  class="px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all duration-200 shadow-sm"
                  :style="{
                    'min-height': '40px',
                    'min-width': '120px',
                    'background': (isRecognizing || !recognitionUrl.trim()) ? '#9ca3af' : 'linear-gradient(to right, #3b82f6, #2563eb)',
                  }"
                  @mouseenter="(e) => {
                    if (!isRecognizing && recognitionUrl.trim() && e.target) {
                      (e.target as HTMLElement).style.background = 'linear-gradient(to right, #2563eb, #1d4ed8)';
                    }
                  }"
                  @mouseleave="(e) => {
                    if (!isRecognizing && recognitionUrl.trim() && e.target) {
                      (e.target as HTMLElement).style.background = 'linear-gradient(to right, #3b82f6, #2563eb)';
                    }
                  }"
                >
                  <svg v-if="isRecognizing" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                  <span>{{ isRecognizing ? '识别中...' : '开始识别' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </EditModal>

    <!-- 查看详情模态框 -->
    <ViewModal :title="viewResourceData ? '资源详情' : '无资源'">
      <div class="space-y-6">
        <!-- 基本信息 -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="text-md font-semibold mb-4 flex items-center">
            <Eye class="mr-2 h-5 w-5 text-blue-500" />
            基本信息
          </h4>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">主要名字</label>
              <p class="text-sm text-gray-900">{{ viewResourceData.main_name }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">标题</label>
              <p class="text-sm text-gray-900">{{ viewResourceData.title || '无' }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">领域</label>
              <p class="text-sm text-gray-900">{{ viewResourceData.domain }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">科目</label>
              <p class="text-sm text-gray-900">{{ viewResourceData.subject }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">资源类型</label>
              <p class="text-sm text-gray-900">{{ viewResourceData.resource_type }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">网盘类型</label>
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="{
                  'bg-blue-100 text-blue-800': viewResourceData.url_type === 'BaiduDrive',
                  'bg-green-100 text-green-800': viewResourceData.url_type === 'QuarkDrive',
                  'bg-orange-100 text-orange-800': viewResourceData.url_type === 'AlistDrive'
                }"
              >
                {{ viewResourceData.url_type === 'BaiduDrive' ? '百度网盘' :
                   viewResourceData.url_type === 'QuarkDrive' ? '夸克网盘' :
                   viewResourceData.url_type === 'AlistDrive' ? 'Alist网盘' : viewResourceData.url_type }}
              </span>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">浏览量</label>
              <p class="text-sm text-gray-900">{{ viewResourceData.view_count || 0 }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">排序</label>
              <p class="text-sm text-gray-900">{{ viewResourceData.sort || 0 }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="{
                  'bg-red-100 text-red-800': viewResourceData.status === 0,
                  'bg-green-100 text-green-800': viewResourceData.status === 1
                }"
              >
                {{ viewResourceData.status === 1 ? '正常' : '停用' }}
              </span>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">审核状态</label>
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="{
                  'bg-orange-100 text-orange-800': viewResourceData.audit_status === 0,
                  'bg-green-100 text-green-800': viewResourceData.audit_status === 1 || viewResourceData.audit_status === 4,
                  'bg-red-100 text-red-800': viewResourceData.audit_status === 2
                }"
              >
                {{ viewResourceData.audit_status === 0 ? '待审核' :
                   (viewResourceData.audit_status === 1 || viewResourceData.audit_status === 4) ? '已通过' : '已拒绝' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 链接信息 -->
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-md font-semibold">链接信息</h4>
            <button
              @click="handleRefreshShareInfo"
              :disabled="isRefreshing"
              class="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm border border-green-600"
              style="background-color: #10b981 !important;"
            >
              <svg v-if="isRefreshing" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <span>{{ isRefreshing ? '更新中...' : '更新分享信息' }}</span>
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">资源链接</label>
              <div class="flex items-center space-x-2">
                <p class="text-sm text-gray-900 flex-1 break-all bg-white p-2 rounded border">{{ viewResourceData.url }}</p>
                <button
                  @click="copyToClipboard(viewResourceData.url)"
                  class="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  复制
                </button>
              </div>
            </div>

            <div v-if="viewResourceData.extract_code">
              <label class="block text-sm font-medium text-gray-700 mb-1">提取码</label>
              <div class="flex items-center space-x-2">
                <p class="text-sm text-gray-900 bg-white p-2 rounded border">{{ viewResourceData.extract_code }}</p>
                <button
                  @click="copyToClipboard(viewResourceData.extract_code)"
                  class="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  复制
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 详细信息 -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="text-md font-semibold mb-4">详细信息</h4>

          <div class="space-y-4">
            <div v-if="viewResourceData.description">
              <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <p class="text-sm text-gray-900 whitespace-pre-wrap bg-white p-3 rounded border">{{ viewResourceData.description }}</p>
            </div>

            <div v-if="viewResourceData.resource_intro">
              <label class="block text-sm font-medium text-gray-700 mb-1">资源介绍</label>
              <p class="text-sm text-gray-900 whitespace-pre-wrap bg-white p-3 rounded border">{{ viewResourceData.resource_intro }}</p>
            </div>

            <div v-if="viewResourceData.resource_image">
              <label class="block text-sm font-medium text-gray-700 mb-1">资源图片</label>
              <img
                :src="viewResourceData.resource_image"
                alt="资源图片"
                class="max-w-xs rounded-lg border"
                @error="handleImageError"
              />
            </div>

            <div v-if="viewResourceData.remark">
              <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
              <p class="text-sm text-gray-900 whitespace-pre-wrap bg-white p-3 rounded border">{{ viewResourceData.remark }}</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">是否临时文件</label>
                <p class="text-sm text-gray-900">{{ viewResourceData.is_temp_file ? '是' : '否' }}</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">用户ID</label>
                <p class="text-sm text-gray-900">{{ viewResourceData.user_id }}</p>
              </div>

              <div v-if="viewResourceData.price">
                <label class="block text-sm font-medium text-gray-700 mb-1">价格</label>
                <p class="text-sm text-gray-900">¥{{ viewResourceData.price }}</p>
              </div>

              <div v-if="viewResourceData.suggested_price">
                <label class="block text-sm font-medium text-gray-700 mb-1">建议价格</label>
                <p class="text-sm text-gray-900">¥{{ viewResourceData.suggested_price }}</p>
              </div>

              <div v-if="viewResourceData.created_time">
                <label class="block text-sm font-medium text-gray-700 mb-1">创建时间</label>
                <p class="text-sm text-gray-900">{{ new Date(viewResourceData.created_time).toLocaleString() }}</p>
              </div>

              <div v-if="viewResourceData.updated_time">
                <label class="block text-sm font-medium text-gray-700 mb-1">更新时间</label>
                <p class="text-sm text-gray-900">{{ new Date(viewResourceData.updated_time).toLocaleString() }}</p>
              </div>
            </div>
          </div>
        </div>


      </div>
    </ViewModal>

    <!-- 趋势模态框 -->
    <TrendModal :title="trendResourceData ? `${trendResourceData.main_name} - 浏览量趋势` : '浏览量趋势'">
      <div class="space-y-4">
        <!-- 资源基本信息 -->
        <div v-if="trendResourceData" class="bg-gray-50 rounded-lg p-4">
          <h4 class="text-md font-semibold mb-2">资源信息</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span class="font-medium text-gray-700">主要名字：</span>
              <span class="text-gray-900">{{ trendResourceData.main_name }}</span>
            </div>
            <div>
              <span class="font-medium text-gray-700">当前浏览量：</span>
              <span class="text-blue-600 font-semibold">{{ trendResourceData.view_count || 0 }}</span>
            </div>
            <div>
              <span class="font-medium text-gray-700">领域：</span>
              <span class="text-gray-900">{{ trendResourceData.domain }}</span>
            </div>
          </div>
        </div>

        <!-- 图表容器 -->
        <div class="bg-white rounded-lg border p-4">
          <EchartsUI ref="chartRef" style="height: 400px;" />
        </div>

        <!-- 统计信息 -->
        <div v-if="trendChartData && trendChartData.length > 0" class="bg-gray-50 rounded-lg p-4">
          <h4 class="text-md font-semibold mb-2">统计信息</h4>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">{{ trendChartData.length }}</div>
              <div class="text-gray-600">数据点</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">{{ Math.max(...trendChartData.map(d => d.views)) }}</div>
              <div class="text-gray-600">最高浏览量</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-orange-600">{{ Math.min(...trendChartData.map(d => d.views)) }}</div>
              <div class="text-gray-600">最低浏览量</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-600">{{ Math.round(trendChartData.reduce((sum, d) => sum + d.views, 0) / trendChartData.length) }}</div>
              <div class="text-gray-600">平均浏览量</div>
            </div>
          </div>

          <!-- 增长最快的连续端点 -->
          <div v-if="getFastestGrowthPeriod()" class="bg-white rounded-lg p-4 border border-red-200">
            <h5 class="text-sm font-semibold text-red-700 mb-2">🚀 增长最快的连续端点</h5>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span class="font-medium text-gray-700">时间段：</span>
                <span class="text-gray-900">{{ getFastestGrowthPeriod()?.startDate }} → {{ getFastestGrowthPeriod()?.endDate }}</span>
              </div>
              <div>
                <span class="font-medium text-gray-700">增长量：</span>
                <span class="text-red-600 font-bold">+{{ getFastestGrowthPeriod()?.growth }}</span>
                <span class="text-gray-500 ml-1">({{ getFastestGrowthPeriod()?.startViews }} → {{ getFastestGrowthPeriod()?.endViews }})</span>
              </div>
            </div>
          </div>

          <!-- 无增长数据提示 -->
          <div v-else class="bg-white rounded-lg p-4 border border-gray-200">
            <h5 class="text-sm font-semibold text-gray-700 mb-2">📊 增长分析</h5>
            <p class="text-sm text-gray-600">暂无明显增长趋势或数据点不足</p>
          </div>
        </div>

        <!-- 无数据提示 -->
        <div v-else-if="trendChartData && trendChartData.length === 0" class="bg-gray-50 rounded-lg p-4 text-center">
          <p class="text-gray-600">暂无浏览量历史数据</p>
        </div>

      </div>
    </TrendModal>
  </Page>
</template>

<style scoped>
/* 确保表格容器充分利用空间 */
:deep(.vxe-grid) {
  width: 100%;
}

/* 优化表格布局 */
:deep(.vxe-table) {
  width: 100% !important;
}

/* 确保表格内容区域充分利用空间 */
:deep(.vxe-table--body-wrapper) {
  overflow-x: auto;
}

/* 优化列头样式 */
:deep(.vxe-header--column) {
  background-color: #fafafa;
  font-weight: 500;
}

/* 优化行悬停效果 */
:deep(.vxe-body--row:hover) {
  background-color: #f5f5f5;
}

/* 确保操作列按钮正常显示 */
:deep(.vxe-cell--operation .ant-btn) {
  margin: 0 2px;
}

/* 优化标签显示 */
:deep(.ant-tag) {
  margin: 1px;
  border-radius: 4px;
}
</style>

