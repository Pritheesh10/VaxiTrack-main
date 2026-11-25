"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SidebarItem {
	href: string;
	label: string;
}

interface SidebarProps {
	title: string;
	items: SidebarItem[];
}

export function Sidebar({ title, items }: SidebarProps) {
	const pathname = usePathname();
	const router = useRouter();
	const [open, setOpen] = useState(false);

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
					"fixed left-0 top-0 z-50 flex h-full w-64 shrink-0 flex-col border-r border-white/5 bg-[#0D0D1A] p-4 shadow-xl transition-transform md:sticky md:top-0 md:z-10 md:h-screen md:translate-x-0",
					open ? "translate-x-0" : "-translate-x-full"
				)}
			>
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">{title}</h2>
					<button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400 md:hidden">
						<X className="h-4 w-4" />
					</button>
				</div>

				<nav className="sidebar-scroll flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
					{items.map((item) => {
						const active = pathname === item.href;
						return (
							<Link
								key={item.href}
								href={item.href}
								onClick={(event) => {
									event.preventDefault();
									setOpen(false);
									router.push(item.href);
								}}
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
			</aside>
		</>
	);
}
