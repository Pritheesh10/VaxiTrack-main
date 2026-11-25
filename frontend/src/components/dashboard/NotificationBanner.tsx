import { Bell } from "lucide-react";
import type { VaccineReminder } from "@/types/vaccine.types";

interface NotificationBannerProps {
	vaccines: VaccineReminder[];
}

export function NotificationBanner({ vaccines }: NotificationBannerProps) {
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	const tomorrowStr = tomorrow.toISOString().slice(0, 10);

	const dueTomorrow = vaccines.filter((v) => v.due_date?.slice(0, 10) === tomorrowStr);

	if (dueTomorrow.length === 0) {
		return null;
	}

	return (
		<div className="flex items-center gap-3 rounded-2xl border border-violet-500/20 bg-violet-500/10 backdrop-blur-xl px-4 py-3 text-white">
			<div className="rounded-lg bg-violet-500/20 p-1.5">
				<Bell className="h-4 w-4 text-violet-400" />
			</div>
			<p className="text-sm font-medium">
				{dueTomorrow.length} vaccination{dueTomorrow.length > 1 ? "s" : ""} due tomorrow
				{dueTomorrow.length <= 3 && (
					<span className="text-violet-400">
						{" — "}
						{dueTomorrow.map((v) => v.child_name).join(", ")}
					</span>
				)}
			</p>
		</div>
	);
}
