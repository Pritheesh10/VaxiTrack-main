"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
	Activity,
	ClipboardCheck,
	HeartPulse,
	LoaderCircle,
	PhoneCall,
	QrCode,
	Siren,
	Syringe,
	Users
} from "lucide-react";
import toast from "react-hot-toast";
import { CallCampaignTable } from "@/components/dashboard/CallCampaignTable";
import { CampaignProgressBar } from "@/components/dashboard/CampaignProgressBar";
import { NotificationBanner } from "@/components/dashboard/NotificationBanner";
import { UpcomingVaccinesCard } from "@/components/dashboard/UpcomingVaccinesCard";
import { VaccinationTimeline } from "@/components/dashboard/VaccinationTimeline";
import { VaccinationUpdateModal } from "@/components/dashboard/VaccinationUpdateModal";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useChildren } from "@/hooks/useChildren";
import { useVaccination } from "@/hooks/useVaccination";
import {
	getCallCampaignHistory,
	getCallCampaignStatus,
	getCallLogs,
	getChildVaccineTimeline,
	parseApiError,
	startCallCampaign
} from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { CallCampaign, CallCampaignHistoryItem, CallLogEntry } from "@/types/call.types";
import type { VaccineTimelineEntry } from "@/types/vaccine.types";

const workerMenu = [
	{ href: "/worker/dashboard", label: "Dashboard" },
	{ href: "/worker/calls", label: "Call Console" },
	{ href: "/worker/scan", label: "QR Scanner" },
	{ href: "/worker/children", label: "Child Details" },
	{ href: "/worker/missed", label: "Missed Vaccinations" }
];

