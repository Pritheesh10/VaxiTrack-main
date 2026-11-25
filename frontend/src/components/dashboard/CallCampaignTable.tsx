"use client";

import { Phone, PhoneMissed, PhoneOff } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import type { CallLogEntry } from "@/types/call.types";

interface CallCampaignTableProps {
	logs: CallLogEntry[];
}

const statusConfig = {
	answered: { icon: Phone, color: "text-green-400", bg: "bg-green-500/20", label: "Answered" },
	missed: { icon: PhoneMissed, color: "text-red-400", bg: "bg-red-500/20", label: "Missed" },
	busy: { icon: PhoneOff, color: "text-amber-400", bg: "bg-amber-500/20", label: "Busy" }
} as const;

export function CallCampaignTable({ logs }: CallCampaignTableProps) {
	return (
		<Card>
			<h3 className="mb-4 text-lg font-bold text-white">Call Campaign Monitoring</h3>

			{logs.length === 0 ? (
				<p className="text-sm text-slate-400">No call logs available.</p>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full text-left text-sm">
						<thead>
							<tr className="border-b border-white/10 text-slate-400">
								<th className="pb-3 pr-4 font-medium">Parent Name</th>
								<th className="pb-3 pr-4 font-medium">Vaccine</th>
								<th className="pb-3 pr-4 font-medium">Status</th>
								<th className="pb-3 font-medium">Timestamp</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-white/5">
							{logs.map((log, idx) => {
								const config = statusConfig[log.call_status] ?? statusConfig.missed;
								const Icon = config.icon;

								return (
								<tr key={log.id ?? idx} className="text-slate-300 transition-colors hover:bg-white/5">
									<td className="py-3 pr-4 font-medium text-white">{log.parent_name}</td>
										<td className="py-3 pr-4">{log.vaccine_name}</td>
										<td className="py-3 pr-4">
											<span
												className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config.bg} ${config.color}`}
											>
												<Icon className="h-3 w-3" />
												{config.label}
											</span>
										</td>
										<td className="py-3 text-slate-500">{formatDate(log.timestamp)}</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</Card>
	);
}
