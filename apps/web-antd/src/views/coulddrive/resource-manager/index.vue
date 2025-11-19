<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  CoulddriveDriveAccountDetail,
  CoulddriveUserListParams,
  CreateResourceParams,
  ResourceListParams,
  ResourceStatistics,
  SmartRecognitionResponse,
  UpdateResourceParams,
} from '#/api';

import { onMounted, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { AddData, createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createResourceApi,
  deleteResourceApi,
  DRIVE_TYPE_OPTIONS,
  getCoulddriveUserListApi,
  getResourceListApi,
  getResourceStatisticsApi,
  getSubjectsByDomainApi,
  refreshResourceShareInfoApi,
  smartRecognitionApi,
  TEACHER_MAPPINGS,
  updateResourceApi,
} from '#/api';

import {
  createResourceQuerySchema,
  getCategoryOptions,
  useResourceColumns,
} from './data';
import CategoryManagerModal from './modules/CategoryManagerModal.vue';
import ResourceEditViewModal from './modules/ResourceEditViewModal.vue';
import ResourceTrendModal from './modules/ResourceTrendModal.vue';

// 创建图标组件
const Eye = createIconifyIcon('mdi:eye');
const Database = createIconifyIcon('mdi:database');
const Category = createIconifyIcon('mdi:folder-multiple');

// 临时处理模式
const TEMP_MODES = [
  { value: 0, label: '无操作' },
  { value: 1, label: '定时删除' },
  { value: 2, label: '定时刷新' },
  { value: 3, label: '定时更新' },
];

function getTempModeLabel(mode: null | number | undefined) {
  const found = TEMP_MODES.find((m) => m.value === mode);
  return found ? found.label : '无操作';
}

// 编辑状态
const editingResourceId = ref<null | number>(null);

// 查看详情状态
const viewResourceData = ref<any>(null);

// 趋势图状态
const trendResourceData = ref<any>(null);

// 统计信息
const statsData = ref<null | ResourceStatistics>(null);

// 智能识别相关状态
const recognitionUrl = ref('');
const isRecognizing = ref(false);

// 更新分享信息状态
const isRefreshing = ref(false);

// 账号选项
const accountOptions = ref<
  Array<{ cookies: string; label: string; value: number }>
>([]);

// 动态选项
const domainOptions = ref<Array<{ label: string; value: string }>>([]);
const subjectOptions = ref<Array<{ label: string; value: string }>>([]);
// 全量科目选项
const allSubjectOptions = ref<Array<{ label: string; value: string }>>([]);
const resourceTypeOptions = ref<Array<{ label: string; value: string }>>([]);

// 完整的分类数据
const allCategories = ref<any[]>([]);

// 分类管理组件引用
const categoryManagerRef = ref<InstanceType<
  typeof CategoryManagerModal
> | null>(null);

// 查询表单配置（使用空选项的默认schema）
const queryFormOptions: VbenFormProps = {
  collapsed: true, // 默认折叠状态
  showCollapseButton: true, // 显示折叠按钮
  wrapperClass: 'grid-cols-1 md:grid-cols-4',
  submitButtonOptions: {
    content: $t('common.search'),
  },
  schema: createResourceQuerySchema(), // 使用默认的空选项
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
  gridOptions,
});

// 表单默认值生成器
function getDefaultFormData() {
  return {
    domain: '',
    subject: '',
    main_name: '',
    resource_type: '',
    url: '',
    url_type: '',
    user_id: null as null | number,
    description: '',
    resource_intro: '',
    resource_image: '',
    extract_code: '',
    is_temp_file: 0,
    price: undefined as number | undefined,
    suggested_price: undefined as number | undefined,
    sort: 0,
    remark: '',
  };
}

