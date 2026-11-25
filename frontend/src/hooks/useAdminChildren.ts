"use client";

import { useCallback, useEffect, useState } from "react";
import { deleteAdminChild, getAdminChildren, parseApiError } from "@/lib/api";
import type { AdminChild } from "@/types/admin.types";

interface ChildFilters {
	search?: string;
	page?: number;
	limit?: number;
}

export function useAdminChildren(initialFilters: ChildFilters = { page: 1, limit: 10 }) {
	const [children, setChildren] = useState<AdminChild[]>([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [filters, setFilters] = useState<ChildFilters>(initialFilters);

	const refetch = useCallback(async (next?: ChildFilters) => {
		const params = { ...filters, ...(next ?? {}) };
		setFilters(params);
		setLoading(true);
		setError(null);
		try {
			const data = await getAdminChildren(params);
			setChildren(data.records);
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

	const deleteChild = useCallback(async (childId: number) => {
		await deleteAdminChild(childId);
		await refetch();
	}, [refetch]);

	return {
		children,
		total,
		loading,
		error,
		filters,
		refetch,
		deleteChild,
	};
}
