"use client";

import { RouteGuard } from "@/components/layout/RouteGuard";
import { ParentSidebar } from "@/components/layout/ParentSidebar";

const parentMenu = [
	{ href: "/parent/dashboard", label: "Dashboard" },
	{ href: "/parent/children", label: "My Children" },
	{ href: "/parent/schedule", label: "Vaccination Schedule" },
	{ href: "/parent/qr-card", label: "QR Cards" }
];

export default function ParentLayout({ children }: { children: React.ReactNode }) {
	return (
		<RouteGuard allowedRoles={["parent"]} unauthorizedRedirect="/unauthorized">
			<main className="flex min-h-screen bg-[#0D0D1A]">
				<ParentSidebar items={parentMenu} />
				<section className="relative flex-1 p-6 md:p-8">
					{/* Background orbs */}
					<div className="pointer-events-none absolute top-20 left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
					<div className="pointer-events-none absolute bottom-20 right-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
					<div className="relative space-y-6">
						{children}
					</div>
				</section>
			</main>
		</RouteGuard>
	);
}
