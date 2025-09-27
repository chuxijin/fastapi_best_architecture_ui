<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { OnActionClickParams } from '#/adapter/vxe-table';
import type { JobPostingResult, JobSearchParams } from '#/api';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';

// @ts-ignore
import {
  Dropdown as ADropdown,
  Menu as AMenu,
  MenuItem as AMenuItem,
  Tag as ATag,
  message,
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
  Record<number, { id: number; status: number }>
>({});

const statusConfig: Record<number, { color: string; text: string }> = {
  0: { text: '已投递', color: 'blue' },
  1: { text: '笔试', color: 'purple' },
  2: { text: '一面', color: 'green' },
  3: { text: '二面', color: 'orange' },
  4: { text: '已拒绝', color: 'red' },
  5: { text: '已录用', color: 'gold' },
};

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: $t('common.form.query'),
  },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<JobPostingResult> = {
  rowConfig: { keyField: 'id' },
  height: 'auto',
  columnConfig: { resizable: true, fit: true }, // 新增：允许列拖拽调整和自动适应宽度
  toolbarConfig: {
    export: true,
    print: true,
    refresh: { code: 'query' },
    custom: true,
    zoom: true,
  },
  columns: [...useColumns()],
  proxyConfig: {
    ajax: {
      query: async (
        { page }: { page: { currentPage: number; pageSize: number } },
        formValues: any,
      ) => {
        const params: JobSearchParams = { ...formValues };

        // 先拉取岗位列表
        const pageData = await getJobPostingListApi({
          page: page.currentPage,
          page_size: page.pageSize,
          ...params,
        });
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
              application_status: number;
              id: number;
              job_posting_id: number;
            }) => [
              it.job_posting_id, // 修正：job_id 替换为 job_posting_id
              { id: it.id, status: it.application_status }, // 修正：status 替换为 application_status
            ],
          ),
        );

        return pageData;
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

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
  newStatus: number | string,
) {
  // 修正：jobId 改为 jobPostingId
  // 确保 jobPostingId 和 newStatus 都是数字类型
  const parsedJobPostingId =
    typeof jobPostingId === 'string'
      ? Number.parseInt(jobPostingId.replace('row_', ''))
      : jobPostingId; // 修正：jobId 改为 jobPostingId
  const parsedNewStatus =
    typeof newStatus === 'string' ? Number.parseInt(newStatus) : newStatus;

  console.log(
    'Frontend sending jobPostingId:',
    parsedJobPostingId,
    'newStatus:',
    parsedNewStatus,
  ); // 添加这行日志

  const application = myApplicationStatusMap.value[parsedJobPostingId]; // 修正：jobId 改为 jobPostingId

  if (application) {
    // 如果已投递，则更新状态
    const application_id = application.id;
    await updateJobApplicationStatusApi(application_id, parsedNewStatus);
    message.success('投递状态更新成功');
  } else if (parsedNewStatus === undefined) {
    message.error('未找到该岗位的投递记录，无法更新状态');
  } else {
    // 如果未投递，且选择的是一个有效状态，则创建新的投递记录
    await createJobApplicationApi(parsedJobPostingId, parsedNewStatus); // 修正：jobId 改为 job_posting_id，newStatus 改为 application_status
    message.success(
      `投递成功，状态已更新为${statusConfig[parsedNewStatus]?.text || parsedNewStatus}`,
    );
  }
  gridApi.query(); // 刷新表格
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
            (e) => {
              e.preventDefault();
              alert(row.recruitment_announcement);
            }
          "
        >
          查看公告
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
              {{
                myApplicationStatusMap[row.id]?.status !== undefined
                  ? statusConfig[myApplicationStatusMap[row.id]?.status].text
                  : '未投递'
              }}
            </a-button>
            <template #overlay>
              <AMenu
                @click="
                  (e) =>
                    onApplicationStatusChange(
                      row.id,
                      e.key as unknown as number,
                    )
                "
              >
                <template
                  v-if="myApplicationStatusMap[row.id]?.status === undefined"
                >
                  <AMenuItem
                    v-for="[key, { text, color }] in Object.entries(
                      statusConfig,
                    )"
                    :key="key"
                  >
                    <ATag :color="color">{{ text }}</ATag>
                  </AMenuItem>
                </template>
                <template v-else>
                  <AMenuItem
                    v-for="[key, { text, color }] in Object.entries(
                      statusConfig,
                    ).filter(
                      ([sKey]) =>
                        parseInt(sKey) !==
                        myApplicationStatusMap[row.id]?.status,
                    )"
                    :key="key"
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
