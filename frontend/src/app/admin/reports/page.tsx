"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
	exportAdminFullReport,
	getAdminCallAnalytics,
	getAdminCoverage,
	getAdminMissedReport,
	parseApiError,
} from "@/lib/api";

function downloadJson(name: string, payload: unknown) {
	const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = name;
	link.click();
	URL.revokeObjectURL(url);
}

export default function AdminReportsPage() {
	const [loading, setLoading] = useState<string | null>(null);

	const run = async (key: string, task: () => Promise<unknown>, fileName: string) => {
		setLoading(key);
		try {
			const payload = await task();
			downloadJson(fileName, payload);
			toast.success("Report generated");
		} catch (err) {
			toast.error(parseApiError(err));
		} finally {
			setLoading(null);
		}
	};

	return (
		<section className="space-y-4">
			<h2 className="text-2xl font-bold text-white">Reports</h2>
			<div className="grid gap-4 md:grid-cols-2">
				<Card className="">
					<h3 className="font-bold text-white">Full Platform Report</h3>
					<p className="mt-1 text-sm text-slate-400">Complete JSON dump of admin module datasets.</p>
					<Button className="mt-3" loading={loading === "full"} onClick={() => void run("full", exportAdminFullReport, "full-platform-report.json")}>Generate & Download</Button>
				</Card>
				<Card className="">
					<h3 className="font-bold text-white">Vaccination Coverage Report</h3>
					<p className="mt-1 text-sm text-slate-400">Coverage percentages grouped by vaccine.</p>
					<Button className="mt-3" loading={loading === "coverage"} onClick={() => void run("coverage", getAdminCoverage, "coverage-report.json")}>Generate & Download</Button>
				</Card>
				<Card className="">
					<h3 className="font-bold text-white">Missed Vaccinations Report</h3>
					<p className="mt-1 text-sm text-slate-400">All missed cases with parent contact details.</p>
					<Button className="mt-3" loading={loading === "missed"} onClick={() => void run("missed", getAdminMissedReport, "missed-vaccinations-report.json")}>Generate & Download</Button>
				</Card>
				<Card className="">
					<h3 className="font-bold text-white">Call Performance Report</h3>
					<p className="mt-1 text-sm text-slate-400">Call success rates, intent distribution and reasons.</p>
					<Button className="mt-3" loading={loading === "calls"} onClick={() => void run("calls", getAdminCallAnalytics, "call-performance-report.json")}>Generate & Download</Button>
				</Card>
			</div>
		</section>
	);
}
