"use client";

import { useMemo, useState } from "react";
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { TranscriptModal } from "@/components/admin/TranscriptModal";
import { useCallAnalytics } from "@/hooks/useCallAnalytics";
import { formatDate, formatPhone } from "@/lib/utils";
import { parseApiError } from "@/lib/api";
import type { AdminCallLog } from "@/types/admin.types";

const COLORS = ["#6366F1", "#06B6D4", "#f59e0b", "#64748b"];

export default function AdminCallsPage() {
	const [status, setStatus] = useState("");
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [selectedLog, setSelectedLog] = useState<AdminCallLog | null>(null);

	const { logs, total, analytics, loading, error, refetch, exportCSV } = useCallAnalytics({ page: 1, limit: 10 });

	if (error) toast.error(error);

	const stats = useMemo(() => {
		const dist = analytics?.intent_distribution;
		return {
			totalCalls: dist ? dist.confirmed + dist.no_response + dist.reschedule + dist.unclear : 0,
			confirmed: dist?.confirmed ?? 0,
			reschedule: dist?.reschedule ?? 0,
			noResponse: dist?.no_response ?? 0,
		};
	}, [analytics]);

	const applyFilters = async (nextPage = 1) => {
		setPage(nextPage);
		try {
			await refetch({ status: status || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined, search: search || undefined, page: nextPage, limit: 10 });
		} catch (err) {
			toast.error(parseApiError(err));
		}
	};

	const pieData = analytics ? [
		{ name: "Confirmed", value: analytics.intent_distribution.confirmed },
		{ name: "Reschedule", value: analytics.intent_distribution.reschedule },
		{ name: "No Response", value: analytics.intent_distribution.no_response },
		{ name: "Unclear", value: analytics.intent_distribution.unclear },
	] : [];

	return (
		<section className="space-y-4">
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{[
					["Total Calls", stats.totalCalls],
					["Confirmed", stats.confirmed],
					["Reschedule Requested", stats.reschedule],
					["No Response", stats.noResponse],
				].map(([label, value]) => (
					<Card key={label as string} className="">
						<p className="text-sm text-slate-400">{label}</p>
						<p className="text-2xl font-bold text-white">{value as number}</p>
					</Card>
				))}
			</div>

			<div className="grid gap-5 xl:grid-cols-2">
				<Card className="">
					<h3 className="mb-3 text-lg font-bold text-white">Calls per day (Last 30 days)</h3>
					{analytics?.calls_per_day?.length ? (
						<div className="h-72 w-full">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart data={analytics.calls_per_day}>
									<CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
									<XAxis dataKey="date" stroke="#94a3b8" />
									<YAxis stroke="#94a3b8" />
									<Tooltip contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#e2e8f0' }} />
									<Line type="monotone" dataKey="calls" stroke="#7C3AED" strokeWidth={2} />
								</LineChart>
							</ResponsiveContainer>
						</div>
					) : <p className="text-sm text-slate-400">No data available</p>}
				</Card>
				<Card className="">
					<h3 className="mb-3 text-lg font-bold text-white">Intent distribution</h3>
					{pieData.length ? (
						<div className="h-72 w-full">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label>
										{pieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
									</Pie>
									<Tooltip contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#e2e8f0' }} />
								</PieChart>
							</ResponsiveContainer>
						</div>
					) : <p className="text-sm text-slate-400">No data available</p>}
				</Card>
			</div>

			<Card className="">
				<div className="mb-3 flex flex-wrap items-center gap-2">
					<select className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 backdrop-blur-xl" value={status} onChange={(e) => setStatus(e.target.value)}>
						<option value="">All status</option>
						<option value="confirmed">Confirmed</option>
						<option value="reschedule_requested">Reschedule</option>
						<option value="no_response">No Response</option>
					</select>
					<Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
					<Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
					<Input placeholder="Search child/phone" value={search} onChange={(e) => setSearch(e.target.value)} />
					<Button onClick={() => void applyFilters(1)}>Apply</Button>
					<Button variant="secondary" onClick={() => void exportCSV()}>Export CSV</Button>
				</div>
				{loading ? <div className="h-40 skeleton-shimmer rounded-xl" /> : null}
				<div className="overflow-x-auto">
					<table className="min-w-full text-sm">
						<thead>
							<tr className="border-b border-white/10 text-left text-slate-400">
								<th className="py-2 pr-3">Date & Time</th>
								<th className="py-2 pr-3">Child Name</th>
								<th className="py-2 pr-3">Parent Phone</th>
								<th className="py-2 pr-3">Status</th>
								<th className="py-2 pr-3">AI Response</th>
								<th className="py-2 pr-3">Actions</th>
							</tr>
						</thead>
						<tbody>
							{logs.map((row) => (
								<tr key={row.id} className="border-b border-white/5">
									<td className="py-2 pr-3">{formatDate(row.called_at ?? undefined)}</td>
									<td className="py-2 pr-3">{row.child_name}</td>
									<td className="py-2 pr-3">{formatPhone(row.parent_phone)}</td>
									<td className="py-2 pr-3">{row.status ?? "-"}</td>
									<td className="py-2 pr-3">{row.ai_response?.slice(0, 80) ?? "-"}</td>
									<td className="py-2 pr-3"><button className="text-xs font-semibold text-violet-400" onClick={() => setSelectedLog(row)}>View Transcript</button></td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div className="mt-3 flex items-center justify-between text-sm">
					<p>Total: {total}</p>
					<div className="flex items-center gap-2">
						<Button variant="ghost" disabled={page <= 1} onClick={() => void applyFilters(page - 1)}>Prev</Button>
						<span>{page}</span>
						<Button variant="ghost" disabled={page * 10 >= total} onClick={() => void applyFilters(page + 1)}>Next</Button>
					</div>
				</div>
			</Card>

			<TranscriptModal open={Boolean(selectedLog)} onClose={() => setSelectedLog(null)} callLog={selectedLog} />
		</section>
	);
}
