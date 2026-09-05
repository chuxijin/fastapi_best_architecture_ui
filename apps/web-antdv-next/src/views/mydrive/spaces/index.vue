<script setup lang="ts">
import type {
  MyDriveAccount,
  MyDriveFile,
  MyDriveRelationship,
  MyDriveRelationshipShare,
  MyDriveShareLink,
  MyDriveSpace,
} from '#/api';

import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { Page, VbenButton } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';

import { message, Modal } from 'ant-design-vue';

import {
  cancelMyDriveSharesApi,
  copyMyDriveFilesApi,
  createMyDriveDirectoryApi,
  createMyDriveShareApi,
  createMyDriveSpaceApi,
  deleteMyDriveSpaceApi,
  getMyDriveAccountsApi,
  getMyDriveRelationshipsApi,
  getMyDriveRelationshipSharesApi,
  getMyDriveShareApi,
  getMyDriveSharesApi,
  getMyDriveSpaceFilesApi,
  getMyDriveSpacesApi,
  moveMyDriveFilesApi,
  previewMyDriveSpaceFilesApi,
  removeMyDriveFilesApi,
  renameMyDriveFileApi,
  saveMyDriveShareFilesApi,
  updateMyDriveSpaceApi,
} from '#/api';
import { parseShareLink } from '#/utils/share';

import FileContextMenu from '../components/FileContextMenu.vue';
import PathSelectorModal from '../components/PathSelectorModal.vue';

const FolderIcon = createIconifyIcon('mdi:folder');
const FileIcon = createIconifyIcon('mdi:file-outline');
const RefreshIcon = createIconifyIcon('mdi:refresh');
const MountIcon = createIconifyIcon('mdi:folder-plus-outline');
const NewDirectoryIcon = createIconifyIcon('mdi:folder-plus-outline');
const SaveIcon = createIconifyIcon('mdi:content-save-outline');
const ShareIcon = createIconifyIcon('mdi:share-variant-outline');
const SharesIcon = createIconifyIcon('mdi:share-all-outline');
const MYDRIVE_PINNED_SPACE_STORAGE_KEY = 'mydrive:pinned-space-ids';

const loadingSpaces = ref(false);
const loadingFiles = ref(false);
const mountingSpace = ref(false);
const mountVisible = ref(false);
const pathSelectorVisible = ref(false);
const operationTargetVisible = ref(false);
const saveShareVisible = ref(false);
const saveShareSelectorVisible = ref(false);
const savingShareFiles = ref(false);
const loadingSaveShareFiles = ref(false);
const pendingOperation = ref<'copy' | 'move' | null>(null);
const operatingFiles = ref(false);
const accounts = ref<MyDriveAccount[]>([]);
const spaces = ref<MyDriveSpace[]>([]);
const spaceSearch = ref('');
const pinnedSpaceIds = ref<number[]>([]);
const files = ref<MyDriveFile[]>([]);
const selectedSpaceId = ref<number>();
const directoryStack = ref<MyDriveFile[]>([]);
const selectedFiles = ref<MyDriveFile[]>([]);
const saveShareSourceFiles = ref<MyDriveFile[]>([]);
const saveShareFiles = ref<MyDriveFile[]>([]);
const saveShareForm = ref({ url: '' });
const shareVisible = ref(false);
const creatingShare = ref(false);
const shareResult = ref('');
const shareForm = ref({ expiresInDays: 7, password: '', title: '' });
const sharesVisible = ref(false);
const loadingShares = ref(false);
const shares = ref<MyDriveShareLink[]>([]);
const loadingRelationships = ref(false);
const hasMoreRelationships = ref(false);
const loadingRelationshipShares = ref(false);
const relationships = ref<MyDriveRelationship[]>([]);
const relationshipOffset = ref(0);
const relationshipShares = ref<MyDriveRelationshipShare[]>([]);
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextFile = ref<MyDriveFile>();
const spaceContextMenuVisible = ref(false);
const spaceContextMenuX = ref(0);
const spaceContextMenuY = ref(0);
const contextSpace = ref<MyDriveSpace>();
const editSpaceVisible = ref(false);
const editSpacePathSelectorVisible = ref(false);
const savingSpace = ref(false);
const editSpaceForm = ref({
  isEnabled: true,
  name: '',
  rootId: '',
  rootPath: '/',
});
const removeConfirmVisible = ref(false);
const renameVisible = ref(false);
const renameLoading = ref(false);
const renameForm = ref({ name: '' });
const mkdirVisible = ref(false);
const mkdirLoading = ref(false);
const mkdirForm = ref({ name: '' });
const mountForm = ref({
  accountId: undefined as number | undefined,
  name: '',
  provider: 'baidu',
  relationshipShareKey: '',
  relationshipSourceId: '',
  rootId: '',
  rootPath: '/',
  sharePasscode: '',
  shareUrl: '',
  sourceKey: '',
  sourceRefJson: '{}',
  spaceType: 'personal',
});
const providerOptions = [
  { label: '百度网盘', value: 'baidu' },
  { label: '夸克网盘', value: 'quark' },
  { label: '迅雷网盘', value: 'thunder' },
];
const spaceTypeOptions = [
  { label: '个人空间', value: 'personal' },
  { label: '分享链接', value: 'share_link' },
  { label: '好友分享', value: 'friend' },
  { label: '群组分享', value: 'group' },
];
const shareColumns = [
  { dataIndex: 'title', key: 'title', title: '标题' },
  { dataIndex: 'url', key: 'url', title: '分享链接' },
  { dataIndex: 'password', key: 'password', title: '提取码', width: 100 },
  { key: 'action', title: '操作', width: 170 },
];

const selectedSpace = computed(() =>
  spaces.value.find((space) => space.id === selectedSpaceId.value),
);

const filteredSpaces = computed(() => {
  const keyword = spaceSearch.value.trim().toLocaleLowerCase();
  const matchingSpaces = keyword
    ? spaces.value.filter((space) =>
        `${space.name} ${space.provider} ${space.space_type}`
          .toLocaleLowerCase()
          .includes(keyword),
      )
    : spaces.value;
  const pinnedIds = new Set(pinnedSpaceIds.value);
  return matchingSpaces.toSorted(
    (first, second) =>
      Number(pinnedIds.has(second.id)) - Number(pinnedIds.has(first.id)),
  );
});

const currentDirectory = computed(
  () => directoryStack.value[directoryStack.value.length - 1],
);

const canWrite = computed(() =>
  selectedSpace.value?.capabilities.some((capability) =>
    ['copy', 'make_directory', 'move', 'remove', 'rename'].includes(capability),
  ),
);

const canCreateShare = computed(() =>
  selectedSpace.value?.capabilities.includes('create_share'),
);

const canManageShares = computed(() =>
  selectedSpace.value?.capabilities.includes('manage_shares'),
);

const canSaveShare = computed(
  () =>
    selectedSpace.value?.space_type === 'personal' &&
    ['baidu', 'quark'].includes(selectedSpace.value.provider),
);

watch(
  () => mountForm.value.shareUrl,
  (newVal) => {
    if (!newVal) return;
    const parsed = parseShareLink(newVal);
    if (parsed) {
      if (parsed.url !== newVal.trim()) {
        mountForm.value.shareUrl = parsed.url;
      }
      if (parsed.passcode && !mountForm.value.sharePasscode) {
        mountForm.value.sharePasscode = parsed.passcode;
      }
    }
  },
);

