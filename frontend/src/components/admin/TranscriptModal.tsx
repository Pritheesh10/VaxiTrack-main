"use client";

import { Modal } from "@/components/ui/Modal";
import type { AdminCallLog } from "@/types/admin.types";

interface TranscriptModalProps {
	open: boolean;
	onClose: () => void;
	callLog: AdminCallLog | null;
}

export function TranscriptModal({ open, onClose, callLog }: TranscriptModalProps) {
	return (
		<Modal open={open} title="Call Transcript" onClose={onClose}>
			{callLog ? (
				<div className="space-y-3 text-sm">
					<div>
						<p className="font-semibold text-white">Child</p>
						<p className="text-slate-300">{callLog.child_name}</p>
					</div>
					<div>
						<p className="font-semibold text-white">Status</p>
						<p className="text-slate-300">{callLog.status ?? "-"}</p>
					</div>
					<div>
						<p className="font-semibold text-white">AI Response</p>
						<p className="rounded-lg bg-white/5 border border-white/10 p-2 text-slate-300">{callLog.ai_response ?? "-"}</p>
					</div>
					<div>
						<p className="font-semibold text-white">Transcript</p>
						<p className="max-h-64 overflow-y-auto rounded-lg bg-white/5 border border-white/10 p-2 text-slate-300">{callLog.transcript ?? "-"}</p>
					</div>
				</div>
			) : null}
		</Modal>
	);
}
