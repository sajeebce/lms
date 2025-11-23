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
  // Lesson-level settings
  accessType: z.enum(["PUBLIC", "PASSWORD", "ENROLLED_ONLY"]).optional(),
  password: z.string().max(100).optional(),
  allowDownload: z.boolean().optional(),
  scheduledAt: z.date().optional(),
  attachmentsJson: z.string().optional(),
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
      accessType: validated.accessType ?? "ENROLLED_ONLY",
      password: validated.password,
      allowDownload: validated.allowDownload ?? true,
      scheduledAt: validated.scheduledAt,
      attachmentsJson: validated.attachmentsJson,
      order,
    },
  });

  await recomputeCourseStats(tenantId, topic.courseId);
  const course = await prisma.course.findFirst({
    where: { id: topic.courseId, tenantId },
    select: { slug: true },
  });
  if (course?.slug) {
    revalidatePath(`/course-management/courses/${course.slug}/builder`);
  }

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
      accessType: validated.accessType ?? existing.accessType,
      password: validated.password,
      allowDownload: validated.allowDownload ?? existing.allowDownload,
      scheduledAt: validated.scheduledAt,
      attachmentsJson: validated.attachmentsJson,
      order: validated.order ?? existing.order,
    },
  });

  await recomputeCourseStats(tenantId, existing.topic.courseId);
  const course = await prisma.course.findFirst({
    where: { id: existing.topic.courseId, tenantId },
    select: { slug: true },
  });
  if (course?.slug) {
    revalidatePath(`/course-management/courses/${course.slug}/builder`);
  }

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
  const course = await prisma.course.findFirst({
    where: { id: existing.topic.courseId, tenantId },
    select: { slug: true },
  });
  if (course?.slug) {
    revalidatePath(`/course-management/courses/${course.slug}/builder`);
  }

  return { success: true } as const;
}

export async function duplicateCourseLesson(id: string) {
  await requireRole("ADMIN");
  const tenantId = await getTenantId();

  const existing = await prisma.courseLesson.findFirst({
    where: { id, tenantId },
    include: { topic: true },
  });

  if (!existing) {
    return { success: false, error: "Lesson not found" } as const;
  }

  // Get the last order in the topic
  const last = await prisma.courseLesson.findFirst({
    where: { tenantId, topicId: existing.topicId },
    orderBy: { order: "desc" },
  });

  const newOrder = last ? last.order + 1 : 1;

  // Create duplicate
  const duplicate = await prisma.courseLesson.create({
    data: {
      tenantId,
      topicId: existing.topicId,
      title: `${existing.title} (Copy)`,
      description: existing.description,
      lessonType: existing.lessonType,
      videoUrl: existing.videoUrl,
      documentPath: existing.documentPath,
      textContent: existing.textContent,
      duration: existing.duration,
      isPreview: existing.isPreview,
      order: newOrder,
    },
  });

  await recomputeCourseStats(tenantId, existing.topic.courseId);
  const course = await prisma.course.findFirst({
    where: { id: existing.topic.courseId, tenantId },
    select: { slug: true },
  });
  if (course?.slug) {
    revalidatePath(`/course-management/courses/${course.slug}/builder`);
  }

  return { success: true, data: duplicate } as const;
}

/**
 * Upload lesson document (server action)
 */
export async function uploadLessonDocument(
  lessonId: string,
  formData: FormData
) {
  await requireRole("ADMIN");
  await getTenantId();

  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file provided" } as const;
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: "Invalid file type. Only PDF, DOC, DOCX, PPT, PPTX are allowed.",
      } as const;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        error: "File size must be less than 10MB",
      } as const;
    }

    const { getStorageService } = await import("@/lib/storage/storage-service");
    const storageService = getStorageService();
    const result = await storageService.uploadLessonDocument(lessonId, file);

    return { success: true, data: result } as const;
  } catch (error) {
    console.error("Document upload error:", error);
    return { success: false, error: "Failed to upload document" } as const;
  }
}

/**
 * Upload lesson video (server action)
 */
export async function uploadLessonVideo(lessonId: string, formData: FormData) {
  await requireRole("ADMIN");
  await getTenantId();

  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file provided" } as const;
    }

    // Validate file type
    const allowedTypes = ["video/mp4", "video/webm", "video/ogg"];

    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: "Invalid file type. Only MP4, WebM, OGG are allowed.",
      } as const;
    }

    // Validate file size (100MB max)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        error: "File size must be less than 100MB",
      } as const;
    }

    const { getStorageService } = await import("@/lib/storage/storage-service");
    const storageService = getStorageService();
    const result = await storageService.uploadLessonVideo(lessonId, file);

    return { success: true, data: result } as const;
  } catch (error) {
    console.error("Video upload error:", error);
    return { success: false, error: "Failed to upload video" } as const;
  }
}

/**
 * Reorder lessons within a topic
 */
export async function reorderLessons(
  topicId: string,
  lessonIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole("ADMIN");
    const tenantId = await getTenantId();

    // Verify all lessons belong to this topic and tenant
    const lessons = await prisma.courseLesson.findMany({
      where: {
        id: { in: lessonIds },
        topicId,
        tenantId,
      },
      select: { id: true },
    });

    if (lessons.length !== lessonIds.length) {
      return {
        success: false,
        error: "Some lessons not found or don't belong to this topic",
      } as const;
    }

    // Update order for each lesson
    await Promise.all(
      lessonIds.map((lessonId, index) =>
        prisma.courseLesson.update({
          where: { id: lessonId, tenantId },
          data: { order: index + 1 },
        })
      )
    );

    // Get courseId for revalidation
    const topic = await prisma.courseTopic.findUnique({
      where: { id: topicId, tenantId },
      select: { courseId: true },
    });

    if (topic) {
      const course = await prisma.course.findFirst({
        where: { id: topic.courseId, tenantId },
        select: { slug: true },
      });
      if (course?.slug) {
        revalidatePath(`/course-management/courses/${course.slug}/builder`);
      }
    }

    return { success: true } as const;
  } catch (error) {
    console.error("Reorder lessons error:", error);
    return { success: false, error: "Failed to reorder lessons" } as const;
  }
}
