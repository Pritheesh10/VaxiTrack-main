import { clsx, type ClassValue } from "clsx";
import { format, isValid, parseISO } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatDate(value?: string) {
	if (!value) {
		return "-";
	}
	const parsed = parseISO(value);
	if (!isValid(parsed)) {
		return value;
	}
	return format(parsed, "dd MMM yyyy");
}

export function toPercent(value = 0, total = 100) {
	if (!total) {
		return 0;
	}
	return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

export function round2(value: number) {
	return Math.round(value * 100) / 100;
}

export function formatPhone(phone?: string | null) {
	if (!phone) return "-";
	const digits = phone.replace(/\D/g, "");
	if (digits.length === 10) return `+91${digits}`;
	if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
	if (phone.startsWith("+")) return phone;
	return `+${digits}`;
}
