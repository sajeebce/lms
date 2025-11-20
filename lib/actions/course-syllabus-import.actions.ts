"use server";

import { requireRole, getTenantId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const importSchema = z.object({
  courseId: z.string().min(1, "Course is required"),
  chapterIds: z
    .array(z.string().min(1))
    .min(1, "Select at least one chapter to import"),
});

type ImportInput = z.infer<typeof importSchema>;

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

export async function importChaptersToCourse(input: ImportInput) {
  await requireRole("ADMIN");
  const tenantId = await getTenantId();
  const { courseId, chapterIds } = importSchema.parse(input);

  const course = await prisma.course.findFirst({
    where: { id: courseId, tenantId },
    select: { id: true },
  });

  if (!course) {
    return { success: false, error: "Course not found" } as const;
  }

  const chapters = await prisma.chapter.findMany({
    where: {
      tenantId,
      id: { in: chapterIds },
    },
    orderBy: { order: "asc" },
  });

  if (!chapters.length) {
    return { success: false, error: "No chapters found for import" } as const;
  }

  const existingTopics = await prisma.courseTopic.findMany({
    where: { tenantId, courseId },
    select: { title: true },
  });

  const existingTitles = new Set(
    existingTopics.map((t) => t.title.trim().toLowerCase())
  );

  const lastTopic = await prisma.courseTopic.findFirst({
    where: { tenantId, courseId },
    orderBy: { order: "desc" },
  });

  let nextOrder = lastTopic ? lastTopic.order + 1 : 1;

  const createData = chapters.reduce<
    { tenantId: string; courseId: string; title: string; description: string | null; order: number }[]
  >((acc, chapter) => {
    const title = chapter.name.trim();
    const key = title.toLowerCase();

    if (existingTitles.has(key)) {
      return acc;
    }

    existingTitles.add(key);

    acc.push({
      tenantId,
      courseId,
      title,
      description: chapter.description ?? null,
      order: nextOrder++,
    });

    return acc;
  }, []);

  if (!createData.length) {
    return {
      success: false,
      error: "All selected chapters already exist in this course",
    } as const;
  }

  await prisma.courseTopic.createMany({ data: createData });

  await recomputeCourseStats(tenantId, courseId);
  revalidatePath(`/course-management/courses/${courseId}/builder`);

  return { success: true, createdCount: createData.length } as const;
}

