"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis
} from "recharts";
import { Card } from "@/components/ui/Card";
import type { CampaignSuccessPoint } from "@/types/vaccine.types";

interface CampaignSuccessChartProps {
	data: CampaignSuccessPoint[];
}

export function CampaignSuccessChart({ data }: CampaignSuccessChartProps) {
	return (
		<Card className="h-[360px]">
			<h3 className="mb-4 text-lg font-bold text-slate-900">Reminder Campaign Success Rate</h3>
			<ResponsiveContainer width="100%" height="90%">
				<BarChart data={data} barGap={4}>
					<CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
					<XAxis dataKey="month" />
					<YAxis />
					<Tooltip />
					<Legend />
					<Bar dataKey="answered" name="Answered" fill="#6366F1" radius={[6, 6, 0, 0]} />
					<Bar dataKey="missed" name="Missed" fill="#ef4444" radius={[6, 6, 0, 0]} />
					<Bar dataKey="busy" name="Busy" fill="#f59e0b" radius={[6, 6, 0, 0]} />
				</BarChart>
			</ResponsiveContainer>
		</Card>
	);
}
