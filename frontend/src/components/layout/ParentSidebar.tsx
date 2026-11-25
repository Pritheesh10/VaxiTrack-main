"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, ShieldPlus, X } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

interface ParentSidebarItem {
	href: string;
	label: string;
}

interface ParentSidebarProps {
	items: ParentSidebarItem[];
}

export function ParentSidebar({ items }: ParentSidebarProps) {
	const pathname = usePathname();
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const user = useAuthStore((state) => state.user);
	const logout = useAuthStore((state) => state.logout);

	const handleLogout = () => {
		logout();
		router.replace("/login");
	};

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="fixed left-4 top-4 z-40 rounded-lg border border-white/10 bg-white/5 backdrop-blur-xl p-2 text-slate-300 shadow md:hidden"
			>
				<Menu className="h-5 w-5" />
			</button>

			{open ? <div className="fixed inset-0 z-40 bg-dark/60 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)} /> : null}

			<aside
				className={cn(
					"fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-white/5 bg-[#0D0D1A] p-4 shadow-xl transition-transform md:sticky md:top-0 md:z-10 md:h-screen md:translate-x-0",
					open ? "translate-x-0" : "-translate-x-full"
				)}
			>
				<div className="mb-6 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 shadow-glow">
							<ShieldPlus className="h-4 w-4 text-white" />
						</div>
						<p className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Vaxi-Track</p>
					</div>
					<button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400 md:hidden">
						<X className="h-4 w-4" />
					</button>
				</div>

				<nav className="sidebar-scroll flex-1 space-y-1 overflow-y-auto pr-1">
					{items.map((item) => {
						const active = pathname === item.href;
						return (
							<Link
								key={item.href}
								href={item.href}
								onClick={() => setOpen(false)}
								className={cn(
									"block rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
									active
										? "bg-gradient-to-r from-violet-600/20 to-purple-500/20 border-l-2 border-violet-500 text-white shadow-[0_0_20px_rgba(124,58,237,0.2)]"
										: "text-slate-400 hover:bg-white/5 hover:text-white"
								)}
							>
								{item.label}
							</Link>
						);
					})}
				</nav>

				<div className="mt-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-3">
					<p className="text-xs text-slate-400">Logged in as</p>
					<p className="text-sm font-semibold text-white">{user?.full_name ?? "Parent"}</p>
					<button
						type="button"
						onClick={handleLogout}
						className="mt-2 w-full rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
					>
						Logout
					</button>
				</div>
			</aside>
		</>
	);
}
