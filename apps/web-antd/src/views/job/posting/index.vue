<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { OnActionClickParams } from '#/adapter/vxe-table';
import type { JobPostingResult, JobSearchParams } from '#/api';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';

// @ts-ignore
import {
  Dropdown as ADropdown,
  Menu as AMenu,
  MenuItem as AMenuItem,
  Tag as ATag,
  message,
  Modal,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createJobApplicationApi,
  getJobPostingListApi,
  getMyJobApplicationsApi,
  updateJobApplicationStatusApi,
} from '#/api';

import { querySchema, useColumns } from './data';

// 记录用户对岗位的投递状态（job_id -> { id: job_application_id, status }）
const myApplicationStatusMap = ref<
  Record<number, { id: number; status: string }>
>({});

const statusConfig: Record<string, { color: string; text: string }> = {
  未投递: { text: '未投递', color: 'default' },
  已投递: { text: '已投递', color: 'blue' },
  已笔试: { text: '已笔试', color: 'purple' },
  已面试: { text: '已面试', color: 'green' },
  已挂: { text: '已挂', color: 'red' },
  面试通过: { text: '面试通过', color: 'gold' },
  暂不投递: { text: '暂不投递', color: 'gray' },
};

function getStatusKey(rowId: number): string | undefined {
  const entry = myApplicationStatusMap.value[rowId];
  return entry ? entry.status : undefined;
}

function getStatusColor(rowId: number): string {
  const key = getStatusKey(rowId) || '未投递';
  return statusConfig[key]?.color || 'default';
}

function getStatusText(rowId: number): string {
  const key = getStatusKey(rowId) || '未投递';
  return statusConfig[key]?.text || '未投递';
}

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  submitButtonOptions: {
    content: $t('common.form.query'),
  },
  schema: querySchema,
  layout: 'horizontal',
  gridProps: {
    cols: 4,
  },
};

const gridOptions: VxeTableGridOptions<JobPostingResult> = {
  rowConfig: { keyField: 'id', height: 60 }, // 增加行高
  height: 'auto',
  columnConfig: { resizable: true }, // 允许列拖拽调整
  toolbarConfig: {
    export: true,
    print: true,
    refresh: { code: 'query' },
    custom: true,
    zoom: true,
  },
  columns: (useColumns() || []) as any,
  proxyConfig: {
    ajax: {
      query: async (
        { page }: { page: { currentPage: number; pageSize: number } },
        formValues: any,
      ) => {
        const params: JobSearchParams = { ...formValues };

        // 先拉取岗位列表
        const pageData = await getJobPostingListApi({
          ...params,
          page: page.currentPage,
          page_size: page.pageSize,
        } as any);
        console.log(
          'DEBUG: Frontend received pageData from backend:',
          pageData,
        );

        // 拉取当前用户的投递记录
        const myPaged = await getMyJobApplicationsApi({
          page: 1,
          page_size: 200,
        }); // 修正：size 替换为 page_size
        myApplicationStatusMap.value = Object.fromEntries(
          (myPaged.items || myPaged).map(
            (it: {
              application_status: string; // 修正：从 number 改为 string
              id: number;
              job_posting_id: number;
            }) => [
              it.job_posting_id,
              { id: it.id, status: it.application_status },
            ],
          ),
        );

        return pageData;
      },
    },
  },
};

const [Grid] = useVbenVxeGrid({ formOptions, gridOptions });

function onActionClick({ code, row }: OnActionClickParams<JobPostingResult>) {
  switch (code) {
    case 'apply': {
      if (row.delivery_link) {
        window.open(row.delivery_link, '_blank', 'noopener,noreferrer');
      }
      break;
    }
    case 'view_announcement': {
      if (row.delivery_link) {
        window.open(row.delivery_link, '_blank', 'noopener,noreferrer');
      }
      break;
    }
  }
}

