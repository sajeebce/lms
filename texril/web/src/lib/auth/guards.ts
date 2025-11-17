import { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login`);
  }
  return session.user;
}

export async function requireRole(role: UserRole | UserRole[]) {
  const allowedRoles = Array.isArray(role) ? role : [role];
  const user = await requireUser();
  if (!allowedRoles.includes(user.role as UserRole)) {
    notFound();
  }
  return user;
}

export async function requireTenantContext() {
  const user = await requireRole([UserRole.TENANT_ADMIN, UserRole.EDITOR]);
  if (!user.tenantId) {
    throw new Error("Tenant context missing");
  }
  return user.tenantId;
}
