import axios, { AxiosError } from "axios";
import { getToken } from "@/lib/auth";
import type { AuthResponse, LoginPayload, RegisterPayload } from "@/types/auth.types";
import type { Child, ChildPayload } from "@/types/child.types";
import type {
	CallCampaignHistoryItem,
	CallCampaignStatusResponse,
	CallLogEntry
} from "@/types/call.types";
import type { AdminDashboardStats, CampaignSuccessPoint, CoveragePoint, VaccineReminder, VaccineTimelineEntry } from "@/types/vaccine.types";
import type {
	AdminCallAnalytics,
	AdminCallLog,
	AdminChild,
	AdminChildDetails,
	AdminCoverageRow,
	AdminMissedRow,
	AdminMonthlyTrend,
	AdminStats,
	AdminUser,
	PaginatedResult,
} from "@/types/admin.types";

type ReminderRecord = {
	child_id?: number;
	child_name?: string;
	vaccine_name?: string;
	due_date?: string;
	scheduled_date?: string;
	status?: "upcoming" | "overdue" | "completed";
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const api = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		"Content-Type": "application/json"
	}
});

type FastApiValidationIssue = {
	loc?: Array<string | number>;
	msg?: string;
	type?: string;
};

function normalizeApiErrorDetail(detail: unknown): string {
	if (typeof detail === "string" && detail.trim()) {
		return detail;
	}

	if (Array.isArray(detail)) {
		const messages = detail
			.map((issue) => {
				if (typeof issue === "string") {
					return issue;
				}

				if (issue && typeof issue === "object") {
					const validationIssue = issue as FastApiValidationIssue;
					const path = Array.isArray(validationIssue.loc)
						? validationIssue.loc.join(".")
						: "field";
					const message = validationIssue.msg ?? "Invalid value";
					return `${path}: ${message}`;
				}

				return "";
			})
			.filter(Boolean);

		if (messages.length > 0) {
			return messages.join("; ");
		}
	}

	if (detail && typeof detail === "object") {
		if ("message" in detail && typeof (detail as { message?: unknown }).message === "string") {
			return (detail as { message: string }).message;
		}
		return "Request failed due to invalid input";
	}

	return "Request failed";
}

api.interceptors.request.use((config) => {
	const token = getToken();
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

// Auto-logout on 401 responses (expired/invalid token)
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (axios.isAxiosError(error) && error.response?.status === 401) {
			// Capture the token that was used in the failed request
			const failedAuth = error.config?.headers?.Authorization;
			import("@/store/authStore").then(({ useAuthStore }) => {
				const currentToken = useAuthStore.getState().token;
				// Only logout if the current token is the same one that failed.
				// This prevents clearing a freshly-set token from a new login.
				if (currentToken && failedAuth === `Bearer ${currentToken}`) {
					useAuthStore.getState().logout();
					if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
						window.location.href = "/login";
					}
				}
			});
		}
		return Promise.reject(error);
	}
);

export function parseApiError(error: unknown) {
	if (axios.isAxiosError(error)) {
		const axiosError = error as AxiosError<{ detail?: unknown; message?: string }>;
		const detail = axiosError.response?.data?.detail;
		if (detail !== undefined) {
			return normalizeApiErrorDetail(detail);
		}
		if (typeof axiosError.response?.data?.message === "string") {
			return axiosError.response.data.message;
		}
		return axiosError.message || "Request failed";
	}
	return "Unexpected error occurred";
}

export async function login(payload: LoginPayload) {
	const { data } = await api.post<AuthResponse>("/api/auth/login", payload);
	return data;
}

export async function register(payload: RegisterPayload) {
	const { data } = await api.post<AuthResponse>("/api/auth/register", payload);
	return data;
}

export async function getChildren() {
	const { data } = await api.get<Child[] | { records?: Child[] }>("/api/children/");
	const records = Array.isArray(data) ? data : data?.records ?? [];

	return records.map((child) => ({
		...child,
		dob: child.dob ?? (child as Child & { date_of_birth?: string }).date_of_birth ?? ""
	}));
}

export async function registerChild(payload: ChildPayload) {
	const backendPayload = {
		name: payload.name,
		dob: payload.dob,
		date_of_birth: payload.dob,
		gender: payload.gender,
		blood_group: payload.blood_group
	};

	const { data } = await api.post<Child>("/api/children/", backendPayload);
	return {
		...data,
		dob: data.dob ?? (data as Child & { date_of_birth?: string }).date_of_birth ?? payload.dob
	};
}

export async function uploadBirthCertificate(childId: number | string, file: File) {
	const form = new FormData();
	form.append("file", file);
	const { data } = await api.post<{ message: string; birth_certificate: string }>(
		`/api/children/${childId}/birth-certificate`,
		form,
		{ headers: { "Content-Type": "multipart/form-data" } },
	);
	return data;
}

