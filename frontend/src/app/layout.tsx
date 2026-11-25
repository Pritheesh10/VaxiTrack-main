import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter"
});

export const metadata: Metadata = {
	title: "Vaxi-Track",
	description: "AI-powered digital immunization outreach platform"
};

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`${inter.variable} font-sans bg-[#0D0D1A] text-slate-100`}>
				{children}
				<Toaster
					position="top-right"
					toastOptions={{
						duration: 3500,
						style: {
							borderRadius: "16px",
							background: "rgba(255,255,255,0.05)",
							backdropFilter: "blur(20px)",
							color: "#F1F5F9",
							border: "1px solid rgba(255,255,255,0.1)",
							fontSize: "14px",
							boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
						},
						success: {
							iconTheme: { primary: "#10B981", secondary: "#F1F5F9" },
							style: { borderLeft: "3px solid #10B981" },
						},
						error: {
							iconTheme: { primary: "#EF4444", secondary: "#F1F5F9" },
							style: { borderLeft: "3px solid #EF4444" },
						},
					}}
				/>
			</body>
		</html>
	);
}
