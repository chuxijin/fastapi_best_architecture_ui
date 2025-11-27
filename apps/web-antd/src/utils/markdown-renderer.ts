// eslint-disable-next-line n/no-extraneous-import
import { marked } from 'marked';

/**
 * 自定义渲染器
 */
const renderer = new marked.Renderer();

// 自定义图片渲染
renderer.image = function (href: string, title: null | string, text: string) {
  const titleAttr = title ? ` title="${title}"` : '';
  const altAttr = text ? ` alt="${text}"` : '';

  // 添加 class 用于样式控制，添加 loading="lazy" 用于性能优化
  return `<img src="${href}"${altAttr}${titleAttr} class="markdown-image" loading="lazy" />`;
};

/**
 * 将 Markdown 转换为 HTML
 *
 * :param markdown: Markdown 源码
 * :return: 渲染后的 HTML 字符串
 */
export function renderMarkdown(markdown: string): string {
  if (!markdown) return '';

  try {
    // 配置 marked
    marked.setOptions({
      breaks: true, // 支持 GFM 换行
      gfm: true, // 启用 GitHub 风格的 Markdown
      headerIds: false, // 不生成标题 ID
      mangle: false, // 不混淆邮箱地址
      renderer, // 使用自定义渲染器
    });

    // 转换 Markdown 为 HTML
    const html = marked.parse(markdown) as string;
    return html;
  } catch (error) {
    console.error('Markdown 渲染失败:', error);
    return markdown; // 失败时返回原始文本
  }
}

/**
 * 安全地渲染 Markdown（过滤危险标签）
 *
 * :param markdown: Markdown 源码
 * :return: 渲染后的 HTML 字符串
 */
export function renderMarkdownSafe(markdown: string): string {
  const html = renderMarkdown(markdown);

  // 移除可能的危险标签
  return html
    .replaceAll(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replaceAll(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replaceAll(/on\w+\s*=\s*["'][^"']*["']/gi, '');
}
