"use client";

import {
	Activity,
	CheckCircle2,
	PhoneCall,
	Syringe,
	UserRound,
	Users,
	XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { round2 } from "@/lib/utils";
import type { AdminStats } from "@/types/admin.types";

interface StatsGridProps {
	stats: AdminStats | null;
}

function StatCard({ label, value, icon, badge }: { label: string; value: string | number; icon: React.ReactNode; badge?: string }) {
	return (
		<Card className="">
			<div className="flex items-start justify-between gap-2">
				<div>
					<p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
					<p className="mt-1 text-2xl font-bold text-white">{value}</p>
					{badge ? <p className="mt-1 text-xs font-semibold text-violet-400">{badge}</p> : null}
				</div>
				<div className="rounded-xl bg-violet-500/20 p-2 text-violet-400">{icon}</div>
			</div>
		</Card>
	);
}

export function StatsGrid({ stats }: StatsGridProps) {
	if (!stats) {
		return (
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{Array.from({ length: 8 }).map((_, idx) => (
					<Card key={idx} className="h-28 animate-pulse" />
				))}
			</div>
		);
	}

	return (
		<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			<StatCard label="Total Parents" value={stats.total_parents} icon={<Users className="h-5 w-5" />} />
			<StatCard label="Total Healthcare Workers" value={stats.total_healthcare_workers} icon={<UserRound className="h-5 w-5" />} />
			<StatCard label="Total Children" value={stats.total_children} icon={<Users className="h-5 w-5" />} />
			<StatCard label="Total Vaccines Scheduled" value={stats.total_vaccines_scheduled} icon={<Syringe className="h-5 w-5" />} />
			<StatCard label="Vaccines Completed" value={stats.total_vaccines_completed} icon={<CheckCircle2 className="h-5 w-5" />} badge={`${round2(stats.vaccination_coverage_percent)}% coverage`} />
			<StatCard label="Vaccines Missed" value={stats.total_vaccines_missed} icon={<XCircle className="h-5 w-5" />} badge={`${round2(stats.total_vaccines_scheduled ? (stats.total_vaccines_missed / stats.total_vaccines_scheduled) * 100 : 0)}%`} />
			<StatCard label="Total AI Calls Made" value={stats.total_calls_made} icon={<PhoneCall className="h-5 w-5" />} />
			<StatCard label="Call Success Rate" value={`${round2(stats.call_success_rate_percent)}%`} icon={<Activity className="h-5 w-5" />} badge={`${stats.total_calls_confirmed} confirmed, ${stats.total_calls_no_response} no response`} />
		</div>
	);
}