const saveSharePreviewParams = computed(() => {
  if (!selectedSpace.value || !saveShareForm.value.url.trim()) return undefined;
  const parsed = parseShareLink(saveShareForm.value.url);
  if (!parsed) return undefined;
  const sourceRef: Record<string, string> =
    selectedSpace.value.provider === 'baidu'
      ? { url: parsed.url }
      : { share_id: parsed.url };
  if (parsed.passcode) {
    sourceRef.passcode = parsed.passcode;
  }
  return {
    account_id: selectedSpace.value.account_id as number,
    provider: selectedSpace.value.provider,
    root_id: null,
    root_path: '/',
    source_key: parsed.url,
    source_ref: sourceRef,
    space_type: 'share_link',
  };
});

const allFilesSelected = computed(
  () =>
    files.value.length > 0 && selectedFiles.value.length === files.value.length,
);

const selectedFileIds = computed(
  () => new Set(selectedFiles.value.map((file) => file.file_id)),
);

const accountOptions = computed(() =>
  accounts.value.map((account) => ({
    label: `${account.display_name || account.username || account.external_account_id} · ${account.provider}`,
    value: account.id,
  })),
);

const isRelationshipSpace = computed(() =>
  ['friend', 'group'].includes(mountForm.value.spaceType),
);

const relationshipOptions = computed(() =>
  relationships.value.map((item) => ({
    label: `${item.name} · ${item.source_id}`,
    value: item.source_id,
  })),
);

const relationshipShareOptions = computed(() =>
  relationshipShares.value.map((item) => ({
    label: `${item.name}${item.is_directory ? ' · 文件夹' : ''}`,
    value: getRelationshipShareKey(item),
  })),
);

const externalPreviewParams = computed(() => {
  if (!mountForm.value.accountId || mountForm.value.spaceType === 'personal')
    return undefined;
  const sourceRef = buildMountSourceRef(false);
  if (sourceRef === null) return undefined;
  return {
    account_id: mountForm.value.accountId,
    provider: mountForm.value.provider,
    root_id: mountForm.value.rootId || null,
    root_path: mountForm.value.rootPath || '/',
    source_key: getMountSourceKey(),
    source_ref: sourceRef,
    space_type: mountForm.value.spaceType,
  };
});

const contextFiles = computed(() => {
  if (!contextFile.value) return [];
  if (isSelected(contextFile.value)) return selectedFiles.value;
  return [contextFile.value];
});

const contextMenuGroups = computed(() => {
  if (!contextFile.value) return [];
  const groups = [];
  const file = contextFile.value;

  const primaryActions = [];
  if (file.is_directory) {
    primaryActions.push({
      icon: 'mdi:folder-open-outline',
      key: 'open',
      label: '打开',
    });
  }
  primaryActions.push({
    icon: isSelected(file)
      ? 'mdi:checkbox-blank-outline'
      : 'mdi:checkbox-marked-outline',
    key: 'toggle_select',
    label: isSelected(file) ? '取消选择' : '选择',
  });
  groups.push(primaryActions);

  const shareActions = [];
  if (canCreateShare.value) {
    shareActions.push({
      icon: 'mdi:share-variant-outline',
      key: 'share',
      label: '创建分享',
    });
  }
  if (shareActions.length > 0) groups.push(shareActions);

  const writeActions = [];
  if (hasCapability('copy')) {
    writeActions.push({
      icon: 'mdi:content-copy',
      key: 'copy',
      label: '复制到',
    });
  }
  if (hasCapability('move')) {
    writeActions.push({
      icon: 'mdi:folder-move-outline',
      key: 'move',
      label: '移动到',
    });
  }
  if (hasCapability('rename') && contextFiles.value.length === 1) {
    writeActions.push({
      icon: 'mdi:rename-outline',
      key: 'rename',
      label: '重命名',
    });
  }
  if (hasCapability('make_directory')) {
    writeActions.push({
      icon: 'mdi:folder-plus-outline',
      key: 'mkdir',
      label: '新建文件夹',
    });
  }
  if (writeActions.length > 0) groups.push(writeActions);

  groups.push([{ icon: 'mdi:refresh', key: 'refresh', label: '刷新' }]);

  if (hasCapability('remove')) {
    groups.push([
      {
        danger: true,
        icon: 'mdi:delete-outline',
        key: 'remove',
        label: '删除',
      },
    ]);
  }

  return groups;
});

function formatShareResult(
  url: string,
  password: string,
  provider?: string,
): string {
  if (!password) return url;
  if (provider === 'baidu') {
    const encodedPassword = encodeURIComponent(password);
    if (url.includes('pwd=')) {
      return url.replace(/([?&]pwd=)[^&]*/, `$1${encodedPassword}`);
    }
    return `${url}${url.includes('?') ? '&' : '?'}pwd=${encodedPassword}`;
  }
  return `${url}\n提取码：${password}`;
}

const spaceContextMenuGroups = computed(() => {
  if (!contextSpace.value) return [];
  return [
    [{ icon: 'mdi:pencil-outline', key: 'edit', label: '编辑文件空间' }],
    [
      {
        icon: pinnedSpaceIds.value.includes(contextSpace.value.id)
          ? 'mdi:pin-off-outline'
          : 'mdi:pin-outline',
        key: 'toggle_pinned',
        label: pinnedSpaceIds.value.includes(contextSpace.value.id)
          ? '取消置顶'
          : '置顶文件空间',
      },
    ],
    [
      {
        icon: contextSpace.value.is_enabled
          ? 'mdi:pause-circle-outline'
          : 'mdi:play-circle-outline',
        key: 'toggle_enabled',
        label: contextSpace.value.is_enabled ? '停用文件空间' : '启用文件空间',
      },
    ],
    [
      {
        danger: true,
        icon: 'mdi:delete-outline',
        key: 'delete',
        label: '删除文件空间',
      },
    ],
  ];
});

function hasCapability(capability: string) {
  return Boolean(selectedSpace.value?.capabilities.includes(capability));
}

