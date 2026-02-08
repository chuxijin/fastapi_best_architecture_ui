<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  CreateGkZhentiAnswerParams,
  CreateGkZhentiMaterialParams,
  CreateGkZhentiQuestionParams,
  GkZhentiAnswerResult,
  GkZhentiQuestionResult,
  UpdateGkZhentiAnswerParams,
} from '#/api';

import { computed, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Badge,
  Card,
  Empty,
  message,
  Popconfirm,
  Spin,
  Tag,
} from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createGkZhentiAnswerApi,
  createGkZhentiMaterialApi,
  createGkZhentiQuestionApi,
  deleteGkZhentiAnswerApi,
  deleteGkZhentiQuestionApi,
  getGkZhentiAnswersByQuestionApi,
  getGkZhentiQuestionListApi,
  updateGkZhentiAnswerApi,
  updateGkZhentiMaterialApi,
  updateGkZhentiQuestionApi,
} from '#/api/gongkao';

import {
  answerSchema,
  materialSchema,
  querySchema,
  schema,
  useColumns,
} from './data';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: $t('common.form.query'),
  },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<GkZhentiQuestionResult> = {
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
    refresh: true,
    refreshOptions: {
      code: 'query',
    },
    custom: true,
    zoom: true,
  },
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getGkZhentiQuestionListApi({
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
}: OnActionClickParams<GkZhentiQuestionResult>) {
  switch (code) {
    case 'answers': {
      // 打开答案列表 Modal
      answersListModalApi
        .setData({
          question_id: row.id,
          _question_type: row.type,
          _question_title: row.title,
        })
        .open();
      break;
    }
    case 'delete': {
      deleteGkZhentiQuestionApi([row.id]).then(() => {
        message.success($t('ui.actionMessage.deleteSuccess', [row.title]));
        onRefresh();
      });
      break;
    }
    case 'edit': {
      modalApi.setData(row).open();
      break;
    }
  }
}

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema,
});

interface FormZhentiParams extends CreateGkZhentiQuestionParams {
  id?: number;
}

const formData = ref<FormZhentiParams>();

const modalTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['真题'])
    : $t('ui.actionTitle.create', ['真题']);
});

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const rawData = await formApi.getValues<
        CreateGkZhentiQuestionParams & Record<string, any>
      >();
      // 过滤掉临时筛选字段（以 _ 开头）
      const data = Object.fromEntries(
        Object.entries(rawData).filter(([key]) => !key.startsWith('_')),
      ) as CreateGkZhentiQuestionParams;
      try {
        await (formData.value?.id
          ? updateGkZhentiQuestionApi(formData.value?.id, data)
          : createGkZhentiQuestionApi(data));
        message.success($t('ui.actionMessage.operationSuccess'));
        await modalApi.close();
        onRefresh();
      } finally {
        modalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<FormZhentiParams>();
      formApi.resetForm();
      if (data) {
        formData.value = data;
        formApi.setValues(data);
      } else {
        formData.value = undefined;
      }
    }
  },
});

// ==================== 材料 Modal ====================
const [MaterialForm, materialFormApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema: materialSchema,
});

interface FormMaterialParams extends CreateGkZhentiMaterialParams {
  id?: number;
}

const materialFormData = ref<FormMaterialParams>();

const materialModalTitle = computed(() => {
  return materialFormData.value?.id
    ? $t('ui.actionTitle.edit', ['材料'])
    : $t('ui.actionTitle.create', ['材料']);
});

const [MaterialModal, materialModalApi] = useVbenModal({
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await materialFormApi.validate();
    if (valid) {
      materialModalApi.lock();
      const data =
        await materialFormApi.getValues<CreateGkZhentiMaterialParams>();
      try {
        await (materialFormData.value?.id
          ? updateGkZhentiMaterialApi(materialFormData.value?.id, data)
          : createGkZhentiMaterialApi(data));
        message.success($t('ui.actionMessage.operationSuccess'));
        await materialModalApi.close();
      } finally {
        materialModalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = materialModalApi.getData<FormMaterialParams>();
      materialFormApi.resetForm();
      if (data) {
        materialFormData.value = data;
        materialFormApi.setValues(data);
      } else {
        materialFormData.value = undefined;
      }
    }
  },
});

