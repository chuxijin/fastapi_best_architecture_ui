<script lang="ts" setup>
import type { VbenFormProps, VbenFormSchema } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { AccessEntitlementResult, AccessRuleResult } from '#/api/access';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message, Modal } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createAccessRuleApi,
  deleteAccessRuleApi,
  getAccessEntitlementListApi,
  getAccessRuleListApi,
  updateAccessRuleApi,
} from '#/api/access';

import {
  buildTrialPolicy,
  createSchema,
  editSchema,
  enrichResourceNames,
  loadResourceOptions,
  querySchema,
  registerBankSearchHandler,
  searchBankOptions,
  spreadTrialPolicy,
  useColumns,
} from '../data';

interface Props {
  /** 锁定的资源类型, 传入后该字段从查询/创建表单中隐藏并自动填入 */
  lockedResourceType?: string;
  /** 锁定的资源 ID, 同上 */
  lockedResourceId?: number;
}

const props = defineProps<Props>();

const isLocked = Boolean(props.lockedResourceType && props.lockedResourceId);

// 锁定模式下从 schema 里剔除两个 resource 字段(setup 时一次性算定, 不做 reactive)
function filterLockedFields(schema: VbenFormSchema[]): VbenFormSchema[] {
  if (!isLocked) return schema;
  return schema.filter(
    (item) =>
      item.fieldName !== 'resource_type' &&
      item.fieldName !== 'resource_id' &&
      item.fieldName !== 'resource_id_raw',
  );
}

const effectiveQuerySchema = filterLockedFields(querySchema);
const effectiveCreateSchema = filterLockedFields(createSchema);

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.form.query') },
  schema: effectiveQuerySchema,
};

const gridOptions: VxeTableGridOptions<AccessRuleResult> = {
  rowConfig: { keyField: 'id' },
  checkboxConfig: { highlight: true },
  height: 'auto',
  toolbarConfig: {
    export: true,
    refresh: { code: 'query' },
    custom: true,
    zoom: true,
  },
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const res = await getAccessRuleListApi({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
          // locked 值最后 merge, 覆盖任何用户输入
          ...(isLocked
            ? {
                resource_type: props.lockedResourceType,
                resource_id: props.lockedResourceId,
              }
            : {}),
        });
        if (res?.items?.length) {
          res.items = await enrichResourceNames(res.items);
        }
        return res;
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

function onRefresh() {
  gridApi.query();
}

const entitlementOptions = ref<Array<{ label: string; value: string }>>([]);
const optionPageSize = 200;
let optionsLoaded = false;

async function loadEntitlementOptions() {
  if (optionsLoaded) return;
  try {
    const entitlements: AccessEntitlementResult[] = [];
    let page = 1;

    while (true) {
      const data = await getAccessEntitlementListApi({
        page,
        size: optionPageSize,
        status: 'active',
      });
      entitlements.push(...data.items);

      if (
        entitlements.length >= data.total ||
        data.items.length < optionPageSize
      ) {
        break;
      }
      page += 1;
    }

    entitlementOptions.value = entitlements.map((item) => ({
      label: `${item.code} · ${item.name} (${item.category})`,
      value: item.code,
    }));

    await createFormApi.updateSchema([
      {
        componentProps: {
          allowClear: true,
          optionFilterProp: 'label',
          options: entitlementOptions.value,
          placeholder: '请选择权益编码',
          popupMatchSelectWidth: 560,
          showSearch: true,
          style: { width: '100%' },
        },
        fieldName: 'entitlement_code',
      },
    ]);
    optionsLoaded = true;
  } catch (error) {
    console.error('Failed to load entitlements:', error);
  }
}

// ---------------- 创建 ----------------

const [CreateForm, createFormApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema: effectiveCreateSchema,
});

registerBankSearchHandler(async (keyword: string) => {
  const options = await searchBankOptions(keyword);
  await createFormApi.updateSchema([
    {
      componentProps: { options },
      fieldName: 'resource_id',
    },
  ]);
});

