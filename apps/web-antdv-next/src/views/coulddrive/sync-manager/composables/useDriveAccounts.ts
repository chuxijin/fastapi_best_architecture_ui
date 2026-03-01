import type {
  CoulddriveDriveAccountDetail,
  CoulddriveUserListParams,
} from '#/api';

import { ref } from 'vue';

import { message } from 'ant-design-vue';

import { getCoulddriveUserListApi } from '#/api';

export function useDriveAccounts() {
  const accountOptions = ref<
    Array<{ cookies?: string; label: string; value: number }>
  >([]);
  const accountCache = ref<
    Map<string, Array<{ cookies?: string; label: string; value: number }>>
  >(new Map());

  async function loadAccountOptions(type?: string) {
    if (!type) {
      accountOptions.value = [];
      return;
    }

    if (accountCache.value.has(type)) {
      accountOptions.value = accountCache.value.get(type) || [];
      return;
    }

    try {
      const params: CoulddriveUserListParams = {
        type,
        is_valid: true,
        page: 1,
        size: 100,
      };
      const response = await getCoulddriveUserListApi(params);
      const accounts = response.items || [];
      const options = accounts.map((account: CoulddriveDriveAccountDetail) => ({
        label: `${account.username || account.user_id} (${account.type})`,
        value: account.id,
        cookies: account.cookies,
      }));
      accountCache.value.set(type, options);
      accountOptions.value = options;
    } catch (error) {
      console.error('获取账号列表失败:', error);
      message.error('获取账号列表失败');
      accountOptions.value = [];
    }
  }

  return { accountOptions, loadAccountOptions };
}
