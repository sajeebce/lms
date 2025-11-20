"use server";

import { requireRole } from "@/lib/auth";
import { getTenantId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ============================================
// VALIDATION SCHEMAS
// ============================================

const chapterSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  classId: z.string().min(1, "Class is required"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  code: z.string().max(20, "Code must be 20 characters or less").optional(),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  order: z.number().min(0).max(9999).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

type ChapterInput = z.infer<typeof chapterSchema>;

// ============================================
// GET CHAPTERS
// ============================================

type GetChaptersOptions = {
  subjectId?: string;
  classId?: string;
  status?: "ACTIVE" | "INACTIVE";
};

export async function getChapters(options: GetChaptersOptions = {}) {
  const tenantId = await getTenantId();

  const chapters = await prisma.chapter.findMany({
    where: {
      tenantId,
      ...(options.subjectId && { subjectId: options.subjectId }),
      ...(options.classId && { classId: options.classId }),
      ...(options.status && { status: options.status }),
    },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          icon: true,
          color: true,
        },
      },
      class: {
        select: {
          id: true,
          name: true,
          alias: true,
        },
      },
      _count: {
        select: {
          topics: true,
        },
      },
      topics: {
        select: {
          _count: {
            select: {
              questions: true,
            },
          },
        },
      },
    },
    orderBy: [
      { classId: "asc" },
      { subjectId: "asc" },
      { order: "asc" },
      { name: "asc" },
    ],
  });

  // Calculate total question count per chapter
  const chaptersWithQuestionCount = chapters.map((chapter) => {
    const totalQuestions = chapter.topics.reduce(
      (sum, topic) => sum + topic._count.questions,
      0
    );
    return {
      ...chapter,
      _count: {
        ...chapter._count,
        questions: totalQuestions,
      },
    };
  });

  return chaptersWithQuestionCount;
}

// ============================================
// GET CHAPTER BY ID
// ============================================

export async function getChapterById(id: string) {
  const tenantId = await getTenantId();

  const chapter = await prisma.chapter.findFirst({
    where: {
      id,
      tenantId,
    },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          icon: true,
        },
      },
      class: {
        select: {
          id: true,
          name: true,
          alias: true,
        },
      },
      _count: {
        select: {
          topics: true,
        },
      },
    },
  });

  return chapter;
}

// ============================================
// CREATE CHAPTER
// ============================================

export async function createChapter(data: ChapterInput) {
  await requireRole("ADMIN");
  const tenantId = await getTenantId();

  // Validate input
  const validated = chapterSchema.parse(data);

  // Check for duplicate name within same subject + class
  const existing = await prisma.chapter.findFirst({
    where: {
      tenantId,
      subjectId: validated.subjectId,
      classId: validated.classId,
      name: validated.name,
    },
  });

  if (existing) {
    return {
      success: false,
      error:
        "A chapter with this name already exists for this subject and class",
    };
  }

  // Get next order number if not provided
  let order = validated.order;
  if (order === undefined) {
    const lastChapter = await prisma.chapter.findFirst({
      where: {
        tenantId,
        subjectId: validated.subjectId,
        classId: validated.classId,
      },
      orderBy: { order: "desc" },
    });
    order = lastChapter ? lastChapter.order + 1 : 1;
  }

  // Enforce unique order within subject + class
  const existingOrder = await prisma.chapter.findFirst({
    where: {
      tenantId,
      subjectId: validated.subjectId,
      classId: validated.classId,
      order,
    },
  });

  if (existingOrder) {
    return {
      success: false,
      error: `Order ${order} is already used for another chapter in this subject and class. Please choose a different order number.`,
    };
  }

  // Create chapter
  const chapter = await prisma.chapter.create({
    data: {
      ...validated,
      order,
      tenantId,
      status: validated.status || "ACTIVE",
    },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          icon: true,
          color: true,
        },
      },
      class: {
        select: {
          id: true,
          name: true,
          alias: true,
        },
      },
      _count: {
        select: {
          topics: true,
        },
      },
    },
  });

  revalidatePath("/academic-setup/chapters");

  return {
    success: true,
    data: chapter,
  };
}

// ============================================
// UPDATE CHAPTER
// ============================================

export async function updateChapter(id: string, data: ChapterInput) {
  await requireRole("ADMIN");
  const tenantId = await getTenantId();

  // Validate input
  const validated = chapterSchema.parse(data);

  // Check if chapter exists
  const existing = await prisma.chapter.findFirst({
    where: { id, tenantId },
  });

  if (!existing) {
    return {
      success: false,
      error: "Chapter not found",
    };
  }

  // Check for duplicate name (excluding current chapter)
  const duplicate = await prisma.chapter.findFirst({
    where: {
      tenantId,
      subjectId: validated.subjectId,
      classId: validated.classId,
      name: validated.name,
      id: { not: id },
    },
  });

  if (duplicate) {
    return {
      success: false,
      error:
        "A chapter with this name already exists for this subject and class",
    };
  }

  // Check for duplicate order within subject + class (excluding current chapter)
  if (validated.order !== undefined && validated.order !== existing.order) {
    const orderDuplicate = await prisma.chapter.findFirst({
      where: {
        tenantId,
        subjectId: validated.subjectId,
        classId: validated.classId,
        order: validated.order,
        id: { not: id },
      },
    });

    if (orderDuplicate) {
      return {
        success: false,
        error: `Order ${validated.order} is already used for another chapter in this subject and class. Please choose a different order number.`,
      };
    }
  }

  // Update chapter
  const chapter = await prisma.chapter.update({
    where: { id },
    data: validated,
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          icon: true,
          color: true,
        },
      },
      class: {
        select: {
          id: true,
          name: true,
          alias: true,
        },
      },
      _count: {
        select: {
          topics: true,
        },
      },
    },
  });

  revalidatePath("/academic-setup/chapters");

  return {
    success: true,
    data: chapter,
  };
}

// ============================================
// DELETE CHAPTER
// ============================================

export async function deleteChapter(id: string) {
  await requireRole("ADMIN");
  const tenantId = await getTenantId();

  // Check if chapter exists
  const chapter = await prisma.chapter.findFirst({
    where: { id, tenantId },
    include: {
      _count: {
        select: {
          topics: true,
        },
      },
    },
  });

  if (!chapter) {
    return {
      success: false,
      error: "Chapter not found",
    };
  }

  // Prevent deletion if topics exist
  if (chapter._count.topics > 0) {
    return {
      success: false,
      error: `Cannot delete chapter. It has ${chapter._count.topics} topic(s) associated with it.`,
    };
  }

  // Delete chapter
  await prisma.chapter.delete({
    where: { id },
  });

  revalidatePath("/academic-setup/chapters");

  return {
    success: true,
  };
}
