"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Mic, PhoneCall, PlayCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
	analyzeConversation,
	getCallCampaignHistory,
	getCallCampaignStatus,
	parseApiError,
	startCallCampaign
} from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { CallCampaign, CallCampaignHistoryItem } from "@/types/call.types";

const workerMenu = [
	{ href: "/worker/dashboard", label: "Dashboard" },
	{ href: "/worker/calls", label: "Call Console" },
	{ href: "/worker/scan", label: "QR Scanner" },
	{ href: "/worker/children", label: "Child Details" },
	{ href: "/worker/missed", label: "Missed Vaccinations" }
];

export default function WorkerCallsPage() {
	const [campaign, setCampaign] = useState<CallCampaign | null>(null);
	const [history, setHistory] = useState<CallCampaignHistoryItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [startLoading, setStartLoading] = useState(false);
	const [transcript, setTranscript] = useState("I am busy tomorrow, can we reschedule?");
	const [analysis, setAnalysis] = useState<{ intent: string; reply: string } | null>(null);
	const [analysisLoading, setAnalysisLoading] = useState(false);

	const progress = useMemo(() => {
		if (!campaign?.total_numbers) {
			return 0;
		}
		return Math.round((campaign.completed_numbers / campaign.total_numbers) * 100);
	}, [campaign]);

	useEffect(() => {
		let timer: NodeJS.Timeout | null = null;

		async function loadStatus() {
			try {
				const [status, callHistory] = await Promise.all([
					getCallCampaignStatus(),
					getCallCampaignHistory()
				]);
				setCampaign(status.campaign);
				setHistory(callHistory);
			} catch (error) {
				toast.error(parseApiError(error));
			} finally {
				setLoading(false);
			}
		}

		void loadStatus();
		timer = setInterval(() => {
			void loadStatus();
		}, 2200);

		return () => {
			if (timer) {
				clearInterval(timer);
			}
		};
	}, []);

	const handleStart = async () => {
		setStartLoading(true);
		try {
			await startCallCampaign("worker");
			toast.success("Call campaign started");
			const status = await getCallCampaignStatus();
			setCampaign(status.campaign);
		} catch (error) {
			toast.error(parseApiError(error));
		} finally {
			setStartLoading(false);
		}
	};

	const handleAnalyze = async () => {
		setAnalysisLoading(true);
		try {
			const result = await analyzeConversation(transcript);
			setAnalysis(result);
		} catch (error) {
			toast.error(parseApiError(error));
		} finally {
			setAnalysisLoading(false);
		}
	};

	const active = campaign?.status === "running";

	return (
		<main className="min-h-screen bg-[#0D0D1A]">
			<Navbar />
			<div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr]">
				<Sidebar title="Worker Panel" items={workerMenu} />

				<section className="space-y-5">
					<div className="fade-up">
						<h1 className="text-3xl font-bold text-white">Voice Call Console</h1>
						<p className="text-sm text-slate-400">
							Launch and monitor conversational immunization campaigns in real time.
						</p>
					</div>

					<Card className="relative overflow-hidden border-0 bg-gradient-to-br from-violet-600 to-purple-800 text-white shadow-card">
						<div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/5" />
						<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
							<div className="relative flex items-start gap-3">
								<div className="rounded-xl bg-white/15 p-2.5">
									<PhoneCall className="h-6 w-6" />
								</div>
								<div>
									<h2 className="text-xl font-bold">Campaign Control</h2>
									<p className="text-sm text-white/80">
										Only one campaign can run at a time until every number is fulfilled.
									</p>
								</div>
							</div>
							<Button
								variant="ghost"
								onClick={handleStart}
								loading={startLoading}
								disabled={active}
								className="border border-white/20 bg-white/15 text-white hover:bg-white/25 hover:text-white hover:shadow-lg"
							>
								{active ? "Campaign Running" : "Start New Campaign"}
							</Button>
						</div>

						<div className="relative grid gap-3 sm:grid-cols-3">
							<div className="rounded-xl bg-white/10 p-3">
								<p className="text-xs uppercase text-white/70">State</p>
								<p className="text-lg font-semibold">{campaign?.status ?? "idle"}</p>
							</div>
							<div className="rounded-xl bg-white/10 p-3">
								<p className="text-xs uppercase text-white/70">Processed</p>
								<p className="text-lg font-semibold">
									{campaign?.completed_numbers ?? 0}/{campaign?.total_numbers ?? 0}
								</p>
							</div>
							<div className="rounded-xl bg-white/10 p-3">
								<p className="text-xs uppercase text-white/70">Progress</p>
								<p className="text-lg font-semibold">{progress}%</p>
							</div>
						</div>

						<div className="relative mt-4 h-3 overflow-hidden rounded-full bg-white/20">
							<div
								className="h-full rounded-full bg-gradient-to-r from-violet-300 to-white transition-all duration-700 ease-out"
								style={{ width: `${progress}%` }}
							/>
							{active && (
								<div className="progress-shimmer absolute inset-0 h-full rounded-full" />
							)}
						</div>
					</Card>

					<Card>
						<h2 className="mb-3 text-lg font-bold text-white">Live Call Queue</h2>
						{loading ? <p className="text-sm text-slate-400">Loading queue...</p> : null}
						<div className="grid gap-2 md:grid-cols-2">
							{campaign?.items.map((item, idx) => (
								<div key={`${item.child_id}-${idx}`} className="rounded-xl border border-white/10 bg-white/5 p-3 transition-all hover:bg-white/10">
									<div className="mb-1 flex items-center justify-between">
										<p className="font-semibold text-white">{item.child_name}</p>
										<span className="inline-flex items-center gap-1 rounded-full bg-violet-500/20 px-2 py-0.5 text-xs font-medium text-violet-400">
											{item.status === "talking" ? <LoaderCircle className="h-3 w-3 animate-spin" /> : null}
											{item.status}
										</span>
									</div>
									<p className="text-xs text-slate-500">{item.phone_number} &bull; {item.vaccine_name}</p>
									{item.transcript ? <p className="mt-1 text-xs text-slate-300 italic">&ldquo;{item.transcript}&rdquo;</p> : null}
									{item.intent ? <p className="mt-1 text-xs font-medium text-violet-400">Intent: {item.intent}</p> : null}
								</div>
							))}
							{!campaign?.items?.length ? <p className="text-sm text-slate-400">No active queue.</p> : null}
						</div>
					</Card>

					<div className="grid gap-5 lg:grid-cols-2">
						<Card>
							<div className="mb-3 flex items-center gap-2">
								<Mic className="h-5 w-5 text-violet-400" />
								<h2 className="text-lg font-bold text-white">Conversation Analyzer</h2>
							</div>
							<textarea
								value={transcript}
								onChange={(event) => setTranscript(event.target.value)}
								className="min-h-28 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200 placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
							/>
							<div className="mt-3">
								<Button onClick={handleAnalyze} loading={analysisLoading} className="gap-2">
									<PlayCircle className="h-4 w-4" />
									Analyze Speech
								</Button>
							</div>
							{analysis ? (
								<div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
									<p className="font-semibold text-white">Intent: {analysis.intent}</p>
									<p className="text-violet-400">AI Reply: {analysis.reply}</p>
								</div>
							) : null}
						</Card>

						<Card>
							<h2 className="mb-3 text-lg font-bold text-white">Campaign History</h2>
							<div className="space-y-2">
								{history.slice(0, 8).map((entry) => (
									<div key={entry.campaign_id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm transition-all hover:bg-white/10">
										<p className="font-semibold text-white">Campaign {entry.campaign_id.slice(0, 8)}</p>
										<p className="text-slate-400">{entry.completed_numbers}/{entry.total_numbers} completed &bull; {entry.status}</p>
										<p className="text-xs text-slate-500">Started: {formatDate(entry.started_at)}</p>
									</div>
								))}
								{history.length === 0 ? <p className="text-sm text-slate-400">No campaign history yet.</p> : null}
							</div>
						</Card>
					</div>
				</section>
			</div>
		</main>
	);
}