export default function WorkerDashboardPage() {
	const { children, loadingChildren } = useChildren(true);
	const { reminders } = useVaccination(true);
	const [campaign, setCampaign] = useState<CallCampaign | null>(null);
	const [history, setHistory] = useState<CallCampaignHistoryItem[]>([]);
	const [callLogs, setCallLogs] = useState<CallLogEntry[]>([]);
	const [campaignLoading, setCampaignLoading] = useState(true);
	const [startLoading, setStartLoading] = useState(false);

	// Timeline state
	const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
	const [selectedChildName, setSelectedChildName] = useState("");
	const [timeline, setTimeline] = useState<VaccineTimelineEntry[]>([]);

	// Update modal state
	const [modalOpen, setModalOpen] = useState(false);
	const [modalChild, setModalChild] = useState<{ id: number; name: string; vaccine: string }>({ id: 0, name: "", vaccine: "" });

	const progress = useMemo(() => {
		if (!campaign?.total_numbers) {
			return 0;
		}
		return Math.round((campaign.completed_numbers / campaign.total_numbers) * 100);
	}, [campaign]);

	useEffect(() => {
		let timer: NodeJS.Timeout | null = null;

		async function syncCampaign() {
			try {
				const [status, campaignHistory, logs] = await Promise.all([
					getCallCampaignStatus(),
					getCallCampaignHistory(),
					getCallLogs()
				]);
				setCampaign(status.campaign);
				setHistory(campaignHistory);
				setCallLogs(logs);
			} catch (error) {
				toast.error(parseApiError(error));
			} finally {
				setCampaignLoading(false);
			}
		}

		void syncCampaign();
		timer = setInterval(() => {
			void syncCampaign();
		}, 2500);

		return () => {
			if (timer) {
				clearInterval(timer);
			}
		};
	}, []);

	const handleStartCampaign = async () => {
		setStartLoading(true);
		try {
			await startCallCampaign("worker");
			toast.success("Automated voice campaign started");
			const status = await getCallCampaignStatus();
			setCampaign(status.campaign);
		} catch (error) {
			toast.error(parseApiError(error));
		} finally {
			setStartLoading(false);
		}
	};

	const isCampaignActive = campaign?.status === "running";

	const handleViewTimeline = async (childId: number, childName: string) => {
		setSelectedChildId(childId);
		setSelectedChildName(childName);
		try {
			const data = await getChildVaccineTimeline(childId);
			setTimeline(data);
		} catch (err) {
			toast.error(parseApiError(err));
		}
	};

	const openUpdateModal = (childId: number, childName: string, vaccineName: string) => {
		setModalChild({ id: childId, name: childName, vaccine: vaccineName });
		setModalOpen(true);
	};

	return (
		<main className="min-h-screen bg-[#0D0D1A]">
			<Navbar />
			<div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr]">
				<Sidebar title="Worker Panel" items={workerMenu} />

				<section className="space-y-6">
					{/* ---------- Header ---------- */}
					<div className="fade-up">
						<div className="mb-1 flex items-center gap-2">
							<HeartPulse className="h-7 w-7 text-violet-400" />
							<h1 className="text-3xl font-bold text-white">
								Healthcare Worker Command Center
							</h1>
						</div>
						<p className="text-sm text-slate-400">
							Run conversational AI reminder campaigns, monitor live calls, and update vaccine records.
						</p>
					</div>

					<NotificationBanner vaccines={reminders} />

					{/* ---------- Stats Grid (4 cols) ---------- */}
					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
						{/* Children Records */}
						<Card className="group relative overflow-hidden">
							<div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/10 transition-transform duration-500 group-hover:scale-150" />
							<div className="relative flex items-center justify-between">
								<div>
									<p className="text-xs font-semibold uppercase tracking-wider text-violet-400">Children</p>
									<h3 className="mt-1 text-3xl font-bold text-white">{children.length}</h3>
									<p className="mt-0.5 text-xs text-slate-500">Total records</p>
								</div>
								<div className="rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 p-3 shadow-lg shadow-violet-500/20">
									<Users className="h-5 w-5 text-white" />
								</div>
							</div>
						</Card>

						{/* QR Scanner */}
						<Card className="group relative overflow-hidden">
							<div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/10 transition-transform duration-500 group-hover:scale-150" />
							<div className="relative flex items-center justify-between">
								<div>
									<p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">QR Scanner</p>
									<Link href="/worker/scan" className="mt-1 inline-block text-sm font-bold text-violet-400 underline decoration-violet-500/30 underline-offset-2 transition-colors hover:text-white">
										Open Scanner
									</Link>
								</div>
								<div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 p-3 shadow-lg shadow-cyan-500/20">
									<QrCode className="h-5 w-5 text-white" />
								</div>
							</div>
						</Card>

						{/* Missed Vaccines */}
						<Card className="group relative overflow-hidden">
							<div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-400/10 transition-transform duration-500 group-hover:scale-150" />
							<div className="relative flex items-center justify-between">
								<div>
									<p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Missed Cases</p>
									<Link href="/worker/missed" className="mt-1 inline-block text-sm font-bold text-amber-400 underline decoration-amber-500/30 underline-offset-2 transition-colors hover:text-white">
										Review Missed
									</Link>
								</div>
								<div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-3 shadow-lg shadow-amber-500/20">
									<Siren className="h-5 w-5 text-white" />
								</div>
							</div>
						</Card>

						{/* Voice Campaign Quick Stat */}
						<Card className="group relative overflow-hidden">
							<div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/10 transition-transform duration-500 group-hover:scale-150" />
							<div className="relative flex items-center justify-between">
								<div>
									<p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Campaign</p>
									<h3 className="mt-1 text-xl font-bold text-white">
										{isCampaignActive ? "Running" : "Idle"}
									</h3>
									<p className="mt-0.5 text-xs text-slate-500">
										{campaign ? `${campaign.completed_numbers}/${campaign.total_numbers} calls` : "Ready"}
									</p>
								</div>
								<div className="rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 p-3 shadow-lg shadow-violet-500/20">
									<Activity className="h-5 w-5 text-white" />
								</div>
							</div>
						</Card>
					</div>

					{/* ---------- Voice Campaign Hero Card ---------- */}
					<Card className="relative overflow-hidden border-0 bg-gradient-to-br from-violet-600 to-purple-800 text-white shadow-card">
						{/* Decorative circles */}
						<div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/5" />
						<div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/5" />

						<div className="relative mb-5 flex flex-wrap items-center justify-between gap-4">
							<div className="flex items-center gap-3">
								<div className="rounded-xl bg-white/15 p-2.5">
									<PhoneCall className="h-6 w-6" />
								</div>
								<div>
									<h2 className="text-xl font-bold">Automated Voice Campaign</h2>
									<p className="mt-0.5 text-sm text-white/80">
										Trigger AI-powered calls. New campaigns start once the current one finishes.
									</p>
								</div>
							</div>
							<Button
								variant="ghost"
								onClick={handleStartCampaign}
								loading={startLoading}
								disabled={isCampaignActive}
								className="border border-white/20 bg-white/15 text-white hover:bg-white/25 hover:text-white hover:shadow-lg"
							>
								{isCampaignActive ? "Campaign Running" : "Start Campaign"}
							</Button>
						</div>

						{campaignLoading ? (
							<p className="text-sm text-white/80">Loading campaign status...</p>
						) : campaign ? (
							<div className="relative space-y-4">
								{/* Progress bar */}
								<div>
									<div className="mb-1.5 flex items-center justify-between text-sm font-medium">
										<span>
											Completed {campaign.completed_numbers}/{campaign.total_numbers}
										</span>
										<span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-bold">
											{progress}%
										</span>
									</div>
									<div className="relative h-3 overflow-hidden rounded-full bg-white/20">
										<div
											className="h-full rounded-full bg-gradient-to-r from-violet-300 to-white transition-all duration-700 ease-out"
											style={{ width: `${progress}%` }}
										/>
										{isCampaignActive && (
											<div className="progress-shimmer absolute inset-0 h-full rounded-full" />
										)}
									</div>
								</div>

								{/* Campaign items */}
								<div className="grid gap-2 md:grid-cols-2">
									{campaign.items.map((item, index) => (
										<div key={`${item.child_id}-${index}`} className="rounded-xl border border-white/10 bg-white/10 p-3 transition-colors hover:bg-white/15">
											<div className="mb-1 flex items-center justify-between text-sm font-semibold">
												<span className="flex items-center gap-1.5">
													<Syringe className="h-3.5 w-3.5 text-violet-300" />
													{item.child_name}
												</span>
												<span className="inline-flex items-center gap-1 rounded-full bg-black/20 px-2 py-0.5 text-xs">
													{item.status === "talking" ? <LoaderCircle className="h-3 w-3 animate-spin" /> : null}
													{item.status}
												</span>
											</div>
											<p className="text-xs text-white/70">{item.phone_number} &bull; {item.vaccine_name}</p>
											{item.transcript ? (
												<p className="mt-1 rounded-lg bg-black/10 px-2 py-1 text-xs italic text-white/90">
													&ldquo;{item.transcript}&rdquo;
												</p>
											) : null}
										</div>
									))}
								</div>
							</div>
						) : (
							<p className="relative text-sm text-white/80">No active campaign. Ready to trigger next reminder batch.</p>
						)}
					</Card>

					{/* ---------- Campaign Progress + Call Logs ---------- */}
					<div className="grid gap-6 lg:grid-cols-2">
						<CampaignProgressBar campaigns={history} />
						<CallCampaignTable logs={callLogs} />
					</div>

					{/* ---------- Upcoming Vaccines ---------- */}
					<UpcomingVaccinesCard vaccines={reminders} onUpdate={openUpdateModal} />

					{/* ---------- Children Records ---------- */}
					<Card>
						<div className="mb-4 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<ClipboardCheck className="h-5 w-5 text-violet-400" />
								<h2 className="text-lg font-bold text-white">Children Records</h2>
							</div>
							<Link href="/worker/scan">
								<Button>Update Vaccination</Button>
							</Link>
						</div>

						{loadingChildren ? <p className="text-sm text-slate-400">Loading records...</p> : null}

						<div className="space-y-2">
							{children.map((child) => (
								<div
									key={child.id}
									className="group rounded-xl border border-white/10 bg-white/5 p-3 transition-all hover:bg-white/10"
								>
									<div className="flex flex-wrap items-center justify-between gap-2">
										<div>
											<p className="font-semibold text-white">{child.name}</p>
											<p className="text-sm text-slate-400">DOB: {formatDate(child.dob)}</p>
											<p className="text-sm text-slate-400">Next Vaccine: {child.next_vaccine ?? "TBD"}</p>
										</div>
										<div className="flex gap-2">
											<Button
												variant="ghost"
												className="text-xs"
												onClick={() => handleViewTimeline(child.id, child.name)}
											>
												View Timeline
											</Button>
											{child.next_vaccine && (
												<Button
													className="text-xs"
													onClick={() => openUpdateModal(child.id, child.name, child.next_vaccine!)}
												>
													Update Vaccination
												</Button>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</Card>

					{selectedChildId && <VaccinationTimeline entries={timeline} childName={selectedChildName} />}

					<VaccinationUpdateModal
						open={modalOpen}
						onClose={() => setModalOpen(false)}
						childId={modalChild.id}
						childName={modalChild.name}
						vaccineName={modalChild.vaccine}
						onSuccess={() => {
							if (selectedChildId) {
								void handleViewTimeline(selectedChildId, selectedChildName);
							}
						}}
					/>
				</section>
			</div>
		</main>
	);
}
