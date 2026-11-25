"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface ConfirmModalProps {
	open: boolean;
	title?: string;
	message: string;
	onConfirm: () => void;
	onCancel: () => void;
	confirmLabel?: string;
}

export function ConfirmModal({
	open,
	title = "Please confirm",
	message,
	onConfirm,
	onCancel,
	confirmLabel = "Confirm",
}: ConfirmModalProps) {
	return (
		<Modal open={open} title={title} onClose={onCancel}>
			<p className="mb-4 text-sm text-slate-300">{message}</p>
			<div className="flex justify-end gap-2">
				<Button variant="ghost" onClick={onCancel}>Cancel</Button>
				<Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
			</div>
		</Modal>
	);
}
