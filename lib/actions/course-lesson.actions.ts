"use server";

import { requireRole, getTenantId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const lessonSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  lessonType: z.enum(["TEXT", "VIDEO_YOUTUBE", "DOCUMENT"]),
  videoUrl: z
    .string()
    .max(500, "Video URL must be 500 characters or less")
    .optional(),
  documentPath: z
    .string()
    .max(500, "Document path must be 500 characters or less")
    .optional(),
  textContent: z.string().optional(),
  duration: z.number().min(0).max(9999).optional(),
  isPreview: z.boolean().optional(),
  order: z.number().min(0).max(9999).optional(),
});

type LessonInput = z.infer<typeof lessonSchema>;

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

function validateTypeSpecificFields(input: LessonInput) {
  if (input.lessonType === "TEXT" && !input.textContent) {
    throw new Error("Text content is required for text lessons");
  }
  if (input.lessonType === "VIDEO_YOUTUBE" && !input.videoUrl) {
    throw new Error("Video URL is required for video lessons");
  }
  if (input.lessonType === "DOCUMENT" && !input.documentPath) {
    throw new Error("Document path is required for document lessons");
  }
}

export async function createCourseLesson(topicId: string, data: LessonInput) {
  await requireRole("ADMIN");
  const tenantId = await getTenantId();

  const topic = await prisma.courseTopic.findFirst({
    where: { id: topicId, tenantId },
  });

  if (!topic) {
    return { success: false, error: "Chapter not found" } as const;
  }

  const validated = lessonSchema.parse(data);
  validateTypeSpecificFields(validated);

  let order = validated.order;
  if (order === undefined) {
    const last = await prisma.courseLesson.findFirst({
      where: { tenantId, topicId },
      orderBy: { order: "desc" },
    });
    order = last ? last.order + 1 : 1;
  }

  const lesson = await prisma.courseLesson.create({
    data: {
      tenantId,
      topicId,
      title: validated.title,
      description: validated.description,
      lessonType: validated.lessonType,
      videoUrl: validated.videoUrl,
      documentPath: validated.documentPath,
      textContent: validated.textContent,
      duration: validated.duration,
      isPreview: validated.isPreview ?? false,
      order,
    },
  });

  await recomputeCourseStats(tenantId, topic.courseId);
  revalidatePath(`/course-management/courses/${topic.courseId}/builder`);

  return { success: true, data: lesson } as const;
}

export async function updateCourseLesson(id: string, data: LessonInput) {
  await requireRole("ADMIN");
  const tenantId = await getTenantId();

  const existing = await prisma.courseLesson.findFirst({
    where: { id, tenantId },
    include: { topic: true },
  });

  if (!existing) {
    return { success: false, error: "Lesson not found" } as const;
  }

  const validated = lessonSchema.parse(data);
  validateTypeSpecificFields(validated);

  const lesson = await prisma.courseLesson.update({
    where: { id },
    data: {
      title: validated.title,
      description: validated.description,
      lessonType: validated.lessonType,
      videoUrl: validated.videoUrl,
      documentPath: validated.documentPath,
      textContent: validated.textContent,
      duration: validated.duration,
      isPreview: validated.isPreview ?? existing.isPreview,
      order: validated.order ?? existing.order,
    },
  });

  await recomputeCourseStats(tenantId, existing.topic.courseId);
  revalidatePath(`/course-management/courses/${existing.topic.courseId}/builder`);

  return { success: true, data: lesson } as const;
}

export async function deleteCourseLesson(id: string) {
  await requireRole("ADMIN");
  const tenantId = await getTenantId();

  const existing = await prisma.courseLesson.findFirst({
    where: { id, tenantId },
    include: { topic: true },
  });

  if (!existing) {
    return { success: false, error: "Lesson not found" } as const;
  }

  await prisma.courseLesson.delete({ where: { id } });

  await recomputeCourseStats(tenantId, existing.topic.courseId);
  revalidatePath(`/course-management/courses/${existing.topic.courseId}/builder`);

  return { success: true } as const;
}

