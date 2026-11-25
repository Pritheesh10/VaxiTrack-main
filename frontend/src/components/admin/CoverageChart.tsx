"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import type { AdminCoverageRow } from "@/types/admin.types";

interface CoverageChartProps {
	data: AdminCoverageRow[];
}

export function CoverageChart({ data }: CoverageChartProps) {
	return (
		<Card className="">
			<h3 className="mb-3 text-lg font-bold text-white">Coverage % by Vaccine</h3>
			{data.length === 0 ? (
				<p className="text-sm text-slate-400">No data available</p>
			) : (
				<div className="h-[420px] w-full">
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={data} layout="vertical" margin={{ left: 24, right: 12 }}>
							<CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
							<XAxis type="number" domain={[0, 100]} stroke="#94a3b8" />
							<YAxis type="category" dataKey="vaccine_name" width={150} stroke="#94a3b8" />
							<Tooltip contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#e2e8f0' }} />
							<Bar dataKey="coverage_percent" fill="#7C3AED" />
						</BarChart>
					</ResponsiveContainer>
				</div>
			)}
		</Card>
	);
}
