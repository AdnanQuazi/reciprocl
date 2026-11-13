import { useFrappeAuth } from "frappe-react-sdk";

type FrappeAuthResult = ReturnType<typeof useFrappeAuth>;

export interface AuthState {
  currentUser: FrappeAuthResult['currentUser'];
  isLoggedIn: boolean;
  isLoading: FrappeAuthResult['isLoading'];
  isValidating: FrappeAuthResult['isValidating'];
  error: FrappeAuthResult['error'];
}

/**
 * Thin wrapper around useFrappeAuth so pages never import
 * directly from frappe-react-sdk -- makes swapping easier later.
 */
export function useAuth(): AuthState {
	const { currentUser, isLoading, isValidating, error } = useFrappeAuth();
	const isLoggedIn = Boolean(currentUser);
	return { currentUser, isLoggedIn, isLoading, isValidating, error };
}
