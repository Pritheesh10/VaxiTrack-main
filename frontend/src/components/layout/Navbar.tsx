"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldPlus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
	const { user, logout, hydrated } = useAuth();
	const pathname = usePathname();

	const publicRoutes = new Set(["/", "/login", "/register", "/unauthorized"]);
	const isPublicRoute = publicRoutes.has(pathname);

	return (
		<header className="sticky top-0 z-30 border-b border-white/5 bg-[#0D0D1A]/80 backdrop-blur-xl shadow-header">
			<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
				<Link href="/" className="flex items-center gap-2.5">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 shadow-md">
						<ShieldPlus className="h-4.5 w-4.5 text-white" />
					</div>
					<span className="text-lg font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Vaxi-Track</span>
				</Link>
				<div className="flex items-center gap-3">
					{!hydrated ? null : user && !isPublicRoute ? (
						<>
							<span className="hidden text-sm font-medium text-slate-300 sm:block">{user.full_name}</span>
							<span className="hidden rounded-full bg-violet-500/20 px-2 py-0.5 text-xs font-semibold text-violet-400 sm:block">{user.role}</span>
							<Button variant="ghost" onClick={logout} className="gap-2 border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white">
								<LogOut className="h-4 w-4" />
								Logout
							</Button>
						</>
					) : (
						<div className="flex items-center gap-2 md:gap-3">
							<Link href="/login">
								<Button variant="ghost" className="font-semibold text-slate-300 hover:text-white">
									Login
								</Button>
							</Link>
							<Link href="/register">
								<Button className="font-semibold">Register</Button>
							</Link>
						</div>
					)}
				</div>
			</div>
		</header>
	);
}
