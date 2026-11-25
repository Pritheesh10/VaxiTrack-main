"use client";

import { useEffect } from "react";
import { useChildStore } from "@/store/childStore";

export function useChildren(autoFetch = true) {
	const children = useChildStore((state) => state.children);
	const loadingChildren = useChildStore((state) => state.loadingChildren);
	const reminders = useChildStore((state) => state.reminders);
	const loadingReminders = useChildStore((state) => state.loadingReminders);
	const selectedChild = useChildStore((state) => state.selectedChild);
	const error = useChildStore((state) => state.error);
	const setChildren = useChildStore((state) => state.setChildren);
	const setSelectedChild = useChildStore((state) => state.setSelectedChild);
	const fetchChildren = useChildStore((state) => state.fetchChildren);
	const fetchReminders = useChildStore((state) => state.fetchReminders);
	const addChild = useChildStore((state) => state.addChild);

	useEffect(() => {
		if (autoFetch) {
			void fetchChildren();
		}
	}, [autoFetch, fetchChildren]);

	return {
		children,
		loadingChildren,
		reminders,
		loadingReminders,
		selectedChild,
		error,
		setChildren,
		setSelectedChild,
		fetchChildren,
		fetchReminders,
		addChild
	};
}
