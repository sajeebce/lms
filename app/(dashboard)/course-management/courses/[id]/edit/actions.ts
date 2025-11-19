"use server";

import { requireRole, getTenantId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStorageService } from "@/lib/storage/storage-service";
import { revalidatePath } from "next/cache";
import { z } from "zod";

async function cleanupCourseScheduledImagesForTenantCourse(
  tenantId: string,
  courseId: string
) {
  const storageService = getStorageService();

  const files = await prisma.uploadedFile.findMany({
    where: {
      tenantId,
      category: "course_scheduled_image",
      entityType: "course",
      entityId: courseId,
    },
  });

  for (const file of files) {
    try {
      await storageService.deleteUploadedFile(file.id);
    } catch (error) {
      console.error("Failed to delete scheduled course image", {
        fileId: file.id,
        courseId,
        tenantId,
        error,
      });
    }
  }
}

const courseSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    slug: z.string().min(1, "Slug is required").max(200),
    categoryId: z.string().optional(),
    description: z.string().optional(),
    shortDescription: z.string().max(500).optional(),
    classId: z.string().optional(),
    subjectId: z.string().optional(),
    streamId: z.string().optional(),
    paymentType: z.enum(["FREE", "ONE_TIME", "SUBSCRIPTION"]),
    invoiceTitle: z.string().max(200).optional(),
    regularPrice: z.number().min(0).optional(),
    offerPrice: z.number().min(0).optional(),
    currency: z.string().default("BDT"),
    subscriptionDuration: z.number().min(1).optional(),
    subscriptionType: z
      .enum(["MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"])
      .optional(),
    autoGenerateInvoice: z.boolean().default(true),
    featuredImage: z.string().optional(),
    introVideoUrl: z.string().optional(),
    introVideoAutoplay: z.boolean().default(false),
    metaTitle: z.string().max(200).optional(),
    metaDescription: z.string().max(500).optional(),
    metaKeywords: z.string().max(500).optional(),
    fakeEnrollmentCount: z
      .number()
      .int()
      .min(0, "Fake enrollment count cannot be negative")
      .max(9999, "Fake enrollment count must be 9999 or less")
      .optional(),

    // Settings
    status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "PRIVATE"]),
    visibility: z
      .enum(["PUBLIC", "UNLISTED", "PRIVATE", "INTERNAL_ONLY"])
      .default("PUBLIC"),
    publishedAt: z.date().optional(),
    scheduledAt: z.date().optional(),
    isFeatured: z.boolean().default(false),
    allowComments: z.boolean().default(true),
    certificateEnabled: z.boolean().default(false),

    // Schedule & access
    showComingSoon: z.boolean().default(false),
    comingSoonImage: z.string().max(500).optional(),
    allowCurriculumPreview: z.boolean().default(false),

    // Enrollment (course-level defaults)
    maxStudents: z
      .number()
      .int()
      .min(0, "Maximum students cannot be negative")
      .max(9999, "Maximum students must be 9999 or less")
      .optional(),
    enrollmentStartAt: z.date().optional(),
    enrollmentEndAt: z.date().optional(),
    enrollmentStatus: z
      .enum(["OPEN", "PAUSED", "CLOSED", "INVITE_ONLY"])
      .default("OPEN"),
    defaultEnrollmentDurationDays: z
      .number()
      .int()
      .min(0, "Default duration cannot be negative")
      .max(9999, "Default duration must be 9999 days or less")
      .optional(),

    faqs: z
      .array(
        z.object({
          question: z.string().min(1).max(500),
          answer: z.string().min(1),
        })
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    // Regular price required for paid (ONE_TIME or SUBSCRIPTION)
    if (
      data.paymentType !== "FREE" &&
      (data.regularPrice === undefined || Number.isNaN(data.regularPrice))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["regularPrice"],
        message: "Regular price is required for paid courses",
      });
    }

    // Offer price cannot exceed regular price
    if (
      data.offerPrice !== undefined &&
      data.regularPrice !== undefined &&
      data.offerPrice > data.regularPrice
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["offerPrice"],
        message: "Offer price cannot be greater than regular price",
      });
    }

    // Subscription-specific rules
    if (data.paymentType === "SUBSCRIPTION") {
      if (!data.subscriptionType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["subscriptionType"],
          message: "Subscription type is required for subscription pricing",
        });
      }

      if (
        data.subscriptionType === "CUSTOM" &&
        (!data.subscriptionDuration || data.subscriptionDuration < 1)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["subscriptionDuration"],
          message: "Subscription duration is required for custom subscription",
        });
      }
    }

    // Scheduled publish rules
    if (data.status === "SCHEDULED") {
      if (!data.scheduledAt || Number.isNaN(data.scheduledAt.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["scheduledAt"],
          message:
            "Scheduled publish date & time is required when status is Scheduled",
        });
      } else {
        const now = new Date();
        if (data.scheduledAt.getTime() <= now.getTime()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["scheduledAt"],
            message: "Scheduled publish time must be in the future",
          });
        }
      }
    }

    // Enrollment window rules
    if (data.enrollmentStartAt && data.enrollmentEndAt) {
      if (data.enrollmentEndAt.getTime() < data.enrollmentStartAt.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["enrollmentEndAt"],
          message: "Enrollment end must be on or after enrollment start",
        });
      }
    }

    // Prevent enrollment from ending before course start when scheduled
    if (data.scheduledAt && data.enrollmentEndAt) {
      if (data.enrollmentEndAt.getTime() < data.scheduledAt.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["enrollmentEndAt"],
          message:
            "Enrollment cannot end before the scheduled course start date",
        });
      }
    }
  });

