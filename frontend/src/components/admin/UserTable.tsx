"use client";

import { useMemo, useState } from "react";
import { formatDate, formatPhone } from "@/lib/utils";
import type { AdminUser } from "@/types/admin.types";

interface UserTableProps {
	users: AdminUser[];
	onView: (user: AdminUser) => void;
	onDeactivate: (user: AdminUser) => void;
	onDelete: (user: AdminUser) => void;
}

export function UserTable({ users, onView, onDeactivate, onDelete }: UserTableProps) {
	const [sortKey, setSortKey] = useState<keyof AdminUser>("created_at");
	const [direction, setDirection] = useState<"asc" | "desc">("desc");

	const sorted = useMemo(() => {
		const list = [...users];
		list.sort((a, b) => {
			const av = (a[sortKey] ?? "") as string | number | boolean;
			const bv = (b[sortKey] ?? "") as string | number | boolean;
			if (av < bv) return direction === "asc" ? -1 : 1;
			if (av > bv) return direction === "asc" ? 1 : -1;
			return 0;
		});
		return list;
	}, [users, sortKey, direction]);

	const setSort = (key: keyof AdminUser) => {
		if (sortKey === key) {
			setDirection((prev) => (prev === "asc" ? "desc" : "asc"));
			return;
		}
		setSortKey(key);
		setDirection("asc");
	};

	const roleClass = (role: string) => {
		if (role === "parent") return "bg-blue-500/20 text-blue-400";
		if (role === "admin") return "bg-red-500/20 text-red-400";
		return "bg-violet-500/20 text-violet-400";
	};

	return (
		<div className="overflow-x-auto">
			<table className="min-w-full text-sm">
				<thead>
					<tr className="border-b border-white/10 text-left text-slate-400">
						<th className="cursor-pointer py-2 pr-3" onClick={() => setSort("name")}>Name</th>
						<th className="cursor-pointer py-2 pr-3" onClick={() => setSort("email")}>Email</th>
						<th className="py-2 pr-3">Phone</th>
						<th className="cursor-pointer py-2 pr-3" onClick={() => setSort("role")}>Role</th>
						<th className="py-2 pr-3">Children/Vaccinations</th>
						<th className="cursor-pointer py-2 pr-3" onClick={() => setSort("created_at")}>Joined Date</th>
						<th className="cursor-pointer py-2 pr-3" onClick={() => setSort("is_active")}>Status</th>
						<th className="py-2 pr-3">Actions</th>
					</tr>
				</thead>
				<tbody>
					{sorted.map((user) => (
					<tr key={user.id} className={`border-b border-white/5 ${!user.is_active ? "opacity-60" : ""}`}>
						<td className="py-2 pr-3 font-medium text-white">{user.name}</td>
						<td className="py-2 pr-3 text-slate-300">{user.email}</td>
						<td className="py-2 pr-3 text-slate-300">{formatPhone(user.phone_number)}</td>
							<td className="py-2 pr-3">
								<span className={`rounded-full px-2 py-1 text-xs font-semibold ${roleClass(user.role)}`}>{user.role}</span>
							</td>
						<td className="py-2 pr-3 text-slate-300">{user.role === "parent" ? user.child_count ?? 0 : user.vaccination_count ?? 0}</td>
						<td className="py-2 pr-3 text-slate-300">{formatDate(user.created_at ?? undefined)}</td>
							<td className="py-2 pr-3">
								<span className={`rounded-full px-2 py-1 text-xs font-semibold ${user.is_active ? "bg-violet-500/20 text-violet-400" : "bg-white/10 text-slate-400"}`}>
									{user.is_active ? "active" : "inactive"}
								</span>
							</td>
							<td className="py-2 pr-3">
								<div className="flex gap-2">
									<button className="text-xs font-semibold text-violet-400" onClick={() => onView(user)}>View</button>
									<button className="text-xs font-semibold text-amber-400" onClick={() => onDeactivate(user)}>Deactivate</button>
									<button className="text-xs font-semibold text-red-400" onClick={() => onDelete(user)}>Delete</button>
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
