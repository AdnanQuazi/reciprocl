import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getAppBasePath } from '../lib/frappe';

/**
 * Wraps any route that requires authentication.
 * Unauthenticated users are redirected to Frappe login
 * with a redirect-to param pointing back to this app.
 *
 * Usage:
 *   <Route path="/" element={<AuthGuard><Dashboard /></AuthGuard>} />
 */
export default function AuthGuard({ children }) {
  const { isLoggedIn, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      const redirectTo = getAppBasePath();
      window.location.href = '/login?redirect-to=' + redirectTo;
    }
  }, [isLoading, isLoggedIn]);

  // Render nothing while resolving session or waiting for redirect
  if (isLoading || !isLoggedIn) {
    return null;
  }

  return children;
}
