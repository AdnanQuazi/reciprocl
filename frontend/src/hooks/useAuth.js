import { useFrappeAuth } from "frappe-react-sdk";

/**
 * Thin wrapper around useFrappeAuth so pages never import
 * directly from frappe-react-sdk -- makes swapping easier later.
 */
export function useAuth() {
	const { currentUser, isLoading, isValidating, error } = useFrappeAuth();
	const isLoggedIn = Boolean(currentUser);
	return { currentUser, isLoggedIn, isLoading, isValidating, error };
}
