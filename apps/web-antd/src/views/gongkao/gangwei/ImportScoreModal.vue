<script lang="ts" setup>
import type { ImportScoreResult, ParseFileHeaderResult } from '#/api';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { MaterialSymbolsUploadFileOutline } from '@vben/icons';

import {
  Alert,
  Checkbox,
  Input,
  message,
  Select,
  Spin,
  Steps,
  Table,
  Upload,
} from 'ant-design-vue';

import {
  executeGkScoreImportApi,
  parseGkScoreImportFileApi,
  reparseGkScoreImportFileApi,
} from '#/api/gongkao';

const emit = defineEmits<{ success: [] }>();

// 步骤：0=上传, 1=选择表头, 2=字段映射, 3=导入结果
const currentStep = ref(0);
const loading = ref(false);

// 年份选择（必填）
const selectedYear = ref<number>(new Date().getFullYear());

// 生成年份选项（当前年份往前推5年）
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, i) => ({
    label: String(currentYear - i),
    value: currentYear - i,
  }));
});

// 解析结果
const parseResult = ref<null | ParseFileHeaderResult>(null);
const selectedHeaderRow = ref(0);

// 字段映射状态
interface FieldMapping {
  db_field: string;
  label: string;
  required: boolean;
  match_key: boolean;
  file_column: string;
  fixed_value: string;
}

const mappings = ref<FieldMapping[]>([]);

// 导入结果
const importResult = ref<ImportScoreResult | null>(null);

// 预览模式
const previewMode = ref(true); // 默认开启预览模式
const isPreviewResult = ref(false); // 当前结果是否是预览结果

// 文件上传处理
async function handleUpload(info: any) {
  const file = info.file;
  if (!file) return;

  loading.value = true;
  try {
    const result = await parseGkScoreImportFileApi(file);
    parseResult.value = result;
    selectedHeaderRow.value = result.header_row;
    currentStep.value = 1;
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
    const result = await reparseGkScoreImportFileApi(
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
  const suggestedMap = new Map(
    parseResult.value.suggested_mappings.map((m) => [
      m.db_field,
      m.file_column,
    ]),
  );
  mappings.value = parseResult.value.db_fields.map((f: any) => {
    const isYearField = f.field === 'year';
    return {
      db_field: f.field,
      label: f.label,
      required: f.required,
      match_key: f.match_key || false,
      file_column: isYearField ? '' : suggestedMap.get(f.field) || '',
      // 年份字段自动填入用户选择的年份
      fixed_value: isYearField ? String(selectedYear.value) : '',
    };
  });
  currentStep.value = 2;
}

// 已使用的 Excel 列
const usedFileColumns = computed(() => {
  const used = new Set<string>();
  mappings.value.forEach((m) => {
    if (m.file_column) used.add(m.file_column);
  });
  return used;
});

// 获取某行的 Excel 列选项
function getFileColumnOptions(currentIndex: number) {
  if (!parseResult.value) return [];
  const currentMapping = mappings.value[currentIndex];
  const currentValue = currentMapping?.file_column;

  const options = parseResult.value.headers.map((h) => ({
    label: h,
    value: h,
    used: usedFileColumns.value.has(h) && h !== currentValue,
  }));

  return [{ label: '-- 不映射 --', value: '', used: false }, ...options];
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
    let preview = '';
    if (m.file_column) {
      preview = parseResult.value?.preview_data[0]?.[m.file_column] || '';
    } else if (m.fixed_value) {
      preview = m.fixed_value;
    }
    return {
      key: index,
      // 必填字段显示 *，可选匹配字段显示 (可选)
      label: m.required
        ? `${m.label} *`
        : m.match_key
          ? `${m.label} (可选)`
          : m.label,
      db_field: m.db_field,
      file_column: m.file_column,
      fixed_value: m.fixed_value,
      preview,
      match_key: m.match_key,
      required: m.required,
    };
  });
});

// 更新映射
function updateFileColumn(index: number, val: string) {
  mappings.value[index].file_column = val;
  if (val) {
    mappings.value[index].fixed_value = '';
  }
}

function updateFixedValue(index: number, val: string) {
  mappings.value[index].fixed_value = val;
  if (val) {
    mappings.value[index].file_column = '';
  }
}

// 检查必填匹配字段是否都已映射（match_key=true 且 required=true）
const missingMatchFields = computed(() => {
  return mappings.value
    .filter(
      (m) => m.match_key && m.required && !m.file_column && !m.fixed_value,
    )
    .map((m) => m.label);
});

// 映射统计
const mappingStats = computed(() => {
  const mapped = mappings.value.filter(
    (m) => m.file_column || m.fixed_value,
  ).length;
  const total = mappings.value.length;
  const excelUsed = usedFileColumns.value.size;
  const excelTotal = parseResult.value?.headers.length || 0;
  return { mapped, total, excelUsed, excelTotal };
});

// 执行导入
async function handleImport() {
  if (!parseResult.value) return;

  if (missingMatchFields.value.length > 0) {
    message.error(`请映射匹配字段: ${missingMatchFields.value.join(', ')}`);
    return;
  }

  loading.value = true;
  try {
    const result = await executeGkScoreImportApi({
      file_key: parseResult.value.file_key,
      header_row: selectedHeaderRow.value,
      mappings: mappings.value
        .filter((m) => m.file_column || m.fixed_value)
        .map((m) => ({
          db_field: m.db_field,
          file_column: m.file_column || undefined,
          fixed_value: m.fixed_value || undefined,
        })),
      preview: previewMode.value,
    });
    importResult.value = result;
    isPreviewResult.value = previewMode.value;
    currentStep.value = 3;

    if (!previewMode.value && result.updated > 0) {
      emit('success');
    }
  } catch (error: any) {
    message.error(error?.message || '导入失败');
  } finally {
    loading.value = false;
  }
}

