"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, PhoneCall, Users2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card } from "@/components/ui/Card";
import { useChildren } from "@/hooks/useChildren";
import { useVaccines } from "@/hooks/useVaccines";
import { getParentCallHistory, parseApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import type { CallLogEntry } from "@/types/call.types";

function statusBadge(status?: string) {
	if (status === "completed" || status === "confirmed") return "bg-green-500/20 text-green-400";
	if (status === "missed" || status === "no_response") return "bg-red-500/20 text-red-400";
	return "bg-violet-500/20 text-violet-400";
}

export default function ParentDashboardPage() {
	const user = useAuthStore((state) => state.user);
	const { children, loadingChildren } = useChildren(true);
	const { upcoming, missed, loading } = useVaccines(true);
	const [calls, setCalls] = useState<CallLogEntry[]>([]);

	useEffect(() => {
		async function loadCalls() {
			try {
				setCalls(await getParentCallHistory());
			} catch (err) {
				toast.error(parseApiError(err));
			}
		}
		void loadCalls();
	}, []);

	const completedCount = useMemo(
		() => children.reduce((sum, item) => sum + (item.completed_vaccines ?? 0), 0),
		[children]
	);

	const upcoming7Days = useMemo(() => {
		const now = new Date();
		const end = new Date();
		end.setDate(end.getDate() + 7);
		return upcoming.filter((v) => {
			const d = new Date(v.scheduled_date);
			return d >= now && d <= end;
		}).length;
	}, [upcoming]);

	return (
		<>
			<div className="rounded-2xl bg-gradient-to-r from-violet-600/20 to-purple-500/20 border border-white/10 backdrop-blur-xl p-5 text-white">
				<h1 className="text-2xl font-bold">Welcome back, {user?.full_name ?? "Parent"}!</h1>
				<p className="text-sm text-slate-400">Stay updated on your children&apos;s vaccinations and call reminders.</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<StatsCard title="Total Children registered" value={children.length} icon={<Users2 className="h-5 w-5" />} color="green" />
				<StatsCard title="Upcoming Vaccinations (next 7 days)" value={upcoming7Days} icon={<CalendarDays className="h-5 w-5" />} color="teal" />
				<StatsCard title="Completed Vaccinations" value={completedCount} icon={<CheckCircle2 className="h-5 w-5" />} color="green" />
				<StatsCard title="Missed Vaccinations" value={missed.length} icon={<XCircle className="h-5 w-5" />} color="softGreen" />
			</div>

			<Card>
				<h2 className="mb-3 text-lg font-bold text-white">Upcoming Vaccinations</h2>
				{loadingChildren || loading ? <p className="text-sm text-slate-400">Loading...</p> : null}
				<div className="overflow-x-auto">
					<table className="min-w-full text-sm">
						<thead>
							<tr className="border-b border-white/10 text-left text-slate-400">
								<th className="py-2 pr-3">Child Name</th>
								<th className="py-2 pr-3">Vaccine</th>
								<th className="py-2 pr-3">Scheduled Date</th>
								<th className="py-2 pr-3">Status</th>
							</tr>
						</thead>
						<tbody>
							{upcoming.slice(0, 8).map((item) => (
								<tr key={item.id} className="border-b border-white/5 text-slate-300">
									<td className="py-2 pr-3">{item.child_name}</td>
									<td className="py-2 pr-3">{item.vaccine_name}</td>
									<td className="py-2 pr-3">{formatDate(item.scheduled_date)}</td>
									<td className="py-2 pr-3">
										<span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadge(item.status)}`}>{item.status}</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</Card>

			<Card>
				<div className="mb-3 flex items-center gap-2">
					<PhoneCall className="h-5 w-5 text-violet-400" />
					<h2 className="text-lg font-bold text-white">Recent AI Call Activity</h2>
				</div>
				<div className="space-y-2">
					{calls.slice(0, 3).map((row, idx) => (
						<div key={`${row.id ?? idx}`} className="rounded-xl border border-white/10 bg-white/5 p-3">
							<div className="flex items-center justify-between gap-2">
								<p className="font-semibold text-white">{row.parent_name}</p>
								<span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadge(row.status)}`}>{row.status ?? row.call_status}</span>
							</div>
							<p className="text-sm text-slate-400">{row.ai_response ?? "No AI response available"}</p>
							<p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500"><Clock3 className="h-3.5 w-3.5" />{formatDate(row.timestamp)}</p>
						</div>
					))}
					{calls.length === 0 ? <p className="text-sm text-slate-400">No call logs yet.</p> : null}
				</div>
			</Card>
		</>
	);
}
