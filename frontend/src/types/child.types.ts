export interface Child {
	id: number;
	name: string;
	dob: string;
	date_of_birth?: string;
	gender?: string;
	blood_group?: string;
	created_at?: string;
	parent_id?: number;
	parent_name?: string;
	parent_phone?: string;
	qr_code?: string;
	qr_code_url?: string;
	birth_certificate?: string;
	vaccine_progress?: number;
	completed_vaccines?: number;
	total_vaccines?: number;
	next_vaccine?: string;
	next_vaccine_date?: string;
	vaccines?: {
		id?: string;
		vaccine_name: string;
		scheduled_date: string;
		administered_date?: string | null;
		status: string;
		notes?: string | null;
	}[];
}

export interface ChildPayload {
	name: string;
	dob: string;
	gender: string;
	blood_group: string;
	birth_certificate_file?: File;
}
