import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function decodeJwtPayload(token: string) {
	try {
		const base64Payload = token.split(".")[1];
		if (!base64Payload) return null;
		const padded = base64Payload.padEnd(base64Payload.length + ((4 - (base64Payload.length % 4)) % 4), "=");
		const payload = JSON.parse(atob(padded.replace(/-/g, "+").replace(/_/g, "/")));
		return payload;
	} catch {
		return null;
	}
}

export function middleware(request: NextRequest) {
	if (!request.nextUrl.pathname.startsWith("/admin")) {
		return NextResponse.next();
	}

	const token = request.cookies.get("vaxi-track-token")?.value ?? request.cookies.get("token")?.value;
	const fallbackToken = request.headers.get("authorization")?.replace("Bearer ", "") ?? "";
	const localToken = token || fallbackToken;

	if (!localToken) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	const payload = decodeJwtPayload(localToken);
	const normalizedRole = String(payload?.role ?? "").trim().toLowerCase();
	if (!payload || normalizedRole !== "admin") {
		return NextResponse.redirect(new URL("/unauthorized", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/admin/:path*"],
};
