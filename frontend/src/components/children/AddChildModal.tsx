"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Upload } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ChildPayload } from "@/types/child.types";

interface AddChildModalProps {
	open: boolean;
	onClose: () => void;
	onSubmit: (payload: ChildPayload) => Promise<void>;
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const ACCEPTED_TYPES = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

export function AddChildModal({ open, onClose, onSubmit }: AddChildModalProps) {
	const [name, setName] = useState("");
	const [dob, setDob] = useState("");
	const [gender, setGender] = useState("Male");
	const [bloodGroup, setBloodGroup] = useState("O+");
	const [certFile, setCertFile] = useState<File | null>(null);
	const [loading, setLoading] = useState(false);
	const fileRef = useRef<HTMLInputElement>(null);

	const submit = async () => {
		if (!name || !dob || !gender || !bloodGroup) {
			toast.error("All fields are required");
			return;
		}
		setLoading(true);
		try {
			await onSubmit({
				name,
				dob,
				gender,
				blood_group: bloodGroup,
				birth_certificate_file: certFile ?? undefined,
			});
			toast.success("Child added successfully");
			setName("");
			setDob("");
			setGender("Male");
			setBloodGroup("O+");
			setCertFile(null);
			onClose();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to add child");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal open={open} title="Add Child" onClose={onClose}>
			<div className="space-y-3">
				<Input label="Full Name" value={name} onChange={(event) => setName(event.target.value)} />
				<Input label="Date of Birth" type="date" value={dob} onChange={(event) => setDob(event.target.value)} />

				<label className="flex flex-col gap-2 text-sm text-slate-300">
					<span className="font-medium">Gender</span>
					<select
						value={gender}
						onChange={(event) => setGender(event.target.value)}
						className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-200"
					>
						<option>Male</option>
						<option>Female</option>
						<option>Other</option>
					</select>
				</label>

				<label className="flex flex-col gap-2 text-sm text-slate-300">
					<span className="font-medium">Blood Group</span>
					<select
						value={bloodGroup}
						onChange={(event) => setBloodGroup(event.target.value)}
						className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-200"
					>
						{BLOOD_GROUPS.map((group) => (
							<option key={group} value={group}>{group}</option>
						))}
					</select>
				</label>

				{/* Birth Certificate Upload */}
				<label className="flex flex-col gap-2 text-sm text-slate-300">
					<span className="font-medium">Birth Certificate <span className="text-slate-500">(for verification)</span></span>
					<input
						ref={fileRef}
						type="file"
						accept={ACCEPTED_TYPES.join(",")}
						className="hidden"
						onChange={(e) => setCertFile(e.target.files?.[0] ?? null)}
					/>
					<button
						type="button"
						onClick={() => fileRef.current?.click()}
						className="flex items-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-slate-400 transition hover:border-violet-500/50 hover:text-violet-400"
					>
						<Upload size={16} />
						{certFile ? certFile.name : "Upload birth certificate (JPG, PNG, PDF)"}
					</button>
				</label>

				<div className="flex justify-end gap-2 pt-1">
					<Button variant="ghost" onClick={onClose}>Cancel</Button>
					<Button onClick={submit} loading={loading}>Add Child</Button>
				</div>
			</div>
		</Modal>
	);
}
