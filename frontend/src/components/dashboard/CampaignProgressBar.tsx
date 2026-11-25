import { Card } from "@/components/ui/Card";
import type { CallCampaignHistoryItem } from "@/types/call.types";

interface CampaignProgressBarProps {
	campaigns: CallCampaignHistoryItem[];
}

export function CampaignProgressBar({ campaigns }: CampaignProgressBarProps) {
	if (campaigns.length === 0) {
		return (
			<Card>
				<h3 className="text-lg font-bold text-white">Campaign Progress</h3>
				<p className="mt-2 text-sm text-slate-400">No campaigns yet.</p>
			</Card>
		);
	}

	return (
		<Card>
			<h3 className="mb-4 text-lg font-bold text-white">Campaign Progress</h3>
			<div className="space-y-4">
				{campaigns.slice(0, 5).map((campaign) => {
					const pct = campaign.total_numbers
						? Math.round((campaign.completed_numbers / campaign.total_numbers) * 100)
						: 0;
					const isComplete = campaign.status === "completed";

					return (
						<div key={campaign.campaign_id}>
							<div className="mb-1.5 flex items-center justify-between text-sm">
						<span className="font-medium text-white">
								Campaign {campaign.campaign_id.slice(0, 8)}
							</span>
							<span className="flex items-center gap-2">
								<span
									className={`inline-block h-2 w-2 rounded-full ${
										isComplete ? "bg-violet-500" : "bg-amber-500"
									}`}
								/>
								<span className="text-slate-400">
									{campaign.completed_numbers}/{campaign.total_numbers} • {pct}%
								</span>
							</span>
						</div>
						<div className="h-2.5 overflow-hidden rounded-full bg-white/10">
							<div
								className={`h-full rounded-full transition-all duration-500 ${
									isComplete ? "bg-violet-500" : "bg-amber-500"
									}`}
									style={{ width: `${pct}%` }}
								/>
							</div>
						</div>
					);
				})}
			</div>
		</Card>
	);
}
