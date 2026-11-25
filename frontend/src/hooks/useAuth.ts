"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/types/auth.types";

export function useAuth() {
	const router = useRouter();
	const { user, token, loading, error, hydrated, loginUser, registerUser, logout } = useAuthStore();

	const isAuthenticated = useMemo(() => Boolean(token), [token]);

	const goToDashboard = useCallback((role: UserRole | string) => {
		const normalizedRole = String(role ?? "").trim().toLowerCase();
		if (normalizedRole === "admin") {
			router.push("/admin/dashboard");
			return;
		}
		if (normalizedRole === "worker" || normalizedRole === "healthcare_worker") {
			router.push("/worker/dashboard");
			return;
		}
		router.push("/parent/dashboard");
	}, [router]);

	return {
		user,
		token,
		loading,
		error,
		hydrated,
		isAuthenticated,
		loginUser,
		registerUser,
		logout,
		goToDashboard
	};
}
