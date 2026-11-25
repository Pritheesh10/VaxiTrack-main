"use client";

import { create } from "zustand";
import type {
	AdminCallLog,
	AdminChild,
	AdminCoverageRow,
	AdminMissedRow,
	AdminStats,
	AdminUser,
} from "@/types/admin.types";

interface AdminStoreState {
	stats: AdminStats | null;
	users: AdminUser[];
	children: AdminChild[];
	callLogs: AdminCallLog[];
	coverageData: AdminCoverageRow[];
	missedVaccines: AdminMissedRow[];
	selectedUser: AdminUser | null;
	selectedChild: AdminChild | null;
	loading: boolean;
	setStats: (stats: AdminStats | null) => void;
	setUsers: (users: AdminUser[]) => void;
	setChildren: (children: AdminChild[]) => void;
	setCallLogs: (callLogs: AdminCallLog[]) => void;
	setCoverageData: (coverageData: AdminCoverageRow[]) => void;
	setMissedVaccines: (missedVaccines: AdminMissedRow[]) => void;
	setSelectedUser: (selectedUser: AdminUser | null) => void;
	setSelectedChild: (selectedChild: AdminChild | null) => void;
	setLoading: (loading: boolean) => void;
}

export const useAdminStore = create<AdminStoreState>((set) => ({
	stats: null,
	users: [],
	children: [],
	callLogs: [],
	coverageData: [],
	missedVaccines: [],
	selectedUser: null,
	selectedChild: null,
	loading: false,
	setStats: (stats) => set({ stats }),
	setUsers: (users) => set({ users }),
	setChildren: (children) => set({ children }),
	setCallLogs: (callLogs) => set({ callLogs }),
	setCoverageData: (coverageData) => set({ coverageData }),
	setMissedVaccines: (missedVaccines) => set({ missedVaccines }),
	setSelectedUser: (selectedUser) => set({ selectedUser }),
	setSelectedChild: (selectedChild) => set({ selectedChild }),
	setLoading: (loading) => set({ loading }),
}));