// ==================== 答案列表 Modal ====================
interface AnswersListModalData {
  question_id: number;
  _question_type: string;
  _question_title: string;
}

const answersListData = ref<AnswersListModalData>();
const answersList = ref<GkZhentiAnswerResult[]>([]);
const answersLoading = ref(false);

const answersListModalTitle = computed(() => {
  return `答案管理 - ${answersListData.value?._question_title || ''}`;
});

async function loadAnswers() {
  if (!answersListData.value?.question_id) return;
  answersLoading.value = true;
  try {
    answersList.value = await getGkZhentiAnswersByQuestionApi(
      answersListData.value.question_id,
    );
  } finally {
    answersLoading.value = false;
  }
}

async function handleDeleteAnswer(answer: GkZhentiAnswerResult) {
  await deleteGkZhentiAnswerApi([answer.id]);
  message.success('删除成功');
  await loadAnswers();
}

function handleEditAnswer(answer: GkZhentiAnswerResult) {
  answerModalApi
    .setData({
      ...answer,
      _question_type: answersListData.value?._question_type,
      _is_edit: true,
    })
    .open();
}

function handleAddAnswer() {
  answerModalApi
    .setData({
      question_id: answersListData.value?.question_id,
      _question_type: answersListData.value?._question_type,
      _question_title: answersListData.value?._question_title,
      _is_edit: false,
    })
    .open();
}

const [AnswersListModal, answersListModalApi] = useVbenModal({
  destroyOnClose: true,
  footer: false,
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = answersListModalApi.getData<AnswersListModalData>();
      if (data) {
        answersListData.value = data;
        loadAnswers();
      }
    } else {
      answersList.value = [];
      answersListData.value = undefined;
    }
  },
});

// ==================== 答案编辑 Modal ====================
const [AnswerForm, answerFormApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema: answerSchema,
});

interface AnswerModalData extends Partial<GkZhentiAnswerResult> {
  _question_type: string;
  _question_title?: string;
  _is_edit: boolean;
}

const answerFormData = ref<AnswerModalData>();

const answerModalTitle = computed(() => {
  return answerFormData.value?._is_edit ? '编辑答案' : '添加答案';
});

const [AnswerModal, answerModalApi] = useVbenModal({
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await answerFormApi.validate();
    if (valid) {
      answerModalApi.lock();
      const rawData = await answerFormApi.getValues<
        CreateGkZhentiAnswerParams & Record<string, any>
      >();
      // 过滤掉以 _ 开头的临时字段
      const data = Object.fromEntries(
        Object.entries(rawData).filter(([key]) => !key.startsWith('_')),
      ) as CreateGkZhentiAnswerParams;
      try {
        if (answerFormData.value?._is_edit && answerFormData.value?.id) {
          // 编辑模式
          const updateData: UpdateGkZhentiAnswerParams = { ...data };
          delete (updateData as any).question_id; // 不需要更新 question_id
          await updateGkZhentiAnswerApi(answerFormData.value.id, updateData);
          message.success('答案更新成功');
        } else {
          // 创建模式
          await createGkZhentiAnswerApi(data);
          message.success('答案添加成功');
        }
        await answerModalApi.close();
        // 刷新答案列表
        await loadAnswers();
      } finally {
        answerModalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = answerModalApi.getData<AnswerModalData>();
      answerFormApi.resetForm();
      if (data) {
        answerFormData.value = data;
        answerFormApi.setValues({
          question_id: data.question_id,
          _question_type: data._question_type,
          source: data.source,
          answer_keys: data.answer_keys,
          answer: data.answer,
          analysis: data.analysis,
          analysis_video_url: data.analysis_video_url,
          reference_materials: data.reference_materials,
          is_official: data.is_official ?? false,
        });
      }
    }
  },
});

