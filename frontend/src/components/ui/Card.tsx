import type { HTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
	return (
		<div
			className={cn(
				"rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-card",
				"transition-all duration-300 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] fade-up",
				className
			)}
			{...props}
		>
			{children}
		</div>
	);
}
