import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { FrappeProvider } from 'frappe-react-sdk';
import AuthGuard from '../guards/AuthGuard';
import NotFound from '../pages/NotFound';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const DevPreview = import.meta.env.DEV
  ? lazy(() => import('../pages/DevPreview'))
  : null;

function AppRoutes() {
  return (
    <Suspense fallback={null}>
      <Routes>
        {/* Protected routes */}
        <Route
          path="/"
          element={
            <FrappeProvider>
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            </FrappeProvider>
          }
        />
        {import.meta.env.DEV && (
          <Route path="/dev-preview" element={<DevPreview />} />
        )}
        {/* 404 fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter basename="/reciprocl">
      <AppRoutes />
    </BrowserRouter>
  );
}
