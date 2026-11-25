"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Baby, Calendar, Droplets, Heart, User as UserIcon, CheckCircle, Clock, XCircle } from "lucide-react";
import { VaccinationTimeline } from "@/components/dashboard/VaccinationTimeline";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { QRScanner } from "@/components/qr/QRScanner";
import { Card } from "@/components/ui/Card";
import { fetchChildByQr, getChildVaccineTimeline, parseApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Child } from "@/types/child.types";
import type { VaccineTimelineEntry } from "@/types/vaccine.types";

const workerMenu = [
	{ href: "/worker/dashboard", label: "Dashboard" },
	{ href: "/worker/calls", label: "Call Console" },
	{ href: "/worker/scan", label: "QR Scanner" },
	{ href: "/worker/children", label: "Child Details" },
	{ href: "/worker/missed", label: "Missed Vaccinations" }
];

export default function WorkerScanPage() {
	const [child, setChild] = useState<Child | null>(null);
	const [timeline, setTimeline] = useState<VaccineTimelineEntry[]>([]);
	const [vaccines, setVaccines] = useState<{ vaccine_name: string; scheduled_date: string; administered_date?: string | null; status: string; notes?: string | null }[]>([]);

	const loadTimeline = async (childId: string | number) => {
		try {
			const data = await getChildVaccineTimeline(childId as number);
			setTimeline(data);
		} catch { /* timeline is optional */ }
	};

	const handleScan = async (value: string) => {
		try {
			const response = await fetchChildByQr(value);
			setChild(response);
			if (response.vaccines) {
				setVaccines(response.vaccines as typeof vaccines);
			}
			void loadTimeline(response.id);
			toast.success("Child record loaded from QR scan");
		} catch (error) {
			toast.error(parseApiError(error));
		}
	};

	const completedCount = vaccines.filter((v) => v.status === "completed").length;
	const pendingCount = vaccines.filter((v) => v.status === "pending").length;
	const missedCount = vaccines.filter((v) => v.status === "missed").length;

	return (
		<main className="min-h-screen bg-[#0D0D1A]">
			<Navbar />
			<div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr]">
				<Sidebar title="Worker Panel" items={workerMenu} />

				<section className="space-y-5">
					<QRScanner onScan={handleScan} />

					{child ? (
						<>
							{/* ── Child Details ───────────────────────────── */}
							<Card>
								<div className="mb-4 flex items-center gap-3">
									<div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/20">
										<Baby className="h-6 w-6 text-violet-400" />
									</div>
									<div>
										<h2 className="text-xl font-bold text-white">{child.name}</h2>
										<p className="text-sm text-slate-400">Child Profile</p>
									</div>
								</div>

								<div className="grid gap-4 sm:grid-cols-2">
									<InfoRow icon={Calendar} label="Date of Birth" value={formatDate(child.date_of_birth ?? child.dob)} />
									<InfoRow icon={UserIcon} label="Gender" value={child.gender ?? "-"} />
									<InfoRow icon={Droplets} label="Blood Group" value={child.blood_group ?? "-"} />
									{child.parent_name && (
										<InfoRow icon={Heart} label="Parent" value={child.parent_name} />
									)}
									{child.parent_phone && (
										<InfoRow icon={UserIcon} label="Parent Phone" value={child.parent_phone} />
									)}
								</div>
							</Card>

							{/* ── Vaccination Summary Badges ─────────────── */}
							{vaccines.length > 0 && (
								<div className="grid gap-4 sm:grid-cols-3">
									<StatBadge icon={CheckCircle} label="Completed" count={completedCount} color="green" />
									<StatBadge icon={Clock} label="Pending" count={pendingCount} color="blue" />
									<StatBadge icon={XCircle} label="Missed" count={missedCount} color="red" />
								</div>
							)}

							{/* ── Vaccination History Table ─────────────── */}
							{vaccines.length > 0 && (
								<Card>
									<h3 className="mb-4 text-lg font-bold text-white">Vaccination History</h3>
									<div className="overflow-x-auto">
										<table className="w-full text-left text-sm">
											<thead>
												<tr className="border-b border-white/10 text-slate-400">
													<th className="pb-2 pr-4 font-medium">Vaccine</th>
													<th className="pb-2 pr-4 font-medium">Scheduled</th>
													<th className="pb-2 pr-4 font-medium">Administered</th>
													<th className="pb-2 font-medium">Status</th>
												</tr>
											</thead>
											<tbody>
												{vaccines.map((v, i) => (
													<tr key={i} className="border-b border-white/5">
														<td className="py-2 pr-4 font-medium text-white">{v.vaccine_name}</td>
														<td className="py-2 pr-4 text-slate-400">{formatDate(v.scheduled_date)}</td>
														<td className="py-2 pr-4 text-slate-400">{v.administered_date ? formatDate(v.administered_date) : "-"}</td>
														<td className="py-2">
															<StatusPill status={v.status} />
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</Card>
							)}

							{/* ── Visual Timeline ──────────────────────── */}
							{timeline.length > 0 && (
								<VaccinationTimeline entries={timeline} childName={child.name} />
							)}
						</>
					) : (
						<Card>
							<p className="text-center text-slate-400">Scan a QR code to load child details and vaccination history.</p>
						</Card>
					)}
				</section>
			</div>
		</main>
	);
}

/* ── Small helper components ─────────────────────────────────────── */

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
	return (
		<div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
			<Icon className="h-4 w-4 shrink-0 text-violet-400" />
			<div className="min-w-0">
				<p className="text-xs text-slate-400">{label}</p>
				<p className="truncate font-medium text-white">{value}</p>
			</div>
		</div>
	);
}

function StatBadge({ icon: Icon, label, count, color }: { icon: React.ElementType; label: string; count: number; color: "green" | "blue" | "red" }) {
	const styles = {
		green: "bg-green-500/20 text-green-400",
		blue: "bg-blue-500/20 text-blue-400",
		red: "bg-red-500/20 text-red-400",
	};
	return (
		<div className={`flex items-center gap-3 rounded-xl border border-white/10 p-4 ${styles[color].split(" ")[0]}`}>
			<Icon className={`h-6 w-6 ${styles[color].split(" ")[1]}`} />
			<div>
				<p className="text-2xl font-bold text-white">{count}</p>
				<p className={`text-sm ${styles[color].split(" ")[1]}`}>{label}</p>
			</div>
		</div>
	);
}

function StatusPill({ status }: { status: string }) {
	const map: Record<string, string> = {
		completed: "bg-green-500/20 text-green-400",
		pending: "bg-blue-500/20 text-blue-400",
		missed: "bg-red-500/20 text-red-400",
	};
	return (
		<span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${map[status] ?? "bg-white/10 text-slate-300"}`}>
			{status}
		</span>
	);
}
