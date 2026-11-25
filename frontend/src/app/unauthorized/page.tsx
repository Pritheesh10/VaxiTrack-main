import Link from "next/link";

export default function UnauthorizedPage() {
	return (
		<main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
			<div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
				<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
					<span className="text-2xl">🚫</span>
				</div>
				<h1 className="text-2xl font-bold text-slate-900">Unauthorized</h1>
				<p className="mt-2 text-sm text-slate-500">You do not have permission to view this page.</p>
				<Link href="/login" className="mt-6 inline-block rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 px-6 py-2.5 text-sm font-semibold text-white shadow-glow transition-shadow hover:shadow-card-hover">
					Back to login
				</Link>
			</div>
		</main>
	);
}