const [CreateModal, createModalApi] = useVbenModal({
  title: '新建资源规则',
  onConfirm: async () => {
    try {
      const values = await createFormApi.getValues<any>();
      const resourceType = isLocked
        ? (props.lockedResourceType ?? '')
        : values.resource_type;
      const resourceId = isLocked
        ? (props.lockedResourceId ?? 0)
        : (values.resource_id ?? values.resource_id_raw);
      const payload = {
        resource_type: resourceType,
        resource_id: resourceId,
        entitlement_code: values.entitlement_code,
        grant_mode: values.grant_mode,
        priority: values.priority ?? 0,
        trial_policy: buildTrialPolicy(values),
        valid_period:
          values.valid_from || values.valid_to
            ? {
                valid_from: values.valid_from || null,
                valid_to: values.valid_to || null,
              }
            : null,
        inherit_to_children: values.inherit_to_children ?? true,
      };
      await createAccessRuleApi(payload);
      message.success('资源规则已创建');
      createModalApi.close();
      onRefresh();
    } catch (error) {
      console.error(error);
    }
  },
  onOpenChange: async (isOpen: boolean) => {
    if (isOpen) {
      createFormApi.resetForm();
      const defaults: Record<string, unknown> = {
        grant_mode: 'access',
        priority: 0,
        inherit_to_children: true,
      };
      if (!isLocked) {
        defaults.resource_type = 'qbank';
      }
      createFormApi.setValues(defaults);
      await loadEntitlementOptions();
    }
  },
});

function handleCreate() {
  createModalApi.open();
}

// ---------------- 编辑 ----------------

const editingId = ref<null | number>(null);

const [EditForm, editFormApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema: editSchema,
});

const [EditModal, editModalApi] = useVbenModal({
  title: '编辑资源规则',
  onConfirm: async () => {
    if (editingId.value === null) {
      editModalApi.close();
      return;
    }
    try {
      const values = await editFormApi.getValues<any>();
      const payload = {
        grant_mode: values.grant_mode,
        priority: values.priority ?? 0,
        trial_policy: buildTrialPolicy(values),
        valid_period:
          values.valid_from || values.valid_to
            ? {
                valid_from: values.valid_from || null,
                valid_to: values.valid_to || null,
              }
            : null,
        inherit_to_children: values.inherit_to_children ?? true,
        status: values.status,
      };
      await updateAccessRuleApi(editingId.value, payload);
      message.success('资源规则已更新');
      editModalApi.close();
      onRefresh();
    } catch (error) {
      console.error(error);
    }
  },
});

function openEditModal(row: AccessRuleResult) {
  editingId.value = row.id;
  editFormApi.resetForm();
  const enrichedName = (row as any)._resource_name as string | undefined;
  const resourceDisplay =
    enrichedName || `${row.resource_type} #${row.resource_id}`;
  editFormApi.setValues({
    resource_type: row.resource_type,
    resource_display: resourceDisplay,
    entitlement_code: row.entitlement_code,
    grant_mode: row.grant_mode,
    priority: row.priority,
    ...spreadTrialPolicy(row.trial_policy),
    valid_from: row.valid_period?.valid_from || null,
    valid_to: row.valid_period?.valid_to || null,
    inherit_to_children: row.inherit_to_children,
    status: row.status,
  });
  editModalApi.open();
  // 异步补一次名称(行还没被 enrich 时,例如刚创建立即编辑)
  if (!enrichedName) {
    loadResourceOptions(row.resource_type).then((options) => {
      const match = options.find((o) => o.value === row.resource_id);
      if (match) {
        editFormApi.setValues({ resource_display: match.label });
      }
    });
  }
}

// ---------------- 删除 ----------------

function handleDelete(row: AccessRuleResult) {
  const resourceDesc = (row as any)._resource_name
    ? `${(row as any)._resource_name} → ${row.entitlement_code}`
    : `${row.resource_type}#${row.resource_id} → ${row.entitlement_code}`;
  Modal.confirm({
    title: '确认删除该资源规则吗?',
    content: resourceDesc,
    okType: 'danger',
    okText: '删除',
    cancelText: '取消',
    onOk: async () => {
      await deleteAccessRuleApi(row.id);
      message.success('资源规则已删除');
      onRefresh();
    },
  });
}

function onActionClick({ code, row }: OnActionClickParams<AccessRuleResult>) {
  if (code === 'edit') {
    openEditModal(row);
  } else if (code === 'delete') {
    handleDelete(row);
  }
}

// 暴露刷新方法, 嵌入到题库 tab 场景下父组件可以触发
defineExpose({ refresh: onRefresh });
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex-1 overflow-hidden">
      <Grid class="h-full">
        <template #toolbar-tools>
          <a-button type="primary" @click="handleCreate">新建资源规则</a-button>
        </template>
      </Grid>
    </div>
    <CreateModal>
      <CreateForm />
    </CreateModal>
    <EditModal>
      <EditForm />
    </EditModal>
  </div>
</template>
