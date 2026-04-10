/// <reference types="vite/client" />
/// <reference types="antdv-next/global" />

declare module 'antdv-next/dist/antd-with-locales.esm.js' {
  import type { ConfigProviderProps } from 'antdv-next';

  type AntdvLocale = NonNullable<ConfigProviderProps['locale']>;

  export const locales: Record<string, AntdvLocale>;
  const defaultExport: {
    locales: Record<string, AntdvLocale>;
  };
  export default defaultExport;
}
