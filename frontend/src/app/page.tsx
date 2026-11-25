import Link from "next/link";
import { ArrowRight, BarChart3, Bell, PhoneCall, QrCode } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";

const features = [
	{
		title: "Voice Outreach Agent",
		description: "Automated AI reminder calls with conversational responses for appointment confirmation.",
		icon: PhoneCall,
		emoji: "🎙"
	},
	{
		title: "QR Digital Card",
		description: "Digital child vaccination records with downloadable QR immunization card.",
		icon: QrCode,
		emoji: "📱"
	},
	{
		title: "Analytics Dashboard",
		description: "Parent, worker, and admin panels with reminders, coverage, and report insights.",
		icon: BarChart3,
		emoji: "📊"
	},
	{
		title: "Smart Reminders",
		description: "Intelligent scheduling and automated notifications for upcoming vaccinations.",
		icon: Bell,
		emoji: "🔔"
	}
];

export default function HomePage() {
	return (
		<main className="min-h-screen bg-[#0D0D1A]">
			<Navbar />

			{/* Hero Section */}
			<section className="relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-br from-[#0D0D1A] via-[#1a0533] to-[#0D0D1A]" />

				{/* Floating glass orbs */}
				<div className="pointer-events-none absolute top-20 left-[10%] w-72 h-72 bg-purple-600/20 rounded-full blur-3xl animate-float" />
				<div className="pointer-events-none absolute top-40 right-[15%] w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float-delayed" />
				<div className="pointer-events-none absolute bottom-10 left-[40%] w-64 h-64 bg-violet-500/15 rounded-full blur-3xl animate-float" />

				<div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col items-center justify-center gap-8 px-4 py-20 text-center sm:px-6">
					<div className="fade-up space-y-6 max-w-3xl">
						<p className="inline-flex rounded-full bg-violet-500/20 border border-violet-500/30 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-violet-300">
							AI-Powered Immunization Platform
						</p>
						<h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
							Every child deserves their{" "}
							<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
								vaccine.
							</span>
						</h1>
						<p className="mx-auto max-w-xl text-lg text-slate-400">
							From smart reminder calls to real-time vaccination dashboards, Vaxi-Track turns passive records
							into active preventive healthcare outreach.
						</p>
						<div className="flex flex-wrap items-center justify-center gap-4">
							<Link href="/register">
								<Button className="gap-2 px-8 py-3 text-base">
									Get Started <ArrowRight className="h-4 w-4" />
								</Button>
							</Link>
							<Link href="/login">
								<Button variant="ghost" className="px-8 py-3 text-base border border-white/10 bg-white/5 text-white hover:bg-white/10">
									Learn More
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Feature cards bento grid */}
			<section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{features.map((item) => (
						<div
							key={item.title}
							className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(124,58,237,0.3)]"
						>
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/20 to-purple-500/20 border border-violet-500/20 text-2xl">
								{item.emoji}
							</div>
							<h3 className="text-lg font-bold text-white">{item.title}</h3>
							<p className="mt-2 text-sm text-slate-400">{item.description}</p>
						</div>
					))}
				</div>
			</section>

			<Footer />
		</main>
	);
}
