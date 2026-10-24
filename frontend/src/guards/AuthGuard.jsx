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

  // Render nothing while the session resolves -- avoids a flash redirect
  if (isLoading) return null;

  if (!isLoggedIn) {
    const redirectTo = getAppBasePath();
    window.location.href = '/login?redirect-to=' + redirectTo;
    return null;
  }

  return children;
}
