export type UserRole = "parent" | "worker" | "healthcare_worker" | "admin";

export interface User {
	id: number;
	full_name: string;
	email: string;
	role: UserRole;
	phone_number?: string | null;
}

export interface LoginPayload {
	email: string;
	password: string;
}

export interface RegisterPayload {
	full_name: string;
	email: string;
	password: string;
	role?: UserRole;
	phone_number: string;
}

export interface AuthResponse {
	access_token: string;
	token_type: string;
	user: User;
}
