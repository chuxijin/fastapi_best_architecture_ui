import { requestClient } from '#/api/request';

/**
 * 上传文件返回结果
 */
export interface UploadResult {
  url: string;
}

/**
 * 文件信息
 */
export interface FileInfo {
  name: string;
  url?: string;
  size?: number;
  created_time: string;
  type: 'document' | 'folder' | 'image' | 'other' | 'video';
  is_folder: boolean;
}

/**
 * 文件列表返回结果
 */
export interface FileListResult {
  items: FileInfo[];
  total: number;
  page: number;
  size: number;
  current_folder: string;
}

/**
 * 文件列表查询参数
 */
export interface FileListParams {
  page?: number;
  size?: number;
  keyword?: string;
  file_type?: 'document' | 'image' | 'other' | 'video';
  folder?: string;
}

/**
 * 上传文件
 */
export async function uploadFileApi(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  return requestClient.post<UploadResult>(
    '/api/v1/sys/files/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
}

/**
 * 上传图片（便捷方法）
 */
export async function uploadImageApi(file: File): Promise<string> {
  const result = await uploadFileApi(file);
  return result.url;
}

/**
 * 上传视频（便捷方法）
 */
export async function uploadVideoApi(file: File): Promise<string> {
  const result = await uploadFileApi(file);
  return result.url;
}

/**
 * 获取文件列表
 */
export async function getFileListApi(
  params: FileListParams = {},
): Promise<FileListResult> {
  return requestClient.get<FileListResult>('/api/v1/sys/files/list', {
    params,
  });
}

/**
 * 删除文件
 */
export async function deleteFileApi(filename: string): Promise<any> {
  return requestClient.delete<any>('/api/v1/sys/files/delete', {
    params: { filename },
  });
}

/**
 * 创建文件夹
 */
export async function createFolderApi(
  folderName: string,
  parentFolder?: string,
): Promise<{ name: string; path: string }> {
  const params: any = { folder_name: folderName };
  if (parentFolder) {
    params.parent_folder = parentFolder;
  }
  return requestClient.post<{ name: string; path: string }>(
    '/api/v1/sys/files/create-folder',
    null,
    { params },
  );
}
