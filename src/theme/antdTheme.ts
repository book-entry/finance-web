import { theme, type ThemeConfig } from 'antd';

export type ThemeMode = 'dark' | 'light';

export function buildAntdTheme(mode: ThemeMode): ThemeConfig {
  const isDark = mode === 'dark';
  return {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: isDark ? '#818CF8' : '#4F46E5',
      colorSuccess: '#34D399',
      colorError: '#F87171',
      colorWarning: '#FBBF24',
      borderRadius: 12,
      fontFamily:
        '"Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, sans-serif',
      colorBgBase: isDark ? '#0B0F1F' : '#F6F4EE',
      colorBgContainer: isDark ? '#151B33' : '#FFFFFF',
    },
  };
}
