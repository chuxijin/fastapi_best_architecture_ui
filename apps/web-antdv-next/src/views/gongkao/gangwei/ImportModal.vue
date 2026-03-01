<script lang="ts" setup>
import type { ImportGangweiResult, ParseFileHeaderResult } from '#/api';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { MaterialSymbolsUploadFileOutline } from '@vben/icons';

import {
  Alert,
  Input,
  message,
  Select,
  Spin,
  Steps,
  Table,
  Upload,
} from 'ant-design-vue';

import {
  executeGkGangweiImportApi,
  parseGkGangweiImportFileApi,
  reparseGkGangweiImportFileApi,
} from '#/api/gongkao';

const emit = defineEmits<{ success: [] }>();

// 步骤：0=上传, 1=选择表头, 2=字段映射, 3=导入结果
const currentStep = ref(0);
const loading = ref(false);

// 解析结果
const parseResult = ref<null | ParseFileHeaderResult>(null);
const selectedHeaderRow = ref(0);

// 字段映射状态
interface FieldMapping {
  db_field: string;
  label: string;
  required: boolean;
  file_column: string;
  file_columns: string[]; // 多选（备注字段用）
  fixed_value: string;
  options?: string[]; // 下拉选项
}

// 支持多选的字段（备注）
const MULTI_SELECT_FIELDS = new Set(['remark']);

const mappings = ref<FieldMapping[]>([]);

// 导入结果
const importResult = ref<ImportGangweiResult | null>(null);

// 文件上传处理
async function handleUpload(info: any) {
  const file = info.file;
  if (!file) return;

  loading.value = true;
  try {
    const result = await parseGkGangweiImportFileApi(file);
    parseResult.value = result;
    selectedHeaderRow.value = result.header_row;
    currentStep.value = 1; // 进入选择表头步骤
  } catch (error: any) {
    message.error(error?.message || '文件解析失败');
  } finally {
    loading.value = false;
  }
}

// 选择表头行
async function selectHeaderRow(rowIndex: number) {
  if (!parseResult.value || rowIndex === selectedHeaderRow.value) return;

  loading.value = true;
  try {
    const result = await reparseGkGangweiImportFileApi(
      parseResult.value.file_key,
      rowIndex,
    );
    parseResult.value = result;
    selectedHeaderRow.value = rowIndex;
  } catch (error: any) {
    message.error(error?.message || '解析失败');
  } finally {
    loading.value = false;
  }
}

// 确认表头，进入映射步骤
function confirmHeader() {
  if (!parseResult.value) return;
  // 初始化映射
  const suggestedMap = new Map(
    parseResult.value.suggested_mappings.map((m) => [
      m.db_field,
      m.file_column,
    ]),
  );
  mappings.value = parseResult.value.db_fields.map((f) => ({
    db_field: f.field,
    label: f.label,
    required: f.required,
    file_column: suggestedMap.get(f.field) || '',
    file_columns: [],
    fixed_value: '',
    options: f.options,
  }));
  currentStep.value = 2;
}

// 已使用的 Excel 列（包括单选和多选）
const usedFileColumns = computed(() => {
  const used = new Set<string>();
  mappings.value.forEach((m) => {
    if (m.file_column) used.add(m.file_column);
    m.file_columns.forEach((col) => used.add(col));
  });
  return used;
});

// 获取某行的 Excel 列选项（标记已使用的列）
function getFileColumnOptions(currentIndex: number, isMulti = false) {
  if (!parseResult.value) return [];
  const currentMapping = mappings.value[currentIndex];
  const currentValues = isMulti
    ? new Set(currentMapping?.file_columns || [])
    : new Set(currentMapping?.file_column ? [currentMapping.file_column] : []);

  const options = parseResult.value.headers.map((h) => ({
    label: h,
    value: h,
    used: usedFileColumns.value.has(h) && !currentValues.has(h),
  }));

  if (!isMulti) {
    return [{ label: '-- 不映射 --', value: '', used: false }, ...options];
  }
  return options;
}

