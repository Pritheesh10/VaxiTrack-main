"use client";

import { useRouter } from "next/navigation";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";

const adminMenu = [
	{ href: "/admin/dashboard", label: "Dashboard" },
	{ href: "/admin/users", label: "User Management" },
	{ href: "/admin/children", label: "Children Records" },
	{ href: "/admin/coverage", label: "Vaccination Coverage" },
	{ href: "/admin/calls", label: "Call Analytics" },
	{ href: "/admin/missed", label: "Missed Vaccinations" },
	{ href: "/admin/reports", label: "Reports" },
	{ href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const user = useAuthStore((s) => s.user);
	const logout = useAuthStore((s) => s.logout);

	return (
		<RouteGuard allowedRoles={["admin"]} unauthorizedRedirect="/unauthorized">
			<main className="relative flex min-h-screen bg-[#0D0D1A]">
				{/* Floating orbs */}
				<div className="pointer-events-none fixed inset-0 overflow-hidden">
					<div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
					<div className="absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
					<div className="absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-violet-600/10 blur-3xl" />
				</div>
				<AdminSidebar items={adminMenu} />
				<section className="relative z-10 flex-1 space-y-5 p-6 md:p-8">
					<header className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-xl">
						<div>
							<h1 className="text-lg font-bold text-white">Admin Module</h1>
							<p className="text-xs text-slate-400">Platform-wide visibility and controls</p>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-sm font-semibold text-slate-300">{user?.full_name ?? "Admin"}</span>
							<Button
								variant="ghost"
								onClick={() => {
									logout();
									router.replace("/login");
								}}
							>
								Logout
							</Button>
						</div>
					</header>
					{children}
				</section>
			</main>
		</RouteGuard>
	);
}
