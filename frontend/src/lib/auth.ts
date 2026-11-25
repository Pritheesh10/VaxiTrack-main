const TOKEN_KEY = "vaxi-track-token";

export function getToken() {
	if (typeof window === "undefined") {
		return null;
	}
	return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
	if (typeof window === "undefined") {
		return;
	}
	localStorage.setItem(TOKEN_KEY, token);
	document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=86400; samesite=lax`;
}

export function clearToken() {
	if (typeof window === "undefined") {
		return;
	}
	localStorage.removeItem(TOKEN_KEY);
	document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax`;
}
