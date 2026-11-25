"use client";

import { useEffect } from "react";
import { useChildStore } from "@/store/childStore";

export function useVaccination(autoFetch = true) {
	const reminders = useChildStore((state) => state.reminders);
	const loadingReminders = useChildStore((state) => state.loadingReminders);
	const error = useChildStore((state) => state.error);
	const fetchReminders = useChildStore((state) => state.fetchReminders);

	useEffect(() => {
		if (autoFetch) {
			void fetchReminders();
		}
	}, [autoFetch, fetchReminders]);

	return {
		reminders,
		loadingReminders,
		error,
		fetchReminders
	};
}
