"use client";

import { CheckCircle, Clock, XCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import type { VaccineTimelineEntry } from "@/types/vaccine.types";

interface VaccinationTimelineProps {
	entries: VaccineTimelineEntry[];
	childName?: string;
}

const statusConfig = {
	completed: {
		icon: CheckCircle,
		color: "text-green-400",
		bg: "bg-green-500/20",
		line: "bg-green-500/40",
		label: "Completed"
	},
	pending: {
		icon: Clock,
		color: "text-blue-400",
		bg: "bg-blue-500/20",
		line: "bg-blue-500/30",
		label: "Pending"
	},
	missed: {
		icon: XCircle,
		color: "text-red-400",
		bg: "bg-red-500/20",
		line: "bg-red-500/30",
		label: "Missed"
	}
} as const;

export function VaccinationTimeline({ entries, childName }: VaccinationTimelineProps) {
	if (entries.length === 0) {
		return (
			<Card>
				<h3 className="text-lg font-bold text-white">Vaccine Timeline</h3>
				<p className="mt-2 text-sm text-slate-400">No vaccine records available.</p>
			</Card>
		);
	}

	return (
		<Card>
			<h3 className="mb-1 text-lg font-bold text-white">Vaccine Timeline</h3>
			{childName ? <p className="mb-4 text-sm text-slate-400">{childName}</p> : null}

			<div className="relative space-y-0">
				{entries.map((entry, idx) => {
					const config = statusConfig[entry.status];
					const Icon = config.icon;
					const isLast = idx === entries.length - 1;

					return (
						<div key={`${entry.vaccine_name}-${idx}`} className="relative flex gap-4 pb-6">
							{/* Vertical line */}
							{!isLast && (
								<div
									className={`absolute left-[15px] top-8 h-[calc(100%-16px)] w-0.5 ${config.line}`}
								/>
							)}

							{/* Icon */}
							<div className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.bg}`}>
								<Icon className={`h-4 w-4 ${config.color}`} />
							</div>

							{/* Content */}
							<div className="flex-1 pt-0.5">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<p className="font-semibold text-white">{entry.vaccine_name}</p>
									<span
										className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}
									>
										{config.label}
									</span>
								</div>
								<p className="text-sm text-slate-400">
									Scheduled: {formatDate(entry.scheduled_date)}
									{entry.completed_date ? ` • Completed: ${formatDate(entry.completed_date)}` : ""}
								</p>
							</div>
						</div>
					);
				})}
			</div>
		</Card>
	);
}