function formatSize(size: null | number) {
  if (size === null) return '-';
  if (size < 1024) return `${size} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  const unitIndex = Math.min(
    Math.floor(Math.log(size) / Math.log(1024)) - 1,
    units.length - 1,
  );
  return `${(size / 1024 ** (unitIndex + 1)).toFixed(1)} ${units[unitIndex]}`;
}

function isSelected(file: MyDriveFile) {
  return selectedFileIds.value.has(file.file_id);
}

function toggleFileSelection(file: MyDriveFile, checked: boolean) {
  if (checked) {
    selectedFiles.value = [...selectedFiles.value, file];
    return;
  }

  selectedFiles.value = selectedFiles.value.filter(
    (item) => item.file_id !== file.file_id,
  );
}

function toggleFileRow(file: MyDriveFile) {
  toggleFileSelection(file, !isSelected(file));
}

function toggleAllFiles(checked: boolean) {
  selectedFiles.value = checked ? [...files.value] : [];
}

function isSaveShareFileSelected(file: MyDriveFile): boolean {
  return saveShareFiles.value.some((item) => item.file_id === file.file_id);
}

function toggleSaveShareFile(file: MyDriveFile, checked: boolean): void {
  if (checked) {
    saveShareFiles.value = [...saveShareFiles.value, file];
    return;
  }
  saveShareFiles.value = saveShareFiles.value.filter(
    (item) => item.file_id !== file.file_id,
  );
}

function openSaveShareDialog(): void {
  if (!canSaveShare.value) return;
  saveShareForm.value = { url: '' };
  saveShareSourceFiles.value = [];
  saveShareFiles.value = [];
  saveShareVisible.value = true;
}

watch(
  () => saveShareForm.value.url,
  (newVal) => {
    if (!newVal) return;
    const parsed = parseShareLink(newVal);
    if (parsed && parsed.url !== newVal.trim()) {
      saveShareForm.value.url = parsed.url;
    }
  },
);

async function loadSaveShareFiles(): Promise<void> {
  if (!saveSharePreviewParams.value) {
    message.warning('请输入分享链接或分享 ID');
    return;
  }
  loadingSaveShareFiles.value = true;
  try {
    const result = await previewMyDriveSpaceFilesApi({
      ...saveSharePreviewParams.value,
      file_id: null,
      path: '/',
    });
    saveShareSourceFiles.value = result.items;
    saveShareFiles.value = [];
    saveShareVisible.value = false;
    saveShareSelectorVisible.value = true;
  } catch {
    message.error('加载分享文件失败，请检查链接、提取码和账户凭证');
  } finally {
    loadingSaveShareFiles.value = false;
  }
}

async function saveShareFilesToCurrentDirectory(
  shareAfterSave = false,
): Promise<void> {
  if (
    !selectedSpace.value ||
    !selectedSpaceId.value ||
    !saveSharePreviewParams.value ||
    saveShareFiles.value.length === 0
  ) {
    message.warning('请选择要保存的文件');
    return;
  }
  if (shareAfterSave && !canCreateShare.value) {
    message.warning('当前空间不支持创建分享');
    return;
  }
  savingShareFiles.value = true;
  try {
    const savedFiles = await saveMyDriveShareFilesApi(selectedSpaceId.value, {
      ...saveSharePreviewParams.value,
      files: saveShareFiles.value,
      target: currentDirectory.value || null,
    });
    message.success(`已保存 ${saveShareFiles.value.length} 个文件到当前目录`);
    saveShareSelectorVisible.value = false;
    await loadFiles();
    if (shareAfterSave) {
      const result = await createMyDriveShareApi(selectedSpaceId.value, {
        expires_in_days: 0,
        files: savedFiles,
        password: selectedSpace.value.provider === 'baidu' ? 'zyas' : '',
        title: savedFiles.length === 1 ? savedFiles[0].name : '文件分享',
      });
      const password =
        result.password ||
        (selectedSpace.value.provider === 'baidu' ? 'zyas' : '');
      shareResult.value = formatShareResult(
        result.url,
        password,
        selectedSpace.value.provider,
      );
      shareVisible.value = true;
      message.success('永久分享链接已创建');
    }
  } catch {
    message.error(shareAfterSave ? '保存并分享失败' : '保存分享文件失败');
  } finally {
    savingShareFiles.value = false;
  }
}

function closeContextMenu() {
  contextMenuVisible.value = false;
}

function openFileContextMenu(event: MouseEvent, file: MyDriveFile) {
  event.preventDefault();
  contextFile.value = file;
  if (!isSelected(file)) {
    selectedFiles.value = [file];
  }
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  contextMenuVisible.value = true;
}

function openSpaceContextMenu(event: MouseEvent, space: MyDriveSpace) {
  event.preventDefault();
  contextSpace.value = space;
  spaceContextMenuX.value = event.clientX;
  spaceContextMenuY.value = event.clientY;
  spaceContextMenuVisible.value = true;
}

function openEditSpaceDialog() {
  if (!contextSpace.value) return;
  editSpaceForm.value = {
    isEnabled: contextSpace.value.is_enabled,
    name: contextSpace.value.name,
    rootId: contextSpace.value.root_id || '',
    rootPath: contextSpace.value.root_path || '/',
  };
  editSpaceVisible.value = true;
}

async function handleSpaceContextMenuAction(key: string) {
  if (!contextSpace.value) return;
  if (key === 'edit') {
    openEditSpaceDialog();
    return;
  }
  if (key === 'toggle_enabled') {
    await updateSpace(contextSpace.value, {
      is_enabled: !contextSpace.value.is_enabled,
    });
    return;
  }
  if (key === 'toggle_pinned') {
    togglePinnedSpace(contextSpace.value.id);
    return;
  }
  if (key === 'delete') {
    confirmDeleteSpace(contextSpace.value);
  }
}

function togglePinnedSpace(spaceId: number): void {
  if (pinnedSpaceIds.value.includes(spaceId)) {
    pinnedSpaceIds.value = pinnedSpaceIds.value.filter((id) => id !== spaceId);
  } else {
    pinnedSpaceIds.value = [...pinnedSpaceIds.value, spaceId];
  }
  localStorage.setItem(
    MYDRIVE_PINNED_SPACE_STORAGE_KEY,
    JSON.stringify(pinnedSpaceIds.value),
  );
}

function loadPinnedSpaceIds(): void {
  try {
    const storedIds = JSON.parse(
      localStorage.getItem(MYDRIVE_PINNED_SPACE_STORAGE_KEY) || '[]',
    );
    if (!Array.isArray(storedIds)) return;
    pinnedSpaceIds.value = storedIds.filter((id): id is number =>
      Number.isInteger(id),
    );
  } catch {
    pinnedSpaceIds.value = [];
  }
}

function confirmDeleteSpace(space: MyDriveSpace): void {
  Modal.confirm({
    centered: true,
    content: `确定删除文件空间“${space.name}”吗？该操作不会删除网盘中的实际文件。`,
    okButtonProps: { danger: true },
    okText: '删除',
    title: '删除文件空间',
    onOk: async () => {
      await deleteSpace(space);
    },
  });
}

async function deleteSpace(space: MyDriveSpace): Promise<void> {
  try {
    await deleteMyDriveSpaceApi(space.id);
    if (selectedSpaceId.value === space.id) {
      selectedSpaceId.value = undefined;
      directoryStack.value = [];
      files.value = [];
      selectedFiles.value = [];
    }
    message.success('文件空间已删除');
    await loadSpaces();
  } catch {
    message.error('删除文件空间失败');
  }
}

async function saveSpaceEdit() {
  if (!contextSpace.value || !editSpaceForm.value.name.trim()) {
    message.warning('请输入文件空间名称');
    return;
  }
  savingSpace.value = true;
  try {
    const params = {
      is_enabled: editSpaceForm.value.isEnabled,
      name: editSpaceForm.value.name.trim(),
      root_id: editSpaceForm.value.rootId.trim() || null,
      root_path: editSpaceForm.value.rootPath.trim() || '/',
    };
    await updateMyDriveSpaceApi(contextSpace.value.id, params);
    message.success('文件空间已更新');
    editSpaceVisible.value = false;
    await loadSpaces();
  } catch {
    message.error('更新文件空间失败');
  } finally {
    savingSpace.value = false;
  }
}

function openEditSpacePathSelector() {
  if (!contextSpace.value) {
    message.warning('请先选择文件空间');
    return;
  }
  editSpacePathSelectorVisible.value = true;
}

function joinSpacePath(rootPath: string, childPath: string): string {
  const normalizedRootPath = rootPath.replace(/\/+$/, '') || '/';
  if (childPath === '/') return normalizedRootPath;
  if (normalizedRootPath === '/') return `/${childPath.replace(/^\/+/, '')}`;
  return `${normalizedRootPath}/${childPath.replace(/^\/+/, '')}`;
}

function confirmEditSpacePath(value: {
  file: MyDriveFile | null;
  fileId: null | string;
  path: string;
}) {
  if (contextSpace.value?.space_type !== 'personal') {
    editSpaceForm.value.rootPath = joinSpacePath(
      contextSpace.value.root_path,
      value.path,
    );
    editSpaceForm.value.rootId =
      value.fileId || contextSpace.value.root_id || '';
    return;
  }
  editSpaceForm.value.rootPath = value.path;
  editSpaceForm.value.rootId = value.fileId || '';
}

async function updateSpace(
  space: MyDriveSpace,
  params: { is_enabled: boolean },
) {
  try {
    await updateMyDriveSpaceApi(space.id, params);
    message.success(params.is_enabled ? '文件空间已启用' : '文件空间已停用');
    await loadSpaces();
  } catch {
    message.error('更新文件空间失败');
  }
}

function resetRelationshipMountFields() {
  relationships.value = [];
  relationshipShares.value = [];
  relationshipOffset.value = 0;
  hasMoreRelationships.value = false;
  mountForm.value.relationshipSourceId = '';
  mountForm.value.relationshipShareKey = '';
}

function getRelationshipShareKey(share: MyDriveRelationshipShare) {
  return `${share.source_id}:${share.from_uk}:${share.message_id}:${share.root_id}`;
}

function findSelectedRelationshipShare() {
  return relationshipShares.value.find(
    (item) =>
      getRelationshipShareKey(item) === mountForm.value.relationshipShareKey,
  );
}

async function loadRelationships(loadMore = false) {
  if (!mountForm.value.accountId || !isRelationshipSpace.value) return;
  if (mountForm.value.provider !== 'baidu') {
    resetRelationshipMountFields();
    message.warning('好友分享和群组分享仅支持百度网盘账户');
    return;
  }
  if (loadMore && (!hasMoreRelationships.value || loadingRelationships.value))
    return;
  loadingRelationships.value = true;
  try {
    const pageSize = 50;
    const offset = loadMore ? relationshipOffset.value : 0;
    const items = await getMyDriveRelationshipsApi(
      mountForm.value.accountId,
      mountForm.value.spaceType as 'friend' | 'group',
      { limit: pageSize, offset },
    );
    relationships.value = loadMore ? [...relationships.value, ...items] : items;
    relationshipOffset.value = relationships.value.length;
    hasMoreRelationships.value = items.length === pageSize;
  } catch {
    if (!loadMore) resetRelationshipMountFields();
    message.error('加载好友或群组失败');
  } finally {
    loadingRelationships.value = false;
  }
}

function loadMoreRelationships(event: Event): void {
  const target = event.target as HTMLElement;
  if (target.scrollTop + target.clientHeight < target.scrollHeight - 24) return;
  void loadRelationships(true);
}

async function loadRelationshipShares() {
  if (
    !mountForm.value.accountId ||
    !isRelationshipSpace.value ||
    !mountForm.value.relationshipSourceId
  )
    return;
  loadingRelationshipShares.value = true;
  mountForm.value.relationshipShareKey = '';
  try {
    relationshipShares.value = await getMyDriveRelationshipSharesApi(
      mountForm.value.accountId,
      mountForm.value.spaceType as 'friend' | 'group',
      mountForm.value.relationshipSourceId,
    );
  } catch {
    relationshipShares.value = [];
    message.error('加载关系分享失败');
  } finally {
    loadingRelationshipShares.value = false;
  }
}

async function onMountSpaceTypeChange() {
  mountForm.value.sourceKey = '';
  mountForm.value.sourceRefJson = '{}';
  mountForm.value.shareUrl = '';
  mountForm.value.sharePasscode = '';
  resetRelationshipMountFields();
  if (isRelationshipSpace.value) {
    mountForm.value.provider = 'baidu';
    await loadRelationships();
  }
}

function handleContextMenuAction(key: string) {
  if (key === 'open') {
    enterContextDirectory();
    return;
  }
  if (key === 'toggle_select' && contextFile.value) {
    toggleFileRow(contextFile.value);
    return;
  }
  if (key === 'share') {
    openContextShareDialog();
    return;
  }
  if (key === 'copy' || key === 'move') {
    openOperationTargetSelector(key);
    return;
  }
  if (key === 'rename') {
    openRenameDialog();
    return;
  }
  if (key === 'mkdir') {
    openMkdirDialog();
    return;
  }
  if (key === 'refresh') {
    loadFiles(true);
    return;
  }
  if (key === 'remove') {
    removeConfirmVisible.value = true;
  }
}

function openOperationTargetSelector(operation: 'copy' | 'move') {
  if (
    !selectedSpaceId.value ||
    contextFiles.value.length === 0 ||
    !hasCapability(operation)
  )
    return;
  pendingOperation.value = operation;
  operationTargetVisible.value = true;
}

function openRenameDialog() {
  if (!contextFile.value || !hasCapability('rename')) return;
  renameForm.value.name = contextFile.value.name;
  renameVisible.value = true;
  closeContextMenu();
}

function openMkdirDialog() {
  if (!hasCapability('make_directory')) return;
  mkdirForm.value.name = '';
  mkdirVisible.value = true;
  closeContextMenu();
}

function openContextShareDialog() {
  if (!canCreateShare.value || contextFiles.value.length === 0) return;
  selectedFiles.value = [...contextFiles.value];
  closeContextMenu();
  openShareDialog();
}

async function enterContextDirectory() {
  if (!contextFile.value?.is_directory) return;
  closeContextMenu();
  await enterDirectory(contextFile.value);
}

async function createDirectory() {
  if (!selectedSpaceId.value || !mkdirForm.value.name.trim()) {
    message.warning('请输入文件夹名称');
    return;
  }
  mkdirLoading.value = true;
  try {
    await createMyDriveDirectoryApi(selectedSpaceId.value, {
      name: mkdirForm.value.name.trim(),
      parent: currentDirectory.value || null,
    });
    message.success('文件夹已创建');
    mkdirVisible.value = false;
    await loadFiles();
  } catch {
    message.error('创建文件夹失败');
  } finally {
    mkdirLoading.value = false;
  }
}

async function renameFile() {
  if (
    !selectedSpaceId.value ||
    !contextFile.value ||
    !renameForm.value.name.trim()
  ) {
    message.warning('请输入新名称');
    return;
  }
  renameLoading.value = true;
  try {
    await renameMyDriveFileApi(selectedSpaceId.value, {
      file: contextFile.value,
      name: renameForm.value.name.trim(),
    });
    message.success('重命名成功');
    renameVisible.value = false;
    await loadFiles();
  } catch {
    message.error('重命名失败');
  } finally {
    renameLoading.value = false;
  }
}

async function removeContextFiles() {
  if (
    !selectedSpaceId.value ||
    !hasCapability('remove') ||
    contextFiles.value.length === 0
  )
    return;
  closeContextMenu();
  try {
    await removeMyDriveFilesApi(selectedSpaceId.value, contextFiles.value);
    message.success('删除成功');
    await loadFiles();
  } catch {
    message.error('删除失败');
  }
}

async function loadSpaces() {
  loadingSpaces.value = true;
  try {
    const [accountResult, spaceResult] = await Promise.all([
      getMyDriveAccountsApi(),
      getMyDriveSpacesApi(),
    ]);
    accounts.value = accountResult.items;
    spaces.value = spaceResult.items;
    if (
      selectedSpaceId.value &&
      !spaces.value.some((space) => space.id === selectedSpaceId.value)
    ) {
      selectedSpaceId.value = undefined;
      directoryStack.value = [];
      files.value = [];
      selectedFiles.value = [];
    }
  } catch {
    message.error('加载文件空间失败');
  } finally {
    loadingSpaces.value = false;
  }
}

async function openMountModal() {
  const firstAccount = accounts.value[0];
  mountForm.value = {
    accountId: firstAccount?.id,
    name: '',
    provider: firstAccount?.provider || 'baidu',
    relationshipShareKey: '',
    relationshipSourceId: '',
    rootId: '',
    rootPath: '/',
    sharePasscode: '',
    shareUrl: '',
    sourceKey: '',
    sourceRefJson: '{}',
    spaceType: 'personal',
  };
  await nextTick();
  mountVisible.value = true;
}

async function onMountAccountChange(accountId: number) {
  const account = accounts.value.find((item) => item.id === accountId);
  if (account) {
    mountForm.value.provider = account.provider;
  }
  resetRelationshipMountFields();
  if (isRelationshipSpace.value) {
    await loadRelationships();
  }
}

function openPathSelector() {
  if (!mountForm.value.accountId) {
    message.warning('请先选择关联网盘账户');
    return;
  }
  pathSelectorVisible.value = true;
}

function openExternalPathSelector() {
  if (!externalPreviewParams.value) {
    message.warning('请先填写分享信息，或选择好友/群组分享文件');
    return;
  }
  pathSelectorVisible.value = true;
}

function confirmPreviewPath(value: { fileId: null | string; path: string }) {
  mountForm.value.rootPath = value.path;
  mountForm.value.rootId = value.fileId || '';
}

async function confirmOperationTarget(value: {
  file: MyDriveFile | null;
  fileId: null | string;
  path: string;
}) {
  if (
    !selectedSpaceId.value ||
    !pendingOperation.value ||
    contextFiles.value.length === 0
  )
    return;
  operatingFiles.value = true;
  try {
    const params = { files: contextFiles.value, target: value.file };
    if (pendingOperation.value === 'copy') {
      await copyMyDriveFilesApi(selectedSpaceId.value, params);
      message.success('复制任务已提交');
    } else {
      await moveMyDriveFilesApi(selectedSpaceId.value, params);
      message.success('移动任务已提交');
    }
    operationTargetVisible.value = false;
    await loadFiles();
  } catch {
    message.error(pendingOperation.value === 'copy' ? '复制失败' : '移动失败');
  } finally {
    operatingFiles.value = false;
    pendingOperation.value = null;
  }
}

async function createMountSpace() {
  if (!mountForm.value.name.trim()) {
    message.warning('请输入挂载名称');
    return;
  }
  if (!mountForm.value.accountId) {
    message.warning('请选择关联网盘账户');
    return;
  }

  const sourceRef = buildMountSourceRef();
  if (sourceRef === null) return;

  mountingSpace.value = true;
  try {
    await createMyDriveSpaceApi({
      account_id: mountForm.value.accountId,
      name: mountForm.value.name.trim(),
      provider: mountForm.value.provider,
      root_id: mountForm.value.rootId.trim() || null,
      root_path: mountForm.value.rootPath.trim() || '/',
      source_key: getMountSourceKey(),
      source_ref: sourceRef,
      space_type: mountForm.value.spaceType,
    });
    message.success('文件空间已挂载');
    mountVisible.value = false;
    await loadSpaces();
  } catch {
    message.error('挂载文件空间失败，请检查账户、类型和来源定位信息');
  } finally {
    mountingSpace.value = false;
  }
}

function getMountSourceKey() {
  if (mountForm.value.spaceType === 'share_link') {
    const parsed = parseShareLink(mountForm.value.shareUrl);
    return parsed ? parsed.url : mountForm.value.shareUrl.trim();
  }
  if (isRelationshipSpace.value) return mountForm.value.relationshipSourceId;
  return mountForm.value.sourceKey.trim();
}

function buildMountSourceRef(showMessage = true) {
  if (mountForm.value.spaceType === 'share_link') {
    if (!mountForm.value.shareUrl.trim()) {
      if (showMessage) message.warning('请输入分享链接或分享 ID');
      return null;
    }
    const parsed = parseShareLink(mountForm.value.shareUrl);
    if (!parsed) {
      if (showMessage) message.warning('无法识别分享链接');
      return null;
    }
    const url = parsed.url;
    const passcode = parsed.passcode || mountForm.value.sharePasscode.trim();
    if (mountForm.value.provider === 'baidu') {
      return {
        passcode,
        url,
      };
    }
    if (mountForm.value.provider === 'quark') {
      return {
        passcode,
        share_id: url,
      };
    }
  }

  if (isRelationshipSpace.value) {
    const share = findSelectedRelationshipShare();
    if (!share) {
      if (showMessage) message.warning('请选择需要挂载的好友或群组分享');
      return null;
    }
    return {
      from_uk: share.from_uk,
      message_id: share.message_id,
      root_id: share.root_id,
      source_id: share.source_id,
    };
  }

  try {
    return JSON.parse(mountForm.value.sourceRefJson || '{}') as Record<
      string,
      unknown
    >;
  } catch {
    message.warning('来源定位信息必须是合法 JSON');
    return null;
  }
}

async function selectSpace(space: MyDriveSpace) {
  if (!space.is_enabled) return;
  selectedSpaceId.value = space.id;
  directoryStack.value = [];
  selectedFiles.value = [];
  await loadFiles();
}

async function loadFiles(refresh = false) {
  if (!selectedSpaceId.value) return;
  loadingFiles.value = true;
  try {
    const result = await getMyDriveSpaceFilesApi(
      selectedSpaceId.value,
      currentDirectory.value?.path,
      currentDirectory.value?.file_id,
      refresh,
    );
    files.value = result.items;
    selectedFiles.value = [];
  } catch {
    files.value = [];
    message.error('加载目录失败，请检查网盘凭证或分享链接');
  } finally {
    loadingFiles.value = false;
  }
}

function openShareDialog() {
  if (selectedFiles.value.length === 0) {
    message.warning('请先选择需要分享的文件或目录');
    return;
  }
  shareForm.value = {
    expiresInDays: 7,
    password: selectedSpace.value?.provider === 'baidu' ? 'zyas' : '',
    title:
      selectedFiles.value.length === 1
        ? selectedFiles.value[0].name
        : '文件分享',
  };
  shareResult.value = '';
  shareVisible.value = true;
}

async function createShare() {
  if (!selectedSpaceId.value) return;
  if (!shareForm.value.title.trim()) {
    message.warning('请输入分享标题');
    return;
  }
  if (shareForm.value.password && shareForm.value.password.length !== 4) {
    message.warning('提取码必须为 4 位');
    return;
  }
  creatingShare.value = true;
  try {
    const result = await createMyDriveShareApi(selectedSpaceId.value, {
      expires_in_days: shareForm.value.expiresInDays,
      files: selectedFiles.value,
      password: shareForm.value.password,
      title: shareForm.value.title.trim(),
    });
    const password = result.password || shareForm.value.password;
    shareResult.value = formatShareResult(
      result.url,
      password,
      selectedSpace.value?.provider,
    );
    message.success('分享链接已创建');
  } catch {
    message.error('创建分享链接失败');
  } finally {
    creatingShare.value = false;
  }
}

async function copyShareResult() {
  try {
    await navigator.clipboard.writeText(shareResult.value);
    message.success('分享信息已复制');
  } catch {
    message.error('复制失败，请手动复制');
  }
}

async function openSharesDrawer() {
  sharesVisible.value = true;
  await loadShares();
}

async function loadShares() {
  if (!selectedSpaceId.value) return;
  loadingShares.value = true;
  try {
    const result = await getMyDriveSharesApi(selectedSpaceId.value);
    shares.value = result.items;
  } catch {
    shares.value = [];
    message.error('加载我的分享失败');
  } finally {
    loadingShares.value = false;
  }
}

async function showShareDetail(share: MyDriveShareLink) {
  if (!selectedSpaceId.value) return;
  try {
    const result = await getMyDriveShareApi(
      selectedSpaceId.value,
      share.share_id,
    );
    const shareText = formatShareResult(
      result.url,
      result.password,
      result.provider,
    );
    await navigator.clipboard.writeText(shareText);
    message.success('分享信息已复制');
  } catch {
    message.error('获取分享详情失败');
  }
}

async function cancelShare(share: MyDriveShareLink) {
  if (!selectedSpaceId.value) return;
  try {
    await cancelMyDriveSharesApi(selectedSpaceId.value, [share.share_id]);
    message.success('分享链接已取消');
    await loadShares();
  } catch {
    message.error('取消分享链接失败');
  }
}

async function enterDirectory(file: MyDriveFile) {
  if (!file.is_directory) return;
  directoryStack.value.push(file);
  await loadFiles();
}

async function openBreadcrumb(index: number) {
  directoryStack.value = directoryStack.value.slice(0, index + 1);
  await loadFiles();
}

async function openRoot() {
  directoryStack.value = [];
  await loadFiles();
}

onMounted(() => {
  loadPinnedSpaceIds();
  loadSpaces();
});
</script>

<template>
  <Page auto-content-height>
    <div
      class="grid h-[calc(100vh-132px)] min-h-[640px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]"
    >
      <aside
        class="flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
      >
        <div class="mb-3 flex shrink-0 items-center justify-between px-2">
          <div>
            <h2 class="font-semibold text-slate-900">文件空间</h2>
            <p class="mt-0.5 text-xs text-slate-500">个人盘与分享链接</p>
          </div>
          <div class="flex items-center gap-1">
            <a-tooltip title="刷新文件空间">
              <VbenButton
                aria-label="刷新文件空间"
                size="sm"
                variant="ghost"
                :loading="loadingSpaces"
                @click="loadSpaces"
              >
                <RefreshIcon />
              </VbenButton>
            </a-tooltip>
            <a-tooltip title="添加挂载">
              <VbenButton
                aria-label="添加挂载"
                size="sm"
                variant="ghost"
                @click="openMountModal"
              >
                <MountIcon />
              </VbenButton>
            </a-tooltip>
          </div>
        </div>

        <a-spin
          :spinning="loadingSpaces"
          class="min-h-0 flex-1 overflow-y-auto pr-1"
        >
          <a-input
            v-model:value="spaceSearch"
            allow-clear
            class="mb-2"
            placeholder="搜索文件空间"
          />
          <a-empty
            v-if="spaces.length === 0"
            description="还没有可用的文件空间"
          />
          <a-empty
            v-else-if="filteredSpaces.length === 0"
            description="没有匹配的文件空间"
          />
          <button
            v-for="space in filteredSpaces"
            :key="space.id"
            class="mb-1 w-full rounded-xl px-3 py-3 text-left transition-all"
            :class="
              !space.is_enabled
                ? 'cursor-default opacity-40'
                : space.id === selectedSpaceId
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'text-slate-700 hover:scale-[1.01] hover:bg-slate-50'
            "
            @click="space.is_enabled && selectSpace(space)"
            @contextmenu="openSpaceContextMenu($event, space)"
          >
            <div class="flex items-center gap-2">
              <FolderIcon class="text-lg" />
              <span class="truncate font-medium">{{ space.name }}</span>
            </div>
            <div class="mt-1 pl-7 text-xs opacity-70">
              {{ space.provider }} · {{ space.space_type }}
            </div>
          </button>
        </a-spin>
      </aside>

      <section
        class="flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div class="shrink-0 border-b border-slate-100 px-5 py-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="min-w-0">
              <h1 class="truncate text-lg font-semibold text-slate-900">
                {{ selectedSpace?.name || '选择一个文件空间' }}
              </h1>
              <div
                class="mt-1 flex min-w-0 items-center gap-1 overflow-x-auto text-sm text-slate-500"
              >
                <button
                  class="shrink-0 rounded-md px-1.5 py-0.5 hover:bg-indigo-50 hover:text-indigo-600"
                  @click="openRoot"
                >
                  根目录
                </button>
                <template
                  v-for="(item, index) in directoryStack"
                  :key="item.file_id"
                >
                  <span class="text-slate-300">/</span>
                  <button
                    class="max-w-44 shrink-0 truncate rounded-md px-1.5 py-0.5 hover:bg-indigo-50 hover:text-indigo-600"
                    @click="openBreadcrumb(index)"
                  >
                    {{ item.name }}
                  </button>
                </template>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <a-tag
                v-if="selectedSpace"
                :color="canWrite ? 'blue' : 'default'"
              >
                {{ canWrite ? '可写空间' : '只读空间' }}
              </a-tag>
              <a-tooltip title="刷新目录">
                <VbenButton
                  :disabled="!selectedSpaceId"
                  :loading="loadingFiles"
                  aria-label="刷新目录"
                  @click="loadFiles(true)"
                >
                  <RefreshIcon />
                </VbenButton>
              </a-tooltip>
              <a-tooltip title="新建文件夹">
                <VbenButton
                  :disabled="!hasCapability('make_directory')"
                  aria-label="新建文件夹"
                  @click="openMkdirDialog"
                >
                  <NewDirectoryIcon />
                </VbenButton>
              </a-tooltip>
              <a-tooltip title="保存分享文件">
                <VbenButton
                  :disabled="!canSaveShare"
                  aria-label="保存分享文件"
                  @click="openSaveShareDialog"
                >
                  <SaveIcon />
                </VbenButton>
              </a-tooltip>
              <a-tooltip title="创建分享">
                <VbenButton
                  :disabled="!canCreateShare || selectedFiles.length === 0"
                  aria-label="创建分享"
                  @click="openShareDialog"
                >
                  <ShareIcon />
                </VbenButton>
              </a-tooltip>
              <a-tooltip title="我的分享">
                <VbenButton
                  :disabled="!canManageShares"
                  aria-label="我的分享"
                  @click="openSharesDrawer"
                >
                  <SharesIcon />
                </VbenButton>
              </a-tooltip>
            </div>
          </div>
          <div
            class="mt-3 flex items-center justify-between text-xs text-slate-500"
          >
            <span
              >共 {{ files.length }} 项，已选择
              {{ selectedFiles.length }} 项</span
            >
            <span v-if="selectedSpace"
              >{{ selectedSpace.provider }} ·
              {{ selectedSpace.space_type }}</span
            >
          </div>
        </div>

        <a-spin
          :spinning="loadingFiles"
          class="mydrive-file-list-spin min-h-0 flex-1 overflow-hidden"
        >
          <div class="flex h-full min-h-0 flex-col px-3 py-3">
            <a-empty
              v-if="selectedSpaceId && files.length === 0"
              class="py-28"
              description="当前目录为空"
            />
            <a-empty
              v-else-if="!selectedSpaceId"
              class="py-28"
              description="请从左侧选择文件空间"
            />
            <template v-else>
              <div
                class="grid shrink-0 grid-cols-[minmax(0,1fr)_120px_190px] items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-500 max-md:grid-cols-[minmax(0,1fr)_96px]"
              >
                <div class="flex items-center gap-3">
                  <a-checkbox
                    :checked="allFilesSelected"
                    @change="
                      (event: any) => toggleAllFiles(event.target.checked)
                    "
                  />
                  <span>名称</span>
                </div>
                <div class="text-right">大小</div>
                <div class="text-right max-md:hidden">更新时间</div>
              </div>
              <div class="min-h-0 flex-1 overflow-y-auto pr-1">
                <button
                  v-for="file in files"
                  :key="file.file_id"
                  class="grid w-full grid-cols-[minmax(0,1fr)_120px_190px] items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:scale-[1.005] hover:bg-indigo-50/70 max-md:grid-cols-[minmax(0,1fr)_96px]"
                  :class="
                    isSelected(file)
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-700'
                  "
                  @click="toggleFileRow(file)"
                  @contextmenu="openFileContextMenu($event, file)"
                  @dblclick="enterDirectory(file)"
                >
                  <div class="flex min-w-0 items-center gap-3">
                    <a-checkbox
                      :checked="isSelected(file)"
                      @click.stop
                      @change="
                        (event: any) =>
                          toggleFileSelection(file, event.target.checked)
                      "
                    />
                    <FolderIcon
                      v-if="file.is_directory"
                      class="shrink-0 text-2xl text-indigo-500"
                    />
                    <FileIcon v-else class="shrink-0 text-2xl text-slate-400" />
                    <span class="truncate font-medium" :title="file.name">{{
                      file.name
                    }}</span>
                  </div>
                  <div class="text-right text-sm text-slate-500">
                    {{ file.is_directory ? '-' : formatSize(file.size) }}
                  </div>
                  <div
                    class="truncate text-right text-sm text-slate-500 max-md:hidden"
                  >
                    {{ file.modified_at || '-' }}
                  </div>
                </button>
              </div>
            </template>
          </div>
        </a-spin>
      </section>
    </div>

    <FileContextMenu
      v-model:open="contextMenuVisible"
      :groups="contextMenuGroups"
      :x="contextMenuX"
      :y="contextMenuY"
      @action="handleContextMenuAction"
    />

    <FileContextMenu
      v-model:open="spaceContextMenuVisible"
      :groups="spaceContextMenuGroups"
      :x="spaceContextMenuX"
      :y="spaceContextMenuY"
      @action="handleSpaceContextMenuAction"
    />

    <a-modal
      v-model:open="mountVisible"
      :confirm-loading="mountingSpace"
      title="添加文件空间挂载"
      width="720px"
      @ok="createMountSpace"
    >
      <a-alert
        class="mb-4"
        message="添加挂载前需要先创建网盘账户，挂载会使用所选账户的 Cookie / 凭证访问对应空间。"
        type="info"
        show-icon
      />
      <a-alert
        v-if="accountOptions.length === 0"
        class="mb-4"
        message="当前没有可用网盘账户，请先到账号管理中添加网盘账户。"
        type="warning"
        show-icon
      />
      <a-form layout="vertical">
        <div class="grid gap-x-4 md:grid-cols-2">
          <a-form-item label="关联网盘账户" required>
            <a-select
              v-model:value="mountForm.accountId"
              :options="accountOptions"
              placeholder="请选择账户"
              @change="onMountAccountChange"
            />
          </a-form-item>
          <a-form-item label="Provider" required>
            <a-select
              v-model:value="mountForm.provider"
              :disabled="isRelationshipSpace"
              :options="providerOptions"
            />
          </a-form-item>
          <a-form-item label="空间类型" required>
            <a-select
              v-model:value="mountForm.spaceType"
              :options="spaceTypeOptions"
              @change="onMountSpaceTypeChange"
            />
          </a-form-item>
          <a-form-item label="挂载名称" required>
            <a-input
              v-model:value="mountForm.name"
              :maxlength="128"
              placeholder="例如：百度课程盘"
            />
          </a-form-item>
          <a-form-item
            v-if="mountForm.spaceType === 'share_link'"
            label="分享链接 / 分享 ID"
            required
          >
            <a-input
              v-model:value="mountForm.shareUrl"
              :placeholder="
                mountForm.provider === 'quark'
                  ? '可粘贴夸克分享链接或分享 ID'
                  : '请输入百度分享链接'
              "
            />
          </a-form-item>
          <a-form-item
            v-if="mountForm.spaceType === 'share_link'"
            label="提取码"
          >
            <a-input
              v-model:value="mountForm.sharePasscode"
              :maxlength="4"
              placeholder="没有提取码可留空"
            />
          </a-form-item>
          <a-form-item
            v-if="isRelationshipSpace"
            :label="mountForm.spaceType === 'friend' ? '好友' : '群组'"
            required
          >
            <a-select
              v-model:value="mountForm.relationshipSourceId"
              class="mydrive-relationship-select"
              :dropdown-style="{ maxHeight: '360px', overflow: 'auto' }"
              :loading="loadingRelationships"
              :options="relationshipOptions"
              popup-class-name="mydrive-relationship-dropdown"
              size="large"
              show-search
              :virtual="true"
              option-filter-prop="label"
              :placeholder="
                mountForm.spaceType === 'friend' ? '请选择好友' : '请选择群组'
              "
              @change="loadRelationshipShares"
              @popup-scroll="loadMoreRelationships"
            />
          </a-form-item>
          <a-form-item v-if="isRelationshipSpace" label="分享文件" required>
            <a-select
              v-model:value="mountForm.relationshipShareKey"
              class="mydrive-relationship-select"
              :disabled="!mountForm.relationshipSourceId"
              :dropdown-style="{ maxHeight: '360px', overflow: 'auto' }"
              :loading="loadingRelationshipShares"
              :options="relationshipShareOptions"
              popup-class-name="mydrive-relationship-dropdown"
              size="large"
              show-search
              option-filter-prop="label"
              placeholder="请选择要挂载的分享文件或目录"
            />
          </a-form-item>
          <a-form-item label="根目录 ID">
            <a-input
              v-model:value="mountForm.rootId"
              placeholder="留空则使用来源默认根目录"
            />
          </a-form-item>
          <a-form-item label="根路径">
            <div style="display: flex; gap: 8px; width: 100%">
              <a-input
                v-model:value="mountForm.rootPath"
                placeholder="/"
                style="flex: 1; min-width: 0"
              />
              <a-button
                @click="
                  mountForm.spaceType === 'personal'
                    ? openPathSelector()
                    : openExternalPathSelector()
                "
              >
                选择
              </a-button>
            </div>
          </a-form-item>
        </div>
        <a-alert
          v-if="isRelationshipSpace"
          class="mt-2"
          message="好友分享和群组分享会自动生成来源定位信息，不需要手动填写好友标识、群组 ID 或消息 ID。"
          type="info"
          show-icon
        />
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="saveShareVisible"
      :confirm-loading="loadingSaveShareFiles"
      title="保存分享文件"
      @ok="loadSaveShareFiles"
    >
      <a-alert
        class="mb-4"
        message="分享文件会保存到当前个人空间的当前目录。"
        type="info"
        show-icon
      />
      <a-form layout="vertical">
        <a-form-item label="分享链接 / 分享 ID" required>
          <a-input
            v-model:value="saveShareForm.url"
            :placeholder="
              selectedSpace?.provider === 'quark'
                ? '粘贴夸克分享链接或分享 ID'
                : '粘贴百度分享链接'
            "
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="saveShareSelectorVisible"
      :confirm-loading="savingShareFiles"
      title="选择要保存的分享文件"
      width="720px"
    >
      <template #footer>
        <a-button @click="saveShareSelectorVisible = false">取消</a-button>
        <a-button
          :loading="savingShareFiles"
          @click="saveShareFilesToCurrentDirectory(false)"
        >
          保存
        </a-button>
        <a-button
          type="primary"
          :loading="savingShareFiles"
          @click="saveShareFilesToCurrentDirectory(true)"
        >
          保存并分享
        </a-button>
      </template>
      <a-alert
        class="mb-3"
        :message="`将保存到当前目录：${currentDirectory?.path || '/'}`"
        type="info"
        show-icon
      />
      <a-empty
        v-if="saveShareSourceFiles.length === 0"
        description="分享中没有可保存的文件"
      />
      <div
        v-else
        class="max-h-[420px] overflow-y-auto rounded-xl border border-slate-100 p-2"
      >
        <label
          v-for="file in saveShareSourceFiles"
          :key="file.file_id"
          class="mb-1 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-indigo-50"
        >
          <a-checkbox
            :checked="isSaveShareFileSelected(file)"
            @change="
              (event: any) => toggleSaveShareFile(file, event.target.checked)
            "
          />
          <FolderIcon
            v-if="file.is_directory"
            class="shrink-0 text-xl text-indigo-500"
          />
          <FileIcon v-else class="shrink-0 text-xl text-slate-400" />
          <span class="min-w-0 flex-1 truncate text-slate-700">{{
            file.name
          }}</span>
          <span class="text-sm text-slate-500">{{
            file.is_directory ? '-' : formatSize(file.size)
          }}</span>
        </label>
      </div>
    </a-modal>

    <PathSelectorModal
      v-model:open="pathSelectorVisible"
      :account-id="
        mountForm.spaceType === 'personal' ? mountForm.accountId : undefined
      "
      :file-id="mountForm.rootId || null"
      :path="mountForm.rootPath || '/'"
      :preview-params="externalPreviewParams"
      title="选择根路径"
      @confirm="confirmPreviewPath"
    />

    <PathSelectorModal
      v-model:open="operationTargetVisible"
      :space-id="selectedSpaceId"
      :title="
        pendingOperation === 'copy' ? '选择复制目标目录' : '选择移动目标目录'
      "
      @confirm="confirmOperationTarget"
    />

    <a-modal
      v-model:open="operatingFiles"
      :closable="false"
      :footer="null"
      centered
      title="正在处理文件"
    >
      <a-spin :spinning="true">
        <div class="py-6 text-center text-slate-500">
          {{
            pendingOperation === 'copy'
              ? '正在复制文件，请稍候...'
              : '正在移动文件，请稍候...'
          }}
        </div>
      </a-spin>
    </a-modal>

    <a-modal
      v-model:open="mkdirVisible"
      :confirm-loading="mkdirLoading"
      title="新建文件夹"
      @ok="createDirectory"
    >
      <a-form layout="vertical">
        <a-form-item label="文件夹名称" required>
          <a-input
            v-model:value="mkdirForm.name"
            :maxlength="255"
            placeholder="请输入文件夹名称"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="renameVisible"
      :confirm-loading="renameLoading"
      title="重命名"
      @ok="renameFile"
    >
      <a-form layout="vertical">
        <a-form-item label="新名称" required>
          <a-input
            v-model:value="renameForm.name"
            :maxlength="255"
            placeholder="请输入新名称"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="removeConfirmVisible"
      ok-text="删除"
      title="删除文件"
      :ok-button-props="{ danger: true }"
      @ok="removeContextFiles"
    >
      确定删除选中的 {{ contextFiles.length }} 项？此操作不可撤销。
    </a-modal>

    <a-modal
      v-model:open="editSpaceVisible"
      :confirm-loading="savingSpace"
      title="编辑文件空间"
      @ok="saveSpaceEdit"
    >
      <a-form layout="vertical">
        <a-form-item label="空间名称" required>
          <a-input v-model:value="editSpaceForm.name" :maxlength="128" />
        </a-form-item>
        <a-form-item label="根目录 ID">
          <a-input
            v-model:value="editSpaceForm.rootId"
            placeholder="选择根路径后自动回填"
            readonly
          />
        </a-form-item>
        <a-form-item label="根路径">
          <div style="display: flex; gap: 8px; width: 100%">
            <a-input
              v-model:value="editSpaceForm.rootPath"
              placeholder="/"
              readonly
              style="flex: 1; min-width: 0"
            />
            <a-button @click="openEditSpacePathSelector">选择</a-button>
          </div>
        </a-form-item>
        <a-form-item label="状态">
          <a-switch
            v-model:checked="editSpaceForm.isEnabled"
            checked-children="启用"
            un-checked-children="停用"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <PathSelectorModal
      v-model:open="editSpacePathSelectorVisible"
      :account-id="
        contextSpace?.space_type === 'personal'
          ? contextSpace?.account_id || undefined
          : undefined
      "
      :file-id="
        contextSpace?.space_type === 'personal'
          ? editSpaceForm.rootId || null
          : null
      "
      :path="
        contextSpace?.space_type === 'personal'
          ? editSpaceForm.rootPath || '/'
          : '/'
      "
      :space-id="
        contextSpace?.space_type === 'personal' ? undefined : contextSpace?.id
      "
      title="选择根路径"
      @confirm="confirmEditSpacePath"
    />

    <a-modal
      v-model:open="shareVisible"
      :confirm-loading="creatingShare"
      :ok-button-props="{ disabled: Boolean(shareResult) }"
      title="创建分享链接"
      @ok="createShare"
    >
      <template v-if="shareResult">
        <a-textarea :value="shareResult" :auto-size="{ minRows: 3 }" readonly />
        <VbenButton class="mt-3" @click="copyShareResult">
          复制分享信息
        </VbenButton>
      </template>
      <a-form v-else layout="vertical">
        <a-form-item label="分享文件">
          <div class="max-h-24 overflow-y-auto text-slate-600">
            {{ selectedFiles.map((file) => file.name).join('、') }}
          </div>
        </a-form-item>
        <a-form-item label="分享标题">
          <a-input v-model:value="shareForm.title" :maxlength="255" />
        </a-form-item>
        <a-form-item label="有效期">
          <a-radio-group v-model:value="shareForm.expiresInDays">
            <a-radio :value="1">1 天</a-radio>
            <a-radio :value="7">7 天</a-radio>
            <a-radio :value="30">30 天</a-radio>
            <a-radio :value="0">永久</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item v-if="selectedSpace?.provider === 'baidu'" label="提取码">
          <a-input
            v-model:value="shareForm.password"
            :maxlength="4"
            placeholder="留空则不设置"
          />
        </a-form-item>
        <a-alert
          v-else-if="selectedSpace?.provider === 'quark'"
          message="夸克网盘会由服务端生成提取码"
          type="info"
          show-icon
        />
      </a-form>
    </a-modal>

    <a-drawer v-model:open="sharesVisible" :width="720" title="我的分享">
      <template #extra>
        <VbenButton :loading="loadingShares" @click="loadShares">
          刷新
        </VbenButton>
      </template>
      <a-table
        :columns="shareColumns"
        :data-source="shares"
        :loading="loadingShares"
        :pagination="false"
        row-key="share_id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'url'">
            <a :href="record.url" rel="noreferrer" target="_blank">打开链接</a>
          </template>
          <template v-else-if="column.key === 'password'">
            {{ record.password || '-' }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button
              size="small"
              type="link"
              @click="showShareDetail(record as MyDriveShareLink)"
            >
              复制
            </a-button>
            <a-popconfirm
              title="确定取消此分享链接？"
              @confirm="cancelShare(record as MyDriveShareLink)"
            >
              <a-button danger size="small" type="link">取消分享</a-button>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </a-drawer>
  </Page>
</template>

<style scoped>
:deep(.mydrive-relationship-select.ant-select-single) {
  height: 40px;
}

:deep(.mydrive-relationship-select.ant-select-single .ant-select-selector) {
  align-items: center;
  border-radius: 8px;
}

:global(.mydrive-relationship-dropdown .ant-select-item) {
  min-height: 40px;
  padding-block: 8px;
}

:deep(.mydrive-file-list-spin .ant-spin-container) {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
</style>
