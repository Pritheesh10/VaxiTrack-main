"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { VaccinationUpdateModal } from "@/components/dashboard/VaccinationUpdateModal";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getMissedVaccinations, parseApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { VaccineReminder } from "@/types/vaccine.types";

const workerMenu = [
	{ href: "/worker/dashboard", label: "Dashboard" },
	{ href: "/worker/calls", label: "Call Console" },
	{ href: "/worker/scan", label: "QR Scanner" },
	{ href: "/worker/children", label: "Child Details" },
	{ href: "/worker/missed", label: "Missed Vaccinations" }
];

export default function WorkerMissedPage() {
	const [items, setItems] = useState<VaccineReminder[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [modalOpen, setModalOpen] = useState(false);
	const [modalChild, setModalChild] = useState({ id: 0, name: "", vaccine: "" });

	const load = async () => {
		setLoading(true);
		try {
			const data = await getMissedVaccinations();
			setItems(data);
		} catch (loadError) {
			setError(parseApiError(loadError));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void load();
	}, []);

	const openReschedule = (childId: number, childName: string, vaccineName: string) => {
		setModalChild({ id: childId, name: childName, vaccine: vaccineName });
		setModalOpen(true);
	};

	return (
		<main className="min-h-screen bg-[#0D0D1A]">
			<Navbar />
			<div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr]">
				<Sidebar title="Worker Panel" items={workerMenu} />

				<section className="space-y-5">
					<Card>
						<div className="mb-4 flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-amber-400" />
							<h1 className="text-2xl font-bold text-white">Missed Vaccinations</h1>
						</div>
						<p className="mb-4 text-sm text-slate-400">Follow-up list for overdue vaccine appointments. You can reschedule or mark them from here.</p>

						{loading ? <p className="text-sm text-slate-400">Loading missed cases...</p> : null}
						{error ? <p className="text-sm text-red-400">{error}</p> : null}

						<div className="space-y-2">
							{items.map((item) => (
								<div
									key={`${item.child_id}-${item.vaccine_name}`}
									className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-white/5 p-3 transition-all hover:border-amber-500/40 hover:bg-white/10"
								>
									<div>
										<p className="font-semibold text-white">{item.child_name}</p>
										<p className="text-sm text-slate-400">Vaccine: {item.vaccine_name}</p>
										<p className="text-sm text-amber-400">Overdue since: {formatDate(item.due_date)}</p>
									</div>
									<Button
										variant="secondary"
										className="text-xs"
										onClick={() => openReschedule(item.child_id, item.child_name, item.vaccine_name)}
									>
										Reschedule / Update
									</Button>
								</div>
							))}

							{!loading && items.length === 0 ? (
								<p className="text-sm text-slate-400">No missed cases found. All caught up!</p>
							) : null}
						</div>
					</Card>

					<VaccinationUpdateModal
						open={modalOpen}
						onClose={() => setModalOpen(false)}
						childId={modalChild.id}
						childName={modalChild.name}
						vaccineName={modalChild.vaccine}
						onSuccess={() => void load()}
					/>
				</section>
			</div>
		</main>
	);
}
