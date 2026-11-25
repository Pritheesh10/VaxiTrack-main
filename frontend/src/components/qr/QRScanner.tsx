"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Card } from "@/components/ui/Card";

interface QRScannerProps {
	onScan: (value: string) => void;
}

export function QRScanner({ onScan }: QRScannerProps) {
	const [scanError, setScanError] = useState<string | null>(null);

	return (
		<Card>
			<div className="mb-3 flex items-center gap-2">
				<Camera className="h-5 w-5 text-violet-400" />
				<h3 className="text-lg font-bold text-white">Scan Child QR Card</h3>
			</div>
			{scanError && (
				<p className="mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{scanError}</p>
			)}
			<div className="overflow-hidden rounded-xl border border-white/10">
				<Scanner
					onScan={(detectedCodes) => {
						if (detectedCodes.length > 0) {
							setScanError(null);
							onScan(detectedCodes[0].rawValue);
						}
					}}
					onError={(error) => {
						const msg = error instanceof Error ? error.message : String(error);
						if (!msg.includes("NotFoundException")) {
							setScanError(msg);
						}
					}}
					styles={{ container: { width: "100%" } }}
				/>
			</div>
		</Card>
	);
}