// 解析领域对应的科目选项（优先接口，失败回退本地）
async function resolveSubjectOptionsByDomain(value: string) {
  let next = allSubjectOptions.value;
  if (value) {
    try {
      const resp = await getSubjectsByDomainApi(value);
      const arr = Array.isArray(resp) ? resp : (resp as any)?.data || [];
      if (Array.isArray(arr) && arr.length > 0) {
        next = arr as Array<{ label: string; value: string }>;
      } else {
        const d = (value || '').trim();
        const domainCategory = allCategories.value.find((cat: any) => {
          if (cat.category_type !== 'domain') return false;
          const nameEqual =
            typeof cat.name === 'string' && cat.name.trim() === d;
          const codeEqual =
            typeof cat.code === 'string' &&
            cat.code.trim().toLowerCase() === d.toLowerCase();
          return nameEqual || codeEqual;
        });
        if (domainCategory) {
          next = allCategories.value
            .filter(
              (cat: any) =>
                cat.category_type === 'subject' &&
                cat.parent_id === domainCategory.id &&
                cat.status === 1,
            )
            .map((cat: any) => ({ label: cat.name, value: cat.name }));
        }
      }
    } catch {}
  }
  return next;
}

// 初始化表单的函数
async function initializeForms() {
  // 获取分类数据
  const categoryOptions = await getCategoryOptions();

  // 更新本地选项状态
  domainOptions.value = categoryOptions.domainOptions;
  resourceTypeOptions.value = categoryOptions.resourceTypeOptions;
  allCategories.value = categoryOptions.allCategories;

  // 计算所有科目选项（不联动领域）
  allSubjectOptions.value = allCategories.value
    .filter((cat: any) => cat.category_type === 'subject' && cat.status === 1)
    .map((cat: any) => ({ label: cat.name, value: cat.name }));
  subjectOptions.value = allSubjectOptions.value;

  // 动态更新查询表单的下拉选项（领域/科目/资源类型）
  gridApi.formApi.updateSchema([
    {
      fieldName: 'domain',
      componentProps: {
        options: domainOptions.value,
        placeholder: '请选择领域',
        allowClear: true,
        onChange: async (value: string, formApi: any) => {
          const next = await resolveSubjectOptionsByDomain(value);
          formApi.updateSchema([
            {
              fieldName: 'subject',
              componentProps: {
                options: next,
                placeholder: next.length > 0 ? '请选择科目' : '暂无科目选项',
                allowClear: true,
              },
            },
          ]);
          formApi.setFieldValue('subject', undefined);
        },
      },
    },
    {
      fieldName: 'subject',
      componentProps: {
        options: allSubjectOptions.value,
        placeholder:
          allSubjectOptions.value.length > 0 ? '请选择科目' : '暂无科目选项',
        allowClear: true,
      },
    },
    {
      fieldName: 'resource_type',
      componentProps: {
        options: resourceTypeOptions.value,
        placeholder: '请选择资源类型',
        allowClear: true,
      },
    },
  ]);
}

// 刷新分类选项数据的函数
async function refreshCategoryOptions() {
  try {
    // 获取最新的分类数据
    const categoryOptions = await getCategoryOptions();

    // 更新本地选项状态
    domainOptions.value = categoryOptions.domainOptions;
    resourceTypeOptions.value = categoryOptions.resourceTypeOptions;
    allCategories.value = categoryOptions.allCategories;

    // 重新计算所有科目选项
    allSubjectOptions.value = allCategories.value
      .filter((cat: any) => cat.category_type === 'subject' && cat.status === 1)
      .map((cat: any) => ({ label: cat.name, value: cat.name }));
    subjectOptions.value = allSubjectOptions.value;

    // 同步更新查询表单的下拉（领域/科目/资源类型），支持按领域筛选科目
    gridApi.formApi.updateSchema([
      {
        fieldName: 'domain',
        componentProps: {
          options: domainOptions.value,
          placeholder: '请选择领域',
          allowClear: true,
          onChange: async (value: string, formApi: any) => {
            const next = await resolveSubjectOptionsByDomain(value);
            formApi.updateSchema([
              {
                fieldName: 'subject',
                componentProps: {
                  options: next,
                  placeholder: next.length > 0 ? '请选择科目' : '暂无科目选项',
                  allowClear: true,
                },
              },
            ]);
            formApi.setFieldValue('subject', undefined);
          },
        },
      },
      {
        fieldName: 'subject',
        componentProps: {
          options: allSubjectOptions.value,
          placeholder:
            subjectOptions.value.length > 0 ? '请选择科目' : '暂无科目选项',
          allowClear: true,
        },
      },
      {
        fieldName: 'resource_type',
        componentProps: {
          options: resourceTypeOptions.value,
          placeholder: '请选择资源类型',
          allowClear: true,
        },
      },
    ]);
  } catch (error) {
    console.error('刷新分类选项失败:', error);
  }
}

