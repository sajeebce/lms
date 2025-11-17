"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { TenantStatusBadge } from "./tenant-status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type TenantRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  planName: string | null;
  planCode: string | null;
  domains: string[];
  createdAt: string;
  subscriptionStatus: string | null;
};

export function TenantTable({ tenants }: { tenants: TenantRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query) return tenants;
    return tenants.filter((tenant) => {
      const target = `${tenant.name} ${tenant.slug} ${tenant.domains.join(" ")}`.toLowerCase();
      return target.includes(query.toLowerCase());
    });
  }, [query, tenants]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Search tenant name, slug or domain"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="max-w-md"
        />
        <Button variant="outline" size="sm">
          Export CSV
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Domains</th>
              <th className="px-4 py-3">Subscription</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filtered.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-slate-50">
                <td className="px-4 py-4">
                  <div className="font-medium text-slate-900">{tenant.name}</div>
                  <div className="text-xs text-slate-500">{tenant.slug}</div>
                  <div className="mt-1">
                    <TenantStatusBadge status={tenant.status as any} />
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="font-medium">{tenant.planName ?? "—"}</div>
                  <div className="text-xs text-slate-500">{tenant.planCode ?? ""}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {tenant.domains.length ? (
                      tenant.domains.map((domain) => (
                        <Badge key={domain} variant="secondary">
                          {domain}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">No domains</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-xs uppercase tracking-wide text-slate-500">
                    {tenant.subscriptionStatus ?? "Unknown"}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-slate-500">{tenant.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
