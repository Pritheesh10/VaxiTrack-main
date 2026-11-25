"use client";

import Image from "next/image";
import toast from "react-hot-toast";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Child } from "@/types/child.types";
import { formatDate } from "@/lib/utils";

interface QRCardProps {
	child: Child;
	qrPath: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export function QRCard({ child, qrPath }: QRCardProps) {
	const imageUrl = `${API_BASE_URL}/${qrPath.replace(/^\/+/, "")}`;

	const handleDownload = async () => {
		const response = await fetch(imageUrl);
		const blob = await response.blob();
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `child_${child.id}_qr.png`;
		link.click();
		URL.revokeObjectURL(url);
	};

	const handleShare = async () => {
		const shareUrl = `http://localhost:3000/records/${child.id}`;
		await navigator.clipboard.writeText(shareUrl);
		toast.success("QR URL copied to clipboard");
	};

	return (
		<Card className="max-w-xl border-white/10 bg-white/5">
			<div className="mb-3 text-center">
				<p className="text-sm font-semibold text-violet-400">Vaxi-Track</p>
				<h3 className="text-lg font-bold text-white">Digital Immunization Card</h3>
			</div>

			<div className="mx-auto mb-3 flex w-fit justify-center rounded-xl border border-white/10 bg-white p-3">
				<Image src={imageUrl} alt={`QR card for ${child.name}`} width={220} height={220} unoptimized />
			</div>

			<div className="space-y-1 text-sm text-slate-300">
				<p><span className="font-semibold text-slate-200">Child:</span> {child.name}</p>
				<p><span className="font-semibold text-slate-200">DOB:</span> {formatDate(child.dob || child.date_of_birth)}</p>
				<p><span className="font-semibold text-slate-200">Blood Group:</span> {child.blood_group ?? "-"}</p>
			</div>

			<p className="mt-3 text-xs text-slate-500">Scan to view complete vaccination history</p>

			<div className="mt-4 flex gap-2">
				<Button className="gap-2" onClick={() => void handleDownload()}>
					<Download className="h-4 w-4" />
					Download QR Card
				</Button>
				<Button variant="secondary" className="gap-2" onClick={() => void handleShare()}>
					<Share2 className="h-4 w-4" />
					Share
				</Button>
			</div>
		</Card>
	);
}
