"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminCallAnalytics, getAdminCallLogs, parseApiError } from "@/lib/api";
import type { AdminCallAnalytics, AdminCallLog } from "@/types/admin.types";

interface CallFilters {
	status?: string;
	date_from?: string;
	date_to?: string;
	search?: string;
	page?: number;
	limit?: number;
}

export function useCallAnalytics(initialFilters: CallFilters = { page: 1, limit: 10 }) {
	const [logs, setLogs] = useState<AdminCallLog[]>([]);
	const [total, setTotal] = useState(0);
	const [analytics, setAnalytics] = useState<AdminCallAnalytics | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [filters, setFilters] = useState<CallFilters>(initialFilters);

	const refetch = useCallback(async (next?: CallFilters) => {
		const params = { ...filters, ...(next ?? {}) };
		setFilters(params);
		setLoading(true);
		setError(null);
		try {
			const [logData, analyticsData] = await Promise.all([
				getAdminCallLogs(params),
				getAdminCallAnalytics(),
			]);
			setLogs(logData.records);
			setTotal(logData.total_count);
			setAnalytics(analyticsData);
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

	const exportCSV = useCallback(async () => {
		const all = await getAdminCallLogs({ ...filters, page: 1, limit: 10000 });
		const allRows = all.records;
		const header = ["Date & Time", "Child Name", "Parent Phone", "Status", "AI Response", "Transcript"];
		const rows = allRows.map((row) => [
			row.called_at ?? "",
			row.child_name,
			row.parent_phone ?? "",
			row.status ?? "",
			row.ai_response ?? "",
			row.transcript ?? "",
		]);
		const csv = [header, ...rows].map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "admin-call-logs.csv";
		link.click();
		URL.revokeObjectURL(url);
	}, [filters]);

	return { logs, total, analytics, loading, error, filters, refetch, exportCSV };
}
