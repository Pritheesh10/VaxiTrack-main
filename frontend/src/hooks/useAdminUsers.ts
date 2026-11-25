"use client";

import { useCallback, useEffect, useState } from "react";
import {
	createHealthcareWorker,
	deactivateAdminUser,
	deleteAdminUser,
	getAdminUsers,
	parseApiError,
} from "@/lib/api";
import type { AdminUser } from "@/types/admin.types";

interface UserFilters {
	role?: string;
	search?: string;
	page?: number;
	limit?: number;
}

export function useAdminUsers(initialFilters: UserFilters = { page: 1, limit: 10 }) {
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [filters, setFilters] = useState<UserFilters>(initialFilters);

	const refetch = useCallback(async (next?: UserFilters) => {
		const params = { ...filters, ...(next ?? {}) };
		setFilters(params);
		setLoading(true);
		setError(null);
		try {
			const data = await getAdminUsers(params);
			setUsers(data.records);
			setTotal(data.total_count);
		} catch (err) {
			setError(parseApiError(err));
		} finally {
			setLoading(false);
		}
	}, [filters]);

	useEffect(() => {
		void refetch(initialFilters);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const createWorker = useCallback(async (payload: { name: string; email: string; phone_number: string; password: string }) => {
		await createHealthcareWorker(payload);
		await refetch();
	}, [refetch]);

	const deactivateUser = useCallback(async (userId: number) => {
		await deactivateAdminUser(userId);
		await refetch();
	}, [refetch]);

	const deleteUser = useCallback(async (userId: number) => {
		await deleteAdminUser(userId);
		await refetch();
	}, [refetch]);

	return {
		users,
		total,
		loading,
		error,
		filters,
		refetch,
		createWorker,
		deactivateUser,
		deleteUser,
	};
}
