export interface VaccineReminder {
	child_id: number;
	child_name: string;
	vaccine_name: string;
	due_date: string;
	status?: "upcoming" | "overdue" | "completed";
}

export interface VaccineTimelineEntry {
	vaccine_name: string;
	scheduled_date: string;
	status: "completed" | "pending" | "missed";
	completed_date?: string;
}

export interface ParentVaccineItem {
	id: number;
	child_id: number;
	child_name: string;
	vaccine_name: string;
	scheduled_date: string;
	administered_date?: string | null;
	status: "pending" | "completed" | "missed";
	notes?: string | null;
}

export interface AdminDashboardStats {
	total_children: number;
	completed_vaccines: number;
	pending_vaccines: number;
	reminder_calls: number;
}

export interface CoveragePoint {
	month: string;
	completed: number;
	pending: number;
}

export interface CampaignSuccessPoint {
	month: string;
	answered: number;
	missed: number;
	busy: number;
}
