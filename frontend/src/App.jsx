import { FrappeProvider } from 'frappe-react-sdk';
import AppRouter from './router';

/**
 * Root component.
 * FrappeProvider initialises the SDK (session, auth, SWR cache).
 * No URL prop needed -- same-origin requests work via Vite proxy in dev
 * and are served directly by Frappe in production.
 */
export default function App() {
  return (
    <FrappeProvider>
      <AppRouter />
    </FrappeProvider>
  );
}
