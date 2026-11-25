import Link from "next/link";
import { formatDate, toPercent } from "@/lib/utils";
import type { Child } from "@/types/child.types";

interface ChildCardProps {
	child: Child;
}

function calculateAge(dob?: string) {
	if (!dob) return "-";
	const birth = new Date(dob);
	if (Number.isNaN(birth.getTime())) return "-";
	const today = new Date();
	let years = today.getFullYear() - birth.getFullYear();
	const monthDelta = today.getMonth() - birth.getMonth();
	if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) {
		years -= 1;
	}
	return `${years} yrs`;
}

export function ChildCard({ child }: ChildCardProps) {
	const progress = toPercent(child.completed_vaccines ?? 0, child.total_vaccines ?? 0);
	return (
		<div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
			<div className="flex items-start justify-between">
				<div>
					<p className="text-lg font-bold text-white">{child.name}</p>
					<p className="text-sm text-slate-400">Age: {calculateAge(child.dob || child.date_of_birth)}</p>
				</div>
				<div className="flex gap-1">
					{child.gender ? <span className="rounded-full bg-violet-500/20 px-2 py-1 text-xs text-violet-400">{child.gender}</span> : null}
					{child.blood_group ? <span className="rounded-full bg-cyan-500/20 px-2 py-1 text-xs text-cyan-400">{child.blood_group}</span> : null}
				</div>
			</div>

			<div className="mt-3 rounded-lg bg-white/5 border border-white/5 p-2">
				<p className="text-xs text-slate-500">Next vaccine due</p>
				<p className="text-sm font-medium text-slate-300">
					{child.next_vaccine ?? "Not scheduled"}
					{child.next_vaccine_date ? ` • ${formatDate(child.next_vaccine_date)}` : ""}
				</p>
			</div>

			<div className="mt-3">
				<div className="mb-1 flex justify-between text-xs text-slate-400">
					<span>Vaccine Progress</span>
					<span>{progress}%</span>
				</div>
				<div className="h-2 rounded-full bg-white/10">
					<div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500" style={{ width: `${progress}%` }} />
				</div>
			</div>

			<div className="mt-4 grid grid-cols-2 gap-2">
				<Link href={`/parent/schedule?child=${child.id}`} className="rounded-lg border border-white/10 px-3 py-2 text-center text-sm font-semibold text-violet-400 hover:bg-white/5 transition-colors">
					View Details
				</Link>
				<Link href={`/parent/qr-card?child=${child.id}`} className="rounded-lg bg-gradient-to-r from-violet-600 to-purple-500 px-3 py-2 text-center text-sm font-semibold text-white hover:opacity-90 transition-opacity">
					View QR Card
				</Link>
			</div>
		</div>
	);
}
