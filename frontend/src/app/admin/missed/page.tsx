"use client";

import { useMemo } from "react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useCoverage } from "@/hooks/useCoverage";
import { formatDate, formatPhone } from "@/lib/utils";
import { parseApiError, triggerFollowupCall } from "@/lib/api";

export default function AdminMissedPage() {
	const { missedVaccines, loading } = useCoverage();

	const sorted = useMemo(() => [...missedVaccines].sort((a, b) => b.days_overdue - a.days_overdue), [missedVaccines]);

	const exportCsv = () => {
		const header = ["Child Name", "Age/DOB", "Vaccine", "Scheduled Date", "Days Overdue", "Parent Name", "Parent Phone"];
		const rows = sorted.map((row) => [
			row.child_name,
			row.date_of_birth,
			row.vaccine_name,
			row.scheduled_date ?? "",
			row.days_overdue,
			row.parent_name,
			row.parent_phone ?? "",
		]);
		const csv = [header, ...rows].map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "missed-vaccinations.csv";
		link.click();
		URL.revokeObjectURL(url);
	};

	const triggerFollowup = async (childId: number) => {
		try {
			await triggerFollowupCall(childId);
			toast.success("Follow-up call triggered");
		} catch (err) {
			toast.error(parseApiError(err));
		}
	};

	return (
		<section className="space-y-4">
			<Card className="border-amber-500/20 bg-amber-500/10">
				<p className="text-sm font-semibold text-amber-400">{sorted.length} children have missed vaccinations</p>
			</Card>
			<Card className="">
				<div className="mb-3 flex items-center justify-between">
					<h2 className="text-2xl font-bold text-white">Missed Vaccinations Report</h2>
					<Button variant="secondary" onClick={exportCsv}>Export to CSV</Button>
				</div>
				{loading ? <div className="h-40 skeleton-shimmer rounded-xl" /> : null}
				<div className="overflow-x-auto">
					<table className="min-w-full text-sm">
						<thead>
							<tr className="border-b border-white/10 text-left text-slate-400">
								<th className="py-2 pr-3">Child Name</th>
								<th className="py-2 pr-3">Age/DOB</th>
								<th className="py-2 pr-3">Vaccine</th>
								<th className="py-2 pr-3">Scheduled Date</th>
								<th className="py-2 pr-3">Days Overdue</th>
								<th className="py-2 pr-3">Parent Name</th>
								<th className="py-2 pr-3">Parent Phone</th>
								<th className="py-2 pr-3">Actions</th>
							</tr>
						</thead>
						<tbody>
							{sorted.map((row) => (
								<tr key={`${row.child_id}-${row.vaccine_id}`} className="border-b border-white/5">
									<td className="py-2 pr-3">{row.child_name}</td>
									<td className="py-2 pr-3">{formatDate(row.date_of_birth)}</td>
									<td className="py-2 pr-3">{row.vaccine_name}</td>
									<td className="py-2 pr-3">{formatDate(row.scheduled_date ?? undefined)}</td>
									<td className="py-2 pr-3 font-semibold text-amber-400">{row.days_overdue}</td>
									<td className="py-2 pr-3">{row.parent_name}</td>
									<td className="py-2 pr-3">{formatPhone(row.parent_phone)}</td>
									<td className="py-2 pr-3">
										<button className="text-xs font-semibold text-violet-400" onClick={() => void triggerFollowup(row.child_id)}>Trigger Follow-up Call</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</Card>
		</section>
	);
}