// 映射表格列
const mappingColumns = [
  { title: '系统字段', dataIndex: 'label', key: 'label', width: 150 },
  {
    title: 'Excel 列名',
    dataIndex: 'file_column',
    key: 'file_column',
    width: 200,
  },
  { title: '固定值', dataIndex: 'fixed_value', key: 'fixed_value', width: 150 },
  { title: '预览', dataIndex: 'preview', key: 'preview', ellipsis: true },
];

// 映射表格数据
const mappingTableData = computed(() => {
  if (!parseResult.value) return [];
  return mappings.value.map((m, index) => {
    const isMulti = MULTI_SELECT_FIELDS.has(m.db_field);
    let preview = '';
    if (isMulti && m.file_columns.length > 0) {
      preview = m.file_columns
        .map(
          (col) => `${col}: ${parseResult.value?.preview_data[0]?.[col] || ''}`,
        )
        .join('; ');
    } else if (m.file_column) {
      preview = parseResult.value?.preview_data[0]?.[m.file_column] || '';
    } else if (m.fixed_value) {
      preview = m.fixed_value;
    }
    return {
      key: index,
      label: m.required ? `${m.label} *` : m.label,
      db_field: m.db_field,
      file_column: m.file_column,
      file_columns: m.file_columns,
      fixed_value: m.fixed_value,
      preview,
      isMulti,
      options: m.options,
    };
  });
});

// 更新映射（单选）
function updateFileColumn(index: number, val: string) {
  mappings.value[index].file_column = val;
  if (val) {
    mappings.value[index].fixed_value = '';
  }
}

// 更新映射（多选）
function updateFileColumns(index: number, vals: string[]) {
  mappings.value[index].file_columns = vals;
  if (vals.length > 0) {
    mappings.value[index].fixed_value = '';
  }
}

function updateFixedValue(index: number, val: string) {
  mappings.value[index].fixed_value = val;
  if (val) {
    mappings.value[index].file_column = '';
    mappings.value[index].file_columns = [];
  }
}

// 检查必填字段
const missingRequiredFields = computed(() => {
  return mappings.value
    .filter(
      (m) =>
        m.required &&
        !m.file_column &&
        m.file_columns.length === 0 &&
        !m.fixed_value,
    )
    .map((m) => m.label);
});

// 映射统计
const mappingStats = computed(() => {
  const mapped = mappings.value.filter(
    (m) => m.file_column || m.file_columns.length > 0 || m.fixed_value,
  ).length;
  const total = mappings.value.length;
  const excelUsed = usedFileColumns.value.size;
  const excelTotal = parseResult.value?.headers.length || 0;
  return { mapped, total, excelUsed, excelTotal };
});

// 执行导入
async function handleImport() {
  if (!parseResult.value) return;

  if (missingRequiredFields.value.length > 0) {
    message.error(`请映射必填字段: ${missingRequiredFields.value.join(', ')}`);
    return;
  }

  loading.value = true;
  try {
    const result = await executeGkGangweiImportApi({
      file_key: parseResult.value.file_key,
      header_row: selectedHeaderRow.value,
      mappings: mappings.value
        .filter(
          (m) => m.file_column || m.file_columns.length > 0 || m.fixed_value,
        )
        .map((m) => ({
          db_field: m.db_field,
          file_column: m.file_column || undefined,
          file_columns: m.file_columns.length > 0 ? m.file_columns : undefined,
          fixed_value: m.fixed_value || undefined,
        })),
    });
    importResult.value = result;
    currentStep.value = 3;

    if (result.success > 0) {
      emit('success');
    }
  } catch (error: any) {
    message.error(error?.message || '导入失败');
  } finally {
    loading.value = false;
  }
}

