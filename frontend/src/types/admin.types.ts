export interface AdminStats {
	total_parents: number;
	total_healthcare_workers: number;
	total_children: number;
	total_vaccines_scheduled: number;
	total_vaccines_completed: number;
	total_vaccines_missed: number;
	total_vaccines_pending: number;
	total_calls_made: number;
	total_calls_confirmed: number;
	total_calls_no_response: number;
	vaccination_coverage_percent: number;
	call_success_rate_percent: number;
}

export interface AdminUser {
	id: number;
	name: string;
	email: string;
	phone_number?: string | null;
	role: string;
	is_active: boolean;
	created_at?: string | null;
	child_count?: number;
	vaccination_count?: number;
}

export interface AdminChild {
	id: number;
	name: string;
	date_of_birth: string;
	gender?: string | null;
	blood_group?: string | null;
	parent_id: number;
	parent_name: string;
	parent_phone?: string | null;
	qr_code?: string | null;
	created_at?: string | null;
	total_vaccines: number;
	completed_vaccines: number;
	pending_vaccines: number;
	missed_vaccines: number;
	last_vaccination_date?: string | null;
}

export interface AdminChildDetails {
	id: number;
	name: string;
	date_of_birth: string;
	gender?: string | null;
	blood_group?: string | null;
	qr_code?: string | null;
	created_at?: string | null;
	parent: {
		id: number;
		name: string;
		phone_number?: string | null;
		email: string;
	};
	vaccines: Array<{
		id: number;
		vaccine_name: string;
		scheduled_date?: string | null;
		administered_date?: string | null;
		status: string;
		notes?: string | null;
		administered_by?: number | null;
	}>;
	call_history: Array<{
		id: number;
		status?: string | null;
		parent_phone?: string | null;
		transcript?: string | null;
		ai_response?: string | null;
		called_at?: string | null;
	}>;
}

export interface AdminCoverageRow {
	vaccine_name: string;
	total_scheduled: number;
	total_completed: number;
	total_missed: number;
	total_pending: number;
	coverage_percent: number;
}

export interface AdminMissedRow {
	child_id: number;
	child_name: string;
	date_of_birth: string;
	vaccine_id: number;
	vaccine_name: string;
	scheduled_date?: string | null;
	days_overdue: number;
	parent_id: number;
	parent_name: string;
	parent_phone?: string | null;
	parent_email?: string | null;
}

export interface AdminMonthlyTrend {
	month: string;
	completed: number;
	missed: number;
}

export interface AdminCallLog {
	id: number;
	child_id: number;
	child_name: string;
	parent_name: string;
	parent_phone?: string | null;
	status?: string | null;
	transcript?: string | null;
	ai_response?: string | null;
	called_at?: string | null;
}

export interface AdminCallAnalytics {
	calls_per_day: Array<{ date: string; calls: number }>;
	intent_distribution: {
		confirmed: number;
		reschedule: number;
		no_response: number;
		unclear: number;
	};
	most_common_missed_vaccine_reasons: Array<{ reason: string; count: number }>;
}

export interface PaginatedResult<T> {
	records: T[];
	total_count: number;
	page: number;
	limit: number;
}
