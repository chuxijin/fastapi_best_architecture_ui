<script setup lang="ts">
import type { UploadFile, UploadProps } from 'ant-design-vue';

import type { BankResult } from '#/api';

import { onMounted, ref, watch } from 'vue';

import { MarkdownEditor } from '@vben/common-ui';
import { useAppConfig } from '@vben/hooks';
import { MaterialSymbolsAdd } from '@vben/icons';
import { useAccessStore } from '@vben/stores';

import { Card, Divider, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { uploadImageApi } from '#/api';

import {
  analysisSchema,
  basicInfoSchema,
  coverSchema,
  priceSchema,
  tagSchema,
  teacherSchema,
} from '../basic-info-schema';

const props = defineProps<Props>();
const emit = defineEmits<{
  update: [bankInfo: BankResult];
}>();
// ==================== Store ====================
const accessStore = useAccessStore();
const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

// ==================== Markdown 编辑器上传配置 ====================
const uploadOptions = {
  mode: 'ir' as 'ir', // 使用即时渲染模式，保持纯 Markdown 格式
  toolbar: [
    'emoji',
    'headings',
    'bold',
    'italic',
    'strike',
    'link',
    '|',
    'list',
    'ordered-list',
    'check',
    'outdent',
    'indent',
    '|',
    'quote',
    'line',
    'code',
    'inline-code',
    '|',
    'upload',
    'table',
    '|',
    'undo',
    'redo',
    '|',
    'edit-mode',
    'fullscreen',
    {
      name: 'more',
      toolbar: [
        'both',
        'preview',
        'outline',
        'export',
        'devtools',
        'info',
        'help',
      ],
    },
  ],
  upload: {
    url: `${apiURL}/api/v1/sys/files/upload`,
    fieldName: 'file',
    headers: {
      Authorization: `Bearer ${accessStore.accessToken || ''}`,
    },
    format(files: File[], responseText: string) {
      try {
        const response = JSON.parse(responseText);
        if (response.code === 200 && response.data?.url) {
          return JSON.stringify({
            code: 0,
            data: {
              errFiles: [],
              succMap: {
                [files[0].name]: response.data.url,
              },
            },
          });
        }
        return JSON.stringify({
          code: 1,
          msg: response.message || '上传失败',
        });
      } catch {
        return JSON.stringify({
          code: 1,
          msg: '上传失败',
        });
      }
    },
  },
  hint: {
    parse: false,
    emoji: {
      '+1': '👍',
      '-1': '👎',
      confused: '😕',
      eyes: '👀',
      heart: '❤️',
      rocket: '🚀',
      smile: '😄',
      tada: '🎉',
    },
  },
  preview: {
    markdown: {
      toc: true,
    },
  },
};

interface Props {
  bankId: number;
  bankInfo: BankResult | null;
}

const detailContent = ref('');

const [BasicForm, basicFormApi] = useVbenForm({
  wrapperClass: 'grid-cols-2 gap-4',
  showDefaultActions: false,
  schema: basicInfoSchema,
});

const [CoverForm, coverFormApi] = useVbenForm({
  wrapperClass: 'grid-cols-2 gap-4',
  showDefaultActions: false,
  schema: coverSchema,
});

const [TagForm, tagFormApi] = useVbenForm({
  wrapperClass: 'grid-cols-1',
  showDefaultActions: false,
  schema: tagSchema,
});

const [TeacherForm, teacherFormApi] = useVbenForm({
  wrapperClass: 'grid-cols-1',
  showDefaultActions: false,
  schema: teacherSchema,
});

const [PriceForm, priceFormApi] = useVbenForm({
  wrapperClass: 'grid-cols-2 gap-4',
  showDefaultActions: false,
  schema: priceSchema,
});

const [AnalysisForm, analysisFormApi] = useVbenForm({
  wrapperClass: 'grid-cols-2 gap-4',
  showDefaultActions: false,
  schema: analysisSchema,
});

const coverFileList = ref<UploadFile[]>([]);
const squareCoverFileList = ref<UploadFile[]>([]);
const uploadingCover = ref(false);
const uploadingSquare = ref(false);

function createPreviewFile(url: string, name: string): UploadFile {
  return {
    uid: name,
    name,
    status: 'done',
    url,
  } as UploadFile;
}

function syncCoverPreview(
  url: null | string | undefined,
  target: typeof coverFileList,
  name: string,
) {
  if (url) {
    target.value = [createPreviewFile(url, name)];
    return;
  }
  target.value = [];
}

function loadBankData(data: BankResult) {
  basicFormApi.setValues(data);
  coverFormApi.setValues(data);
  tagFormApi.setValues(data);
  teacherFormApi.setValues(data);
  priceFormApi.setValues(data);
  analysisFormApi.setValues(data);
  detailContent.value = data.detail || '';
  syncCoverPreview(data.cover_url, coverFileList, 'cover');
  syncCoverPreview(data.square_cover_url, squareCoverFileList, 'square-cover');
}

function handleCoverUrlChange(value: string) {
  syncCoverPreview(value, coverFileList, 'cover');
}

function handleSquareCoverUrlChange(value: string) {
  syncCoverPreview(value, squareCoverFileList, 'square-cover');
}

coverFormApi.updateSchema([
  {
    componentProps: {
      onBlur: (event: Event) => {
        const target = event.target as HTMLInputElement | null;
        handleCoverUrlChange(target?.value ?? '');
      },
      onInput: (event: Event) => {
        const target = event.target as HTMLInputElement | null;
        handleCoverUrlChange(target?.value ?? '');
      },
    },
    fieldName: 'cover_url',
  },
  {
    componentProps: {
      onBlur: (event: Event) => {
        const target = event.target as HTMLInputElement | null;
        handleSquareCoverUrlChange(target?.value ?? '');
      },
      onInput: (event: Event) => {
        const target = event.target as HTMLInputElement | null;
        handleSquareCoverUrlChange(target?.value ?? '');
      },
    },
    fieldName: 'square_cover_url',
  },
]);

const handleCoverPreview: UploadProps['onPreview'] = async (file) => {
  const url = file.url || file.thumbUrl;
  if (url) {
    window.open(url, '_blank', 'noopener');
  }
};

// 题库封面上传处理（改用真实上传）
const handleCoverBeforeUpload: UploadProps['beforeUpload'] = async (file) => {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error('只能上传图片文件！');
    return false;
  }

  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    message.error('图片大小不能超过 5MB！');
    return false;
  }

  uploadingCover.value = true;
  try {
    const url = await uploadImageApi(file as File);
    coverFileList.value = [
      {
        uid: `cover-${Date.now()}`,
        name: file.name,
        status: 'done',
        url,
      },
    ];
    coverFormApi.setValues({ cover_url: url });
    message.success('封面上传成功');
  } catch (error) {
    message.error('封面上传失败');
    console.error(error);
  } finally {
    uploadingCover.value = false;
  }

  return false;
};

