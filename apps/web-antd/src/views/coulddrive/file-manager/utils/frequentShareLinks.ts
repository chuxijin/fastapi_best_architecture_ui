// 常用分享链接管理工具
export interface FrequentShareLink {
  url: string;
  name: string; // 第一个文件名作为显示名称
  visitCount: number; // 访问次数（输入链接的次数）
  saveCount: number; // 保存次数（成功保存文件的次数）
  lastVisited: number; // 最后访问时间戳
  lastSaved: number; // 最后保存时间戳
  accountId: string; // 关联的账号ID
}

export interface AccountShareLinks {
  [accountId: string]: FrequentShareLink[];
}

const STORAGE_KEY = 'coulddrive_frequent_share_links';
const MAX_LINKS = 5; // 最多保存5个常用链接

/**
 * 获取所有账号的常用分享链接
 */
export function getAllFrequentShareLinks(): AccountShareLinks {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('读取常用分享链接失败:', error);
    return {};
  }
}

/**
 * 获取指定账号的常用分享链接
 */
export function getFrequentShareLinks(accountId: string): FrequentShareLink[] {
  const allLinks = getAllFrequentShareLinks();
  return allLinks[accountId] || [];
}

/**
 * 记录分享链接访问
 */
export function recordShareLinkVisit(
  accountId: string,
  url: string,
  name: string,
) {
  // 跳过空链接
  if (!url || !url.trim()) {
    return;
  }

  const allLinks = getAllFrequentShareLinks();
  const accountLinks = allLinks[accountId] || [];

  // 查找是否已存在
  const existingIndex = accountLinks.findIndex((link) => link.url === url);

  if (existingIndex === -1) {
    // 添加新记录
    accountLinks.push({
      url,
      name,
      visitCount: 1,
      saveCount: 0,
      lastVisited: Date.now(),
      lastSaved: 0,
      accountId,
    });
  } else {
    // 更新现有记录
    const existingLink = accountLinks[existingIndex];
    if (existingLink) {
      existingLink.visitCount += 1;
      existingLink.lastVisited = Date.now();
      existingLink.name = name; // 更新名称（可能有变化）
    }
  }

  // 重新排序并保存
  sortAndSaveLinks(allLinks, accountId, accountLinks);
}

/**
 * 记录分享链接保存成功
 */
export function recordShareLinkSave(
  accountId: string,
  url: string,
  name: string,
) {
  // 跳过空链接
  if (!url || !url.trim()) {
    return;
  }

  const allLinks = getAllFrequentShareLinks();
  const accountLinks = allLinks[accountId] || [];

  // 查找是否已存在
  const existingIndex = accountLinks.findIndex((link) => link.url === url);

  if (existingIndex === -1) {
    // 添加新记录（直接保存的情况）
    accountLinks.push({
      url,
      name,
      visitCount: 1,
      saveCount: 1,
      lastVisited: Date.now(),
      lastSaved: Date.now(),
      accountId,
    });
  } else {
    // 更新现有记录
    const existingLink = accountLinks[existingIndex];
    if (existingLink) {
      existingLink.saveCount += 1;
      existingLink.lastSaved = Date.now();
      existingLink.name = name; // 更新为实际文件名
    }
  }

  // 重新排序并保存
  sortAndSaveLinks(allLinks, accountId, accountLinks);
}

/**
 * 智能排序算法：综合保存次数、访问次数和时间权重
 */
function calculateScore(link: FrequentShareLink): number {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // 时间衰减因子（越近期权重越高）
  const visitTimeDecay = Math.exp(-(now - link.lastVisited) / (7 * dayMs)); // 7天衰减
  const saveTimeDecay = Math.exp(-(now - link.lastSaved) / (7 * dayMs));

  // 权重配置
  const saveWeight = 3; // 保存次数权重最高
  const visitWeight = 1; // 访问次数权重
  const timeWeight = 2; // 时间权重

  // 综合得分
  const score =
    link.saveCount * saveWeight +
    link.visitCount * visitWeight +
    Math.max(visitTimeDecay, saveTimeDecay) * timeWeight;

  return score;
}

/**
 * 排序并保存链接
 */
function sortAndSaveLinks(
  allLinks: AccountShareLinks,
  accountId: string,
  accountLinks: FrequentShareLink[],
) {
  // 按综合得分排序
  accountLinks.sort((a, b) => {
    const scoreA = calculateScore(a);
    const scoreB = calculateScore(b);
    return scoreB - scoreA; // 得分高的排前面
  });

  // 只保留前N个
  allLinks[accountId] = accountLinks.slice(0, MAX_LINKS);

  // 保存到localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allLinks));
  } catch (error) {
    console.error('保存常用分享链接失败:', error);
  }
}

/**
 * 清除指定账号的常用分享链接
 */
export function clearFrequentShareLinks(accountId: string) {
  const allLinks = getAllFrequentShareLinks();
  allLinks[accountId] = [];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allLinks));
  } catch (error) {
    console.error('清除常用分享链接失败:', error);
  }
}

/**
 * 清除所有常用分享链接
 */
export function clearAllFrequentShareLinks() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('清除所有常用分享链接失败:', error);
  }
}

/**
 * 格式化显示名称
 */
export function formatShareLinkName(name: string, url: string): string {
  if (name && name.trim()) {
    return name;
  }

  // 从URL中提取可能的名称
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      return pathParts[pathParts.length - 1] || '分享链接';
    }
  } catch {
    // URL解析失败，使用默认名称
  }

  return '分享链接';
}

/**
 * 验证分享链接格式
 */
export function isValidShareLink(url: string): boolean {
  if (!url || !url.trim()) {
    return false;
  }

  try {
    const urlObj = new URL(url);
    // 检查是否为常见的网盘分享链接
    const validDomains = [
      'pan.baidu.com',
      'pan.quark.cn',
      'cloud.189.cn',
      'pan.xunlei.com',
      'www.aliyundrive.com',
    ];

    return validDomains.some(
      (domain) =>
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`),
    );
  } catch {
    return false;
  }
}
