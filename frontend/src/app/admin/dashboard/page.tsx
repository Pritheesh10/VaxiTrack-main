"use client";

import Link from "next/link";
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell, Legend } from "recharts";
import { Card } from "@/components/ui/Card";
import { StatsGrid } from "@/components/admin/StatsGrid";
import { TrendChart } from "@/components/admin/TrendChart";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useCallAnalytics } from "@/hooks/useCallAnalytics";
import { useCoverage } from "@/hooks/useCoverage";
import { formatDate, formatPhone } from "@/lib/utils";

const COLORS = ["#6366F1", "#06B6D4", "#f59e0b", "#64748b"];

export default function AdminDashboardPage() {
	const { stats, loading: statsLoading } = useAdminStats();
	const { monthlyTrend, missedVaccines, loading: covLoading } = useCoverage();
	const { logs, analytics, loading: callsLoading } = useCallAnalytics({ page: 1, limit: 5 });

	const pieData = analytics
		? [
			{ name: "Confirmed", value: analytics.intent_distribution.confirmed },
			{ name: "Reschedule", value: analytics.intent_distribution.reschedule },
			{ name: "No Response", value: analytics.intent_distribution.no_response },
			{ name: "Unclear", value: analytics.intent_distribution.unclear },
		]
		: [];

	return (
		<section className="space-y-5">
			<StatsGrid stats={statsLoading ? null : stats} />

			<div className="grid gap-5 xl:grid-cols-2">
				<TrendChart data={covLoading ? [] : monthlyTrend} />
				<Card className="">
					<h3 className="mb-3 text-lg font-bold text-white">Call Intent Distribution</h3>
					{callsLoading || pieData.length === 0 ? (
						<p className="text-sm text-slate-400">No data available</p>
					) : (
						<div className="h-72 w-full">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label>
										{pieData.map((_, idx) => (
											<Cell key={idx} fill={COLORS[idx % COLORS.length]} />
										))}
									</Pie>
									<Tooltip contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#e2e8f0' }} />
									<Legend />
								</PieChart>
							</ResponsiveContainer>
						</div>
					)}
				</Card>
			</div>

			<div className="grid gap-5 xl:grid-cols-2">
				<Card className="">
					<div className="mb-3 flex items-center justify-between">
						<h3 className="text-lg font-bold text-white">Recent Missed Vaccinations</h3>
						<Link href="/admin/missed" className="text-sm font-semibold text-violet-400">View All</Link>
					</div>
					<div className="overflow-x-auto">
						<table className="min-w-full text-sm">
							<thead>
								<tr className="border-b border-white/10 text-left text-slate-400">
									<th className="py-2 pr-3">Child Name</th>
									<th className="py-2 pr-3">Vaccine</th>
									<th className="py-2 pr-3">Days Overdue</th>
									<th className="py-2 pr-3">Parent Phone</th>
								</tr>
							</thead>
							<tbody>
								{missedVaccines.slice(0, 5).map((row) => (
									<tr key={`${row.child_id}-${row.vaccine_id}`} className="border-b border-white/5">
										<td className="py-2 pr-3">{row.child_name}</td>
										<td className="py-2 pr-3">{row.vaccine_name}</td>
										<td className="py-2 pr-3">{row.days_overdue}</td>
										<td className="py-2 pr-3">{formatPhone(row.parent_phone)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</Card>

				<Card className="">
					<div className="mb-3 flex items-center justify-between">
						<h3 className="text-lg font-bold text-white">Recent AI Calls</h3>
						<Link href="/admin/calls" className="text-sm font-semibold text-violet-400">View All</Link>
					</div>
					<div className="overflow-x-auto">
						<table className="min-w-full text-sm">
							<thead>
								<tr className="border-b border-white/10 text-left text-slate-400">
									<th className="py-2 pr-3">Child Name</th>
									<th className="py-2 pr-3">Called At</th>
									<th className="py-2 pr-3">Status</th>
									<th className="py-2 pr-3">Intent</th>
								</tr>
							</thead>
							<tbody>
								{logs.slice(0, 5).map((row) => (
									<tr key={row.id} className="border-b border-white/5">
										<td className="py-2 pr-3">{row.child_name}</td>
										<td className="py-2 pr-3">{formatDate(row.called_at ?? undefined)}</td>
										<td className="py-2 pr-3">{row.status ?? "-"}</td>
										<td className="py-2 pr-3">{row.ai_response ? "classified" : "-"}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</Card>
			</div>
		</section>
	);
}
