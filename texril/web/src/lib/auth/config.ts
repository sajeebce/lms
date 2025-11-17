import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/hash";

export const authConfig: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user) {
          return null;
        }

        const valid = await verifyPassword(credentials.password, user.passwordHash);
        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
        } satisfies {
          id: string;
          email: string;
          name: string | null;
          role: string;
          tenantId?: string | null;
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.tenantId = (user as any).tenantId ?? null;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user = {
          id: token.id as string,
          email: (token.email as string) ?? session.user?.email ?? "",
          role: (token.role as string) ?? "EDITOR",
          tenantId: (token.tenantId as string | null) ?? undefined,
        };
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLoginRoute = nextUrl.pathname === "/login";
      if (!isLoggedIn && isProtectedRoute(nextUrl.pathname) && !isLoginRoute) {
        return false;
      }
      if (isLoggedIn && isLoginRoute) {
        return Response.redirect(new URL("/app/admin/tenants", nextUrl));
      }
      return true;
    },
  },
};

const ADMIN_PREFIX = "/app/admin";
const TENANT_PREFIX = "/app/tenant";

function isProtectedRoute(pathname: string) {
  return pathname.startsWith("/app");
}

export function enforceRouteRole(pathname: string, role?: string | null, tenantId?: string | null) {
  if (pathname.startsWith(ADMIN_PREFIX)) {
    return role === "SUPER_ADMIN";
  }

  if (pathname.startsWith(TENANT_PREFIX)) {
    return !!tenantId;
  }

  return true;
}
