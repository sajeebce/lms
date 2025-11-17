"use server";

import { requireRole, getTenantId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Create Subject
export async function createSubject(data: {
  name: string;
  code?: string;
  description?: string;
  icon?: string;
  color?: string;
  order?: number;
}) {
  // 1. ROLE GUARD
  await requireRole("ADMIN");

  // 2. TENANT ID
  const tenantId = await getTenantId();

  // 3. ZOD VALIDATION
  const schema = z.object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be 100 characters or less"),
    code: z.string().max(20, "Code must be 20 characters or less").optional(),
    description: z
      .string()
      .max(500, "Description must be 500 characters or less")
      .optional(),
    icon: z.string().max(50, "Icon must be 50 characters or less").optional(),
    color: z.string().max(20, "Color must be 20 characters or less").optional(),
    order: z.number().min(0).max(9999).optional(),
  });

  try {
    const validated = schema.parse(data);

    // Check duplicate name
    const existing = await prisma.subject.findFirst({
      where: {
        tenantId,
        name: validated.name,
      },
    });

    if (existing) {
      return { success: false, error: "Subject with this name already exists" };
    }

    // Determine order: auto-increment if not provided
    let order = validated.order;
    if (order === undefined) {
      const lastSubject = await prisma.subject.findFirst({
        where: {
          tenantId,
        },
        orderBy: {
          order: "desc",
        },
      });

      order = lastSubject ? lastSubject.order + 1 : 1;
    }

    // Enforce unique order per tenant
    const existingOrder = await prisma.subject.findFirst({
      where: {
        tenantId,
        order,
      },
    });

    if (existingOrder) {
      return {
        success: false,
        error: `Order ${order} is already used for another subject. Please choose a different order number.`,
      };
    }

    // 4. TENANT ISOLATION
    const subject = await prisma.subject.create({
      data: {
        ...validated,
        order,
        tenantId,
        status: "ACTIVE",
      },
    });

    // 5. REVALIDATE PATH
    revalidatePath("/academic-setup/subjects");

    // 6. RETURN CONSISTENT FORMAT
    return { success: true, subjectId: subject.id };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Failed to create subject" };
  }
}

// Update Subject
export async function updateSubject(
  id: string,
  data: {
    name?: string;
    code?: string;
    description?: string;
    icon?: string;
    color?: string;
    order?: number;
    status?: "ACTIVE" | "INACTIVE";
  }
) {
  // 1. ROLE GUARD
  await requireRole("ADMIN");

  // 2. TENANT ID
  const tenantId = await getTenantId();

  // 3. ZOD VALIDATION
  const schema = z.object({
    name: z.string().min(1).max(100).optional(),
    code: z.string().max(20).optional(),
    description: z.string().max(500).optional(),
    icon: z.string().max(50).optional(),
    color: z.string().max(20).optional(),
    order: z.number().min(0).max(9999).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  });

  try {
    const validated = schema.parse(data);

    // 4. OWNERSHIP CHECK
    const subject = await prisma.subject.findFirst({
      where: { id, tenantId },
    });

    if (!subject) {
      return { success: false, error: "Subject not found" };
    }

    // Check duplicate name
    if (validated.name && validated.name !== subject.name) {
      const existing = await prisma.subject.findFirst({
        where: {
          tenantId,
          name: validated.name,
          id: { not: id },
        },
      });

      if (existing) {
        return {
          success: false,
          error: "Subject with this name already exists",
        };
      }
    }

    // Check duplicate order (per tenant)
    if (validated.order !== undefined && validated.order !== subject.order) {
      const orderClash = await prisma.subject.findFirst({
        where: {
          tenantId,
          order: validated.order,
          id: { not: id },
        },
      });

      if (orderClash) {
        return {
          success: false,
          error: `Order ${validated.order} is already used for another subject. Please choose a different order number.`,
        };
      }
    }

    // Update subject
    await prisma.subject.update({
      where: { id },
      data: validated,
    });

    // 5. REVALIDATE PATH
    revalidatePath("/academic-setup/subjects");

    // 6. RETURN CONSISTENT FORMAT
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Failed to update subject" };
  }
}

// Delete Subject
export async function deleteSubject(id: string) {
  // 1. ROLE GUARD
  await requireRole("ADMIN");

  // 2. TENANT ID
  const tenantId = await getTenantId();

  try {
    // 4. OWNERSHIP CHECK
    const subject = await prisma.subject.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { courses: true, chapters: true },
        },
      },
    });

    if (!subject) {
      return { success: false, error: "Subject not found" };
    }

    // Delete guard - check if courses exist
    if (subject._count.courses > 0) {
      return {
        success: false,
        error: `Cannot delete subject. ${subject._count.courses} course(s) are using this subject.`,
      };
    }

    // Delete guard - check if chapters exist
    if (subject._count.chapters > 0) {
      return {
        success: false,
        error: `Cannot delete subject. ${subject._count.chapters} chapter(s) are using this subject.`,
      };
    }

    // Delete subject
    await prisma.subject.delete({
      where: { id },
    });

    // 5. REVALIDATE PATH
    revalidatePath("/academic-setup/subjects");

    // 6. RETURN CONSISTENT FORMAT
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete subject" };
  }
}

// Get Subjects
export async function getSubjects(filters?: {
  status?: "ACTIVE" | "INACTIVE";
  search?: string;
}) {
  // 1. ROLE GUARD
  await requireRole(["ADMIN", "TEACHER"]);

  // 2. TENANT ID
  const tenantId = await getTenantId();

  // 4. TENANT ISOLATION
  const subjects = await prisma.subject.findMany({
    where: {
      tenantId,
      status: filters?.status,
      name: filters?.search
        ? { contains: filters.search, mode: "insensitive" }
        : undefined,
    },
    include: {
      _count: {
        select: { courses: true, chapters: true },
      },
    },
    orderBy: { order: "asc" },
  });

  return subjects;
}

// Get Subject by ID
export async function getSubjectById(id: string) {
  // 1. ROLE GUARD
  await requireRole(["ADMIN", "TEACHER"]);

  // 2. TENANT ID
  const tenantId = await getTenantId();

  // 4. OWNERSHIP CHECK + TENANT ISOLATION
  const subject = await prisma.subject.findFirst({
    where: { id, tenantId },
    include: {
      _count: {
        select: { courses: true, chapters: true },
      },
    },
  });

  return subject;
}
