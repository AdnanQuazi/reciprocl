import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import AuthGuard from '../guards/AuthGuard';
import NotFound from '../pages/NotFound';

const Dashboard = lazy(() => import('../pages/Dashboard'));

function AppRoutes() {
  return (
    <Suspense fallback={null}>
      <Routes>
        {/* Protected routes */}
        <Route
          path="/"
          element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          }
        />
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
