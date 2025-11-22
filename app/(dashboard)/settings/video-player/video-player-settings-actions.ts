"use server";

import { z } from "zod";
import { requireRole, getTenantId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Video player settings server actions

const youtubeOverlaySchema = z.object({
  topLabel: z
    .string()
    .min(1, "Top label is required")
    .max(50, "Top label must be 50 characters or less"),
  titleText: z
    .string()
    .min(1, "Title text is required")
    .max(100, "Title text must be 100 characters or less"),
  bottomLeftText: z
    .string()
    .min(1, "Bottom left text is required")
    .max(100, "Bottom left text must be 100 characters or less"),
  bottomRightText: z
    .string()
    .min(1, "Bottom right text is required")
    .max(100, "Bottom right text must be 100 characters or less"),
  topBackgroundClass: z
    .string()
    .min(1, "Top background class is required")
    .max(200, "Top background class must be 200 characters or less"),
  bottomBackgroundClass: z
    .string()
    .min(1, "Bottom background class is required")
    .max(200, "Bottom background class must be 200 characters or less"),
  // Optional user-friendly color/opacity controls
  topGradientColor: z.string().optional(),
  topGradientStartOpacity: z.number().min(0).max(100).optional(),
  topGradientMidOpacity: z.number().min(0).max(100).optional(),
  bottomGradientColor: z.string().optional(),
  bottomGradientStartOpacity: z.number().min(0).max(100).optional(),
  bottomGradientMidOpacity: z.number().min(0).max(100).optional(),
});

const vdocipherSchema = z.object({
  enabled: z.boolean().default(false),
  apiKey: z
    .string()
    .max(200, "API key must be 200 characters or less")
    .optional()
    .or(z.literal("")),
  secretKey: z
    .string()
    .max(200, "Secret key must be 200 characters or less")
    .optional()
    .or(z.literal("")),
});

const videoSettingsSchema = z.object({
  youtube: z.object({
    pauseOverlay: youtubeOverlaySchema,
  }),
  vdocipher: vdocipherSchema,
});

export type VideoSettings = z.infer<typeof videoSettingsSchema>;

export async function updateVideoSettings(data: VideoSettings) {
  try {
    await requireRole("ADMIN");
    const tenantId = await getTenantId();

    console.log("Received data:", JSON.stringify(data, null, 2));

    const validated = videoSettingsSchema.parse(data);

    console.log("Validated data:", JSON.stringify(validated, null, 2));

    await prisma.tenantSettings.upsert({
      where: { tenantId },
      update: {
        videoSettings: JSON.stringify(validated),
      },
      create: {
        tenantId,
        videoSettings: JSON.stringify(validated),
      },
    });

    revalidatePath("/settings/video-player");

    return { success: true as const };
  } catch (error: any) {
    console.error("Failed to update video settings - Full error:", error);

    if (error instanceof z.ZodError) {
      console.error(
        "Zod validation errors:",
        JSON.stringify(error.issues, null, 2)
      );
    }

    const message =
      error instanceof z.ZodError
        ? `Validation error: ${error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join(", ")}`
        : error?.message || "Failed to update video settings";

    return {
      success: false as const,
      error: message,
    };
  }
}
