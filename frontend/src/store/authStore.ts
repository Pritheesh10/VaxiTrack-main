"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clearToken, setToken } from "@/lib/auth";
import { login, parseApiError, register } from "@/lib/api";
import type { LoginPayload, RegisterPayload, User } from "@/types/auth.types";

interface AuthState {
	user: User | null;
	token: string | null;
	loading: boolean;
	error: string | null;
	hydrated: boolean;
	setUser: (user: User | null) => void;
	setToken: (token: string | null) => void;
	loginUser: (payload: LoginPayload) => Promise<User>;
	registerUser: (payload: RegisterPayload) => Promise<User>;
	logout: () => void;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			user: null,
			token: null,
			loading: false,
			error: null,
			hydrated: false,
			setUser: (user) => set({ user }),
			setToken: (token) => {
				if (token) {
					setToken(token);
				} else {
					clearToken();
				}
				set({ token });
			},
			loginUser: async (payload) => {
				set({ loading: true, error: null });
				try {
					const response = await login(payload);
					setToken(response.access_token);
					set({
						user: response.user,
						token: response.access_token,
						loading: false
					});
					return response.user;
				} catch (error) {
					set({ error: parseApiError(error), loading: false });
					throw error;
				}
			},
			registerUser: async (payload) => {
				set({ loading: true, error: null });
				try {
					const response = await register(payload);
					setToken(response.access_token);
					set({
						user: response.user,
						token: response.access_token,
						loading: false
					});
					return response.user;
				} catch (error) {
					set({ error: parseApiError(error), loading: false });
					throw error;
				}
			},
			logout: () => {
				clearToken();
				set({ user: null, token: null, error: null });
			}
		}),
		{
			name: "vaxi-track-auth",
			version: 2,
			partialize: (state) => ({
				user: state.user,
				token: state.token,
			}),
			migrate: (persistedState) => {
				const state = persistedState as Partial<AuthState> | undefined;
				return {
					user: state?.user ?? null,
					token: typeof state?.token === "string" ? state.token : null,
					loading: false,
					error: null,
					hydrated: false,
				};
			},
			onRehydrateStorage: () => (state) => {
				if (state) {
					state.error = null;
					state.hydrated = true;
					// If there's a stored token, validate it. The 401 interceptor
					// will auto-clear if the token is invalid/expired.
					if (state.token) {
						import("@/lib/api").then(({ api }) => {
							api.get("/api/auth/me").catch(() => {
								// The 401 interceptor handles logout.
								// Only clear here if the token hasn't changed
								// (i.e., user hasn't logged in between).
							});
						});
					}
				}
			}
		}
	)
);
