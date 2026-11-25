"use client";

import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface ProfileForm {
	name: string;
	email: string;
	phone: string;
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
}

interface CampaignForm {
	daysBeforeCall: number;
	maxCallAttempts: number;
	callTiming: "morning" | "afternoon" | "evening";
}

export default function AdminSettingsPage() {
	const profile = useForm<ProfileForm>({
		defaultValues: {
			name: "Admin",
			email: "admin@vaxitrack.local",
			phone: "+919999999999",
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
		},
	});
	const campaign = useForm<CampaignForm>({
		defaultValues: {
			daysBeforeCall: 3,
			maxCallAttempts: 2,
			callTiming: "morning",
		},
	});

	const saveProfile = profile.handleSubmit(() => {
		toast.success("Profile settings saved");
	});
	const saveCampaign = campaign.handleSubmit(() => {
		toast.success("Campaign settings saved");
	});

	return (
		<section className="space-y-4">
			<Card className="">
				<h2 className="mb-3 text-2xl font-bold text-white">Settings</h2>
				<h3 className="mb-2 text-lg font-semibold text-white">Admin Profile</h3>
				<form className="grid gap-3 md:grid-cols-2" onSubmit={saveProfile}>
					<Input label="Name" {...profile.register("name", { required: true })} />
					<Input label="Email" type="email" {...profile.register("email", { required: true })} />
					<Input label="Phone" {...profile.register("phone")} />
					<div className="md:col-span-2 grid gap-3 md:grid-cols-3">
						<Input label="Current Password" type="password" {...profile.register("currentPassword")} />
						<Input label="New Password" type="password" {...profile.register("newPassword")} />
						<Input label="Confirm New Password" type="password" {...profile.register("confirmPassword")} />
					</div>
					<div className="md:col-span-2">
						<Button type="submit">Save</Button>
					</div>
				</form>
			</Card>

			<Card className="">
				<h3 className="mb-2 text-lg font-semibold text-white">Campaign Settings</h3>
				<form className="grid gap-3 md:grid-cols-2" onSubmit={saveCampaign}>
					<Input label="Days before vaccination to trigger call" type="number" {...campaign.register("daysBeforeCall", { valueAsNumber: true })} />
					<Input label="Max call attempts per parent" type="number" {...campaign.register("maxCallAttempts", { valueAsNumber: true })} />
					<label className="flex flex-col gap-2 text-sm text-slate-300">
						<span className="font-medium">Call timing preference</span>
						<select className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-200 backdrop-blur-xl" {...campaign.register("callTiming")}>
							<option value="morning">morning</option>
							<option value="afternoon">afternoon</option>
							<option value="evening">evening</option>
						</select>
					</label>
					<div className="md:col-span-2">
						<Button type="submit">Save Settings</Button>
					</div>
				</form>
			</Card>

			<Card className="">
				<h3 className="mb-2 text-lg font-semibold text-white">System Info</h3>
				<div className="space-y-1 text-sm text-slate-400">
					<p>App version: 1.0</p>
					<p>Database status: Connected</p>
					<p>Total storage used: 128 MB</p>
					<p>Last backup date: 05 Mar 2026</p>
				</div>
			</Card>
		</section>
	);
}
