<script setup lang="ts">
import type { UploadFile, UploadProps } from 'ant-design-vue';

import type { BatchImportQuestionResult, QuestionImportRow } from '#/api';

import { computed, ref } from 'vue';

import { VbenButton } from '@vben/common-ui';
import { MaterialSymbolsUploadFileOutline } from '@vben/icons';

import {
  Alert,
  Upload as AUpload,
  Card,
  Drawer,
  message,
  Table,
} from 'ant-design-vue';

import { batchImportQuestionsApi } from '#/api';

interface Props {
  bankId: number;
}

const props = defineProps<Props>();

const fileList = ref<UploadFile[]>([]);
const uploading = ref(false);
const importResult = ref<BatchImportQuestionResult | null>(null);
const showResultDrawer = ref(false);

// 解析 CSV 文件
function parseCSV(text: string): QuestionImportRow[] {
  const lines = text.split('\n').filter((line) => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV 文件格式错误：至少需要表头和一行数据');
  }

  /**
   * 正确解析 CSV 行（处理引号内的逗号和换行）
   */
  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            // 转义的双引号 ""
            current += '"';
            i++; // 跳过下一个引号
          } else {
            // 结束引号
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          // 开始引号
          inQuotes = true;
        } else if (char === ',') {
          // 字段分隔符
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
    }

    // 添加最后一个字段
    result.push(current.trim());
    return result;
  }

  // 解析表头
  const headers = parseCSVLine(lines[0]);
  const expectedHeaders = [
    'ID',
    '题目',
    '题型',
    '分数',
    '难度',
    '选项A',
    '选项B',
    '选项C',
    '选项D',
    '答案',
    '解析',
    '一级目录',
    '二级目录',
  ];

  // 验证表头（至少需要核心字段）
  const requiredFields = {
    题目: ['题目', '题干'],
    题型: ['题型', '类型'],
    答案: ['答案', '答', '正确答案'],
  };

  // 检查必需字段是否存在
  for (const [fieldName, possibleNames] of Object.entries(requiredFields)) {
    const found = possibleNames.some((name) => headers.includes(name));
    if (!found) {
      throw new Error(
        `CSV 表头缺少必需字段：${fieldName}（支持的表头名：${possibleNames.join('、')}）`,
      );
    }
  }

  // 解析数据行
  const questions: QuestionImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // 🔥 使用正确的 CSV 解析器（处理引号内的逗号）
    const values = parseCSVLine(line);

    // 根据表头位置获取值（支持多种表头名称）
    const getValueByHeader = (...headerOptions: string[]): string => {
      for (const header of headerOptions) {
        const index = headers.indexOf(header);
        if (index !== -1) {
          return values[index] || '';
        }
      }
      return '';
    };

    questions.push({
      题目: getValueByHeader('题目', '题干'),
      题型: getValueByHeader('题型', '类型'),
      分数: Number.parseInt(getValueByHeader('分数', '分值') || '1'),
      难度: getValueByHeader('难度') || '中等',
      选项A: getValueByHeader('选项A') || null,
      选项B: getValueByHeader('选项B') || null,
      选项C: getValueByHeader('选项C') || null,
      选项D: getValueByHeader('选项D') || null,
      答案: getValueByHeader('答案', '答', '正确答案'),
      解析: getValueByHeader('解析', '答案解析') || '',
      一级目录: getValueByHeader('一级目录', '一级章节') || null,
      二级目录: getValueByHeader('二级目录', '二级章节') || null,
    });
  }

  return questions;
}

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isCsv = file.name.endsWith('.csv');

  if (!isCsv) {
    message.error('只能上传 .csv 格式的文件！');
    return false;
  }

  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    message.error('文件大小不能超过 5MB！');
    return false;
  }

  // 暂时只添加到文件列表，不自动上传
  fileList.value = [file as any];
  return false;
};

