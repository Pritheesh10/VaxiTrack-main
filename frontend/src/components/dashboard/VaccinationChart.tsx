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
import type { CoveragePoint } from "@/types/vaccine.types";

interface VaccinationChartProps {
	data: CoveragePoint[];
}

export function VaccinationChart({ data }: VaccinationChartProps) {
	return (
		<Card className="h-[360px]">
			<h3 className="mb-4 text-lg font-bold text-slate-900">Vaccination Coverage Trend</h3>
			<ResponsiveContainer width="100%" height="90%">
				<BarChart data={data} barGap={8}>
					<CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
					<XAxis dataKey="month" />
					<YAxis />
					<Tooltip />
					<Legend />
					<Bar dataKey="completed" fill="#6366F1" radius={[6, 6, 0, 0]} />
					<Bar dataKey="pending" fill="#06B6D4" radius={[6, 6, 0, 0]} />
				</BarChart>
			</ResponsiveContainer>
		</Card>
	);
}