export async function updateCourse(
  id: string,
  data: z.infer<typeof courseSchema>
) {
  try {
    await requireRole("ADMIN");
    const tenantId = await getTenantId();

    // Normalize subscription fields so Zod enum doesn't break on empty strings
    const normalizedData: z.infer<typeof courseSchema> = {
      ...data,
      subscriptionType:
        data.paymentType === "SUBSCRIPTION" && data.subscriptionType
          ? data.subscriptionType
          : undefined,
      subscriptionDuration:
        data.paymentType === "SUBSCRIPTION"
          ? data.subscriptionDuration
          : undefined,
    };

    // Validate
    const validated = courseSchema.parse(normalizedData);

    // Check if course exists
    const existing = await prisma.course.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return { success: false, error: "Course not found" };
    }

    // Check slug uniqueness (exclude current course)
    const slugExists = await prisma.course.findFirst({
      where: {
        tenantId,
        slug: validated.slug,
        NOT: { id },
      },
    });

    if (slugExists) {
      return {
        success: false,
        error: "A course with this slug already exists",
      };
    }

    const becomesPublished = validated.status === "PUBLISHED";
    const scheduledImageManuallyCleared =
      !validated.comingSoonImage && !!existing.comingSoonImage;

    if (becomesPublished || scheduledImageManuallyCleared) {
      await cleanupCourseScheduledImagesForTenantCourse(tenantId, id);
    }

    // Delete existing FAQs and create new ones
    await prisma.courseFAQ.deleteMany({
      where: { courseId: id },
    });

    // Update course
    const course = await prisma.course.update({
      where: { id },
      data: {
        ...validated,
        categoryId: validated.categoryId || null,
        classId: validated.classId || null,
        subjectId: validated.subjectId || null,
        streamId: validated.streamId || null,
        fakeEnrollmentCount: validated.fakeEnrollmentCount ?? null,
        comingSoonImage: becomesPublished
          ? null
          : validated.comingSoonImage ?? null,
        scheduledAt:
          validated.status === "PUBLISHED" ? null : validated.scheduledAt,
        publishedAt:
          validated.status === "PUBLISHED" && !existing.publishedAt
            ? new Date()
            : validated.publishedAt,
        faqs:
          validated.faqs && validated.faqs.length > 0
            ? {
                create: validated.faqs.map((faq, index) => ({
                  tenantId,
                  question: faq.question,
                  answer: faq.answer,
                  order: index + 1,
                })),
              }
            : undefined,
      },
    });

    revalidatePath("/course-management/courses");
    revalidatePath(`/course-management/courses/${id}`);
    return { success: true, data: course };
  } catch (error) {
    console.error("Update course error:", error);
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues?.[0];
      return {
        success: false,
        error: firstIssue?.message || "Validation failed",
      };
    }
    return { success: false, error: "Failed to update course" };
  }
}
