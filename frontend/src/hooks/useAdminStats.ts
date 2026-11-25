"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminStats, parseApiError } from "@/lib/api";
import type { AdminStats } from "@/types/admin.types";

export function useAdminStats() {
	const [stats, setStats] = useState<AdminStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refetch = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			setStats(await getAdminStats());
		} catch (err) {
			setError(parseApiError(err));
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void refetch();
	}, [refetch]);

	return { stats, loading, error, refetch };
}
