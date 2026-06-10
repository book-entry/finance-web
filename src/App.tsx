import { useEffect } from 'react';
import { ConfigProvider } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { buildAntdTheme } from './theme/antdTheme';
import { usePrefsStore } from './stores/prefsStore';
import { useAuthStore } from './stores/authStore';
import { router } from './routes/router';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export function App() {
  const themeMode = usePrefsStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode]);

  useEffect(() => {
    // Whenever the auth session flips (login, logout, cross-tab change),
    // ask the router to re-run its route guards.
    return useAuthStore.subscribe((state, prev) => {
      if (state.session !== prev.session) {
        void router.invalidate();
      }
    });
  }, []);

  return (
    <ConfigProvider theme={buildAntdTheme(themeMode)}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ConfigProvider>
  );
}