const handleRemove: UploadProps['onRemove'] = () => {
  fileList.value = [];
  return true;
};

async function handleImport() {
  if (fileList.value.length === 0) {
    message.error('请先选择要导入的文件');
    return;
  }

  uploading.value = true;
  let hideLoading = message.loading('正在解析 CSV 文件...', 0);

  try {
    // 读取 CSV 文件内容（支持 GBK 和 UTF-8 编码）
    const file = fileList.value[0] as any;
    let text = '';

    // 尝试 UTF-8 解码
    try {
      text = await file.text();
      // 检测是否有乱码（如果表头包含问号或方块，说明编码错误）
      if (text.includes('�') || !text.includes('题目')) {
        throw new Error('UTF-8 解码失败，尝试 GBK');
      }
    } catch {
      // UTF-8 失败，尝试 GBK 解码
      const arrayBuffer = await file.arrayBuffer();
      const decoder = new TextDecoder('gbk');
      text = decoder.decode(arrayBuffer);
    }

    // 解析 CSV
    const questions = parseCSV(text);

    if (questions.length === 0) {
      hideLoading();
      message.warning('CSV 文件中没有有效数据');
      return;
    }

    hideLoading();
    hideLoading = message.loading(`正在导入 ${questions.length} 道题目...`, 0);

    // 调用后端 API 导入
    const result = await batchImportQuestionsApi({
      bank_id: props.bankId,
      questions,
    });

    hideLoading();
    importResult.value = result;
    showResultDrawer.value = true;

    if (result.fail_count === 0) {
      message.success(`导入完成！成功 ${result.success_count} 道题目`);
      fileList.value = [];
    } else {
      message.warning(
        `导入完成！成功 ${result.success_count} 道，失败 ${result.fail_count} 道`,
      );
    }
  } catch (error: any) {
    hideLoading();
    message.error(error.message || '题目导入失败');
    console.error(error);
  } finally {
    uploading.value = false;
  }
}

