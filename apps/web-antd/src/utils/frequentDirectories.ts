// 常用目录管理工具
export interface FrequentDirectory {
  path: string;
  name: string;
  fileId: string;
  visitCount: number;
  lastVisited: number; // 时间戳
}

export interface AccountDirectories {
  [accountId: string]: FrequentDirectory[];
}

const STORAGE_KEY = 'coulddrive_frequent_directories';
const MAX_DIRECTORIES = 5; // 最多保存5个常用目录

/**
 * 获取所有账号的常用目录
 */
export function getAllFrequentDirectories(): AccountDirectories {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('读取常用目录失败:', error);
    return {};
  }
}

/**
 * 获取指定账号的常用目录
 */
export function getFrequentDirectories(accountId: string): FrequentDirectory[] {
  const allDirectories = getAllFrequentDirectories();
  return allDirectories[accountId] || [];
}

/**
 * 记录目录访问
 */
export function recordDirectoryVisit(
  accountId: string,
  path: string,
  name: string,
  fileId: string,
) {
  // 跳过根目录
  if (path === '/' || path === '') {
    return;
  }

  const allDirectories = getAllFrequentDirectories();
  const accountDirectories = allDirectories[accountId] || [];

  // 查找是否已存在
  const existingIndex = accountDirectories.findIndex(
    (dir) => dir.path === path,
  );

  if (existingIndex === -1) {
    // 添加新记录
    accountDirectories.push({
      path,
      name,
      fileId,
      visitCount: 1,
      lastVisited: Date.now(),
    });
  } else {
    // 更新现有记录
    const existingDir = accountDirectories[existingIndex];
    if (existingDir) {
      existingDir.visitCount += 1;
      existingDir.lastVisited = Date.now();
      existingDir.name = name; // 更新名称（可能重命名了）
      existingDir.fileId = fileId; // 更新ID
    }
  }

  // 按访问频率和最近访问时间排序
  accountDirectories.sort((a, b) => {
    // 首先按访问次数排序
    if (a.visitCount !== b.visitCount) {
      return b.visitCount - a.visitCount;
    }
    // 访问次数相同时按最近访问时间排序
    return b.lastVisited - a.lastVisited;
  });

  // 只保留前N个
  allDirectories[accountId] = accountDirectories.slice(0, MAX_DIRECTORIES);

  // 保存到localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allDirectories));
  } catch (error) {
    console.error('保存常用目录失败:', error);
  }
}

/**
 * 清除指定账号的常用目录
 */
export function clearFrequentDirectories(accountId: string) {
  const allDirectories = getAllFrequentDirectories();
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete allDirectories[accountId];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allDirectories));
  } catch (error) {
    console.error('清除常用目录失败:', error);
  }
}

/**
 * 清除所有常用目录
 */
export function clearAllFrequentDirectories() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('清除所有常用目录失败:', error);
  }
}

/**
 * 格式化显示名称
 */
export function formatDirectoryName(path: string, name?: string): string {
  if (name && name !== path) {
    return name;
  }

  // 从路径中提取文件夹名
  const parts = path.split('/').filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] || '根目录' : '根目录';
}
