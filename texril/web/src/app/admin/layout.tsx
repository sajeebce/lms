import { ReactNode } from "react";
import { requireRole } from "@/lib/auth/guards";
import { UserRole } from "@prisma/client";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole(UserRole.SUPER_ADMIN);
  return children;
}
