"use client";

import { create } from "zustand";
import {
	getChildren,
	getUpcomingVaccines,
	parseApiError,
	registerChild,
	uploadBirthCertificate
} from "@/lib/api";
import type { Child, ChildPayload } from "@/types/child.types";
import type { VaccineReminder } from "@/types/vaccine.types";

interface ChildState {
	children: Child[];
	selectedChild: Child | null;
	reminders: VaccineReminder[];
	loadingChildren: boolean;
	loadingReminders: boolean;
	error: string | null;
	setChildren: (children: Child[]) => void;
	setSelectedChild: (child: Child | null) => void;
	fetchChildren: () => Promise<void>;
	fetchReminders: () => Promise<void>;
	addChild: (payload: ChildPayload) => Promise<void>;
}

export const useChildStore = create<ChildState>((set, get) => ({
	children: [],
	selectedChild: null,
	reminders: [],
	loadingChildren: false,
	loadingReminders: false,
	error: null,
	setChildren: (children) => set({ children }),
	setSelectedChild: (selectedChild) => set({ selectedChild }),
	fetchChildren: async () => {
		set({ loadingChildren: true, error: null });
		try {
			const children = await getChildren();
			set({ children, loadingChildren: false });
		} catch (error) {
			set({ error: parseApiError(error), loadingChildren: false });
		}
	},
	fetchReminders: async () => {
		set({ loadingReminders: true, error: null });
		try {
			const reminders = await getUpcomingVaccines();
			set({ reminders, loadingReminders: false });
		} catch (error) {
			set({ error: parseApiError(error), loadingReminders: false });
		}
	},
	addChild: async (payload) => {
		set({ error: null });
		try {
			const child = await registerChild(payload);
			// Upload birth certificate if provided
			if (payload.birth_certificate_file && child.id) {
				try {
					await uploadBirthCertificate(child.id, payload.birth_certificate_file);
				} catch {
					// child was created, cert upload is best-effort
				}
			}
			await get().fetchChildren();
		} catch (error) {
			const message = parseApiError(error);
			set({ error: message });
			throw new Error(message);
		}
	}
}));
