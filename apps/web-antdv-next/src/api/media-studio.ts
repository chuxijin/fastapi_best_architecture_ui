import { requestClient } from './request';

export interface MediaAuthor {
  id?: string;
  name: string;
  avatar?: string;
  url?: string;
}

export interface MediaStats {
  like_count?: number;
  comment_count?: number;
  collect_count?: number;
  share_count?: number;
}

export interface UnifiedMediaData {
  platform: 'douyin' | 'xhs' | string;
  media_type: 'image' | 'video' | string;
  title: string;
  content: string;
  tags: string[];
  cover_url?: string;
  images: string[];
  video_url?: string;
  author?: MediaAuthor;
  stats?: MediaStats;
  raw_url: string;
}

export interface MediaParseParams {
  url_or_text: string;
  cookie?: string;
}

export interface ImageGenerateParams {
  prompt: string;
  model?: string;
  n?: number;
  size?: string;
  quality?: string;
  image_url?: string;
  provider_id?: number;
}

export interface AIImageItem {
  url: string;
  revised_prompt?: string;
}

export interface AIImageGenerateResult {
  images: AIImageItem[];
  provider_id: number;
  provider_name: string;
  model: string;
  elapsed_seconds: number;
}

export interface OneClickRecreateParams {
  url_or_text: string;
  cookie?: string;
  prompt_style?: string;
  custom_prompt?: string;
  model?: string;
  size?: string;
  reference_image_url?: string;
  provider_id?: number;
}

export interface OneClickRecreateResult {
  original_media: UnifiedMediaData;
  generated_prompt: string;
  generated_images: string[];
  provider_name: string;
  elapsed_seconds: number;
}

/**
 * 解析抖音/小红书平台作品
 */
export async function parseMediaApi(params: MediaParseParams) {
  return requestClient.post<UnifiedMediaData>(
    '/api/v1/media-studio/parse',
    params,
  );
}

/**
 * 单步 AI 生图（支持多中转站高可用容灾）
 */
export async function generateImageApi(params: ImageGenerateParams) {
  return requestClient.post<AIImageGenerateResult>(
    '/api/v1/media-studio/image-gen',
    params,
  );
}

/**
 * 一键二创流水线（自动解析 -> 提炼场景 Prompt -> 容灾生图）
 */
export async function recreateMediaApi(params: OneClickRecreateParams) {
  return requestClient.post<OneClickRecreateResult>(
    '/api/v1/media-studio/recreate',
    params,
  );
}
