"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateVaccineStatus, parseApiError } from "@/lib/api";

interface VaccinationUpdateModalProps {
	open: boolean;
	onClose: () => void;
	childId: number;
	childName: string;
	vaccineName: string;
	onSuccess?: () => void;
}

type VaccineAction = "completed" | "missed" | "rescheduled";

export function VaccinationUpdateModal({
	open,
	onClose,
	childId,
	childName,
	vaccineName,
	onSuccess
}: VaccinationUpdateModalProps) {
	const [action, setAction] = useState<VaccineAction>("completed");
	const [newDate, setNewDate] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async () => {
		if (action === "rescheduled" && !newDate) {
			toast.error("Please select a new date for rescheduling");
			return;
		}

		setLoading(true);
		try {
			await updateVaccineStatus(
				childId,
				vaccineName,
				action,
				action === "rescheduled" ? newDate : undefined
			);
			toast.success(`Vaccine marked as ${action}`);
			onSuccess?.();
			onClose();
		} catch (error) {
			toast.error(parseApiError(error));
		} finally {
			setLoading(false);
		}
	};

	const actions: { value: VaccineAction; label: string; desc: string; color: string }[] = [
		{
			value: "completed",
			label: "Completed",
			desc: "Vaccine was administered successfully",
			color: "border-green-500 bg-green-500/10 text-green-400"
		},
		{
			value: "missed",
			label: "Missed",
			desc: "Parent/child did not show up",
			color: "border-red-500 bg-red-500/10 text-red-400"
		},
		{
			value: "rescheduled",
			label: "Rescheduled",
			desc: "Postponed to a new date",
			color: "border-amber-500 bg-amber-500/10 text-amber-400"
		}
	];

	return (
		<Modal open={open} title="Update Vaccination" onClose={onClose}>
			<div className="space-y-4">
				<div className="rounded-xl border border-white/10 bg-white/5 p-3">
					<p className="text-sm text-slate-400">Child</p>
					<p className="font-semibold text-white">{childName}</p>
					<p className="text-sm text-slate-400 mt-1">Vaccine</p>
					<p className="font-semibold text-white">{vaccineName}</p>
				</div>

				<div className="space-y-2">
					<p className="text-sm font-medium text-violet-400">Select Status</p>
					{actions.map((opt) => (
						<button
							key={opt.value}
							type="button"
							onClick={() => setAction(opt.value)}
							className={`w-full rounded-xl border-2 p-3 text-left transition-all ${
								action === opt.value ? opt.color : "border-white/10 bg-white/5 text-slate-300"
							}`}
						>
							<p className="font-semibold">{opt.label}</p>
							<p className="text-xs opacity-80">{opt.desc}</p>
						</button>
					))}
				</div>

				{action === "rescheduled" && (
					<Input
						label="New Date"
						type="date"
						value={newDate}
						onChange={(e) => setNewDate(e.target.value)}
					/>
				)}

				<div className="flex justify-end gap-2 pt-2">
					<Button variant="ghost" onClick={onClose}>
						Cancel
					</Button>
					<Button onClick={handleSubmit} loading={loading}>
						Confirm Update
					</Button>
				</div>
			</div>
		</Modal>
	);
}