// 客观题判断
const OBJECTIVE_TYPES = new Set(['判断题', '单选题', '多选题']);
function isObjectiveType(type: string | undefined) {
  return type ? OBJECTIVE_TYPES.has(type) : false;
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="() => modalApi.setData(null).open()">
          <MaterialSymbolsAdd class="size-5" />
          新增真题
        </VbenButton>
        <VbenButton
          variant="outline"
          @click="() => materialModalApi.setData(null).open()"
        >
          <MaterialSymbolsAdd class="size-5" />
          新增材料
        </VbenButton>
      </template>
    </Grid>
    <Modal :title="modalTitle">
      <Form />
    </Modal>
    <MaterialModal :title="materialModalTitle">
      <MaterialForm />
    </MaterialModal>

    <!-- 答案列表 Modal -->
    <AnswersListModal :title="answersListModalTitle" class="w-[700px]">
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-gray-500">
            共 {{ answersList.length }} 个答案版本
          </span>
          <VbenButton size="small" @click="handleAddAnswer">
            <MaterialSymbolsAdd class="size-4" />
            添加答案
          </VbenButton>
        </div>

        <Spin :spinning="answersLoading">
          <div v-if="answersList.length === 0 && !answersLoading" class="py-8">
            <Empty description="暂无答案，点击上方按钮添加" />
          </div>

          <div v-else class="max-h-[500px] space-y-3 overflow-y-auto pr-2">
            <Card
              v-for="answer in answersList"
              :key="answer.id"
              size="small"
              class="shadow-sm"
            >
              <template #title>
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ answer.source }}</span>
                  <Tag v-if="answer.is_official" color="gold">官方</Tag>
                </div>
              </template>
              <template #extra>
                <div class="flex gap-2">
                  <VbenButton
                    size="small"
                    variant="outline"
                    @click="handleEditAnswer(answer)"
                  >
                    编辑
                  </VbenButton>
                  <Popconfirm
                    title="确定删除此答案吗？"
                    @confirm="handleDeleteAnswer(answer)"
                  >
                    <VbenButton
                      size="small"
                      variant="outline"
                      class="text-red-500"
                    >
                      删除
                    </VbenButton>
                  </Popconfirm>
                </div>
              </template>

              <div class="space-y-2 text-sm">
                <!-- 客观题答案 -->
                <div
                  v-if="
                    isObjectiveType(answersListData?._question_type) &&
                    answer.answer_keys
                  "
                >
                  <Badge status="processing" />
                  <span class="mr-2 text-gray-500">答案：</span>
                  <span class="font-bold text-blue-600">{{
                    answer.answer_keys
                  }}</span>
                </div>

                <!-- 主观题答案 -->
                <div
                  v-if="
                    !isObjectiveType(answersListData?._question_type) &&
                    answer.answer
                  "
                >
                  <Badge status="processing" />
                  <span class="mr-2 text-gray-500">参考答案：</span>
                  <div class="mt-1 whitespace-pre-wrap rounded bg-gray-50 p-2">
                    {{ answer.answer }}
                  </div>
                </div>

                <!-- 解析 -->
                <div v-if="answer.analysis">
                  <Badge status="default" />
                  <span class="mr-2 text-gray-500">解析：</span>
                  <div class="mt-1 whitespace-pre-wrap rounded bg-blue-50 p-2">
                    {{ answer.analysis }}
                  </div>
                </div>

                <!-- 视频解析 -->
                <div v-if="answer.analysis_video_url">
                  <Badge status="warning" />
                  <span class="mr-2 text-gray-500">视频解析：</span>
                  <a
                    :href="answer.analysis_video_url"
                    target="_blank"
                    class="text-blue-500 hover:underline"
                  >
                    {{ answer.analysis_video_url }}
                  </a>
                </div>

                <!-- 参考资料 -->
                <div v-if="answer.reference_materials">
                  <Badge status="success" />
                  <span class="mr-2 text-gray-500">参考资料：</span>
                  <span>{{ answer.reference_materials }}</span>
                </div>

                <!-- 更新时间 -->
                <div class="mt-2 text-xs text-gray-400">
                  更新时间：{{ answer.updated_time || answer.created_time }}
                </div>
              </div>
            </Card>
          </div>
        </Spin>
      </div>
    </AnswersListModal>

    <!-- 答案编辑 Modal -->
    <AnswerModal :title="answerModalTitle">
      <AnswerForm />
    </AnswerModal>
  </Page>
</template>
