"use server";

import { requireRole, getTenantId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const topicSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  order: z.number().min(0).max(9999).optional(),
});

type TopicInput = z.infer<typeof topicSchema>;

async function recomputeCourseStats(tenantId: string, courseId: string) {
  const [topicsCount, lessonsAgg] = await Promise.all([
    prisma.courseTopic.count({
      where: { tenantId, courseId },
    }),
    prisma.courseLesson.aggregate({
      where: {
        tenantId,
        topic: { courseId },
      },
      _count: { _all: true },
      _sum: { duration: true },
    }),
  ]);

  await prisma.course.update({
    where: { id: courseId, tenantId },
    data: {
      totalTopics: topicsCount,
      totalLessons: lessonsAgg._count._all ?? 0,
      totalDuration: lessonsAgg._sum.duration ?? 0,
    },
  });
}

export async function createCourseTopic(courseId: string, data: TopicInput) {
  await requireRole("ADMIN");
  const tenantId = await getTenantId();
  const validated = topicSchema.parse(data);

  let order = validated.order;
  if (order === undefined) {
    const last = await prisma.courseTopic.findFirst({
      where: { tenantId, courseId },
      orderBy: { order: "desc" },
    });
    order = last ? last.order + 1 : 1;
  }

  const topic = await prisma.courseTopic.create({
    data: {
      tenantId,
      courseId,
      title: validated.title,
      description: validated.description,
      order,
    },
  });

  await recomputeCourseStats(tenantId, courseId);
  revalidatePath(`/course-management/courses/${courseId}/builder`);

  return { success: true, data: topic } as const;
}

export async function updateCourseTopic(id: string, data: TopicInput) {
  await requireRole("ADMIN");
  const tenantId = await getTenantId();

  const existing = await prisma.courseTopic.findFirst({
    where: { id, tenantId },
  });

  if (!existing) {
    return { success: false, error: "Chapter not found" } as const;
  }

  const validated = topicSchema.parse(data);

  const topic = await prisma.courseTopic.update({
    where: { id },
    data: {
      title: validated.title,
      description: validated.description,
      order: validated.order ?? existing.order,
    },
  });

  await recomputeCourseStats(tenantId, existing.courseId);
  revalidatePath(`/course-management/courses/${existing.courseId}/builder`);

  return { success: true, data: topic } as const;
}

export async function deleteCourseTopic(id: string) {
  await requireRole("ADMIN");
  const tenantId = await getTenantId();

  const existing = await prisma.courseTopic.findFirst({
    where: { id, tenantId },
    include: {
      _count: {
        select: {
          lessons: true,
        },
      },
    },
  });

  if (!existing) {
    return { success: false, error: "Chapter not found" } as const;
  }

  if (existing._count.lessons > 0) {
    return {
      success: false,
      error: `Cannot delete chapter with ${existing._count.lessons} lesson(s). Delete lessons first.`,
    } as const;
  }

  await prisma.courseTopic.delete({ where: { id } });

  await recomputeCourseStats(tenantId, existing.courseId);
  revalidatePath(`/course-management/courses/${existing.courseId}/builder`);

  return { success: true } as const;
}