// 确认执行导入（预览后）
async function confirmImport() {
  if (!parseResult.value) return;

  loading.value = true;
  try {
    const result = await executeGkScoreImportApi({
      file_key: parseResult.value.file_key,
      header_row: selectedHeaderRow.value,
      mappings: mappings.value
        .filter((m) => m.file_column || m.fixed_value)
        .map((m) => ({
          db_field: m.db_field,
          file_column: m.file_column || undefined,
          fixed_value: m.fixed_value || undefined,
        })),
      preview: false, // 正式执行
    });
    importResult.value = result;
    isPreviewResult.value = false;

    if (result.updated > 0) {
      emit('success');
      message.success(`成功更新 ${result.updated} 条记录`);
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
  selectedYear.value = new Date().getFullYear();
  parseResult.value = null;
  selectedHeaderRow.value = 0;
  mappings.value = [];
  importResult.value = null;
  previewMode.value = true;
  isPreviewResult.value = false;
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
  <Modal title="导入分数" class="w-[900px]" :footer="null">
    <Spin :spinning="loading">
      <Steps :current="currentStep" class="mb-6">
        <Steps.Step title="上传文件" />
        <Steps.Step title="选择表头" />
        <Steps.Step title="字段映射" />
        <Steps.Step title="导入结果" />
      </Steps>

      <!-- 步骤0: 上传文件 -->
      <div v-if="currentStep === 0">
        <Alert class="mb-4" type="info">
          <template #message>
            <div>分数导入说明：</div>
            <ul class="mt-1 list-disc pl-4 text-xs text-gray-600">
              <li>
                根据
                <strong>年度+职位代码+职位名称+部门名称</strong> 匹配已有岗位
              </li>
              <li>
                如果数据是每人一行，系统会自动按岗位分组，计算
                <strong>最低分/平均分/最高分</strong>
              </li>
            </ul>
          </template>
        </Alert>

        <div class="mb-4 flex items-center gap-4">
          <span class="font-medium">选择年份：</span>
          <Select
            v-model:value="selectedYear"
            :options="yearOptions"
            style="width: 120px"
            placeholder="选择年份"
          />
          <span class="text-sm text-gray-500">（此年份将用于匹配岗位）</span>
        </div>

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
              <span>
                共 {{ parseResult.total_rows }} 行数据待导入 | 匹配年份：<strong
                  >{{ selectedYear }}</strong
                >
              </span>
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
          v-if="missingMatchFields.length > 0"
          class="mb-4"
          type="warning"
          :message="`缺少匹配字段: ${missingMatchFields.join(', ')}`"
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
                :value="record.file_column"
                :options="getFileColumnOptions(index)"
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
              <Input
                :value="record.fixed_value"
                placeholder="固定值"
                :disabled="record.match_key"
                @change="(e: any) => updateFixedValue(index, e.target.value)"
              />
            </template>
          </template>
        </Table>

        <div class="mt-4 flex items-center justify-between">
          <Checkbox v-model:checked="previewMode">
            <span class="text-orange-500">仅预览（不写入数据库）</span>
          </Checkbox>
          <div class="flex gap-2">
            <a-button @click="modalApi.close()">取消</a-button>
            <a-button @click="goBack">上一步</a-button>
            <a-button
              type="primary"
              :disabled="missingMatchFields.length > 0"
              @click="handleImport"
            >
              {{ previewMode ? '预览结果' : '开始导入' }}
            </a-button>
          </div>
        </div>
      </div>

      <!-- 步骤3: 导入结果 -->
      <div v-if="currentStep === 3 && importResult">
        <Alert
          v-if="isPreviewResult"
          class="mb-4"
          type="warning"
          message="预览模式 - 以下为预计结果，数据未写入数据库"
        />

        <Alert
          class="mb-4"
          :type="
            importResult.failed === 0 && importResult.not_found === 0
              ? 'success'
              : 'warning'
          "
        >
          <template #message>
            <div>
              <span v-if="isPreviewResult">预计结果：</span>
              <span v-else>导入完成：</span>
            </div>
            <div class="mt-1 text-sm">
              <span class="mr-3"
                >原始数据 <strong>{{ importResult.total }}</strong> 行</span
              >
              <span class="mr-3"
                >→ 聚合为
                <strong>{{ importResult.positions }}</strong> 个岗位</span
              >
            </div>
            <div class="mt-1 text-sm">
              <span class="mr-3 text-green-600"
                >更新 <strong>{{ importResult.updated }}</strong> 个</span
              >
              <span class="mr-3 text-orange-500"
                >未匹配 <strong>{{ importResult.not_found }}</strong> 个</span
              >
              <span class="text-red-500"
                >失败 <strong>{{ importResult.failed }}</strong> 个</span
              >
            </div>
          </template>
        </Alert>

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

        <div class="mt-4 flex justify-end gap-2">
          <a-button v-if="isPreviewResult" @click="currentStep = 2">
            返回修改
          </a-button>
          <a-button
            v-if="isPreviewResult && importResult.updated > 0"
            type="primary"
            :loading="loading"
            @click="confirmImport"
          >
            确认导入
          </a-button>
          <a-button
            v-if="!isPreviewResult"
            type="primary"
            @click="modalApi.close()"
          >
            完成
          </a-button>
        </div>
      </div>
    </Spin>
  </Modal>
</template>