// 投递状态变更
async function onApplicationStatusChange(
  jobPostingId: number | string,
  newStatus: string,
) {
  try {
    // 确保 jobPostingId 是数字类型，newStatus 是字符串
    const parsedJobPostingId =
      typeof jobPostingId === 'string'
        ? Number.parseInt(jobPostingId.replace('row_', ''))
        : jobPostingId;

    console.log(
      'Frontend sending jobPostingId:',
      parsedJobPostingId,
      'newStatus:',
      newStatus,
    );

    const application = myApplicationStatusMap.value[parsedJobPostingId];

    if (application) {
      // 如果已投递，则更新状态
      const application_id = application.id;
      await updateJobApplicationStatusApi(application_id, newStatus);

      // 更新本地状态映射
      myApplicationStatusMap.value[parsedJobPostingId] = {
        ...application,
        status: newStatus,
      };

      message.success(
        `状态已更新为：${statusConfig[newStatus]?.text || newStatus}`,
      );
    } else {
      // 如果未投递，则创建新的投递记录
      await createJobApplicationApi(parsedJobPostingId, newStatus);

      // 更新本地状态映射（这里需要获取新创建的投递记录ID）
      // 由于API可能不返回ID，我们先刷新数据
      await loadUserApplications();

      message.success(
        `投递成功，状态：${statusConfig[newStatus]?.text || newStatus}`,
      );
    }
  } catch (error) {
    console.error('投递状态更新失败:', error);
    message.error('投递状态更新失败，请重试');
  }
}

// 加载用户投递记录
async function loadUserApplications() {
  try {
    const myPaged = await getMyJobApplicationsApi({
      page: 1,
      page_size: 200,
    });

    myApplicationStatusMap.value = Object.fromEntries(
      (myPaged.items || myPaged).map(
        (it: {
          application_status: string;
          id: number;
          job_posting_id: number;
        }) => [it.job_posting_id, { id: it.id, status: it.application_status }],
      ),
    );

    console.log('用户投递状态已加载:', myApplicationStatusMap.value);
  } catch (error) {
    console.error('加载用户投递记录失败:', error);
    message.error('加载投递记录失败');
  }
}

// 复制内推码
function copyReferralCode(code: string) {
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        message.success('内推码已复制到剪贴板');
      })
      .catch(() => {
        // 降级处理
        const textArea = document.createElement('textarea');
        textArea.value = code;
        document.body.append(textArea);
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
        message.success('内推码已复制到剪贴板');
      });
  } else {
    // 降级处理
    const textArea = document.createElement('textarea');
    textArea.value = code;
    document.body.append(textArea);
    textArea.select();
    document.execCommand('copy');
    textArea.remove();
    message.success('内推码已复制到剪贴板');
  }
}

// 显示岗位详情模态框
function showPositionDetail(position: string) {
  Modal.info({
    title: '岗位详情',
    content: position,
    width: 600,
    maskClosable: true,
  });
}

// 显示备注详情模态框
function showRemarkDetail(remark: string) {
  Modal.info({
    title: '备注详情',
    content: remark || '暂无备注',
    width: 600,
    maskClosable: true,
  });
}

// 页面加载时自动加载用户投递记录
onMounted(() => {
  loadUserApplications();
});
</script>

