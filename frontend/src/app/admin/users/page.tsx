"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { UserTable } from "@/components/admin/UserTable";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { parseApiError } from "@/lib/api";
import type { AdminUser } from "@/types/admin.types";

interface WorkerForm {
	name: string;
	email: string;
	phone_number: string;
	password: string;
}

export default function AdminUsersPage() {
	const [tab, setTab] = useState("all");
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [openAdd, setOpenAdd] = useState(false);
	const [confirm, setConfirm] = useState<{ action: "deactivate" | "delete"; user: AdminUser } | null>(null);
	const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
	const { users, total, loading, refetch, createWorker, deactivateUser, deleteUser } = useAdminUsers({ page: 1, limit: 10 });

	const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<WorkerForm>();

	const roleFilter = useMemo(() => {
		if (tab === "parents") return "parent";
		if (tab === "healthcare_workers") return "healthcare_worker";
		return undefined;
	}, [tab]);

	const applyFilters = async (nextPage = 1) => {
		setPage(nextPage);
		await refetch({ role: roleFilter, search, page: nextPage, limit: 10 });
	};

	const submitWorker = async (values: WorkerForm) => {
		try {
			await createWorker(values);
			toast.success("Healthcare worker created");
			setOpenAdd(false);
			reset();
			await applyFilters(page);
		} catch (err) {
			toast.error(parseApiError(err));
		}
	};

	const confirmAction = async () => {
		if (!confirm) return;
		try {
			if (confirm.action === "deactivate") {
				await deactivateUser(confirm.user.id);
				toast.success("User deactivated");
			} else {
				await deleteUser(confirm.user.id);
				toast.success("User deleted");
			}
			setConfirm(null);
			await applyFilters(page);
		} catch (err) {
			toast.error(parseApiError(err));
		}
	};

	return (
		<section className="space-y-4">
			<Card className="">
				<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
					<h2 className="text-2xl font-bold text-white">User Management</h2>
					<Button className="gap-2" onClick={() => setOpenAdd(true)}>
						<Plus className="h-4 w-4" />
						Add Healthcare Worker
					</Button>
				</div>
				<div className="mb-3 flex flex-wrap items-center gap-2">
					{[
						{ key: "all", label: "All Users" },
						{ key: "parents", label: "Parents" },
						{ key: "healthcare_workers", label: "Healthcare Workers" },
					].map((item) => (
						<button
							key={item.key}
							type="button"
							onClick={() => {
								setTab(item.key);
								void applyFilters(1);
							}}
							className={`rounded-full px-3 py-1.5 text-sm font-semibold ${tab === item.key ? "bg-gradient-to-r from-violet-600 to-purple-500 text-white" : "border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"}`}
						>
							{item.label}
						</button>
					))}
				</div>
				<div className="mb-3 flex gap-2">
					<Input placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
					<Button onClick={() => void applyFilters(1)}>Search</Button>
				</div>

				{loading ? <div className="h-40 skeleton-shimmer rounded-xl" /> : null}
				{selectedUser ? (
					<div className="mb-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
						<b className="text-white">Selected User:</b> {selectedUser.name} ({selectedUser.email})
					</div>
				) : null}
				<UserTable
					users={users}
					onView={setSelectedUser}
					onDeactivate={(user) => setConfirm({ action: "deactivate", user })}
					onDelete={(user) => setConfirm({ action: "delete", user })}
				/>

				<div className="mt-3 flex items-center justify-between text-sm">
					<p className="text-slate-400">Total: {total}</p>
					<div className="flex items-center gap-2">
						<Button variant="ghost" disabled={page <= 1} onClick={() => void applyFilters(page - 1)}>Prev</Button>
						<span>{page}</span>
						<Button variant="ghost" disabled={page * 10 >= total} onClick={() => void applyFilters(page + 1)}>Next</Button>
					</div>
				</div>
			</Card>

			<Modal open={openAdd} title="Add Healthcare Worker" onClose={() => setOpenAdd(false)}>
				<form className="space-y-3" onSubmit={handleSubmit(submitWorker)}>
					<Input label="Full Name" {...register("name", { required: true })} error={errors.name ? "Name is required" : undefined} />
					<Input label="Email" type="email" {...register("email", { required: true })} error={errors.email ? "Email is required" : undefined} />
					<Input label="Phone Number" {...register("phone_number", { required: true })} error={errors.phone_number ? "Phone is required" : undefined} />
					<Input label="Password" type="password" {...register("password", { required: true, minLength: 6 })} error={errors.password ? "Password must be 6+ chars" : undefined} />
					<div className="flex justify-end gap-2">
						<Button variant="ghost" type="button" onClick={() => setOpenAdd(false)}>Cancel</Button>
						<Button type="submit" loading={isSubmitting}>Create Worker</Button>
					</div>
				</form>
			</Modal>

			<ConfirmModal
				open={Boolean(confirm)}
				message={confirm ? `${confirm.action === "delete" ? "Delete" : "Deactivate"} ${confirm.user.name}?` : ""}
				onCancel={() => setConfirm(null)}
				onConfirm={() => void confirmAction()}
				confirmLabel={confirm?.action === "delete" ? "Delete" : "Deactivate"}
			/>
		</section>
	);
}