const handleCoverRemove: UploadProps['onRemove'] = async (_file) => {
  coverFileList.value = [];
  coverFormApi.setValues({ cover_url: '' });
  return true;
};

const handleSquarePreview: UploadProps['onPreview'] = async (file) => {
  const url = file.url || file.thumbUrl;
  if (url) {
    window.open(url, '_blank', 'noopener');
  }
};

// 方形封面上传处理（改用真实上传）
const handleSquareBeforeUpload: UploadProps['beforeUpload'] = async (file) => {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error('只能上传图片文件！');
    return false;
  }

  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    message.error('图片大小不能超过 5MB！');
    return false;
  }

  uploadingSquare.value = true;
  try {
    const url = await uploadImageApi(file as File);
    squareCoverFileList.value = [
      {
        uid: `square-cover-${Date.now()}`,
        name: file.name,
        status: 'done',
        url,
      },
    ];
    coverFormApi.setValues({ square_cover_url: url });
    message.success('方形封面上传成功');
  } catch (error) {
    message.error('方形封面上传失败');
    console.error(error);
  } finally {
    uploadingSquare.value = false;
  }

  return false;
};

const handleSquareRemove: UploadProps['onRemove'] = async (_file) => {
  squareCoverFileList.value = [];
  coverFormApi.setValues({ square_cover_url: '' });
  return true;
};

watch(
  () => props.bankInfo,
  (newBankInfo) => {
    if (newBankInfo) {
      loadBankData(newBankInfo);
    }
  },
  { immediate: true },
);

onMounted(async () => {
  if (props.bankInfo) {
    loadBankData(props.bankInfo);
  }
});

async function handleSaveBasic() {
  const { valid } = await basicFormApi.validate();
  if (valid) {
    const data = await basicFormApi.getValues();
    console.log('保存基本信息:', { ...data, detail: detailContent.value });
    message.success('保存成功');
  }
}

