import { requestClient } from './request';

export interface GrayscaleFeatureItem {
  feature: string;
  enabled: boolean;
  whitelist: number[];
  ratio: number;
}

export interface GrayscaleListResult {
  features: GrayscaleFeatureItem[];
}

export interface GrayscaleConfigParams {
  enabled: boolean;
  whitelist: number[];
  ratio: number;
}

export async function getGrayscaleListApi() {
  return requestClient.get<GrayscaleListResult>('/api/v1/grayscale');
}

export async function getGrayscaleConfigApi(feature: string) {
  return requestClient.get<GrayscaleConfigParams>(
    `/api/v1/grayscale/${feature}`,
  );
}

export async function saveGrayscaleConfigApi(
  feature: string,
  params: GrayscaleConfigParams,
) {
  return requestClient.put(`/api/v1/grayscale/${feature}`, params);
}

export async function deleteGrayscaleConfigApi(feature: string) {
  return requestClient.delete(`/api/v1/grayscale/${feature}`);
}
