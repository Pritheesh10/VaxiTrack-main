import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
}

export function Input({ label, className, error, ...props }: InputProps) {
	return (
		<label className="flex w-full flex-col gap-2 text-sm text-slate-300">
			{label ? <span className="font-medium text-slate-300">{label}</span> : null}
			<input
				className={cn(
					"w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white",
					"transition-all duration-200 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20",
					error && "border-red-400 focus:border-red-400 focus:ring-red-500/20",
					className
				)}
				{...props}
			/>
			{error ? <span className="text-xs font-medium text-red-400">{error}</span> : null}
		</label>
	);
}
