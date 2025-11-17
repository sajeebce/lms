import Link from "next/link";
import { ReactNode } from "react";

const navItems = [
  { href: "/app/admin/tenants", label: "Tenants" },
  { href: "/app/admin/plans", label: "Plans" },
  { href: "/app/admin/audit-log", label: "Audit Log" },
];

export function AdminShell({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-medium text-violet-600">Texril Admin</p>
            <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
            {description ? <p className="text-sm text-slate-500">{description}</p> : null}
          </div>
          <nav className="flex gap-4 text-sm text-slate-600">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-slate-900">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
