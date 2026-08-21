import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import esES from 'antd/locale/es_ES';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './app/AuthContext.tsx';
import { BRAND } from './shared/theme/brand';
import './index.css';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      locale={esES}
      theme={{
        token: {
          colorPrimary: BRAND.teal,
          colorLink: BRAND.teal,
          colorInfo: BRAND.teal,
          fontSize: 13,
          fontSizeLG: 15,
          fontSizeSM: 12,
        },
        components: {
          Layout: {
            siderBg: BRAND.tealDark,
            headerBg: '#ffffff',
            bodyBg: BRAND.bg,
          },
          Menu: {
            darkItemBg: BRAND.tealDark,
            darkItemColor: 'rgba(255,255,255,0.85)',
            darkItemHoverBg: '#0e463f',
            darkItemSelectedBg: BRAND.orange,
            darkItemSelectedColor: '#ffffff',
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ConfigProvider>
  </StrictMode>,
)
