"use client";

import { CalendarClock, Syringe } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { VaccineReminder } from "@/types/vaccine.types";

interface UpcomingVaccinesCardProps {
	vaccines: VaccineReminder[];
	onUpdate?: (childId: number, childName: string, vaccineName: string) => void;
}

export function UpcomingVaccinesCard({ vaccines, onUpdate }: UpcomingVaccinesCardProps) {
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	const tomorrowStr = tomorrow.toISOString().slice(0, 10);

	const dueTomorrow = vaccines.filter((v) => {
		const dueStr = v.due_date?.slice(0, 10);
		return dueStr === tomorrowStr;
	});

	return (
		<Card>
			<div className="mb-4 flex items-center gap-2">
				<CalendarClock className="h-5 w-5 text-violet-400" />
				<h3 className="text-lg font-bold text-white">Scheduled Tomorrow</h3>
				{dueTomorrow.length > 0 && (
					<span className="ml-auto rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-semibold text-violet-400">
						{dueTomorrow.length}
					</span>
				)}
			</div>

			{dueTomorrow.length === 0 ? (
				<p className="text-sm text-slate-400">No vaccines scheduled for tomorrow.</p>
			) : (
				<div className="space-y-2">
					{dueTomorrow.map((v, idx) => (
						<div
							key={`${v.child_id}-${v.vaccine_name}-${idx}`}
									className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition-all hover:bg-white/10"
						>
							<div className="flex items-center gap-3">
								<div className="rounded-lg bg-violet-500/20 p-2">
									<Syringe className="h-4 w-4 text-violet-400" />
								</div>
								<div>
											<p className="font-semibold text-white">{v.child_name}</p>
											<p className="text-sm text-slate-400">{v.vaccine_name}</p>
								</div>
							</div>
							{onUpdate && (
								<Button
									variant="secondary"
									className="text-xs"
									onClick={() => onUpdate(v.child_id, v.child_name, v.vaccine_name)}
								>
									Update
								</Button>
							)}
						</div>
					))}
				</div>
			)}
		</Card>
	);
}
