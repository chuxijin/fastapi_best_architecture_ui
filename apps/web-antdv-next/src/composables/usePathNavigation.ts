import type { CoulddriveFileInfo } from '#/api';

import { computed, ref } from 'vue';

import { message } from 'ant-design-vue';

export interface PathHistoryItem {
  path: string;
  file_id: string;
  name: string;
}

export interface UsePathNavigationOptions {
  onNavigate?: (path: string, fileId: string) => void;
  onEnterFolder?: (folder: CoulddriveFileInfo) => void;
  onGoBack?: (parentItem: PathHistoryItem) => void;
}

/**
 * 路径导航 composable
 *
 * :param options: 配置选项，包含导航回调函数
 * :return: 路径导航相关的状态和方法
 */
export function usePathNavigation(options: UsePathNavigationOptions = {}) {
  // 路径历史记录
  const pathHistory = ref<PathHistoryItem[]>([
    { path: '/', file_id: '0', name: '根目录' },
  ]);

  // 当前路径和文件ID
  const currentPath = ref<string>('/');
  const currentFileId = ref<string>('0');

  // 计算面包屑路径
  const breadcrumbPaths = computed(() => pathHistory.value);

  /**
   * 跳转到指定路径
   *
   * :param path: 目标路径
   * :param fileId: 目标文件ID
   */
  function navigateToPath(path: string, fileId: string = '0') {
    // 找到目标路径在历史记录中的位置
    const targetIndex = pathHistory.value.findIndex(
      (item) => item.path === path,
    );
    if (targetIndex === -1) {
      // 如果在历史记录中找不到，需要重新构建面包屑路径
      currentPath.value = path;
      currentFileId.value = fileId;

      if (path === '/') {
        // 根目录
        pathHistory.value = [{ path: '/', file_id: '0', name: '根目录' }];
      } else {
        // 构建完整的面包屑路径
        const pathParts = path.split('/').filter(Boolean);
        const newHistory: PathHistoryItem[] = [
          { path: '/', file_id: '0', name: '根目录' },
        ];

        let currentBuildPath = '';
        for (let i = 0; i < pathParts.length; i++) {
          currentBuildPath += `/${pathParts[i]}`;
          const isTarget = i === pathParts.length - 1;
          newHistory.push({
            path: currentBuildPath,
            file_id: isTarget ? fileId : '0', // 只有目标路径使用传入的fileId
            name: pathParts[i] || '',
          });
        }

        pathHistory.value = newHistory;
      }
    } else {
      // 截取历史记录到目标位置
      pathHistory.value = pathHistory.value.slice(0, targetIndex + 1);
      const targetItem = pathHistory.value[targetIndex];

      if (targetItem) {
        currentPath.value = targetItem.path;
        currentFileId.value = targetItem.file_id;
      }
    }

    // 执行导航回调
    options.onNavigate?.(currentPath.value, currentFileId.value);
    message.success(`已跳转到: ${path === '/' ? '根目录' : path}`);
  }

  /**
   * 进入文件夹
   *
   * :param folder: 要进入的文件夹信息
   */
  function navigateToFolder(folder: CoulddriveFileInfo) {
    if (!folder.is_folder) return;

    currentPath.value = folder.file_path;
    currentFileId.value = folder.file_id;

    // 更新路径历史记录
    pathHistory.value.push({
      path: folder.file_path,
      file_id: folder.file_id,
      name: folder.file_name,
    });

    // 执行进入文件夹回调
    options.onEnterFolder?.(folder);
    message.success(`已进入文件夹: ${folder.file_name}`);
  }

  /**
   * 返回上级目录
   */
  function goBack() {
    if (pathHistory.value.length > 1) {
      // 移除当前路径，回到上一级
      pathHistory.value.pop();
      const parentItem = pathHistory.value[pathHistory.value.length - 1];

      if (parentItem) {
        currentPath.value = parentItem.path;
        currentFileId.value = parentItem.file_id;

        // 执行返回回调
        options.onGoBack?.(parentItem);
        message.success(`已返回到: ${parentItem.name}`);
      }
    }
  }

  /**
   * 重置路径到根目录
   */
  function resetPath() {
    pathHistory.value = [{ path: '/', file_id: '0', name: '根目录' }];
    currentPath.value = '/';
    currentFileId.value = '0';
  }

  /**
   * 检查是否可以返回上级
   */
  const canGoBack = computed(() => pathHistory.value.length > 1);

  return {
    // 状态
    pathHistory,
    currentPath,
    currentFileId,
    breadcrumbPaths,
    canGoBack,

    // 方法
    navigateToPath,
    navigateToFolder,
    goBack,
    resetPath,
  };
}