export async function getParentChildById(childId: number) {
	const { data } = await api.get<Child>(`/api/children/${childId}`);
	return {
		...data,
		dob: data.dob ?? (data as Child & { date_of_birth?: string }).date_of_birth ?? ""
	};
}

export async function deleteParentChild(childId: number) {
	const { data } = await api.delete<{ message: string }>(`/api/children/${childId}`);
	return data;
}

export async function getParentChildQr(childId: number) {
	const { data } = await api.get<{ child_id: number; qr_code: string }>(`/api/children/${childId}/qr`);
	return data;
}

export async function getParentUpcomingVaccines() {
	const { data } = await api.get<Array<{
		id: number;
		child_id: number;
		child_name: string;
		vaccine_name: string;
		scheduled_date: string;
		status: string;
		administered_date?: string | null;
		notes?: string | null;
	}>>("/api/vaccines/upcoming");
	return data;
}

export async function getParentMissedVaccines() {
	const { data } = await api.get<Array<{
		id: number;
		child_id: number;
		child_name: string;
		vaccine_name: string;
		scheduled_date: string;
		status: string;
		administered_date?: string | null;
		notes?: string | null;
	}>>("/api/vaccines/missed");
	return data;
}

export async function getChildVaccines(childId: number) {
	const { data } = await api.get<Array<{
		id: number;
		child_id: number;
		vaccine_name: string;
		scheduled_date: string;
		administered_date?: string | null;
		status: string;
		notes?: string | null;
	}>>(`/api/vaccines/child/${childId}`);
	return data;
}

export async function getParentCallHistory() {
	const { data } = await api.get<CallLogEntry[] | { records?: CallLogEntry[] }>("/api/calls/logs");
	return Array.isArray(data) ? data : data?.records ?? [];
}

export async function getUpcomingVaccines() {
	const { data } = await api.get<
		VaccineReminder[] | { records?: ReminderRecord[]; vaccines_due?: number }
	>("/api/vaccines/reminders");

	const records = Array.isArray(data) ? data : data?.records ?? [];

	return records.map((item) => ({
		child_id: item.child_id ?? 0,
		child_name: item.child_name ?? `Child #${item.child_id ?? "-"}`,
		vaccine_name: item.vaccine_name ?? "Upcoming vaccine",
		due_date: item.due_date ?? ("scheduled_date" in item ? item.scheduled_date : undefined) ?? new Date().toISOString(),
		status: item.status ?? "upcoming"
	}));
}

export async function getAdminDashboardStats() {
	const { data } = await api.get<AdminDashboardStats & { total_reminder_calls?: number }>(
		"/api/analytics/dashboard"
	);

	return {
		total_children: data.total_children ?? 0,
		completed_vaccines: data.completed_vaccines ?? 0,
		pending_vaccines: data.pending_vaccines ?? 0,
		reminder_calls: data.reminder_calls ?? data.total_reminder_calls ?? 0
	};
}

export async function getCoverageData() {
	const { data } = await api.get<CoveragePoint[] | { records?: CoveragePoint[] }>("/api/analytics/coverage");
	return Array.isArray(data) ? data : data?.records ?? [];
}

export async function getMissedVaccinations() {
	const { data } = await api.get<VaccineReminder[] | { records?: ReminderRecord[] }>("/api/vaccines/missed");
	const records = Array.isArray(data) ? data : data?.records ?? [];

	return records.map((item) => ({
		child_id: item.child_id ?? 0,
		child_name: item.child_name ?? `Child #${item.child_id ?? "-"}`,
		vaccine_name: item.vaccine_name ?? "Missed vaccine",
		due_date: item.due_date ?? ("scheduled_date" in item ? item.scheduled_date : undefined) ?? new Date().toISOString(),
		status: item.status ?? "overdue"
	}));
}

export async function fetchChildByQr(qrCode: string) {
	const { data } = await api.get<Child>(`/api/children/qr/${encodeURIComponent(qrCode)}`);
	return data;
}

export async function getAllChildren() {
	const { data } = await api.get<Array<{
		id: string;
		name: string;
		date_of_birth: string;
		gender?: string;
		blood_group?: string;
		parent_name?: string;
		parent_phone?: string;
		completed_vaccines: number;
		total_vaccines: number;
	}>>("/api/children/all");
	return data;
}

export async function getChildById(childId: string) {
	const { data } = await api.get<Child>(`/api/children/${childId}`);
	return data;
}

export async function updateVaccineById(
	vaccineId: string,
	payload: { status: string; administered_date?: string; scheduled_date?: string; notes?: string }
) {
	const { data } = await api.patch(`/api/vaccines/${vaccineId}/status`, payload);
	return data;
}

export async function markVaccineCompleted(childId: number, vaccineName: string) {
	const { data } = await api.post(`/api/vaccines/complete`, {
		child_id: childId,
		vaccine_name: vaccineName
	});
	return data;
}

