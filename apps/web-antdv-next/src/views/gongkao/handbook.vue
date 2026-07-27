<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  HaloDocTreeNodeResult,
  SysCategoryDocBindingResult,
  SysCategoryTreeResult,
} from '#/api';

import { computed, onMounted, ref } from 'vue';

import { ColPage, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';

import { message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createSysCategoryDocBindingApi,
  deleteSysCategoryDocBindingApi,
  getSysCategoryDocBindingsApi,
  getSysCategoryTreeApi,
  updateSysCategoryDocBindingApi,
} from '#/api/category';
import {
  getHaloDocDetailApi,
  getHaloDocPreviewApi,
  getHaloDocProjectsApi,
  getHaloDocProjectVersionsApi,
  getHaloDocTreeApi,
} from '#/api/halo';

interface CategoryTreeOption {
  key: string;
  title: string;
  children?: CategoryTreeOption[];
}

interface DocOption {
  label: string;
  value: string;
  node: HaloDocTreeNodeResult;
}

const APP_CODE = 'youanshang';
const HANDBOOK_CATEGORY_ROOT_ID = 1400;

const loading = ref(false);
const treeLoading = ref(false);
const saving = ref(false);
const categoryTree = ref<CategoryTreeOption[]>([]);
const selectedCategoryKeys = ref<string[]>([]);
const searchCategoryValue = ref('');
const bindings = ref<SysCategoryDocBindingResult[]>([]);
const projects = ref<Awaited<ReturnType<typeof getHaloDocProjectsApi>>>([]);
const versions = ref<Awaited<ReturnType<typeof getHaloDocProjectVersionsApi>>>(
  [],
);
const docTree = ref<HaloDocTreeNodeResult[]>([]);
const selectedProjectName = ref('');
const selectedVersionName = ref('');
const selectedTreeName = ref('');
const isBindingModalOpen = ref(false);
const editingBindingId = ref<null | number>(null);
const bindingForm = ref({
  title: '',
  enabled: true,
  sort_order: 0,
});
const isPreviewModalOpen = ref(false);
const previewTitle = ref('');
const previewUrl = ref('');
const previewHtml = ref('');
const previewLoading = ref(false);

const selectedCategoryId = computed(() =>
  Number(selectedCategoryKeys.value[0] || 0),
);
const selectedDocNode = computed(() =>
  findDocNode(docTree.value, selectedTreeName.value),
);
const docOptions = computed<DocOption[]>(() => flattenDocTree(docTree.value));
const projectSelectOptions = computed(() => {
  return projects.value.map((project) => ({
    label: project.display_name || project.slug || project.name,
    value: project.name,
  }));
});
const versionSelectOptions = computed(() => {
  return versions.value.map((version) => ({
    label: `${version.slug || version.name}${version.publish ? '（已发布）' : ''}`,
    value: version.name,
  }));
});
const docSelectOptions = computed(() => {
  return docOptions.value.map((option) => ({
    label: option.label,
    value: option.value,
  }));
});
const visibleCategoryTree = computed(() => {
  return filterCategoryTree(categoryTree.value, searchCategoryValue.value);
});

async function fetchBindings(): Promise<SysCategoryDocBindingResult[]> {
  if (!selectedCategoryId.value) {
    bindings.value = [];
    return [];
  }
  const response = await getSysCategoryDocBindingsApi({
    category_id: selectedCategoryId.value,
  });
  const data = normalizeList<SysCategoryDocBindingResult>(response);
  bindings.value = data;
  return data;
}

function onActionClick({
  code,
  row,
}: OnActionClickParams<SysCategoryDocBindingResult>) {
  switch (code) {
    case 'delete': {
      removeBinding(row);
      break;
    }
    case 'edit': {
      void openEditModal(row);
      break;
    }
    case 'preview': {
      void previewBinding(row);
      break;
    }
  }
}

const gridOptions: VxeTableGridOptions<SysCategoryDocBindingResult> = {
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
  pagerConfig: {
    enabled: false,
  },
  columns: [
    { field: 'title', title: '文章标题', minWidth: 260 },
    { field: 'halo_project_version_name', title: '文档版本', width: 190 },
    { field: 'halo_tree_name', title: '文档节点', width: 220 },
    {
      field: 'enabled',
      title: '状态',
      width: 100,
      slots: { default: 'enabled' },
    },
    { field: 'sort_order', title: '排序', width: 80 },
    {
      field: 'updated_time',
      title: '更新时间',
      width: 168,
    },
    {
      field: 'operation',
      title: '操作',
      align: 'center',
      fixed: 'right',
      width: 180,
      cellRender: {
        attrs: {
          nameField: 'title',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [{ code: 'preview', text: '预览' }, 'edit', 'delete'],
      },
    },
  ],
  proxyConfig: {
    ajax: {
      query: async () => fetchBindings(),
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function normalizeList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const data = (payload as { data?: unknown }).data;
  if (Array.isArray(data)) {
    return data as T[];
  }
  if (data && typeof data === 'object') {
    const nestedData = (data as { data?: unknown }).data;
    if (Array.isArray(nestedData)) {
      return nestedData as T[];
    }
  }
  return [];
}

function convertCategoryTree(
  nodes: SysCategoryTreeResult[],
): CategoryTreeOption[] {
  return nodes.map((node) => ({
    key: String(node.id),
    title: node.name,
    children: node.children?.length
      ? convertCategoryTree(node.children)
      : undefined,
  }));
}

function filterCategoryTree(
  nodes: CategoryTreeOption[],
  keyword: string,
): CategoryTreeOption[] {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return nodes;
  }

  const result: CategoryTreeOption[] = [];
  for (const node of nodes) {
    const children = filterCategoryTree(node.children || [], normalizedKeyword);
    if (
      node.title.toLowerCase().includes(normalizedKeyword) ||
      children.length > 0
    ) {
      result.push({
        ...node,
        children: children.length > 0 ? children : node.children,
      });
    }
  }
  return result;
}

function findDocNode(
  nodes: HaloDocTreeNodeResult[],
  name: string,
): HaloDocTreeNodeResult | null {
  for (const node of nodes) {
    if (node.name === name) {
      return node;
    }
    const child = findDocNode(node.children, name);
    if (child) {
      return child;
    }
  }
  return null;
}

function flattenDocTree(
  nodes: HaloDocTreeNodeResult[],
  parents: string[] = [],
): DocOption[] {
  const result: DocOption[] = [];
  for (const node of nodes) {
    const currentPath = [...parents, node.title];
    if (node.type === 'DOC') {
      result.push({
        label: currentPath.join(' / '),
        value: node.name,
        node,
      });
    }
    result.push(...flattenDocTree(node.children, currentPath));
  }
  return result;
}

async function loadCategories() {
  treeLoading.value = true;
  try {
    const response = await getSysCategoryTreeApi({
      app_code: APP_CODE,
      type: 'product_catalog',
    });
    const data = normalizeList<SysCategoryTreeResult>(response);
    const root = data.find((node) => node.id === HANDBOOK_CATEGORY_ROOT_ID);
    categoryTree.value = root ? convertCategoryTree([root]) : [];
    if (selectedCategoryKeys.value.length === 0 && categoryTree.value[0]) {
      selectedCategoryKeys.value = [categoryTree.value[0].key];
    }
  } finally {
    treeLoading.value = false;
  }
}

async function loadProjects() {
  projects.value = normalizeList(await getHaloDocProjectsApi());
  const project =
    projects.value.find((item) => item.slug === 'gongkao') ||
    projects.value.find((item) => item.preferred_version_name) ||
    projects.value[0];
  if (project) {
    await loadVersions(project.name, project.preferred_version_name);
  }
}

async function loadVersions(projectName: string, preferredVersionName = '') {
  selectedProjectName.value = projectName;
  selectedVersionName.value = '';
  versions.value = normalizeList(
    await getHaloDocProjectVersionsApi(projectName),
  );
  const version =
    versions.value.find((item) => item.name === preferredVersionName) ||
    versions.value.find((item) => item.publish) ||
    versions.value[0];
  if (version) {
    await loadDocTree(version.name);
  } else {
    docTree.value = [];
  }
}

async function loadDocTree(versionName: string) {
  selectedVersionName.value = versionName;
  selectedTreeName.value = '';
  docTree.value = normalizeList(
    await getHaloDocTreeApi({
      project_version_name: versionName,
    }),
  );
}

async function loadBindings() {
  await gridApi.query();
}

async function loadData() {
  loading.value = true;
  try {
    await Promise.all([loadCategories(), loadProjects()]);
  } catch (error) {
    console.error('学习手册数据加载失败', error);
    message.error('学习手册数据加载失败，请检查 Halo 配置');
  } finally {
    loading.value = false;
  }
}

function handleCategorySelect(keys: Array<number | string>) {
  selectedCategoryKeys.value = keys.slice(0, 1).map(String);
  void loadBindings();
}

function handleProjectChange(value: string) {
  void loadVersions(value);
}

function handleDocChange(value: string) {
  selectedTreeName.value = value;
  const node = selectedDocNode.value;
  if (node && !editingBindingId.value) {
    bindingForm.value.title = node.title;
  }
}

function buildPreviewHtml(html: string, url: string): string {
  if (!html || !url || /<base\s/i.test(html)) {
    return html;
  }

  const baseUrl = new URL('.', url).href;
  return html.replace(/<head([^>]*)>/i, `<head$1><base href="${baseUrl}">`);
}

function openCreateModal() {
  if (!selectedCategoryId.value) {
    message.warning('请先选择一个分类');
    return;
  }
  if (projects.value.length === 0 || versions.value.length === 0) {
    message.warning('Halo Docsme 暂无可用项目或版本，请先检查 Halo 配置');
    return;
  }
  if (docOptions.value.length === 0) {
    message.warning('当前 Halo 版本暂无可关联文档');
    return;
  }
  editingBindingId.value = null;
  selectedTreeName.value = '';
  bindingForm.value = {
    title: '',
    enabled: true,
    sort_order: bindings.value.length,
  };
  isBindingModalOpen.value = true;
}

async function openEditModal(binding: SysCategoryDocBindingResult) {
  editingBindingId.value = binding.id;
  selectedProjectName.value = binding.halo_project_name;
  await loadVersions(
    binding.halo_project_name,
    binding.halo_project_version_name,
  );
  selectedTreeName.value = binding.halo_tree_name;
  bindingForm.value = {
    title: binding.title,
    enabled: binding.enabled,
    sort_order: binding.sort_order,
  };
  isBindingModalOpen.value = true;
}

async function saveBinding() {
  const node = selectedDocNode.value;
  if (!selectedCategoryId.value || !node || !selectedVersionName.value) {
    message.warning('请选择有效的文档版本和正文节点');
    return;
  }
  if (!bindingForm.value.title.trim()) {
    message.warning('请输入文档标题');
    return;
  }

  saving.value = true;
  let docName = node.doc_name;
  const data = {
    halo_project_name: selectedProjectName.value,
    halo_project_version_name: selectedVersionName.value,
    halo_tree_name: node.name,
    halo_doc_name: docName,
    title: bindingForm.value.title.trim(),
    relation_type: 'teaching',
    halo_doc_path: node.path || undefined,
    halo_permalink: node.permalink || undefined,
    enabled: bindingForm.value.enabled,
    sort_order: bindingForm.value.sort_order,
  };
  try {
    if (!docName) {
      const detail = await getHaloDocDetailApi(node.name);
      docName = detail.doc_name;
      data.halo_doc_name = docName;
    }
    if (!docName) {
      message.error('无法获取 Halo 正文资源，请检查文档是否已发布');
      return;
    }
    if (editingBindingId.value) {
      await updateSysCategoryDocBindingApi(editingBindingId.value, data);
    } else {
      await createSysCategoryDocBindingApi(selectedCategoryId.value, data);
    }
    message.success('学习手册关联已保存');
    isBindingModalOpen.value = false;
    await loadBindings();
  } catch (error) {
    console.error('学习手册关联保存失败', error);
    message.error('学习手册关联保存失败，请检查权限和文档状态');
  } finally {
    saving.value = false;
  }
}

function removeBinding(binding: SysCategoryDocBindingResult) {
  Modal.confirm({
    title: '确认取消此文档关联？',
    content: `将取消“${binding.title}”与当前分类的关联。`,
    okType: 'danger',
    async onOk() {
      await deleteSysCategoryDocBindingApi(binding.id);
      message.success('文档关联已删除');
      await loadBindings();
    },
  });
}

async function previewBinding(binding: SysCategoryDocBindingResult) {
  previewTitle.value = binding.title;
  previewUrl.value = '';
  previewHtml.value = '';
  previewLoading.value = true;
  isPreviewModalOpen.value = true;
  try {
    const preview = await getHaloDocPreviewApi(binding.halo_tree_name);
    previewUrl.value = preview.url;
    previewHtml.value = buildPreviewHtml(preview.html, preview.url);
  } catch (error) {
    console.error('学习手册正文加载失败', error);
    message.error('无法打开 Halo 文档预览');
    isPreviewModalOpen.value = false;
  } finally {
    previewLoading.value = false;
  }
}

onMounted(() => {
  void loadData().then(() => loadBindings());
});
</script>

<template>
  <ColPage
    auto-content-height
    :resizable="false"
    :left-width="20"
    :right-width="80"
  >
    <template #left>
      <div class="mr-2 h-full overflow-y-auto rounded-[var(--radius)] bg-card">
        <div class="mt-1 p-2">
          <a-input-search
            v-model:value="searchCategoryValue"
            :loading="treeLoading"
            placeholder="搜索分类"
            size="small"
            enter-button
          />
        </div>
        <a-spin :spinning="treeLoading">
          <div class="-mt-3 p-3">
            <div class="mb-1">公考分类</div>
            <a-tree
              v-if="categoryTree.length > 0"
              block-node
              default-expand-all
              :selected-keys="selectedCategoryKeys"
              :tree-data="visibleCategoryTree"
              @select="handleCategorySelect"
            >
              <template #titleRender="{ title }">
                <span>{{ title }}</span>
              </template>
            </a-tree>
            <a-empty v-else description="暂无分类数据" />
          </div>
        </a-spin>
      </div>
    </template>

    <Grid>
      <template #toolbar-actions>
        <VbenButton :disabled="!selectedCategoryId" @click="openCreateModal">
          <MaterialSymbolsAdd class="size-5" />
          添加文章
        </VbenButton>
      </template>
      <template #toolbar-tools>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500">项目</span>
          <a-select
            v-model:value="selectedProjectName"
            class="w-48"
            :loading="loading"
            :options="projectSelectOptions"
            @change="handleProjectChange"
          />
          <span class="text-sm text-gray-500">版本</span>
          <a-select
            v-model:value="selectedVersionName"
            class="w-44"
            :loading="loading"
            :options="versionSelectOptions"
            @change="loadDocTree"
          />
        </div>
      </template>
      <template #enabled="{ row }">
        <a-tag :color="row.enabled ? 'green' : 'default'">
          {{ row.enabled ? '已启用' : '已停用' }}
        </a-tag>
      </template>
    </Grid>

    <a-modal
      v-model:open="isBindingModalOpen"
      :confirm-loading="saving"
      :title="editingBindingId ? '编辑手册文档' : '新增手册文档'"
      @ok="saveBinding"
    >
      <a-form layout="vertical">
        <a-form-item label="Halo 文档">
          <a-select
            v-model:value="selectedTreeName"
            show-search
            :disabled="Boolean(editingBindingId)"
            option-filter-prop="label"
            :options="docSelectOptions"
            placeholder="请选择正文文档"
            @change="handleDocChange"
          />
        </a-form-item>
        <a-form-item label="展示标题">
          <a-input v-model:value="bindingForm.title" :maxlength="255" />
        </a-form-item>
        <div class="grid grid-cols-2 gap-4">
          <a-form-item label="排序">
            <a-input-number
              v-model:value="bindingForm.sort_order"
              :min="0"
              class="w-full"
            />
          </a-form-item>
          <a-form-item label="启用">
            <a-switch v-model:checked="bindingForm.enabled" />
          </a-form-item>
        </div>
        <div
          v-if="selectedDocNode"
          class="rounded bg-gray-50 p-3 text-xs text-gray-500"
        >
          文档资源：{{ selectedDocNode.doc_name }}
        </div>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="isPreviewModalOpen"
      :body-style="{ padding: 0, height: '75vh' }"
      :footer="null"
      :title="previewTitle"
      width="90%"
    >
      <a-spin :spinning="previewLoading" class="block h-full">
        <iframe
          v-if="previewHtml"
          class="h-[75vh] w-full border-0"
          :srcdoc="previewHtml"
          sandbox="allow-forms allow-popups allow-scripts"
          title="Halo 文档预览"
          @load="previewLoading = false"
        ></iframe>
      </a-spin>
    </a-modal>
  </ColPage>
</template>

<style scoped></style>
