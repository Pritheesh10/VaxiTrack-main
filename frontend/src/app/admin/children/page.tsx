"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ChildDetailPanel } from "@/components/admin/ChildDetailPanel";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { useAdminChildren } from "@/hooks/useAdminChildren";
import { formatDate, formatPhone } from "@/lib/utils";
import { parseApiError } from "@/lib/api";

export default function AdminChildrenPage() {
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
	const [deleteChildId, setDeleteChildId] = useState<number | null>(null);
	const { children, total, loading, refetch, deleteChild } = useAdminChildren({ page: 1, limit: 10 });

	const applyFilters = async (nextPage = 1) => {
		setPage(nextPage);
		await refetch({ search, page: nextPage, limit: 10 });
	};

	const handleDelete = async () => {
		if (!deleteChildId) return;
		try {
			await deleteChild(deleteChildId);
			toast.success("Child record deleted");
			setDeleteChildId(null);
			await applyFilters(page);
		} catch (err) {
			toast.error(parseApiError(err));
		}
	};

	return (
		<section className="space-y-4">
			<Card className="">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-2xl font-bold text-white">Children Records</h2>
				</div>
				<div className="mb-3 flex gap-2">
					<Input placeholder="Search child or parent" value={search} onChange={(e) => setSearch(e.target.value)} />
					<Button onClick={() => void applyFilters(1)}>Search</Button>
				</div>
				{loading ? <div className="h-40 skeleton-shimmer rounded-xl" /> : null}
				<div className="overflow-x-auto">
					<table className="min-w-full text-sm">
						<thead>
							<tr className="border-b border-white/10 text-left text-slate-400">
								<th className="py-2 pr-3">Child Name</th>
								<th className="py-2 pr-3">Age/DOB</th>
								<th className="py-2 pr-3">Parent Name</th>
								<th className="py-2 pr-3">Parent Phone</th>
								<th className="py-2 pr-3">Total</th>
								<th className="py-2 pr-3">Completed</th>
								<th className="py-2 pr-3">Pending</th>
								<th className="py-2 pr-3">Missed</th>
								<th className="py-2 pr-3">Actions</th>
							</tr>
						</thead>
						<tbody>
							{children.map((row) => (
								<tr key={row.id} className="border-b border-white/5">
									<td className="py-2 pr-3">{row.name}</td>
									<td className="py-2 pr-3">{formatDate(row.date_of_birth)}</td>
									<td className="py-2 pr-3">{row.parent_name}</td>
									<td className="py-2 pr-3">{formatPhone(row.parent_phone)}</td>
									<td className="py-2 pr-3">{row.total_vaccines}</td>
									<td className="py-2 pr-3">{row.completed_vaccines}</td>
									<td className="py-2 pr-3">{row.pending_vaccines}</td>
									<td className="py-2 pr-3">{row.missed_vaccines}</td>
									<td className="py-2 pr-3">
										<div className="flex gap-2">
											<button className="text-xs font-semibold text-violet-400" onClick={() => setSelectedChildId(row.id)}>View Details</button>
											<button className="text-xs font-semibold text-red-400" onClick={() => setDeleteChildId(row.id)}>Delete</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="mt-3 flex items-center justify-between text-sm">
					<p className="text-slate-400">Total: {total}</p>
					<div className="flex items-center gap-2">
						<Button variant="ghost" disabled={page <= 1} onClick={() => void applyFilters(page - 1)}>Prev</Button>
						<span>{page}</span>
						<Button variant="ghost" disabled={page * 10 >= total} onClick={() => void applyFilters(page + 1)}>Next</Button>
					</div>
				</div>
			</Card>

			<ChildDetailPanel open={Boolean(selectedChildId)} childId={selectedChildId} onClose={() => setSelectedChildId(null)} />
			<ConfirmModal open={Boolean(deleteChildId)} message="Delete this child record and all related data?" onCancel={() => setDeleteChildId(null)} onConfirm={() => void handleDelete()} confirmLabel="Delete" />
		</section>
	);
}