// 重置
function reset() {
  currentStep.value = 0;
  parseResult.value = null;
  selectedHeaderRow.value = 0;
  mappings.value = [];
  importResult.value = null;
}

// 返回上一步
function goBack() {
  if (currentStep.value === 2) {
    currentStep.value = 1;
  } else if (currentStep.value === 1) {
    currentStep.value = 0;
  }
}

// Modal
const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  showConfirmButton: false,
  showCancelButton: false,
  onOpenChange(isOpen) {
    if (isOpen) {
      reset();
    }
  },
});

defineExpose({ open: () => modalApi.open() });
</script>

<template>
  <Modal title="导入岗位" class="w-[900px]" :footer="null">
    <Spin :spinning="loading">
      <Steps :current="currentStep" class="mb-6">
        <Steps.Step title="上传文件" />
        <Steps.Step title="选择表头" />
        <Steps.Step title="字段映射" />
        <Steps.Step title="导入结果" />
      </Steps>

      <!-- 步骤0: 上传文件 -->
      <div v-if="currentStep === 0">
        <Upload.Dragger
          :multiple="false"
          :show-upload-list="false"
          accept=".xlsx,.xls,.csv"
          :before-upload="() => false"
          @change="handleUpload"
        >
          <p class="ant-upload-drag-icon">
            <MaterialSymbolsUploadFileOutline class="size-12 text-blue-500" />
          </p>
          <p class="ant-upload-text">点击或拖拽文件到此处上传</p>
          <p class="ant-upload-hint">支持 Excel (.xlsx, .xls) 和 CSV 格式</p>
        </Upload.Dragger>

        <div class="mt-4 flex justify-end">
          <a-button @click="modalApi.close()">取消</a-button>
        </div>
      </div>

      <!-- 步骤1: 选择表头行 -->
      <div v-if="currentStep === 1 && parseResult">
        <Alert
          class="mb-4"
          type="info"
          message="请点击选择表头所在的行（高亮行为当前选中的表头）"
        />

        <div class="mb-4 max-h-[300px] overflow-auto rounded border">
          <table class="w-full text-sm">
            <tbody>
              <tr
                v-for="(row, rowIdx) in parseResult.raw_rows"
                :key="rowIdx"
                class="cursor-pointer border-b transition-colors hover:bg-blue-50"
                :class="{
                  'bg-blue-100 font-medium': rowIdx === selectedHeaderRow,
                }"
                @click="selectHeaderRow(rowIdx)"
              >
                <td
                  class="w-12 border-r bg-gray-50 px-2 py-1 text-center text-gray-500"
                >
                  {{ rowIdx + 1 }}
                </td>
                <td
                  v-for="(cell, cellIdx) in row"
                  :key="cellIdx"
                  class="max-w-[150px] truncate border-r px-2 py-1"
                  :title="cell"
                >
                  {{ cell || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <Alert class="mb-4" type="success">
          <template #message>
            当前表头（第 {{ selectedHeaderRow + 1 }} 行）：
            <span class="font-medium">{{
              parseResult.headers.slice(0, 5).join(', ')
            }}</span>
            <span v-if="parseResult.headers.length > 5"
              >... 共 {{ parseResult.headers.length }} 列</span
            >
          </template>
        </Alert>

        <div class="mt-4 flex justify-end gap-2">
          <a-button @click="modalApi.close()">取消</a-button>
          <a-button @click="goBack">重新上传</a-button>
          <a-button type="primary" @click="confirmHeader">
            确认表头，下一步
          </a-button>
        </div>
      </div>

      <!-- 步骤2: 字段映射 -->
      <div v-if="currentStep === 2 && parseResult">
        <Alert class="mb-4" type="info">
          <template #message>
            <div class="flex items-center justify-between">
              <span
                >共 {{ parseResult.total_rows }} 行数据待导入（表头：第
                {{ selectedHeaderRow + 1 }} 行）</span
              >
              <span class="text-xs">
                系统字段: {{ mappingStats.mapped }}/{{
                  mappingStats.total
                }}
                已映射 | Excel列: {{ mappingStats.excelUsed }}/{{
                  mappingStats.excelTotal
                }}
                已使用
              </span>
            </div>
          </template>
        </Alert>

        <Alert
          v-if="missingRequiredFields.length > 0"
          class="mb-4"
          type="warning"
          :message="`缺少必填字段: ${missingRequiredFields.join(', ')}`"
        />

        <Table
          :columns="mappingColumns"
          :data-source="mappingTableData"
          :pagination="false"
          size="small"
          :scroll="{ y: 350 }"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'file_column'">
              <Select
                v-if="record.isMulti"
                :value="record.file_columns"
                :options="getFileColumnOptions(index, true)"
                style="width: 100%"
                mode="multiple"
                allow-clear
                placeholder="可选择多列"
                option-filter-prop="label"
                :max-tag-count="2"
                show-search
                @change="(vals: string[]) => updateFileColumns(index, vals)"
              >
                <template #option="{ label, used }">
                  <div class="flex items-center justify-between">
                    <span :class="{ 'text-gray-400': used }">{{ label }}</span>
                    <span v-if="used" class="ml-2 text-xs text-green-500"
                      >✓</span
                    >
                  </div>
                </template>
              </Select>
              <Select
                v-else
                :value="record.file_column"
                :options="getFileColumnOptions(index, false)"
                style="width: 100%"
                allow-clear
                placeholder="选择Excel列"
                option-filter-prop="label"
                show-search
                @change="(val: string) => updateFileColumn(index, val)"
              >
                <template #option="{ label, used }">
                  <div class="flex items-center justify-between">
                    <span :class="{ 'text-gray-400': used }">{{ label }}</span>
                    <span v-if="used" class="ml-2 text-xs text-green-500"
                      >✓</span
                    >
                  </div>
                </template>
              </Select>
            </template>
            <template v-else-if="column.key === 'fixed_value'">
              <Select
                v-if="record.options && record.options.length > 0"
                :value="record.fixed_value || undefined"
                :options="
                  record.options.map((o: string) => ({ label: o, value: o }))
                "
                style="width: 100%"
                allow-clear
                placeholder="选择固定值"
                @change="(val: string) => updateFixedValue(index, val || '')"
              />
              <Input
                v-else
                :value="record.fixed_value"
                placeholder="固定值"
                @change="(e: any) => updateFixedValue(index, e.target.value)"
              />
            </template>
          </template>
        </Table>

        <div class="mt-4 flex justify-end gap-2">
          <a-button @click="modalApi.close()">取消</a-button>
          <a-button @click="goBack">上一步</a-button>
          <a-button
            type="primary"
            :disabled="missingRequiredFields.length > 0"
            @click="handleImport"
          >
            开始导入
          </a-button>
        </div>
      </div>

      <!-- 步骤3: 导入结果 -->
      <div v-if="currentStep === 3 && importResult">
        <Alert
          class="mb-4"
          :type="importResult.failed === 0 ? 'success' : 'warning'"
          :message="`导入完成: 成功 ${importResult.success} 条, 跳过 ${importResult.skipped} 条(重复), 失败 ${importResult.failed} 条`"
        />

        <div v-if="importResult.errors.length > 0" class="mb-4">
          <div class="mb-2 font-medium text-red-500">错误详情:</div>
          <div class="max-h-[300px] overflow-auto rounded bg-gray-50 p-3">
            <div
              v-for="(error, idx) in importResult.errors"
              :key="idx"
              class="text-sm text-gray-600"
            >
              {{ error }}
            </div>
          </div>
        </div>

        <div class="mt-4 flex justify-end">
          <a-button type="primary" @click="modalApi.close()">完成</a-button>
        </div>
      </div>
    </Spin>
  </Modal>
</template>
