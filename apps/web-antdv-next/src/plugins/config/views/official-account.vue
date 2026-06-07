<script setup lang="ts">
import type { ConfigParams } from '#/plugins/config/api';

import { ref } from 'vue';

import { VbenButton } from '@vben/common-ui';
import { MaterialSymbolsEdit } from '@vben/icons';
import { $t } from '@vben/locales';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import {
  createConfigApi,
  getAllConfigApi,
  updateConfigApi,
} from '#/plugins/config/api';
import { officialAccountSchema } from '#/plugins/config/views/data';

const OFFICIAL_ACCOUNT_TYPE = 'OFFICIAL_ACCOUNT';
const OFFICIAL_ACCOUNT_CONFIGS: ConfigParams[] = [
  {
    name: '公众号名称',
    type: OFFICIAL_ACCOUNT_TYPE,
    key: 'OFFICIAL_ACCOUNT_NAME',
    value: '有岸上',
    is_frontend: true,
    remark: '激活权益页展示名称',
  },
  {
    name: '公众号原始 ID',
    type: OFFICIAL_ACCOUNT_TYPE,
    key: 'OFFICIAL_ACCOUNT_ORIGINAL_ID',
    value: '',
    is_frontend: true,
    remark: '用于打开公众号主页，格式通常为 gh_xxx',
  },
  {
    name: '公众号微信号',
    type: OFFICIAL_ACCOUNT_TYPE,
    key: 'OFFICIAL_ACCOUNT_WECHAT_ID',
    value: '',
    is_frontend: true,
    remark: '用于打开公众号会话',
  },
  {
    name: '公众号回复词',
    type: OFFICIAL_ACCOUNT_TYPE,
    key: 'OFFICIAL_ACCOUNT_REPLY_KEYWORD',
    value: '激活',
    is_frontend: true,
    remark: '用户在公众号后台回复的关键词',
  },
  {
    name: '公众号文章链接',
    type: OFFICIAL_ACCOUNT_TYPE,
    key: 'OFFICIAL_ACCOUNT_ARTICLE_URL',
    value: '',
    is_frontend: true,
    remark: '可选，用于打开购买或激活说明文章',
  },
  {
    name: '启用公众号会话',
    type: OFFICIAL_ACCOUNT_TYPE,
    key: 'OFFICIAL_ACCOUNT_ENABLE_CHAT',
    value: 'true',
    is_frontend: true,
    remark: '是否在小程序展示公众号会话入口',
  },
  {
    name: '启用公众号主页',
    type: OFFICIAL_ACCOUNT_TYPE,
    key: 'OFFICIAL_ACCOUNT_ENABLE_PROFILE',
    value: 'true',
    is_frontend: true,
    remark: '是否在小程序展示公众号主页入口',
  },
  {
    name: '启用公众号文章',
    type: OFFICIAL_ACCOUNT_TYPE,
    key: 'OFFICIAL_ACCOUNT_ENABLE_ARTICLE',
    value: 'false',
    is_frontend: true,
    remark: '是否在小程序展示公众号文章入口',
  },
];

const [Form, formApi] = useVbenForm({
  showDefaultActions: false,
  schema: officialAccountSchema,
  commonConfig: {
    controlClass: 'w-full max-w-[520px]',
    disabled: true,
    labelClass: 'justify-start ml-2 self-start',
    labelWidth: 150,
    wrapperClass: 'flex-col items-start',
    hideRequiredMark: true,
  },
});

const editButtonShow = ref<boolean>(true);
const loading = ref<boolean>(false);
const saveLoading = ref<boolean>(false);
const officialAccountData = ref<ConfigParams[]>([]);

function mergeConfigList(remoteData: ConfigParams[]): ConfigParams[] {
  const configMap = new Map(remoteData.map((config) => [config.key, config]));
  return OFFICIAL_ACCOUNT_CONFIGS.map((config) => ({
    ...config,
    ...configMap.get(config.key),
  }));
}

function toCreatePayload(config: ConfigParams): ConfigParams {
  return {
    name: config.name,
    type: config.type,
    key: config.key,
    value: config.value,
    is_frontend: config.is_frontend,
    remark: config.remark,
  };
}

const fetchConfigList = async () => {
  loading.value = true;
  try {
    const remoteData = await getAllConfigApi({ type: OFFICIAL_ACCOUNT_TYPE });
    officialAccountData.value = mergeConfigList(remoteData);
    officialAccountData.value.forEach((config) => {
      formApi.setState((prev: any) => {
        return {
          schema: prev.schema?.map((item: any) => {
            if (item.fieldName === config.key) {
              return {
                ...item,
                label: config.name,
              };
            }
            return item;
          }),
        };
      });
      formApi.setValues({ [config.key]: config.value });
    });
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const saveOfficialAccountConfig = async () => {
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }

  const data: Record<string, any> = await formApi.getValues();
  officialAccountData.value.forEach((config) => {
    if (Object.prototype.hasOwnProperty.call(data, config.key)) {
      config.value = String(data[config.key] ?? '');
    }
  });

  const createData = officialAccountData.value
    .filter((config) => !config.id)
    .map((config) => toCreatePayload(config));
  const updateData = officialAccountData.value.filter((config) => config.id);

  saveLoading.value = true;
  try {
    if (createData.length > 0) {
      await Promise.all(createData.map((config) => createConfigApi(config)));
    }
    if (updateData.length > 0) {
      await updateConfigApi(updateData);
    }
    message.success($t('ui.actionMessage.operationSuccess'));
    editButtonShow.value = true;
    formApi.setState({ commonConfig: { disabled: true } });
    await fetchConfigList();
  } catch (error) {
    console.error(error);
  } finally {
    saveLoading.value = false;
  }
};

defineExpose({
  fetchConfigList,
});
</script>

<template>
  <a-spin :spinning="loading">
    <div>
      <Form />
      <VbenButton
        v-show="editButtonShow"
        class="ml-1.5 mt-3"
        @click="
          () => {
            editButtonShow = false;
            formApi.setState({ commonConfig: { disabled: false } });
          }
        "
      >
        <MaterialSymbolsEdit class="mr-1" />
        修改
      </VbenButton>
      <VbenButton
        v-show="!editButtonShow"
        class="ml-1.5 mt-3"
        :loading="saveLoading"
        @click="saveOfficialAccountConfig"
      >
        <MaterialSymbolsEdit class="mr-1" />
        保存
      </VbenButton>
      <VbenButton
        v-show="!editButtonShow"
        class="ml-3 mt-3"
        :disabled="saveLoading"
        variant="outline"
        @click="
          () => {
            editButtonShow = true;
            formApi.setState({ commonConfig: { disabled: true } });
            fetchConfigList();
          }
        "
      >
        <MaterialSymbolsEdit class="mr-1" />
        取消
      </VbenButton>
    </div>
  </a-spin>
</template>
