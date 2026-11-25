"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { useVaccines } from "@/hooks/useVaccines";
import { formatDate } from "@/lib/utils";

type Filter = "all" | "upcoming" | "completed" | "missed";

function lineColor(status: string) {
	if (status === "completed") return "border-green-500";
	if (status === "missed") return "border-red-500";
	return "border-violet-500";
}

function badgeColor(status: string) {
	if (status === "completed") return "bg-green-500/20 text-green-400";
	if (status === "missed") return "bg-red-500/20 text-red-400";
	return "bg-violet-500/20 text-violet-400";
}

export default function ParentSchedulePage() {
	const { all, upcoming, missed, loading } = useVaccines(true);
	const [filter, setFilter] = useState<Filter>("all");
	const [selectedChildId, setSelectedChildId] = useState<number | "all">("all");

	const completed = useMemo(() => all.filter((item) => item.status === "completed"), [all]);

	const childOptions = useMemo(() => {
		const byId = new Map<number, string>();
		for (const item of all) {
			if (!byId.has(item.child_id)) {
				byId.set(item.child_id, item.child_name);
			}
		}
		return Array.from(byId.entries())
			.map(([id, name]) => ({ id, name }))
			.sort((a, b) => a.name.localeCompare(b.name));
	}, [all]);

	const rowsByTab = useMemo(() => {
		switch (filter) {
			case "upcoming":
				return upcoming;
			case "completed":
				return completed;
			case "missed":
				return missed;
			default:
				return all;
		}
	}, [all, completed, filter, missed, upcoming]);

	const rows = useMemo(() => {
		if (selectedChildId === "all") {
			return rowsByTab;
		}

		return rowsByTab.filter((item) => item.child_id === selectedChildId);
	}, [rowsByTab, selectedChildId]);

	return (
		<>
			<div>
				<h1 className="text-3xl font-bold text-white">Vaccination Schedule</h1>
			</div>

			<div className="flex flex-wrap items-center gap-2">
				{(["all", "upcoming", "completed", "missed"] as Filter[]).map((tab) => (
					<button
						key={tab}
						type="button"
						onClick={() => setFilter(tab)}
						className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${filter === tab ? "bg-gradient-to-r from-violet-600 to-purple-500 text-white" : "border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"}`}
					>
						{tab[0].toUpperCase() + tab.slice(1)}
					</button>
				))}

				<label className="ml-auto flex items-center gap-2 text-sm text-slate-400" htmlFor="child-filter">
					<span>Child</span>
					<select
						id="child-filter"
						value={selectedChildId}
						onChange={(event) => {
							const value = event.target.value;
							setSelectedChildId(value === "all" ? "all" : Number(value));
						}}
						className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-slate-300 backdrop-blur-xl"
					>
						<option value="all">All children</option>
						{childOptions.map((child) => (
							<option key={child.id} value={child.id}>
								{child.name}
							</option>
						))}
					</select>
				</label>
			</div>

			<Card>
				{loading ? <p className="text-sm text-slate-400">Loading schedule...</p> : null}
				<div className="space-y-2">
					{rows.map((item) => (
						<div key={item.id} className={`rounded-xl border-l-4 border border-white/10 bg-white/5 p-3 ${lineColor(item.status)}`}>
							<div className="flex flex-wrap items-center justify-between gap-2">
								<p className="font-bold text-white">{item.vaccine_name}</p>
								<span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeColor(item.status)}`}>{item.status}</span>
							</div>
							<p className="text-sm text-slate-400">Child: {item.child_name}</p>
							<p className="text-sm text-slate-500">Scheduled: {formatDate(item.scheduled_date)}</p>
							{item.status === "completed" && item.administered_date ? (
								<p className="text-xs text-violet-400">Administered on {formatDate(item.administered_date)}</p>
							) : null}
						</div>
					))}
					{!loading && rows.length === 0 ? <p className="text-sm text-slate-400">No vaccines found for this filter.</p> : null}
				</div>
			</Card>
		</>
	);
}
