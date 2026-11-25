"use client";

import { useEffect, useState } from "react";
import { getChildren, getChildVaccines, getParentMissedVaccines, getParentUpcomingVaccines, parseApiError } from "@/lib/api";
import type { ParentVaccineItem } from "@/types/vaccine.types";

export function useVaccines(autoFetch = true) {
	const [upcoming, setUpcoming] = useState<ParentVaccineItem[]>([]);
	const [missed, setMissed] = useState<ParentVaccineItem[]>([]);
	const [all, setAll] = useState<ParentVaccineItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const refetch = async () => {
		setLoading(true);
		setError(null);
		try {
			const [upcomingData, missedData, children] = await Promise.all([
				getParentUpcomingVaccines(),
				getParentMissedVaccines(),
				getChildren()
			]);

			const allVaccinesNested = await Promise.all(
				children.map(async (child) => {
					const rows = await getChildVaccines(child.id);
					return rows.map((row) => ({
						...row,
						child_name: child.name,
						scheduled_date: row.scheduled_date ?? "",
						status: row.status as ParentVaccineItem["status"],
					}));
				})
			);

			const allRows = allVaccinesNested.flat();
			setUpcoming(upcomingData as ParentVaccineItem[]);
			setMissed(missedData as ParentVaccineItem[]);
			setAll(allRows.sort((a, b) => (a.scheduled_date ?? "").localeCompare(b.scheduled_date ?? "")));
		} catch (err) {
			setError(parseApiError(err));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (autoFetch) {
			void refetch();
		}
	}, [autoFetch]);

	return { upcoming, missed, all, loading, error, refetch };
}
