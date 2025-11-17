"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";
import { UserRole, TenantStatus, SubscriptionStatus } from "@prisma/client";
import { createTenantSchema } from "@/lib/validators/tenant";
import { slugify } from "@/lib/slugify";
import { generateApiKey, hashApiKey } from "@/lib/api-key";
import { hashPassword } from "@/lib/auth/hash";
import { revalidatePath } from "next/cache";

export type ActionState = {
  success?: boolean;
  error?: string;
  apiKey?: string;
  tenantAdminTempPassword?: string;
};

export async function createTenantAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(UserRole.SUPER_ADMIN);

  const parsed = createTenantSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    planId: formData.get("planId"),
    primaryDomain: formData.get("primaryDomain") || undefined,
    primaryEmail: formData.get("primaryEmail"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const { name, planId, primaryDomain, primaryEmail } = parsed.data;
  let { slug } = parsed.data;

  const plan = await prisma.plan.findUnique({ where: { id: planId, isActive: true } });
  if (!plan) {
    return { error: "Selected plan not found" };
  }

  if (!slug || slug.length === 0) {
    slug = slugify(name);
  }

  slug = slugify(slug);

  let finalSlug = slug;
  let counter = 1;
  while (await prisma.tenant.findUnique({ where: { slug: finalSlug } })) {
    finalSlug = `${slug}-${counter}`.slice(0, 64);
    counter++;
  }

  const apiKeyPlain = generateApiKey();
  const apiKeyHash = hashApiKey(apiKeyPlain);

  try {
    const tempPassword = generateApiKey();
    const tempPasswordHash = await hashPassword(tempPassword);

    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug: finalSlug,
        status: TenantStatus.TRIAL,
        planId: plan.id,
        users: {
          create: {
            email: primaryEmail.toLowerCase(),
            role: UserRole.TENANT_ADMIN,
            passwordHash: tempPasswordHash,
          },
        },
      },
    });

    await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        planId: plan.id,
        status: SubscriptionStatus.TRIALING,
      },
    });

    if (primaryDomain) {
      await prisma.tenantDomain.create({
        data: {
          tenantId: tenant.id,
          domain: primaryDomain.toLowerCase(),
        },
      });
    }

    await prisma.apiKey.create({
      data: {
        tenantId: tenant.id,
        keyHash: apiKeyHash,
        label: "Default",
      },
    });

    revalidatePath("/app/admin/tenants");
    return { success: true, apiKey: apiKeyPlain, tenantAdminTempPassword: tempPassword };
  } catch (error) {
    console.error("create tenant failed", error);
    return { error: "Failed to create tenant. Please try again." };
  }
}
