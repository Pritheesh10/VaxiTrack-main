"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
	const router = useRouter();
	const { registerUser, loading, error, logout } = useAuth();
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [fieldError, setFieldError] = useState("");
	const safeError = typeof error === "string" ? error : error ? "Registration failed" : "";

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setFieldError("");
		if (!fullName || !email || !password) {
			setFieldError("All fields are required");
			return;
		}

		if (password.length < 6) {
			setFieldError("Password must be at least 6 characters");
			return;
		}

		if (!phoneNumber.trim()) {
			setFieldError("Mobile number is required for parent registration");
			return;
		}

		try {
			await registerUser({
				full_name: fullName,
				email,
				password,
				role: "parent",
				phone_number: phoneNumber.trim(),
			});
			logout();
			toast.success("Registration successful. Please login.");
			router.replace("/login");
		} catch {
			toast.error("Registration failed. Please try again.");
		}
	};

	return (
		<main className="min-h-screen bg-[#0D0D1A]">
			<Navbar />
			<section className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-7xl items-center justify-center px-4 py-8 sm:px-6">
				<div className="flex w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-card">
					{/* Left branding panel */}
					<div className="hidden w-2/5 bg-gradient-to-br from-[#0D0D1A] via-[#1a0533] to-[#0D0D1A] p-10 lg:flex lg:flex-col lg:justify-center relative overflow-hidden">
						<div className="pointer-events-none absolute top-10 left-10 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl" />
						<div className="pointer-events-none absolute bottom-10 right-10 w-32 h-32 bg-cyan-500/15 rounded-full blur-3xl" />
						<div className="relative space-y-6">
							<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 shadow-glow">
								<span className="text-2xl">💉</span>
							</div>
							<h2 className="text-3xl font-bold text-white">Join VaxiTrack.</h2>
							<p className="text-sm text-slate-400">Create your account and manage immunization records for your family.</p>
							<div className="space-y-3 pt-2">
								<div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-2 text-sm text-slate-300">
									<span className="text-green-400">✓</span> Track every vaccine
								</div>
								<div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-2 text-sm text-slate-300">
									<span className="text-green-400">✓</span> Smart reminders
								</div>
								<div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-2 text-sm text-slate-300">
									<span className="text-green-400">✓</span> Digital QR cards
								</div>
							</div>
						</div>
					</div>
					{/* Right form panel */}
					<div className="flex w-full flex-col justify-center p-8 sm:p-10 lg:w-3/5">
						<h1 className="mb-2 text-2xl font-bold text-white">Create account</h1>
						<p className="mb-6 text-sm text-slate-400">Join VaxiTrack and manage immunization faster.</p>

						<form className="space-y-4" onSubmit={handleSubmit}>
							<Input label="Full Name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
							<Input
								label="Email"
								type="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
							/>
							<Input
								label="Password"
								type="password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
							/>
							<Input
								label="Mobile Number"
								type="tel"
								placeholder="e.g. +919876543210"
								value={phoneNumber}
								onChange={(event) => setPhoneNumber(event.target.value)}
							/>

							{fieldError ? <p className="text-sm text-red-400">{fieldError}</p> : null}
							{safeError ? <p className="text-sm text-red-400">{safeError}</p> : null}

							<Button type="submit" className="w-full" loading={loading}>
								Register
							</Button>
						</form>

						<p className="mt-4 text-sm text-slate-400">
							Already have an account?{" "}
							<Link href="/login" className="font-semibold text-violet-400 hover:text-violet-300">
								Login
							</Link>
						</p>
					</div>
				</div>
			</section>
		</main>
	);
}
