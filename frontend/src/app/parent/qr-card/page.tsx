"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { QRCard } from "@/components/qr/QRCard";
import { Card } from "@/components/ui/Card";
import { getParentChildQr, parseApiError } from "@/lib/api";
import { useChildren } from "@/hooks/useChildren";

export default function ParentQrCardPage() {
	const { children, loadingChildren } = useChildren(true);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [qrPath, setQrPath] = useState<string>("");

	const selectedChild = useMemo(() => {
		if (!children.length) {
			return null;
		}
		if (!selectedId) {
			return children[0];
		}
		return children.find((item) => item.id === selectedId) ?? children[0];
	}, [children, selectedId]);

	useEffect(() => {
		async function loadQr() {
			if (!selectedChild) return;
			try {
				const data = await getParentChildQr(selectedChild.id);
				setQrPath(data.qr_code);
			} catch (err) {
				toast.error(parseApiError(err));
			}
		}
		void loadQr();
	}, [selectedChild]);

	return (
		<>
			<div>
				<h1 className="text-3xl font-bold text-white">Digital Immunization Cards</h1>
			</div>

			<Card>
				<select
					className="w-full max-w-sm rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-300 backdrop-blur-xl focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
					value={selectedChild?.id ?? ""}
					onChange={(event) => setSelectedId(Number(event.target.value))}
				>
					{children.map((child) => (
						<option key={child.id} value={child.id}>{child.name}</option>
					))}
				</select>
			</Card>

			{loadingChildren ? <p className="text-sm text-slate-400">Loading children...</p> : null}
			{selectedChild && qrPath ? <QRCard child={selectedChild} qrPath={qrPath} /> : null}
		</>
	);
}
