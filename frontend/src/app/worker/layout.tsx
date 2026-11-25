"use client";

import { RouteGuard } from "@/components/layout/RouteGuard";

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
	return <RouteGuard allowedRoles={["worker", "admin"]}>{children}</RouteGuard>;
}