async function handleSavePrice() {
  const { valid } = await priceFormApi.validate();
  if (valid) {
    const data = await priceFormApi.getValues();
    console.log('保存价格设置:', data);
    message.success('保存成功');
  }
}

async function handleSaveAnalysis() {
  const { valid } = await analysisFormApi.validate();
  if (valid) {
    const data = await analysisFormApi.getValues();
    console.log('保存解析设置:', data);
    message.success('保存成功');
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <Card title="基本信息">
      <BasicForm />

      <Divider orientation="left">题库详情</Divider>
      <MarkdownEditor
        v-model:value="detailContent"
        :height="300"
        :options="uploadOptions"
      />

      <div class="mt-4 flex justify-end">
        <a-button type="primary" @click="handleSaveBasic">保存</a-button>
      </div>
    </Card>

    <Card title="题库封面">
      <CoverForm />

      <Divider orientation="left">封面上传</Divider>
      <div class="mb-2 text-sm text-gray-500">
        💡 提示：图片会自动上传到服务器，建议使用尺寸为 16:9
        的图片作为封面，方形封面建议使用 1:1 尺寸
      </div>
      <div class="grid gap-6 md:grid-cols-2">
        <div>
          <div class="mb-2 font-medium">题库封面 (16:9)</div>
          <a-upload
            class="upload-16-9"
            list-type="picture-card"
            :max-count="1"
            :file-list="coverFileList"
            :before-upload="handleCoverBeforeUpload"
            :on-remove="handleCoverRemove"
            :on-preview="handleCoverPreview"
            accept="image/*"
          >
            <div
              v-if="coverFileList.length === 0"
              class="flex flex-col items-center justify-center text-gray-500"
            >
              <a-spin v-if="uploadingCover" />
              <template v-else>
                <MaterialSymbolsAdd class="size-6" />
                <span class="mt-1 text-xs">点击或拖拽上传</span>
                <span class="mt-0.5 text-xs text-gray-400">最大 5MB</span>
              </template>
            </div>
          </a-upload>
        </div>
        <div>
          <div class="mb-2 font-medium">方形封面 (1:1)</div>
          <a-upload
            class="upload-1-1"
            list-type="picture-card"
            :max-count="1"
            :file-list="squareCoverFileList"
            :before-upload="handleSquareBeforeUpload"
            :on-remove="handleSquareRemove"
            :on-preview="handleSquarePreview"
            accept="image/*"
          >
            <div
              v-if="squareCoverFileList.length === 0"
              class="flex flex-col items-center justify-center text-gray-500"
            >
              <a-spin v-if="uploadingSquare" />
              <template v-else>
                <MaterialSymbolsAdd class="size-6" />
                <span class="mt-1 text-xs">点击或拖拽上传</span>
                <span class="mt-0.5 text-xs text-gray-400">最大 5MB</span>
              </template>
            </div>
          </a-upload>
        </div>
      </div>
    </Card>

    <Card title="题库标签">
      <TagForm />
    </Card>

    <Card title="题库教师">
      <TeacherForm />
    </Card>

    <Card title="题库价格">
      <PriceForm />

      <div class="mt-4 flex justify-end">
        <a-button type="primary" @click="handleSavePrice">保存设置</a-button>
      </div>
    </Card>

    <Card title="解析">
      <AnalysisForm />

      <div class="mt-4 flex justify-end">
        <a-button type="primary" @click="handleSaveAnalysis">保存</a-button>
      </div>
    </Card>
  </div>
</template>

<style scoped>
:deep(.upload-16-9 .ant-upload-select-picture-card),
:deep(.upload-16-9 .ant-upload-list-picture-card-container),
:deep(.upload-16-9 .ant-upload-list-picture-card .ant-upload-list-item) {
  width: 320px;
  height: 180px;
}

:deep(.upload-16-9 .ant-upload-select-picture-card) {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 180px;
}

:deep(.upload-1-1 .ant-upload-select-picture-card),
:deep(.upload-1-1 .ant-upload-list-picture-card-container),
:deep(.upload-1-1 .ant-upload-list-picture-card .ant-upload-list-item) {
  width: 200px;
  height: 200px;
}

:deep(.upload-1-1 .ant-upload-select-picture-card) {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 200px;
}

:deep(.upload-16-9 .ant-upload-list-item),
:deep(.upload-1-1 .ant-upload-list-item) {
  padding: 0;
}

:deep(.upload-16-9 .ant-upload-list-item-thumbnail img),
:deep(.upload-1-1 .ant-upload-list-item-thumbnail img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
