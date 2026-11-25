"use client";

import type { PropsWithChildren } from "react";
import { X } from "lucide-react";

interface ModalProps {
	open: boolean;
	title: string;
	onClose: () => void;
}

export function Modal({ open, title, onClose, children }: PropsWithChildren<ModalProps>) {
	if (!open) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
			<div className="fade-up w-full max-w-lg rounded-3xl border border-white/10 bg-[#13132A]/95 backdrop-blur-xl p-6 shadow-modal">
				<div className="mb-4 flex items-center justify-between">
					<h3 className="text-lg font-bold text-white">{title}</h3>
					<button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white">
						<X className="h-4 w-4" />
					</button>
				</div>
				{children}
			</div>
		</div>
	);
}
