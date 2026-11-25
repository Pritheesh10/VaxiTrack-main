"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
	ArrowLeft,
	Baby,
	Calendar,
	CheckCircle,
	Clock,
	Droplets,
	Heart,
	Phone,
	User as UserIcon,
	XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getChildById, updateVaccineById, parseApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Child } from "@/types/child.types";

const workerMenu = [
	{ href: "/worker/dashboard", label: "Dashboard" },
	{ href: "/worker/calls", label: "Call Console" },
	{ href: "/worker/scan", label: "QR Scanner" },
	{ href: "/worker/children", label: "Child Details" },
	{ href: "/worker/missed", label: "Missed Vaccinations" },
];

type VaccineRecord = NonNullable<Child["vaccines"]>[number] & { id?: string };

function calculateAge(dob: string): string {
	if (!dob) return "-";
	const birth = new Date(dob);
	const now = new Date();
	let years = now.getFullYear() - birth.getFullYear();
	let months = now.getMonth() - birth.getMonth();
	if (months < 0) {
		years--;
		months += 12;
	}
	if (years > 0) return `${years}y ${months}m`;
	return `${months}m`;
}

export default function WorkerChildDetailPage() {
	const params = useParams();
	const router = useRouter();
	const childId = params.id as string;

	const [child, setChild] = useState<Child | null>(null);
	const [vaccines, setVaccines] = useState<VaccineRecord[]>([]);
	const [loading, setLoading] = useState(true);

	// Modal state
	const [editVaccine, setEditVaccine] = useState<VaccineRecord | null>(null);
	const [newStatus, setNewStatus] = useState<string>("completed");
	const [rescheduleDate, setRescheduleDate] = useState("");
	const [notes, setNotes] = useState("");
	const [updating, setUpdating] = useState(false);

	const loadChild = async () => {
		try {
			const data = await getChildById(childId);
			setChild(data);
			setVaccines((data.vaccines ?? []) as VaccineRecord[]);
		} catch (error) {
			toast.error(parseApiError(error));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void loadChild();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [childId]);

	const handleUpdate = async () => {
		if (!editVaccine?.id) {
			toast.error("Vaccine record has no ID");
			return;
		}
		if (rescheduleDate && newStatus === "completed") {
			toast.error("Cannot reschedule a completed vaccine");
			return;
		}
		setUpdating(true);
		try {
			await updateVaccineById(editVaccine.id, {
				status: newStatus,
				administered_date: newStatus === "completed" ? new Date().toISOString().split("T")[0] : undefined,
				scheduled_date: rescheduleDate || undefined,
				notes: notes || undefined,
			});
			const action = rescheduleDate
				? `rescheduled to ${rescheduleDate}`
				: `marked as ${newStatus}`;
			toast.success(`Vaccine "${editVaccine.vaccine_name}" ${action}`);
			setEditVaccine(null);
			setNotes("");
			setRescheduleDate("");
			// Reload child data so changes are reflected
			setLoading(true);
			await loadChild();
		} catch (error) {
			toast.error(parseApiError(error));
		} finally {
			setUpdating(false);
		}
	};

	const completedCount = vaccines.filter((v) => v.status === "completed").length;
	const pendingCount = vaccines.filter((v) => v.status === "pending").length;
	const missedCount = vaccines.filter((v) => v.status === "missed").length;

	if (loading) {
		return (
			<main className="min-h-screen bg-[#0D0D1A]">
				<Navbar />
				<div className="flex items-center justify-center py-40">
					<div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
				</div>
			</main>
		);
	}

	if (!child) {
		return (
			<main className="min-h-screen bg-[#0D0D1A]">
				<Navbar />
				<div className="mx-auto max-w-7xl px-4 py-20 text-center">
					<p className="text-slate-400">Child not found.</p>
					<Button className="mt-4" onClick={() => router.push("/worker/children")}>
						Back to list
					</Button>
				</div>
			</main>
		);
	}

	return (
		<main className="min-h-screen bg-[#0D0D1A]">
			<Navbar />
			<div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr]">
				<Sidebar title="Worker Panel" items={workerMenu} />

				<section className="space-y-5">
					{/* Back button */}
					<button
						onClick={() => router.push("/worker/children")}
						className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to all children
					</button>

					{/* ── Child Profile ─────────────────────────── */}
					<Card>
						<div className="mb-4 flex items-center gap-3">
							<div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/20">
								<Baby className="h-7 w-7 text-violet-400" />
							</div>
							<div>
								<h1 className="text-2xl font-bold text-white">{child.name}</h1>
								<p className="text-sm text-slate-400">
									Age: {calculateAge(child.date_of_birth ?? child.dob)}
								</p>
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							<InfoRow icon={Calendar} label="Date of Birth" value={formatDate(child.date_of_birth ?? child.dob)} />
							<InfoRow icon={UserIcon} label="Gender" value={child.gender ?? "-"} />
							<InfoRow icon={Droplets} label="Blood Group" value={child.blood_group ?? "-"} />
							{child.parent_name && <InfoRow icon={Heart} label="Parent Name" value={child.parent_name} />}
							{child.parent_phone && <InfoRow icon={Phone} label="Parent Phone" value={child.parent_phone} />}
						</div>
					</Card>

					{/* ── Summary Badges ────────────────────────── */}
					<div className="grid gap-4 sm:grid-cols-3">
						<StatBadge icon={CheckCircle} label="Completed" count={completedCount} color="green" />
						<StatBadge icon={Clock} label="Pending" count={pendingCount} color="blue" />
						<StatBadge icon={XCircle} label="Missed" count={missedCount} color="red" />
					</div>

					{/* ── Vaccination Records ───────────────────── */}
					<Card>
						<h2 className="mb-4 text-lg font-bold text-white">Vaccination Records</h2>
						{vaccines.length === 0 ? (
							<p className="text-sm text-slate-400">No vaccination records yet.</p>
						) : (
							<div className="space-y-3">
								{vaccines.map((v, i) => (
									<div
										key={v.id ?? i}
										className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
									>
										<div className="flex-1 space-y-1">
											<div className="flex flex-wrap items-center gap-2">
												<p className="font-semibold text-white">{v.vaccine_name}</p>
												<StatusPill status={v.status} />
											</div>
											<p className="text-sm text-slate-400">
												Scheduled: {formatDate(v.scheduled_date)}
												{v.administered_date && ` • Administered: ${formatDate(v.administered_date)}`}
											</p>
											{v.notes && <p className="text-xs text-slate-500">Notes: {v.notes}</p>}
										</div>

										{/* Update button – only for non-completed */}
										{v.status !== "completed" && v.id && (
											<Button
												variant="secondary"
												className="shrink-0"
												onClick={() => {
													setEditVaccine(v);
													setNewStatus("completed");
													setNotes("");
												}}
											>
												Update Status
											</Button>
										)}
									</div>
								))}
							</div>
						)}
					</Card>
				</section>
			</div>

			{/* ── Update Modal ───────────────────────────────── */}
			{editVaccine && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
					<div className="mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-[#1A1A2E] p-6 shadow-xl">
						<h3 className="mb-1 text-lg font-bold text-white">
							Update Vaccine Status
						</h3>
						<p className="mb-5 text-sm text-slate-400">
							{editVaccine.vaccine_name} — currently{" "}
							<span className="capitalize text-slate-300">{editVaccine.status}</span>
						</p>

						<label className="mb-3 flex flex-col gap-1.5 text-sm">
							<span className="font-medium text-violet-400">New Status</span>
							<select
								value={newStatus}
								onChange={(e) => setNewStatus(e.target.value)}
								className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-200 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
							>
								<option value="completed">Completed</option>
								<option value="pending">Pending</option>
								<option value="missed">Missed</option>
							</select>
						</label>

						{newStatus !== "completed" && (
							<label className="mb-3 flex flex-col gap-1.5 text-sm">
								<span className="font-medium text-violet-400">Reschedule Date (optional)</span>
								<input
									type="date"
									value={rescheduleDate}
									onChange={(e) => setRescheduleDate(e.target.value)}
									className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-200 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
								/>
								{rescheduleDate && (
									<p className="text-xs text-slate-500">The scheduled date will be updated to {rescheduleDate} across all records.</p>
								)}
							</label>
						)}

						<label className="mb-5 flex flex-col gap-1.5 text-sm">
							<span className="font-medium text-violet-400">Notes (optional)</span>
							<textarea
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								rows={2}
								className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
								placeholder="Any additional notes…"
							/>
						</label>

						<div className="flex items-center justify-end gap-3">
							<Button variant="ghost" onClick={() => setEditVaccine(null)}>
								Cancel
							</Button>
							<Button onClick={handleUpdate} loading={updating}>
								Save Changes
							</Button>
						</div>
					</div>
				</div>
			)}
		</main>
	);
}

/* ── Helper components ──────────────────────────────────────────── */

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

function StatBadge({
	icon: Icon,
	label,
	count,
	color,
}: {
	icon: React.ElementType;
	label: string;
	count: number;
	color: "green" | "blue" | "red";
}) {
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
		<span
			className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${map[status] ?? "bg-white/10 text-slate-300"}`}
		>
			{status}
		</span>
	);
}
