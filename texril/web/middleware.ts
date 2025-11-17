import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const ADMIN_PREFIX = "/app/admin";
const TENANT_PREFIX = "/app/tenant";

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  if (!req.auth?.user && pathname.startsWith("/app")) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  const role = req.auth?.user?.role;
  const tenantId = req.auth?.user?.tenantId;

  if (pathname.startsWith(ADMIN_PREFIX) && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/app/tenant", nextUrl));
  }

  if (pathname.startsWith(TENANT_PREFIX) && !tenantId) {
    return NextResponse.redirect(new URL("/app/admin/tenants", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/app/:path*"],
};
