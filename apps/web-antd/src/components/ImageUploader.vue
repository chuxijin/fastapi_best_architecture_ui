<script setup lang="ts">
import { ref } from 'vue';

import { LoadingOutlined, PlusOutlined } from '@ant-design/icons-vue';
import { message, Upload } from 'ant-design-vue';

import { uploadImageApi } from '#/api';

interface Props {
  modelValue?: string;
  maxSize?: number; // MB
  accept?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  maxSize: 5,
  accept: 'image/png,image/jpeg,image/jpg,image/gif,image/webp',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const loading = ref(false);
const imageUrl = ref(props.modelValue);

// 上传前验证
function beforeUpload(file: File) {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error('只能上传图片文件！');
    return false;
  }

  const isLtMaxSize = file.size / 1024 / 1024 < props.maxSize;
  if (!isLtMaxSize) {
    message.error(`图片大小不能超过 ${props.maxSize}MB！`);
    return false;
  }

  return true;
}

// 自定义上传处理
async function customRequest(options: any) {
  const { file } = options;

  loading.value = true;
  try {
    const url = await uploadImageApi(file);
    imageUrl.value = url;
    emit('update:modelValue', url);
    message.success('上传成功');
  } catch (error) {
    message.error('上传失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Upload
    name="file"
    list-type="picture-card"
    class="image-uploader"
    :show-upload-list="false"
    :accept="accept"
    :before-upload="beforeUpload"
    :custom-request="customRequest"
  >
    <img v-if="imageUrl" :src="imageUrl" alt="preview" class="upload-image" />
    <div v-else class="upload-placeholder">
      <LoadingOutlined v-if="loading" />
      <PlusOutlined v-else />
      <div class="ant-upload-text">上传图片</div>
    </div>
  </Upload>
</template>

<style scoped>
.image-uploader :deep(.ant-upload) {
  width: 128px;
  height: 128px;
}

.upload-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.upload-placeholder .anticon {
  margin-bottom: 8px;
  font-size: 32px;
}

.ant-upload-text {
  margin-top: 8px;
  font-size: 14px;
}
</style>
