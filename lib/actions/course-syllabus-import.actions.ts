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

  // Fetch chapters and maintain their original order
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

  // Create a map to preserve the order of selected chapter IDs
  const chapterIdOrder = new Map(chapterIds.map((id, index) => [id, index]));

  // Sort chapters by the order they were selected (preserves syllabus order)
  const sortedChapters = [...chapters].sort((a, b) => {
    const orderA = chapterIdOrder.get(a.id) ?? 999;
    const orderB = chapterIdOrder.get(b.id) ?? 999;
    return orderA - orderB;
  });

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

  const createData = sortedChapters.reduce<
    {
      tenantId: string;
      courseId: string;
      title: string;
      description: string | null;
      order: number;
    }[]
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
  const course = await prisma.course.findFirst({
    where: { id: courseId, tenantId },
    select: { slug: true },
  });
  if (course?.slug) {
    revalidatePath(`/course-management/courses/${course.slug}/builder`);
  }

  return { success: true, createdCount: createData.length } as const;
}

/**
 * Check for new syllabus chapters that haven't been imported yet
 * Returns new chapters found in the question bank that aren't linked to this course
 */
export async function checkNewSyllabusChapters(courseId: string) {
  await requireRole("ADMIN");
  const tenantId = await getTenantId();

  // Get course with academic mapping
  const course = await prisma.course.findFirst({
    where: { id: courseId, tenantId },
    select: {
      id: true,
      classId: true,
      streamId: true,
      subjectId: true,
      subject: {
        select: { name: true, icon: true },
      },
    },
  });

  if (!course) {
    return { success: false, error: "Course not found" } as const;
  }

  if (!course.subjectId) {
    return {
      success: false,
      error: "Course must have a subject to check for syllabus chapters",
    } as const;
  }

  // Fetch all active chapters from Question Bank matching the course's academic scope
  const availableChapters = await prisma.chapter.findMany({
    where: {
      tenantId,
      subjectId: course.subjectId,
      classId: course.classId || undefined,
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      description: true,
      order: true,
    },
    orderBy: { order: "asc" },
  });

  // Get existing course topics that are linked to syllabus chapters
  const existingTopics = await prisma.courseTopic.findMany({
    where: {
      tenantId,
      courseId,
      sourceType: "QUESTION_BANK",
      chapterId: { not: null },
    },
    select: {
      chapterId: true,
      title: true,
    },
  });

  // Create a set of already-linked chapter IDs
  const linkedChapterIds = new Set(
    existingTopics.map((t) => t.chapterId).filter((id): id is string => !!id)
  );

  // Also check by title (case-insensitive) for chapters imported before chapterId linking
  const existingTitles = new Set(
    (
      await prisma.courseTopic.findMany({
        where: { tenantId, courseId },
        select: { title: true },
      })
    ).map((t) => t.title.trim().toLowerCase())
  );

  // Filter out chapters that are already linked or have matching titles
  const newChapters = availableChapters.filter(
    (ch) =>
      !linkedChapterIds.has(ch.id) &&
      !existingTitles.has(ch.name.trim().toLowerCase())
  );

  return {
    success: true,
    newChaptersCount: newChapters.length,
    newChapters: newChapters.map((ch) => ({
      id: ch.id,
      name: ch.name,
      description: ch.description,
      order: ch.order,
    })),
    subjectName: course.subject?.name || "Unknown Subject",
    subjectIcon: course.subject?.icon || null,
  } as const;
}
