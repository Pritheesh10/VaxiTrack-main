import { AlertTriangle } from "lucide-react";

interface AlertBannerProps {
	title: string;
	message: string;
}

export function AlertBanner({ title, message }: AlertBannerProps) {
	return (
		<div className="fade-up flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
			<AlertTriangle className="mt-0.5 h-5 w-5" />
			<div>
				<h4 className="font-semibold">{title}</h4>
				<p className="text-sm text-amber-800">{message}</p>
			</div>
		</div>
	);
}
