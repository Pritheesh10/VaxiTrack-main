"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Baby, Search, Users } from "lucide-react";
import toast from "react-hot-toast";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { getAllChildren, parseApiError } from "@/lib/api";

const workerMenu = [
	{ href: "/worker/dashboard", label: "Dashboard" },
	{ href: "/worker/calls", label: "Call Console" },
	{ href: "/worker/scan", label: "QR Scanner" },
	{ href: "/worker/children", label: "Child Details" },
	{ href: "/worker/missed", label: "Missed Vaccinations" },
];

interface ChildCard {
	id: string;
	name: string;
	date_of_birth: string;
	gender?: string;
	blood_group?: string;
	parent_name?: string;
	parent_phone?: string;
	completed_vaccines: number;
	total_vaccines: number;
}

function calculateAge(dob: string): string {
	if (!dob) return "-";
	const birth = new Date(dob);
	const now = new Date();
	let years = now.getFullYear() - birth.getFullYear();
	let months = now.getMonth() - birth.getMonth();
	if (months < 0) {
		years--;
		months += 12;
	}
	if (years > 0) return `${years}y ${months}m`;
	return `${months}m`;
}

export default function WorkerChildrenPage() {
	const [children, setChildren] = useState<ChildCard[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");

	useEffect(() => {
		async function load() {
			try {
				const data = await getAllChildren();
				setChildren(data);
			} catch (error) {
				toast.error(parseApiError(error));
			} finally {
				setLoading(false);
			}
		}
		void load();
	}, []);

	const filtered = children.filter((c) => {
		const q = search.toLowerCase();
		return (
			c.name.toLowerCase().includes(q) ||
			(c.parent_name ?? "").toLowerCase().includes(q)
		);
	});

	return (
		<main className="min-h-screen bg-[#0D0D1A]">
			<Navbar />
			<div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr]">
				<Sidebar title="Worker Panel" items={workerMenu} />

				<section className="space-y-5">
					{/* Header */}
					<Card>
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex items-center gap-3">
								<Users className="h-6 w-6 text-violet-400" />
								<div>
									<h1 className="text-xl font-bold text-white">All Children</h1>
									<p className="text-sm text-slate-400">{children.length} registered children</p>
								</div>
							</div>
							<div className="relative">
								<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
								<input
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									placeholder="Search by child or parent name…"
									className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 sm:w-72"
								/>
							</div>
						</div>
					</Card>

					{/* List */}
					{loading ? (
						<div className="flex items-center justify-center py-20">
							<div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
						</div>
					) : filtered.length === 0 ? (
						<Card>
							<p className="text-center text-slate-400">
								{search ? "No children match your search." : "No children found."}
							</p>
						</Card>
					) : (
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{filtered.map((child) => {
								const progress =
									child.total_vaccines > 0
										? Math.round((child.completed_vaccines / child.total_vaccines) * 100)
										: 0;
								return (
									<Link key={child.id} href={`/worker/children/${child.id}`}>
										<Card className="cursor-pointer transition-all hover:border-violet-500/40 hover:shadow-[0_0_24px_rgba(124,58,237,0.2)]">
											<div className="mb-3 flex items-center gap-3">
												<div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/20">
													<Baby className="h-5 w-5 text-violet-400" />
												</div>
												<div className="min-w-0 flex-1">
													<h3 className="truncate font-semibold text-white">{child.name}</h3>
													<p className="text-xs text-slate-400">Age: {calculateAge(child.date_of_birth)}</p>
												</div>
											</div>

											{child.parent_name && (
												<p className="mb-2 text-sm text-slate-400">
													Parent: <span className="text-slate-200">{child.parent_name}</span>
												</p>
											)}

											{/* Progress bar */}
											<div className="mt-2">
												<div className="mb-1 flex items-center justify-between text-xs">
													<span className="text-slate-400">Vaccines</span>
													<span className="text-slate-300">
														{child.completed_vaccines}/{child.total_vaccines} ({progress}%)
													</span>
												</div>
												<div className="h-2 overflow-hidden rounded-full bg-white/10">
													<div
														className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all duration-500"
														style={{ width: `${progress}%` }}
													/>
												</div>
											</div>
										</Card>
									</Link>
								);
							})}
						</div>
					)}
				</section>
			</div>
		</main>
	);
}
