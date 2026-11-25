import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: Variant;
	loading?: boolean;
}

const variantStyles: Record<Variant, string> = {
	primary: "bg-gradient-to-r from-violet-600 to-purple-500 text-white shadow-md hover:from-violet-500 hover:to-purple-400 hover:shadow-glow",
	secondary: "bg-white/5 text-slate-200 border border-white/10 shadow-sm hover:bg-white/10 hover:border-violet-500/30",
	ghost: "bg-transparent text-slate-300 hover:bg-white/5 hover:text-white",
	danger: "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 hover:shadow-glow-danger"
};

export function Button({
	children,
	className,
	variant = "primary",
	loading = false,
	disabled,
	...props
}: PropsWithChildren<ButtonProps>) {
	return (
		<button
			className={cn(
				"inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold",
				"transition-all duration-300 ease-out",
				"hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-400",
				"disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0",
				variantStyles[variant],
				className
			)}
			disabled={disabled || loading}
			{...props}
		>
			{loading ? "Please wait..." : children}
		</button>
	);
}