// 表单数据
const formData = ref(getDefaultFormData());

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
      // 但是某些字段即使是空字符串也要传递
      const allowEmptyStringFields = new Set([
        'description',
        'extract_code',
        'remark',
        'resource_image',
        'resource_intro',
      ]);
      const apiData: CreateResourceParams | UpdateResourceParams = {};
      Object.entries(rawData).forEach(([key, value]) => {
        if (
          value !== null &&
          value !== undefined &&
          (value !== '' || allowEmptyStringFields.has(key))
        ) {
          (apiData as any)[key] = value;
        }
      });

      // 确保必填字段存在（对于新增）
      if (
        !editingResourceId.value && // 新增时必须包含 user_id
        formData.value.user_id
      ) {
        (apiData as any).user_id = formData.value.user_id;
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
    } catch {
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
        Object.assign(formData.value, getDefaultFormData());
        // 确保新增态没有残留的 id，便于显示智能识别区域

        // @ts-ignore
        delete (formData.value as any).id;
      }
    }
  },
});

// 更新科目选项的函数
async function updateSubjectOptions(domain: string) {
  if (!domain) {
    subjectOptions.value = [];
    return;
  }

  // 优先请求后端获取科目选项，失败时再回退到本地分类树
  let nextOptions: Array<{ label: string; value: string }> = [];
  try {
    const resp = await getSubjectsByDomainApi(domain);
    const arr = Array.isArray(resp) ? resp : (resp as any)?.data || [];
    if (Array.isArray(arr) && arr.length > 0) {
      nextOptions = arr as Array<{ label: string; value: string }>;
    }
  } catch {
    // 忽略，进入本地回退
  }

  if (nextOptions.length === 0) {
    const d = (domain || '').trim();
    const domainCategory = allCategories.value.find((cat) => {
      if (cat.category_type !== 'domain') return false;
      const nameEqual = typeof cat.name === 'string' && cat.name.trim() === d;
      const codeEqual =
        typeof cat.code === 'string' &&
        cat.code.trim().toLowerCase() === d.toLowerCase();
      return nameEqual || codeEqual;
    });
    if (domainCategory) {
      const subjects = allCategories.value.filter(
        (cat) =>
          cat.category_type === 'subject' &&
          cat.parent_id === domainCategory.id &&
          cat.status === 1,
      );
      nextOptions = subjects.map((subject) => ({
        label: subject.name,
        value: subject.name,
      }));
    }
  }

  subjectOptions.value = nextOptions;

  // 若当前已选科目不在新选项中，则清空，避免保留无效值
  if (
    !subjectOptions.value.some((opt) => opt.value === formData.value.subject)
  ) {
    formData.value.subject = '';
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
});

// 创建分类管理模态框
const [CategoryModal, categoryModalApi] = useVbenModal({
  class: 'w-[1200px]',
  destroyOnClose: true,
  onOpenChange(isOpen: boolean) {
    // 关闭时刷新主页面的分类数据，因为可能有变更
    if (!isOpen) {
      // 延迟刷新，确保分类管理组件的操作已完成
      setTimeout(async () => {
        await refreshCategoryOptions(); // 只刷新分类数据，不重新创建表单
      }, 300);
    }
  },
});

// 操作处理
async function onActionClick({ code, row }: OnActionClickParams) {
  switch (code) {
    case 'delete': {
      await handleDelete(row);
      break;
    }
    case 'edit': {
      editingResourceId.value = row.id;
      Object.assign(formData.value, row);
      editModalApi.setData(row);
      editModalApi.open();
      break;
    }
    case 'trend': {
      // 查看趋势功能
      trendResourceData.value = row;
      trendModalApi.setData(row);
      trendModalApi.open();
      break;
    }
    case 'view': {
      // 查看详情功能
      viewResourceData.value = row;
      viewModalApi.setData(row);
      viewModalApi.open();
      break;
    }
  }
}

