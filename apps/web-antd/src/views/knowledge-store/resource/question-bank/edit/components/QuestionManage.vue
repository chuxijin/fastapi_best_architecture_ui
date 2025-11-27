<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  BankResult,
  QuestionParams,
  QuestionResult,
  QuestionType,
} from '#/api';

import { computed, onMounted, ref } from 'vue';

import { useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';

import { Dropdown, Menu, MenuItem, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createQuestionApi,
  deleteQuestionApi,
  getChapterTreeApi,
  getQuestionDetailApi,
  getQuestionListApi,
  updateQuestionApi,
} from '#/api';
import { renderMarkdown } from '#/utils/markdown-renderer';

import {
  difficultyMap,
  querySchema,
  questionTypeMap,
  useColumns,
} from './question-data';
import { createQuestionFormSchema } from './question-form-schema';
import UnifiedQuestionForm from './UnifiedQuestionForm.vue';

interface Props {
  bankId: number;
  bankInfo: BankResult | null;
}

const props = defineProps<Props>();

const chapterOptions = ref<Array<{ label: string; value: number }>>([]);
const currentQuestionType = ref<QuestionType>('single');
const currentFormRef = ref<any>(null);
const currentEditId = ref<null | number>(null);
const previewData = ref<any>(null);

// ============ Markdown 渲染 ============
const renderedStem = computed(() =>
  renderMarkdown(previewData.value?.stem || ''),
);
const renderedAnalysis = computed(() =>
  renderMarkdown(previewData.value?.analysis?.content || ''),
);
const renderedOptions = computed(() => {
  if (!previewData.value?.options) return [];
  return previewData.value.options.map((opt: any) => ({
    ...opt,
    renderedContent: renderMarkdown(opt.content || ''),
  }));
});

// 审核状态映射（与后端保持一致：0=待审核, 10=已通过, 20=已拒绝）
const reviewStatusMap: Record<number, { color: string; label: string }> = {
  0: { label: '待审核', color: 'default' },
  10: { label: '已通过', color: 'success' },
  20: { label: '已拒绝', color: 'error' },
};

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-4',
  submitButtonOptions: {
    content: '查询',
  },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<QuestionResult> = {
  rowConfig: {
    keyField: 'id',
    isHover: true,
  },
  height: 'auto',
  toolbarConfig: {
    refresh: { code: 'query' },
    custom: true,
    zoom: true,
  },
  pagerConfig: {
    enabled: true,
    currentPage: 1,
    pageSize: 20,
    pageSizes: [10, 20, 50, 100],
  },
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getQuestionListApi({
          bank_id: props.bankId,
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

const [QuestionForm, questionFormApi] = useVbenForm({
  wrapperClass: 'grid-cols-1',
  showDefaultActions: false,
  schema: createQuestionFormSchema(props.bankId, chapterOptions.value),
});

const modalTitle = computed(() => {
  if (currentEditId.value) {
    return `编辑${questionTypeMap[currentQuestionType.value] || '题目'}`;
  }
  return currentQuestionType.value
    ? `添加${questionTypeMap[currentQuestionType.value]}`
    : '添加题目';
});

// 判断是否使用自定义表单组件（统一组件支持所有题型）
const useCustomForm = computed(() => {
  return [
    'fill',
    'judgement',
    'material',
    'multiple',
    'shortAnswer',
    'single',
  ].includes(currentQuestionType.value);
});

// 添加/编辑弹窗
const [Modal, modalApi] = useVbenModal({
  class: 'w-9/12',
  destroyOnClose: true,
  async onConfirm() {
    if (useCustomForm.value && currentFormRef.value) {
      // 调用自定义表单的提交方法
      await currentFormRef.value.submit();
      return;
    }

    const { valid } = await questionFormApi.validate();
    if (valid) {
      modalApi.lock();
      try {
        const data = await questionFormApi.getValues<QuestionParams>();
        data.bank_id = props.bankId;

        if (currentEditId.value) {
          // 编辑模式
          await updateQuestionApi(currentEditId.value, data);
          message.success('更新题目成功');
        } else {
          // 新增模式
          await createQuestionApi(data);
          message.success('添加题目成功');
        }

        await modalApi.close();
        onRefresh();
      } catch {
        message.error(currentEditId.value ? '更新题目失败' : '添加题目失败');
      } finally {
        modalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      if (!useCustomForm.value) {
        questionFormApi.resetForm();
        questionFormApi.updateSchema(
          createQuestionFormSchema(props.bankId, chapterOptions.value),
        );
      }
    } else {
      currentFormRef.value = null;
      currentEditId.value = null;
    }
  },
});

// 预览弹窗
const [PreviewModal, previewModalApi] = useVbenModal({
  class: 'w-10/12',
  title: '题目预览',
  footer: null,
  destroyOnClose: true,
  closable: false,
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = previewModalApi.getData();
      if (data) {
        previewData.value = data;
      }
    }
  },
});

onMounted(async () => {
  try {
    const chapters = await getChapterTreeApi({ bank_id: props.bankId });
    const flattenChapters = (
      items: typeof chapters,
      level = 0,
    ): Array<{ label: string; value: number }> => {
      return items.flatMap((item) => {
        const prefix = '　'.repeat(level);
        const result = [{ label: `${prefix}${item.name}`, value: item.id }];
        if (item.children && item.children.length > 0) {
          result.push(...flattenChapters(item.children, level + 1));
        }
        return result;
      });
    };
    chapterOptions.value = flattenChapters(chapters);
  } catch (error) {
    console.error('加载章节列表失败:', error);
  }
});

function onRefresh() {
  gridApi.query();
}

async function onActionClick({
  code,
  row,
}: {
  code: string;
  row: QuestionResult;
}) {
  switch (code) {
    case 'delete': {
      deleteQuestionApi({ ids: [row.id] }).then(() => {
        message.success(`删除题目成功`);
        onRefresh();
      });
      break;
    }
    case 'edit': {
      // 直接从列表数据获取题型，设置 editId 后子组件会自动加载详情
      currentEditId.value = row.id;
      currentQuestionType.value = row.type;

      // 打开编辑弹窗
      modalApi.open();

      // 不需要手动调用 setFormData，子组件的 watch 会自动加载数据
      break;
    }
    case 'preview': {
      try {
        const detail = await getQuestionDetailApi(row.id);

        // 转换 options_data 对象为数组（方便前端显示）
        if (detail.options_data) {
          detail.options = Object.values(detail.options_data).map(
            (opt: any) => {
              // 从 analysis 中判断是否是正确答案
              let is_correct = false;
              if (detail.analysis && detail.analysis.answer_data) {
                const correct = detail.analysis.answer_data.correct;
                if (Array.isArray(correct)) {
                  is_correct = correct.includes(opt.code);
                } else {
                  is_correct = opt.code === correct;
                }
              }
              return {
                label: opt.code,
                content: opt.content,
                is_correct,
              };
            },
          );
        }

        previewModalApi.setData(detail);
        previewModalApi.open();
      } catch {
        message.error('获取题目详情失败');
      }
      break;
    }
  }
}

async function handleQuestionSubmit(data: any) {
  try {
    if (currentEditId.value) {
      // 编辑模式
      await updateQuestionApi(currentEditId.value, data);
      message.success('更新题目成功');
    } else {
      // 新增模式
      await createQuestionApi(data);
      message.success('添加题目成功');
    }
    await modalApi.close();
    onRefresh();
  } catch (error) {
    message.error(currentEditId.value ? '更新题目失败' : '添加题目失败');
    throw error;
  }
}

function handleAddQuestion(type: QuestionType) {
  currentEditId.value = null;
  currentQuestionType.value = type;
  modalApi.open();
  // 非自定义表单才需要设置值
  const customFormTypes: QuestionType[] = [
    'single',
    'multiple',
    'judgement',
    'fill',
    'shortAnswer',
  ];
  if (!customFormTypes.includes(type)) {
    questionFormApi.setValues({
      type,
      bank_id: props.bankId,
      score: 1,
      is_active: true,
    });
  }
}
</script>

<template>
  <div class="h-full">
    <Grid class="h-full">
      <template #toolbar-actions>
        <Dropdown>
          <VbenButton>
            <MaterialSymbolsAdd class="size-5" />
            添加题目
          </VbenButton>
          <template #overlay>
            <Menu @click="({ key }) => handleAddQuestion(key as QuestionType)">
              <MenuItem key="single">单选题</MenuItem>
              <MenuItem key="multiple">多选题</MenuItem>
              <MenuItem key="judgement">判断题</MenuItem>
              <MenuItem key="fill">填空题</MenuItem>
              <MenuItem key="shortAnswer">简答题</MenuItem>
              <MenuItem key="material">材料题</MenuItem>
            </Menu>
          </template>
        </Dropdown>
      </template>

      <!-- 状态列插槽 -->
      <template #is_active_default="{ row }">
        <span
          class="inline-block rounded px-2 py-1 text-xs font-medium"
          :class="
            row.is_active
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          "
        >
          {{ row.is_active ? '启用' : '停用' }}
        </span>
      </template>

      <!-- 审核状态列插槽 -->
      <template #review_status_default="{ row }">
        <span
          class="inline-block rounded px-2 py-1 text-xs font-medium"
          :class="{
            'bg-orange-100 text-orange-700': row.review_status === 0,
            'bg-green-100 text-green-700': row.review_status === 10,
            'bg-red-100 text-red-700': row.review_status === 20,
          }"
        >
          {{ reviewStatusMap[row.review_status]?.label || '未知' }}
        </span>
      </template>
    </Grid>

    <Modal :title="modalTitle">
      <!-- 使用统一表单组件 -->
      <UnifiedQuestionForm
        v-if="useCustomForm"
        ref="currentFormRef"
        :bank-id="bankId"
        :question-type="currentQuestionType"
        :chapter-options="chapterOptions"
        :edit-id="currentEditId"
        @submit="handleQuestionSubmit"
      />
      <!-- 其他题型使用通用表单（如果有未支持的题型） -->
      <QuestionForm v-else />
    </Modal>

    <!-- 预览弹窗 -->
    <PreviewModal>
      <div v-if="previewData" class="space-y-6">
        <!-- 基本信息 -->
        <div class="rounded-lg bg-gray-50 p-4">
          <h4 class="text-md mb-4 font-semibold">基本信息</h4>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >题型</label
              >
              <p class="text-sm text-gray-900">
                {{ questionTypeMap[previewData.type] || '未知' }}
              </p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >分值</label
              >
              <p class="text-sm text-gray-900">{{ previewData.score }} 分</p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >难度</label
              >
              <p class="text-sm text-gray-900">
                {{
                  previewData.difficulty
                    ? difficultyMap[previewData.difficulty]
                    : '-'
                }}
              </p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >章节</label
              >
              <p class="text-sm text-gray-900">
                {{ previewData.chapter?.name || '未分配' }}
              </p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >状态</label
              >
              <p class="text-sm text-gray-900">
                {{ previewData.is_active ? '启用' : '停用' }}
              </p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >审核状态</label
              >
              <p class="text-sm text-gray-900">
                {{
                  reviewStatusMap[previewData.review_status]?.label || '未知'
                }}
              </p>
            </div>
          </div>
        </div>

        <!-- 题干 -->
        <div class="rounded-lg bg-gray-50 p-4">
          <h4 class="text-md mb-4 font-semibold">题干</h4>
          <div
            class="rounded border bg-white p-3 text-sm text-gray-900"
            v-html="renderedStem"
          ></div>
        </div>

        <!-- 选项（选择题） -->
        <div
          v-if="renderedOptions.length > 0"
          class="rounded-lg bg-gray-50 p-4"
        >
          <h4 class="text-md mb-4 font-semibold">选项</h4>
          <div class="space-y-2">
            <div
              v-for="option in renderedOptions"
              :key="option.id"
              class="flex items-start gap-3 rounded border p-3"
              :class="
                option.is_correct ? 'border-green-500 bg-green-50' : 'bg-white'
              "
            >
              <div class="flex-shrink-0">
                <span
                  class="inline-block rounded px-2 py-1 text-sm font-medium"
                  :class="
                    option.is_correct
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  "
                >
                  {{ option.label }}{{ option.is_correct ? ' ✓' : '' }}
                </span>
              </div>
              <div
                class="flex-1 text-sm text-gray-900"
                v-html="option.renderedContent"
              ></div>
            </div>
          </div>
        </div>

        <!-- 答案 -->
        <div v-if="previewData.analysis" class="rounded-lg bg-gray-50 p-4">
          <h4 class="text-md mb-4 font-semibold">答案</h4>
          <div class="rounded border bg-white p-3 text-sm text-gray-900">
            <template v-if="previewData.analysis.answer_data">
              <!-- 单选/判断 -->
              <p
                v-if="
                  previewData.type === 'single' ||
                  previewData.type === 'judgement'
                "
              >
                {{ previewData.analysis.answer_data.correct }}
              </p>
              <!-- 多选 -->
              <p v-else-if="previewData.type === 'multiple'">
                {{ previewData.analysis.answer_data.correct.join(', ') }}
              </p>
              <!-- 填空 -->
              <div v-else-if="previewData.type === 'fill'">
                <p
                  v-for="(ans, idx) in previewData.analysis.answer_data.correct"
                  :key="idx"
                >
                  填空 {{ idx + 1 }}：{{ ans }}
                </p>
              </div>
              <!-- 简答 -->
              <div v-else-if="previewData.type === 'shortAnswer'">
                <p><strong>关键词：</strong></p>
                <ul class="ml-5 list-disc">
                  <li
                    v-for="(keyword, idx) in previewData.analysis.answer_data
                      .keywords"
                    :key="idx"
                  >
                    {{ keyword }}
                  </li>
                </ul>
              </div>
            </template>
            <p v-else class="text-gray-500">暂无答案</p>
          </div>
        </div>

        <!-- 解析 -->
        <div
          v-if="previewData.analysis?.content"
          class="rounded-lg bg-gray-50 p-4"
        >
          <h4 class="text-md mb-4 font-semibold">解析</h4>
          <div
            class="rounded border bg-white p-3 text-sm text-gray-900"
            v-html="renderedAnalysis"
          ></div>
        </div>

        <!-- 扩展信息 -->
        <div class="rounded-lg bg-gray-50 p-4">
          <h4 class="text-md mb-4 font-semibold">扩展信息</h4>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >用途</label
              >
              <p class="text-sm text-gray-900">
                {{ previewData.usage || '-' }}
              </p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >考点</label
              >
              <p class="text-sm text-gray-900">
                {{ previewData.knowledge_point || '-' }}
              </p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >来源</label
              >
              <p class="text-sm text-gray-900">
                {{ previewData.source || '-' }}
              </p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >年份</label
              >
              <p class="text-sm text-gray-900">{{ previewData.year || '-' }}</p>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex items-center justify-end space-x-2">
          <button
            @click="previewModalApi.close()"
            class="rounded bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700"
          >
            确定
          </button>
        </div>
      </template>
    </PreviewModal>
  </div>
</template>

<style scoped>
/* Markdown 渲染内容样式 */
:deep(.markdown-content) {
  line-height: 1.6;
}

:deep(.markdown-content p) {
  margin: 0.5em 0;
}

:deep(.markdown-content p:first-child) {
  margin-top: 0;
}

:deep(.markdown-content p:last-child) {
  margin-bottom: 0;
}

:deep(.markdown-content strong) {
  font-weight: 600;
}

:deep(.markdown-content em) {
  font-style: italic;
}

:deep(.markdown-content code) {
  padding: 0.2em 0.4em;
  font-family: monospace;
  font-size: 0.9em;
  background-color: rgb(0 0 0 / 5%);
  border-radius: 3px;
}

:deep(.markdown-content pre) {
  padding: 1em;
  overflow-x: auto;
  background-color: rgb(0 0 0 / 5%);
  border-radius: 5px;
}

:deep(.markdown-content blockquote) {
  padding-left: 1em;
  margin: 0.5em 0;
  color: #666;
  border-left: 4px solid #ddd;
}

:deep(.markdown-content ul, .markdown-content ol) {
  padding-left: 2em;
  margin: 0.5em 0;
}

:deep(.markdown-content img),
:deep(.markdown-image) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 1em auto;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
}

:deep(
  .markdown-content h1,
  .markdown-content h2,
  .markdown-content h3,
  .markdown-content h4
) {
  margin: 0.5em 0;
  font-weight: 600;
}
</style>
