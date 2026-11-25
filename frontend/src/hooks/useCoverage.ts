"use client";

import { useCallback, useEffect, useState } from "react";
import {
	getAdminCoverage,
	getAdminMonthlyTrend,
	getAdminMissedReport,
	parseApiError,
} from "@/lib/api";
import type { AdminCoverageRow, AdminMissedRow, AdminMonthlyTrend } from "@/types/admin.types";

export function useCoverage() {
	const [coverageData, setCoverageData] = useState<AdminCoverageRow[]>([]);
	const [monthlyTrend, setMonthlyTrend] = useState<AdminMonthlyTrend[]>([]);
	const [missedVaccines, setMissedVaccines] = useState<AdminMissedRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refetch = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [coverage, trend, missed] = await Promise.all([
				getAdminCoverage(),
				getAdminMonthlyTrend(),
				getAdminMissedReport(),
			]);
			setCoverageData(coverage);
			setMonthlyTrend(trend);
			setMissedVaccines(missed);
		} catch (err) {
			setError(parseApiError(err));
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void refetch();
	}, [refetch]);

	return { coverageData, monthlyTrend, missedVaccines, loading, error, refetch };
}
