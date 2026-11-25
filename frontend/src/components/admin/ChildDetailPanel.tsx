"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { getAdminChild, parseApiError } from "@/lib/api";
import { formatDate, formatPhone } from "@/lib/utils";
import type { AdminChildDetails } from "@/types/admin.types";

interface ChildDetailPanelProps {
	open: boolean;
	childId: number | null;
	onClose: () => void;
}

export function ChildDetailPanel({ open, childId, onClose }: ChildDetailPanelProps) {
	const [data, setData] = useState<AdminChildDetails | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!open || !childId) return;
		const safeChildId = childId;
		async function load() {
			setLoading(true);
			try {
				setData(await getAdminChild(safeChildId));
			} catch (err) {
				toast.error(parseApiError(err));
			} finally {
				setLoading(false);
			}
		}
		void load();
	}, [open, childId]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
			<div className="h-full w-full max-w-2xl overflow-y-auto bg-[#13132A] border-l border-white/10 p-5 shadow-2xl">
				<div className="mb-4 flex items-center justify-between">
					<h3 className="text-xl font-bold text-white">Child Details</h3>
					<button className="rounded-lg p-2 hover:bg-white/10" onClick={onClose}><X className="h-4 w-4 text-slate-400" /></button>
				</div>
				{loading ? <p className="text-sm text-slate-400">Loading child details...</p> : null}
				{data ? (
					<div className="space-y-4 text-sm">
						<div className="rounded-xl border border-white/10 bg-white/5 p-3">
							<p><b>Name:</b> {data.name}</p>
							<p><b>DOB:</b> {formatDate(data.date_of_birth)}</p>
							<p><b>Gender:</b> {data.gender ?? "-"}</p>
							<p><b>Blood Group:</b> {data.blood_group ?? "-"}</p>
							<p><b>Parent:</b> {data.parent.name} ({formatPhone(data.parent.phone_number)})</p>
							<p><b>QR:</b> {data.qr_code ?? "-"}</p>
						</div>

						<div>
							<h4 className="mb-2 font-bold text-white">Vaccination History</h4>
							<div className="overflow-x-auto">
								<table className="min-w-full text-xs">
									<thead>
										<tr className="border-b border-white/10 text-left text-slate-400">
											<th className="py-1 pr-2">Vaccine</th>
											<th className="py-1 pr-2">Scheduled</th>
											<th className="py-1 pr-2">Administered</th>
											<th className="py-1 pr-2">Status</th>
										</tr>
									</thead>
									<tbody>
										{data.vaccines.map((v) => (
											<tr key={v.id} className="border-b border-white/5">
												<td className="py-1 pr-2">{v.vaccine_name}</td>
												<td className="py-1 pr-2">{formatDate(v.scheduled_date ?? undefined)}</td>
												<td className="py-1 pr-2">{formatDate(v.administered_date ?? undefined)}</td>
												<td className="py-1 pr-2">{v.status}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>

						<div>
							<h4 className="mb-2 font-bold text-white">AI Call History</h4>
							<div className="space-y-2">
								{data.call_history.map((c) => (
									<div key={c.id} className="rounded-lg border border-white/10 bg-white/5 p-2">
										<p><b>{formatDate(c.called_at ?? undefined)}</b> • {c.status}</p>
										<p className="text-slate-400">Transcript: {c.transcript ?? "-"}</p>
										<p className="text-slate-400">AI: {c.ai_response ?? "-"}</p>
									</div>
								))}
							</div>
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}
