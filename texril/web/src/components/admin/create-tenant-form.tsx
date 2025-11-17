"use client";

import { useFormState } from "react-dom";
import { createTenantAction, ActionState } from "@/app/admin/tenants/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const initialState: ActionState = {};

type PlanOption = {
  id: string;
  name: string;
  code: string;
};

export function CreateTenantForm({ plans }: { plans: PlanOption[] }) {
  const [state, formAction] = useFormState(createTenantAction, initialState);
  const [slugSuggested, setSlugSuggested] = useState("");

  return (
    <form action={formAction} className="rounded-xl border bg-white p-6 shadow-sm space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Create tenant</h2>
        <p className="text-sm text-slate-500">Provision a new customer account with plan + domain.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Tenant name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Acme Academy"
            required
            onChange={(event) => setSlugSuggested(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            placeholder="auto-generated"
            defaultValue=""
            aria-describedby="slugHelp"
          />
          <p className="text-xs text-slate-500" id="slugHelp">
            Leave blank to use: <span className="font-mono">{slugSuggested || "(tenant-name)"}</span>
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="primaryDomain">Primary domain</Label>
          <Input id="primaryDomain" name="primaryDomain" placeholder="example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="primaryEmail">Tenant admin email</Label>
          <Input id="primaryEmail" name="primaryEmail" type="email" placeholder="admin@example.com" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="planId">Plan</Label>
        <select
          id="planId"
          name="planId"
          required
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
          defaultValue=""
        >
          <option value="" disabled>
            Select plan
          </option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} ({plan.code})
            </option>
          ))}
        </select>
      </div>

      {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
      {state.success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 space-y-2">
          <p>Tenant created successfully.</p>
          {state.apiKey ? (
            <div>
              <p className="font-medium">API Key</p>
              <code className="rounded bg-white px-2 py-1 text-xs">{state.apiKey}</code>
            </div>
          ) : null}
          {state.tenantAdminTempPassword ? (
            <div>
              <p className="font-medium">Temp tenant admin password</p>
              <code className="rounded bg-white px-2 py-1 text-xs">{state.tenantAdminTempPassword}</code>
            </div>
          ) : null}
        </div>
      ) : null}

      <Button type="submit" className="w-full">
        Create tenant
      </Button>
    </form>
  );
}
