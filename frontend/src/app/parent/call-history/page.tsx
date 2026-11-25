"use client";

import { Fragment, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { getParentCallHistory, parseApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { CallLogEntry } from "@/types/call.types";

function badgeClass(status?: string) {
	switch (status) {
		case "confirmed":
			return "bg-primary-100 text-primary-700";
		case "reschedule_requested":
			return "bg-amber-100 text-amber-700";
		case "missed":
			return "bg-red-100 text-red-700";
		case "no_response":
			return "bg-slate-100 text-slate-600";
		default:
			return "bg-primary-100 text-primary-700";
	}
}

export default function ParentCallHistoryPage() {
	const [rows, setRows] = useState<CallLogEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [expanded, setExpanded] = useState<number | null>(null);

	useEffect(() => {
		async function load() {
			setLoading(true);
			try {
				setRows(await getParentCallHistory());
			} catch (err) {
				toast.error(parseApiError(err));
			} finally {
				setLoading(false);
			}
		}
		void load();
	}, []);

	return (
		<>
			<div>
				<h1 className="text-3xl font-bold text-slate-900">AI Call History</h1>
			</div>
			<Card>
				{loading ? <p className="text-sm text-slate-500">Loading call logs...</p> : null}
				<div className="overflow-x-auto">
					<table className="min-w-full text-sm">
						<thead>
							<tr className="border-b border-slate-200 text-left text-slate-500">
								<th className="py-2 pr-3">Date</th>
								<th className="py-2 pr-3">Child Name</th>
								<th className="py-2 pr-3">Call Status</th>
								<th className="py-2 pr-3">AI Response Summary</th>
								<th className="py-2 pr-3">Transcript</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((row, idx) => (
								<Fragment key={`${row.id ?? idx}`}>
									<tr
										onClick={() => setExpanded(expanded === idx ? null : idx)}
										className="cursor-pointer border-b border-slate-100"
									>
										<td className="py-2 pr-3">{formatDate(row.timestamp)}</td>
										<td className="py-2 pr-3">{row.child_name ?? row.parent_name}</td>
										<td className="py-2 pr-3">
											<span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeClass(row.status)}`}>
												{row.status ?? row.call_status}
											</span>
										</td>
										<td className="py-2 pr-3 text-slate-700">{row.ai_response ?? "-"}</td>
										<td className="py-2 pr-3 text-slate-700">{row.transcript ? `${row.transcript.slice(0, 60)}...` : "-"}</td>
									</tr>
									{expanded === idx ? (
									<tr className="bg-slate-50">
											<td className="px-3 py-2 text-xs text-slate-600" colSpan={5}>
												<b>Full Transcript:</b> {row.transcript ?? "-"}
											</td>
										</tr>
									) : null}
								</Fragment>
							))}
						</tbody>
					</table>
				</div>
			</Card>
		</>
	);
}
