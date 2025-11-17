import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { CreateTenantForm } from "@/components/admin/create-tenant-form";
import { TenantTable } from "@/components/admin/tenant-table";

export const dynamic = "force-dynamic";

export default async function AdminTenantsPage() {
  const [tenants, plans] = await Promise.all([
    prisma.tenant.findMany({
      include: {
        plan: true,
        domains: true,
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.plan.findMany({ where: { isActive: true }, orderBy: { priceMonthly: "asc" } }),
  ]);

  const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

  const tenantRows = tenants.map((tenant) => ({
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    planName: tenant.plan?.name ?? null,
    planCode: tenant.plan?.code ?? null,
    domains: tenant.domains.map((domain) => domain.domain),
    createdAt: dateFormatter.format(tenant.createdAt),
    subscriptionStatus: tenant.subscriptions[0]?.status ?? null,
  }));

  const planOptions = plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    code: plan.code,
  }));

  return (
    <AdminShell title="Tenants" description="Manage SaaS customers, plans and API keys">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TenantTable tenants={tenantRows} />
        </div>
        <div className="lg:col-span-1">
          <CreateTenantForm plans={planOptions} />
        </div>
      </div>
    </AdminShell>
  );
}
