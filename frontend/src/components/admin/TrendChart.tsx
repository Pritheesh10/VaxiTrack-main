"use client";

import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import type { AdminMonthlyTrend } from "@/types/admin.types";

interface TrendChartProps {
	data: AdminMonthlyTrend[];
}

export function TrendChart({ data }: TrendChartProps) {
	return (
		<Card className="">
			<h3 className="mb-3 text-lg font-bold text-white">Monthly Vaccination Trend</h3>
			{data.length === 0 ? (
				<p className="text-sm text-slate-400">No data available</p>
			) : (
				<div className="h-72 w-full">
					<ResponsiveContainer width="100%" height="100%">
						<LineChart data={data}>
							<CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
							<XAxis dataKey="month" stroke="#94a3b8" />
							<YAxis stroke="#94a3b8" />
							<Tooltip contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#e2e8f0' }} />
							<Legend />
							<Line type="monotone" dataKey="completed" stroke="#7C3AED" strokeWidth={2} />
							<Line type="monotone" dataKey="missed" stroke="#f59e0b" strokeWidth={2} />
						</LineChart>
					</ResponsiveContainer>
				</div>
			)}
		</Card>
	);
}
