"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
	const { loginUser, loading, error, hydrated, goToDashboard } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [fieldError, setFieldError] = useState("");
	const safeError = typeof error === "string" ? error : error ? "Login failed" : "";

	// If already authenticated, redirect to dashboard
	const storedUser = useAuthStore((s) => s.user);
	useEffect(() => {
		if (hydrated && storedUser) {
			goToDashboard(storedUser.role);
		}
	}, [hydrated, storedUser, goToDashboard]);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setFieldError("");
		if (!email || !password) {
			setFieldError("Email and password are required");
			return;
		}

		try {
			const loggedInUser = await loginUser({ email, password });
			toast.success("Logged in successfully");
			goToDashboard(loggedInUser.role ?? "parent");
		} catch {
			// error is already set in authStore; the toast gives visual feedback
		}
	};

	return (
		<main className="min-h-screen bg-[#0D0D1A]">
			<Navbar />
			<section className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-7xl items-center justify-center px-4 py-8 sm:px-6">
				<div className="flex w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-card">
					{/* Left branding panel */}
					<div className="hidden w-2/5 bg-gradient-to-br from-[#0D0D1A] via-[#1a0533] to-[#0D0D1A] p-10 lg:flex lg:flex-col lg:justify-center relative overflow-hidden">
						{/* Floating orbs */}
						<div className="pointer-events-none absolute top-10 left-10 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl" />
						<div className="pointer-events-none absolute bottom-10 right-10 w-32 h-32 bg-cyan-500/15 rounded-full blur-3xl" />
						<div className="relative space-y-6">
							<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 shadow-glow">
								<span className="text-2xl">🛡️</span>
							</div>
							<h2 className="text-3xl font-bold text-white">Protect every child.</h2>
							<p className="text-sm text-slate-400">Access your immunization dashboard and keep every child on track.</p>
							<div className="space-y-3 pt-2">
								<div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-2 text-sm text-slate-300">
									<span className="text-green-400">✓</span> AI Voice Reminders
								</div>
								<div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-2 text-sm text-slate-300">
									<span className="text-green-400">✓</span> QR Digital Cards
								</div>
								<div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-2 text-sm text-slate-300">
									<span className="text-green-400">✓</span> Real-time Analytics
								</div>
							</div>
						</div>
					</div>
					{/* Right form panel */}
					<div className="flex w-full flex-col justify-center p-8 sm:p-10 lg:w-3/5">
						<h1 className="mb-2 text-2xl font-bold text-white">Welcome back</h1>
						<p className="mb-6 text-sm text-slate-400">Access your immunization dashboard.</p>

						<form className="space-y-4" onSubmit={handleSubmit}>
							<Input
								label="Email"
								type="email"
								placeholder="name@email.com"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
							/>
							<Input
								label="Password"
								type="password"
								placeholder="Enter your password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
							/>
							{fieldError ? <p className="text-sm text-red-400">{fieldError}</p> : null}
							{safeError ? <p className="text-sm text-red-400">{safeError}</p> : null}
							<Button type="submit" className="w-full" loading={loading}>
								Login
							</Button>
						</form>

						<p className="mt-4 text-sm text-slate-400">
							New user?{" "}
							<Link href="/register" className="font-semibold text-violet-400 hover:text-violet-300">
								Create account
							</Link>
						</p>
					</div>
				</div>
			</section>
		</main>
	);
}