export async function exportReports() {
	const { data } = await api.get("/api/analytics/reports", {
		responseType: "blob"
	});
	return data;
}

export async function startCallCampaign(actorRole: "worker" | "admin" | "parent" = "worker") {
	const { data } = await api.post("/api/calls/campaign/start", {
		actor_role: actorRole
	});
	return data;
}

export async function getCallCampaignStatus() {
	const { data } = await api.get<CallCampaignStatusResponse>("/api/calls/campaign/status");
	return data;
}

export async function getCallCampaignHistory() {
	const { data } = await api.get<{ history: CallCampaignHistoryItem[] }>("/api/calls/campaign/history");
	return data.history ?? [];
}

export async function analyzeConversation(transcript: string) {
	const { data } = await api.post<{ intent: string; reply: string }>("/api/calls/conversation/analyze", {
		transcript
	});
	return data;
}

export async function getChildVaccineTimeline(childId: number) {
	const { data } = await api.get<VaccineTimelineEntry[] | { records?: VaccineTimelineEntry[] }>(
		`/api/vaccines/timeline/${childId}`
	);
	return Array.isArray(data) ? data : data?.records ?? [];
}

export async function updateVaccineStatus(
	childId: number,
	vaccineName: string,
	status: "completed" | "missed" | "rescheduled",
	newDate?: string
) {
	const { data } = await api.post("/api/vaccines/update-status", {
		child_id: childId,
		vaccine_name: vaccineName,
		status,
		...(newDate ? { new_date: newDate } : {})
	});
	return data;
}

export async function getCallLogs() {
	const { data } = await api.get<CallLogEntry[] | { records?: CallLogEntry[] }>("/api/calls/logs");
	const records = Array.isArray(data) ? data : data?.records ?? [];
	return records;
}

export async function getCampaignSuccessData() {
	const { data } = await api.get<CampaignSuccessPoint[] | { records?: CampaignSuccessPoint[] }>(
		"/api/analytics/campaign-success"
	);
	return Array.isArray(data) ? data : data?.records ?? [];
}

export async function getAdminStats() {
	const { data } = await api.get<AdminStats>("/api/admin/stats");
	return data;
}

export async function getAdminUsers(params?: { role?: string; search?: string; page?: number; limit?: number }) {
	const { data } = await api.get<PaginatedResult<AdminUser>>("/api/admin/users", { params });
	return data;
}

export async function getAdminUser(userId: number) {
	const { data } = await api.get<AdminUser>(`/api/admin/users/${userId}`);
	return data;
}

export async function createHealthcareWorker(payload: {
	name: string;
	email: string;
	phone_number: string;
	password: string;
}) {
	const { data } = await api.post<AdminUser>("/api/admin/users/create-worker", payload);
	return data;
}

export async function deactivateAdminUser(userId: number) {
	const { data } = await api.patch<{ id: number; is_active: boolean }>(`/api/admin/users/${userId}/deactivate`);
	return data;
}

export async function deleteAdminUser(userId: number) {
	const { data } = await api.delete<{ message: string }>(`/api/admin/users/${userId}`);
	return data;
}

export async function getAdminChildren(params?: { search?: string; page?: number; limit?: number }) {
	const { data } = await api.get<PaginatedResult<AdminChild>>("/api/admin/children", { params });
	return data;
}

export async function getAdminChild(childId: number) {
	const { data } = await api.get<AdminChildDetails>(`/api/admin/children/${childId}`);
	return data;
}

export async function deleteAdminChild(childId: number) {
	const { data } = await api.delete<{ message: string }>(`/api/admin/children/${childId}`);
	return data;
}

export async function getAdminCoverage() {
	const { data } = await api.get<AdminCoverageRow[]>("/api/admin/vaccines/coverage");
	return data;
}

export async function getAdminMissedReport() {
	const { data } = await api.get<AdminMissedRow[]>("/api/admin/vaccines/missed-report");
	return data;
}

export async function getAdminMonthlyTrend() {
	const { data } = await api.get<AdminMonthlyTrend[]>("/api/admin/vaccines/monthly-trend");
	return data;
}

export async function getAdminCallLogs(params?: {
	status?: string;
	date_from?: string;
	date_to?: string;
	search?: string;
	page?: number;
	limit?: number;
}) {
	const { data } = await api.get<PaginatedResult<AdminCallLog>>("/api/admin/calls/logs", { params });
	return data;
}

export async function getAdminCallAnalytics() {
	const { data } = await api.get<AdminCallAnalytics>("/api/admin/calls/analytics");
	return data;
}

export async function exportAdminFullReport() {
	const { data } = await api.get("/api/admin/reports/export");
	return data;
}

export async function triggerFollowupCall(childId: number) {
	const { data } = await api.post(`/api/calls/trigger-followup/${childId}`);
	return data;
}
