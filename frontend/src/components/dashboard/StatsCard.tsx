import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

interface StatsCardProps {
	title: string;
	value: number | string;
	icon: ReactNode;
	color?: string;
	accent?: string;
}

export function StatsCard({ title, value, icon }: StatsCardProps) {
	return (
		<Card className="fade-up">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{title}</p>
					<h3 className="mt-1 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">{value}</h3>
				</div>
				<div className="rounded-xl bg-white/5 border border-white/10 p-3 text-violet-400">
					{icon}
				</div>
			</div>
		</Card>
	);
}
