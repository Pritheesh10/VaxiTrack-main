"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/types/auth.types";

interface RouteGuardProps {
	children: React.ReactNode;
	allowedRoles: UserRole[];
	unauthorizedRedirect?: string;
}

export function RouteGuard({ children, allowedRoles, unauthorizedRedirect = "/login" }: RouteGuardProps) {
	const router = useRouter();
	const { user, token, hydrated } = useAuthStore();
	const normalizedAllowedRoles = allowedRoles.map((role) => role.trim().toLowerCase());

	useEffect(() => {
		if (!hydrated) return; // Wait for store to rehydrate from localStorage
		if (!token) {
			router.replace("/login");
			return;
		}
		const normalizedUserRole = String(user?.role ?? "").trim().toLowerCase();
		if (user && !normalizedAllowedRoles.includes(normalizedUserRole)) {
			router.replace(unauthorizedRedirect);
		}
	}, [hydrated, token, user, normalizedAllowedRoles, router, unauthorizedRedirect]);

	// Show nothing until hydrated, or if not authorized
	if (!hydrated) {
		return null;
	}

	const normalizedUserRole = String(user?.role ?? "").trim().toLowerCase();
	if (!token || (user && !normalizedAllowedRoles.includes(normalizedUserRole))) {
		return null;
	}

	return <>{children}</>;
}