// 删除处理
async function handleDelete(row: any) {
  try {
    await deleteResourceApi(row.id);
    message.success('删除成功');
    onRefresh();
    await fetchStats();
  } catch {
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
    is_temp_file: 0,
    price: undefined,
    suggested_price: undefined,
    sort: 0,
    remark: '',
  });
  // 确保新增态没有残留的 id，便于显示智能识别区域

  // @ts-ignore
  delete (formData.value as any).id;
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

// 根据领域获取科目选项：由 updateSubjectOptions 统一处理

// 打开分类管理
function openCategoryManager() {
  categoryModalApi.open();
}

// 复制到剪贴板
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    message.success('已复制到剪贴板');
  } catch {
    message.error('复制失败');
  }
}

// 复制完整分享链接（包含提取码）
async function copyShareLinkWithExtractCode(resourceData: any) {
  try {
    const driveTypeLabel =
      DRIVE_TYPE_OPTIONS.find(
        (option) => option.value === resourceData.url_type,
      )?.label || '网盘';

    let shareText = `我用${driveTypeLabel}分享了「${resourceData.main_name || resourceData.title}」，点击链接即可保存。打开「${driveTypeLabel}APP」在线查看，支持多种文档格式转换。\n链接：${resourceData.url}`;

    // 如果有提取码，添加提取码信息
    if (resourceData.extract_code) {
      shareText += `\n提取码：${resourceData.extract_code}`;
    }

    await navigator.clipboard.writeText(shareText);
    message.success('完整分享链接已复制到剪贴板');
  } catch {
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

// 已移除未使用的时间格式化函数

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

    accountOptions.value = accounts.map(
      (account: CoulddriveDriveAccountDetail) => ({
        label: `${account.username || account.user_id} (${account.type})`,
        value: account.id,
        cookies: account.cookies || '',
      }),
    );
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
  const urlToRecognize =
    recognitionUrl.value.trim() || formData.value.url.trim();

  if (!urlToRecognize) {
    message.error('请输入要识别的资源链接');
    return;
  }

  isRecognizing.value = true;
  try {
    const response: SmartRecognitionResponse =
      await smartRecognitionApi(urlToRecognize);

    if (response.success) {
      // 根据识别结果自动填充表单
      if (response.domain) {
        // 尝试匹配领域：先按代码匹配，再按名称匹配
        const domainOption = domainOptions.value.find(
          (opt) =>
            opt.value === response.domain || opt.label === response.domain,
        );
        if (domainOption) {
          formData.value.domain = domainOption.value;
          // 当领域改变时，更新科目选项
          updateSubjectOptions(domainOption.value);
        }
      }

      if (response.subject) {
        // 尝试匹配科目：先按代码匹配，再按名称匹配
        const subjectOption = subjectOptions.value.find(
          (opt) =>
            opt.value === response.subject || opt.label === response.subject,
        );
        if (subjectOption) {
          formData.value.subject = subjectOption.value;
        }
      }

      if (response.main_name) {
        formData.value.main_name = response.main_name;
      }

      if (response.resource_type) {
        // 尝试匹配资源类型：先按代码匹配，再按名称匹配
        const resourceTypeOption = resourceTypeOptions.value.find(
          (opt) =>
            opt.value === response.resource_type ||
            opt.label === response.resource_type,
        );
        if (resourceTypeOption) {
          formData.value.resource_type = resourceTypeOption.value;
        }
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
        const teacherName = Object.keys(TEACHER_MAPPINGS).find((name) => {
          const mapping = TEACHER_MAPPINGS[name];
          if (!mapping) return false;

          const subjectMatch = response.subject?.includes('数学')
            ? '数学'
            : response.subject?.includes('英语')
              ? '英语'
              : response.subject?.includes('政治')
                ? '政治'
                : '';

          return (
            mapping.sort === response.sort && mapping.subject === subjectMatch
          );
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
    const response = await refreshResourceShareInfoApi(
      viewResourceData.value.id,
    );

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

// 初始化数据
onMounted(async () => {
  await fetchStats();
  await initializeForms(); // 只调用一次，内部会获取分类数据
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
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100"
            >
              <span class="text-sm font-medium text-green-600">✓</span>
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
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100"
            >
              <span class="text-sm font-medium text-orange-600">📈</span>
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
        <VbenButton @click="onCreate" type="primary" class="mobile-btn">
          <AddData class="mr-1" />
          <span class="hidden sm:inline">新增资源</span>
          <span class="sm:hidden">新增</span>
        </VbenButton>
        <VbenButton
          @click="openCategoryManager"
          type="default"
          class="mobile-btn"
        >
          <Category class="mr-1" />
          <span class="hidden sm:inline">分类管理</span>
          <span class="sm:hidden">分类</span>
        </VbenButton>
      </template>
    </Grid>

    <!-- 编辑模态框 -->
    <EditModal :title="editingResourceId ? '编辑资源' : '新增资源'">
      <ResourceEditViewModal
        mode="edit"
        :form-data="formData"
        :show-recognition="!editingResourceId"
        :domain-options="domainOptions"
        :subject-options="subjectOptions"
        :resource-type-options="resourceTypeOptions"
        :account-options="accountOptions"
        :temp-modes="TEMP_MODES"
        :drive-type-options="DRIVE_TYPE_OPTIONS"
        :recognition-url="recognitionUrl"
        :is-recognizing="isRecognizing"
        :on-domain-change="onDomainChange"
        :on-url-type-change="onUrlTypeChange"
        :on-smart-recognition="handleSmartRecognition"
        @update:recognition-url="(v: string) => (recognitionUrl = v)"
      />
    </EditModal>

    <!-- 查看详情模态框 -->
    <ViewModal :title="viewResourceData ? '资源详情' : '无资源'">
      <div class="mb-4 flex items-center justify-between">
        <div></div>
        <div class="flex items-center space-x-2">
          <button
            @click="editResource(viewResourceData)"
            class="rounded bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600"
          >
            编辑
          </button>
          <button
            @click="handleRefreshShareInfo"
            :disabled="isRefreshing"
            class="flex items-center space-x-2 rounded-lg border border-green-600 bg-green-500 px-3 py-1.5 text-sm text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
            style="background-color: #10b981 !important"
          >
            <span>{{ isRefreshing ? '更新中...' : '更新分享信息' }}</span>
          </button>
        </div>
      </div>
      <ResourceEditViewModal
        v-if="viewResourceData"
        mode="view"
        :form-data="viewResourceData"
        :get-temp-mode-label="getTempModeLabel"
        :on-copy="copyToClipboard"
        :on-copy-share="copyShareLinkWithExtractCode"
        :on-image-error="handleImageError"
      />
      <template #footer>
        <div class="flex items-center justify-end space-x-2">
          <button
            @click="viewModalApi.close()"
            class="rounded bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700"
          >
            确定
          </button>
        </div>
      </template>
    </ViewModal>

    <!-- 趋势模态框 -->
    <TrendModal
      :title="
        trendResourceData
          ? `${trendResourceData.main_name} - 浏览量趋势`
          : '浏览量趋势'
      "
    >
      <ResourceTrendModal :resource="trendResourceData" />
    </TrendModal>

    <!-- 分类管理模态框 -->
    <CategoryModal title="分类管理">
      <CategoryManagerModal ref="categoryManagerRef" />
    </CategoryModal>
  </Page>
</template>

<style scoped>
/* 移动端工具栏按钮间距 */
@media (max-width: 640px) {
  :deep(.vxe-toolbar .vxe-toolbar--wrapper .vxe-toolbar--actions) {
    gap: 0.5rem;
  }

  .mobile-btn {
    @apply min-w-0 px-2 py-1 text-xs;

    height: 32px;
  }

  .mobile-btn .mr-1 {
    @apply mr-0.5 h-3 w-3;
  }
}

/* 移动端表格操作按钮适配 */
@media (max-width: 640px) {
  :deep(.vxe-cell--operation .ant-btn) {
    @apply min-w-0 px-1 py-0 text-xs;

    height: 24px;
    margin: 0 1px;
    line-height: 22px;
  }
}

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
  font-weight: 500;
  background-color: #fafafa;
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

/* 移动端按钮适配 */
.mobile-btn {
  @apply px-2 py-1 text-sm;
}

/* 确保表格容器充分利用空间 */
</style>
