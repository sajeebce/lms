"use server";

import { requireRole, getTenantId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const courseSchema = z
  .object({
    // Basic Info
    title: z.string().min(1, "Title is required").max(200),
    slug: z.string().min(1, "Slug is required").max(200),
    categoryId: z.string().optional(),
    description: z.string().optional(),
    shortDescription: z.string().max(500).optional(),

    // Academic Integration (Optional)
    classId: z.string().optional(),
    subjectId: z.string().optional(),
    streamId: z.string().optional(),

    // Pricing
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

    // Media
    featuredImage: z.string().optional(),
    introVideoUrl: z.string().optional(),
    introVideoAutoplay: z.boolean().default(false),

    // SEO
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

    // FAQ
    faqs: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
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

export async function createSingleCourse(data: z.infer<typeof courseSchema>) {
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

    // Check slug uniqueness
    const existing = await prisma.course.findFirst({
      where: {
        tenantId,
        slug: validated.slug,
      },
    });

    if (existing) {
      return {
        success: false,
        error: "A course with this slug already exists",
      };
    }

    // Create course with FAQs
    const course = await prisma.course.create({
      data: {
        tenantId,
        courseType: "SINGLE",
        title: validated.title,
        slug: validated.slug,
        categoryId: validated.categoryId,
        description: validated.description,
        shortDescription: validated.shortDescription,
        // Academic Integration
        classId: validated.classId,
        subjectId: validated.subjectId,
        streamId: validated.streamId,
        paymentType: validated.paymentType,
        invoiceTitle: validated.invoiceTitle,
        regularPrice: validated.regularPrice,
        offerPrice: validated.offerPrice,
        currency: validated.currency,
        subscriptionDuration: validated.subscriptionDuration,
        subscriptionType: validated.subscriptionType,
        autoGenerateInvoice: validated.autoGenerateInvoice,
        featuredImage: validated.featuredImage,
        introVideoUrl: validated.introVideoUrl,
        introVideoAutoplay: validated.introVideoAutoplay,
        status: validated.status,
        visibility: validated.visibility,
        publishedAt:
          validated.status === "PUBLISHED" ? new Date() : validated.publishedAt,
        scheduledAt: validated.scheduledAt,
        showComingSoon: validated.showComingSoon,
        comingSoonImage: validated.comingSoonImage,
        allowCurriculumPreview: validated.allowCurriculumPreview,
        metaTitle: validated.metaTitle,
        metaDescription: validated.metaDescription,
        metaKeywords: validated.metaKeywords,
        fakeEnrollmentCount: validated.fakeEnrollmentCount ?? null,
        isFeatured: validated.isFeatured,
        allowComments: validated.allowComments,
        certificateEnabled: validated.certificateEnabled,
        maxStudents: validated.maxStudents,
        enrollmentStartAt: validated.enrollmentStartAt,
        enrollmentEndAt: validated.enrollmentEndAt,
        enrollmentStatus: validated.enrollmentStatus,
        defaultEnrollmentDurationDays: validated.defaultEnrollmentDurationDays,
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

    // Re-associate scheduled image uploads created with temporary entityId
    if (validated.comingSoonImage) {
      try {
        await prisma.uploadedFile.updateMany({
          where: {
            tenantId,
            category: "course_scheduled_image",
            entityType: "course",
            entityId: "temp",
            url: validated.comingSoonImage,
          },
          data: {
            entityId: course.id,
          },
        });
      } catch (error) {
        console.error("Failed to re-associate scheduled course image", {
          tenantId,
          courseId: course.id,
          error,
        });
      }
    }

    revalidatePath("/course-management/courses");
    return { success: true, data: course };
  } catch (error) {
    console.error("Create course error:", error);
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues?.[0];
      return {
        success: false,
        error: firstIssue?.message || "Validation failed",
      };
    }
    return { success: false, error: "Failed to create course" };
  }
}