<template>
  <Page auto-content-height>
    <Grid auto-resize>
      <template #industry_default="{ row }">
        <span v-if="row.industry" class="text-gray-800">{{
          row.industry
        }}</span>
        <span v-else class="text-gray-400">-</span>
      </template>

      <template #delivery_link_default="{ row }">
        <a
          v-if="row.delivery_link"
          :href="row.delivery_link"
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue-500 hover:underline"
        >
          投递链接
        </a>
        <span v-else class="text-gray-400">-</span>
      </template>

      <template #recruitment_announcement_default="{ row }">
        <a-button
          v-if="row.recruitment_announcement"
          type="link"
          size="small"
          class="h-auto p-0"
          @click="
            () => {
              Modal.info({
                title: '招聘公告',
                content: row.recruitment_announcement,
                width: 600,
                maskClosable: true,
              });
            }
          "
        >
          查看公告
        </a-button>
        <span v-else class="text-gray-400">-</span>
      </template>

      <template #company_type_default="{ row }">
        <ATag v-if="row.company_type" color="blue" size="small">
          {{ row.company_type }}
        </ATag>
        <span v-else class="text-gray-400">-</span>
      </template>

      <template #position_default="{ row }">
        <a-button
          type="link"
          size="small"
          @click="showPositionDetail(row.position)"
          style="height: auto; padding: 0; text-align: left"
        >
          {{ row.position }}
        </a-button>
      </template>

      <template #recruitment_info_default="{ row }">
        <div style="padding: 4px 0">
          <div style="margin-bottom: 4px">
            <ATag color="purple" size="small">
              类型：{{ row.recruitment_type || '-' }}
            </ATag>
          </div>
          <div>
            <ATag color="cyan" size="small">
              对象：{{ row.recruitment_object || '-' }}
            </ATag>
          </div>
        </div>
      </template>

      <template #delivery_period_default="{ row }">
        <div style="padding: 4px 0">
          <div style="margin-bottom: 4px">
            <ATag color="blue" size="small">
              开始：{{
                row.delivery_start
                  ? new Date(row.delivery_start).toLocaleString()
                  : '-'
              }}
            </ATag>
          </div>
          <div>
            <ATag :color="row.delivery_end ? 'green' : 'orange'" size="small">
              截止：{{
                row.delivery_end
                  ? new Date(row.delivery_end).toLocaleString()
                  : '报完即止'
              }}
            </ATag>
          </div>
        </div>
      </template>

      <template #referral_code_default="{ row }">
        <div style="padding: 4px 0">
          <div style="margin-bottom: 4px">
            <ATag
              v-if="row.referral_code"
              color="gold"
              size="small"
              style="cursor: pointer"
              @click="copyReferralCode(row.referral_code)"
            >
              {{ row.referral_code }}
            </ATag>
            <span v-else class="text-gray-400">无内推码</span>
          </div>
          <div>
            <ATag
              :color="row.is_exempt_from_written_test ? 'green' : 'red'"
              size="small"
            >
              {{ row.is_exempt_from_written_test ? '免笔试' : '需笔试' }}
            </ATag>
          </div>
        </div>
      </template>

      <template #remark_default="{ row }">
        <a-button
          v-if="row.remark"
          type="link"
          size="small"
          @click="showRemarkDetail(row.remark)"
          style="height: auto; padding: 0"
        >
          查看
        </a-button>
        <span v-else class="text-gray-400">-</span>
      </template>

      <template #logo_url_default="{ row }">
        <img
          v-if="row.logo_url"
          :src="row.logo_url"
          alt="公司Logo"
          class="h-8 w-8 object-contain"
        />
        <span v-else class="text-gray-400">-</span>
      </template>

      <template #operation_default="{ row }">
        <div class="flex justify-center gap-2">
          <a-button
            size="small"
            type="primary"
            :disabled="!row.delivery_link"
            @click="onActionClick({ code: 'view_announcement', row })"
          >
            查看公告
          </a-button>
          <a-button
            size="small"
            type="default"
            :disabled="!row.delivery_link"
            @click="onActionClick({ code: 'apply', row })"
          >
            投递
          </a-button>
          <!-- 投递状态下拉按钮 -->
          <ADropdown>
            <a-button size="small" type="default">
              <ATag :color="getStatusColor(row.id)">
                {{ getStatusText(row.id) }}
              </ATag>
            </a-button>
            <template #overlay>
              <AMenu>
                <template v-if="!myApplicationStatusMap[row.id]?.status">
                  <AMenuItem
                    v-for="[key, { text, color }] in Object.entries(
                      statusConfig,
                    ).filter(([k]) => k !== '未投递')"
                    :key="key"
                    @click="onApplicationStatusChange(row.id, key)"
                  >
                    <ATag :color="color">{{ text }}</ATag>
                  </AMenuItem>
                </template>
                <template v-else>
                  <!-- 显示当前状态 -->
                  <AMenuItem disabled>
                    <ATag :color="getStatusColor(row.id)">
                      当前：{{ getStatusText(row.id) }}
                    </ATag>
                  </AMenuItem>
                  <AMenuItem key="divider" disabled>
                    <div
                      style="margin: 4px 0; border-top: 1px solid #d9d9d9"
                    ></div>
                  </AMenuItem>
                  <!-- 显示可切换的状态 -->
                  <AMenuItem
                    v-for="[key, { text, color }] in Object.entries(
                      statusConfig,
                    ).filter(
                      ([sKey]) =>
                        sKey !==
                          (myApplicationStatusMap[row.id] &&
                            myApplicationStatusMap[row.id].status) &&
                        sKey !== '未投递',
                    )"
                    :key="key"
                    @click="onApplicationStatusChange(row.id, key as string)"
                  >
                    <ATag :color="color">{{ text }}</ATag>
                  </AMenuItem>
                </template>
              </AMenu>
            </template>
          </ADropdown>
        </div>
      </template>
    </Grid>
  </Page>
</template>