function handleDownloadTemplate() {
  // 创建 CSV 模板内容
  const headers = [
    'ID',
    '题目',
    '题型',
    '分数',
    '难度',
    '选项A',
    '选项B',
    '选项C',
    '选项D',
    '答案',
    '解析',
    '一级目录',
    '二级目录',
  ];

  const sampleData = [
    [
      '1',
      '马克思主义中国化的第一次历史性飞跃是？',
      '单选',
      '1',
      '中等',
      '毛泽东思想',
      '邓小平理论',
      '三个代表',
      '科学发展观',
      'A',
      '毛泽东思想是马克思主义中国化的第一次历史性飞跃',
      '马克思主义基本原理',
      '马克思主义中国化',
    ],
    [
      '2',
      '以下哪些是中国特色社会主义的基本特征？',
      '多选',
      '2',
      '困难',
      '坚持中国共产党的领导',
      '坚持人民民主专政',
      '坚持社会主义道路',
      '坚持改革开放',
      'A,B,C,D',
      '这是中国特色社会主义的四个基本特征',
      '中国特色社会主义',
      '',
    ],
  ];

  // 生成 CSV 内容
  const csvContent = [
    headers.join(','),
    ...sampleData.map((row) => row.join(',')),
  ].join('\n');

  // 创建 Blob 并下载
  const blob = new Blob([`\uFEFF${csvContent}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = '题目导入模板.csv';
  link.click();
  URL.revokeObjectURL(url);

  message.success('CSV 模板下载成功');
}

// 结果表格列定义
const resultColumns = [
  {
    title: '行号',
    dataIndex: 'row_number',
    key: 'row_number',
    width: 80,
  },
  {
    title: '状态',
    dataIndex: 'success',
    key: 'success',
    width: 80,
    customRender: ({ text }: any) => (text ? '✅ 成功' : '❌ 失败'),
  },
  {
    title: '题目 ID',
    dataIndex: 'question_id',
    key: 'question_id',
    width: 100,
  },
  {
    title: '错误信息',
    dataIndex: 'error_message',
    key: 'error_message',
    ellipsis: true,
  },
];

// 计算失败的记录
const failedRecords = computed(() => {
  if (!importResult.value) return [];
  return importResult.value.details.filter((item) => !item.success);
});
</script>

<template>
  <div class="question-import-container">
    <Card title="题目批量导入">
      <!-- 提示信息 -->
      <Alert
        message="请按照 CSV 模板格式准备题目数据，系统将自动创建章节并导入题目。"
        type="info"
        show-icon
        class="mb-6"
      />

      <!-- 导题文件 -->
      <div class="form-item mb-6">
        <label class="form-label">导题文件：</label>
        <div class="form-control">
          <AUpload
            :file-list="fileList"
            :before-upload="beforeUpload"
            :on-remove="handleRemove"
            accept=".csv"
            :max-count="1"
          >
            <VbenButton>
              <MaterialSymbolsUploadFileOutline class="mr-1 size-4" />
              选择 CSV 文件
            </VbenButton>
          </AUpload>
          <div class="form-hint mt-2">
            * 仅支持 UTF-8 编码的 CSV 文件，大小不超过 5M。
            <a
              class="ml-2 cursor-pointer text-blue-500 hover:text-blue-600"
              @click="handleDownloadTemplate"
            >
              下载 CSV 模板 ⊕
            </a>
          </div>
          <div class="form-hint mt-2 text-orange-600">
            ⚠️ CSV 格式说明：
            <ul class="ml-4 mt-1 list-disc">
              <li>
                题型：单选/单选题、多选/多选题、判断/判断题、填空/填空题、简答/简答题
              </li>
              <li>难度：简单/中等/困难</li>
              <li>答案：单选填 A，多选填 A,B,C，填空/简答用逗号分隔</li>
              <li>一级/二级目录：留空则不归属任何章节</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-end gap-3">
        <VbenButton
          type="primary"
          :loading="uploading"
          :disabled="fileList.length === 0"
          @click="handleImport"
        >
          {{ uploading ? '导入中...' : '开始导入' }}
        </VbenButton>
      </div>
    </Card>

    <!-- 导入结果抽屉 -->
    <Drawer
      v-model:open="showResultDrawer"
      title="导入结果"
      :width="800"
      :body-style="{ paddingBottom: '80px' }"
    >
      <div v-if="importResult" class="space-y-4">
        <!-- 统计信息 -->
        <Alert
          :message="`导入完成！总计 ${importResult.total} 道题目，成功 ${importResult.success_count} 道，失败 ${importResult.fail_count} 道`"
          :type="importResult.fail_count === 0 ? 'success' : 'warning'"
          show-icon
        />

        <!-- 失败详情 -->
        <div v-if="failedRecords.length > 0">
          <h3 class="mb-3 text-base font-semibold">失败详情：</h3>
          <Table
            :columns="resultColumns"
            :data-source="failedRecords"
            :pagination="false"
            size="small"
            bordered
          />
        </div>

        <!-- 全部结果 -->
        <div>
          <h3 class="mb-3 text-base font-semibold">全部结果：</h3>
          <Table
            :columns="resultColumns"
            :data-source="importResult.details"
            :pagination="{ pageSize: 10 }"
            size="small"
            bordered
          />
        </div>
      </div>
    </Drawer>
  </div>
</template>

<style scoped>
.form-item {
  display: flex;
  align-items: flex-start;
}

.form-label {
  flex-shrink: 0;
  width: 120px;
  padding-top: 4px;
  font-weight: 500;
  color: #333;
}

.form-control {
  flex: 1;
  max-width: 600px;
}

.form-hint {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: #666;
}

:deep(.ant-alert) {
  border-radius: 4px;
}

:deep(.ant-upload-list-item) {
  margin-top: 8px;
}
</style>
