"use client";

import { useTransition } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateVideoSettings } from "./video-player-settings-actions";
import type { TenantVideoSettings } from "@/types/video-settings";

const youtubeOverlaySchema = z.object({
  topLabel: z
    .string()
    .min(1, "Required")
    .max(50, "Must be 50 characters or less"),
  titleText: z
    .string()
    .min(1, "Required")
    .max(100, "Must be 100 characters or less"),
  bottomLeftText: z
    .string()
    .min(1, "Required")
    .max(100, "Must be 100 characters or less"),
  bottomRightText: z
    .string()
    .min(1, "Required")
    .max(100, "Must be 100 characters or less"),
  topBackgroundClass: z
    .string()
    .min(1, "Required")
    .max(200, "Must be 200 characters or less"),
  bottomBackgroundClass: z
    .string()
    .min(1, "Required")
    .max(200, "Must be 200 characters or less"),
  // Solid color controls (no gradient)
  topGradientColor: z.string().optional(),
  bottomGradientColor: z.string().optional(),
});

const vdocipherSchema = z.object({
  enabled: z.boolean().default(false),
  apiKey: z
    .string()
    .max(200, "Must be 200 characters or less")
    .optional()
    .or(z.literal("")),
  secretKey: z
    .string()
    .max(200, "Must be 200 characters or less")
    .optional()
    .or(z.literal("")),
});

const formSchema = z.object({
  youtube: z.object({
    pauseOverlay: youtubeOverlaySchema,
  }),
  vdocipher: vdocipherSchema,
});

export type VideoSettingsFormValues = z.infer<typeof formSchema>;

const defaultValues: VideoSettingsFormValues = {
  youtube: {
    pauseOverlay: {
      topLabel: "Paused",
      titleText: "Secure Lesson",
      bottomLeftText: "Suggestions disabled for secure mode",
      bottomRightText: "Focus Mode",
      topBackgroundClass: "bg-black",
      bottomBackgroundClass: "bg-black",
      topGradientColor: "#000000",
      bottomGradientColor: "#000000",
    },
  },
  vdocipher: {
    enabled: false,
    apiKey: "",
    secretKey: "",
  },
};

interface VideoPlayerSettingsClientProps {
  initialVideoSettings: TenantVideoSettings | null;
  searchParams: Record<string, string | string[] | undefined>;
}

// Helper function to convert hex color to Tailwind color name
function hexToTailwindColor(hex: string): string {
  const colorMap: Record<string, string> = {
    "#000000": "black",
    "#ffffff": "white",
    "#1e293b": "slate-800",
    "#334155": "slate-700",
    "#475569": "slate-600",
    "#64748b": "slate-500",
  };
  return colorMap[hex.toLowerCase()] || "black";
}

// Helper function to generate Tailwind gradient class from color and opacity
function generateGradientClass(
  direction: "b" | "t",
  color: string,
  startOpacity: number,
  midOpacity: number
): string {
  const tailwindColor = hexToTailwindColor(color);
  return `bg-linear-to-${direction} from-${tailwindColor}/${startOpacity} via-${tailwindColor}/${midOpacity} to-transparent`;
}

// Helper function to parse Tailwind class and extract opacity values
function parseGradientClass(gradientClass: string): {
  startOpacity: number;
  midOpacity: number;
} {
  // Extract opacity from patterns like "from-black/95 via-black/80"
  const startMatch = gradientClass.match(/from-\w+\/(\d+)/);
  const midMatch = gradientClass.match(/via-\w+\/(\d+)/);

  return {
    startOpacity: startMatch ? parseInt(startMatch[1]) : 95,
    midOpacity: midMatch ? parseInt(midMatch[1]) : 80,
  };
}

export function VideoPlayerSettingsClient({
  initialVideoSettings,
}: VideoPlayerSettingsClientProps) {
  const [isPending, startTransition] = useTransition();

  // Parse existing gradient classes to extract color/opacity if not already set
  const initialValues: VideoSettingsFormValues = {
    youtube: {
      pauseOverlay: {
        topLabel:
          initialVideoSettings?.youtube?.pauseOverlay?.topLabel ||
          defaultValues.youtube.pauseOverlay.topLabel,
        titleText:
          initialVideoSettings?.youtube?.pauseOverlay?.titleText ||
          defaultValues.youtube.pauseOverlay.titleText,
        bottomLeftText:
          initialVideoSettings?.youtube?.pauseOverlay?.bottomLeftText ||
          defaultValues.youtube.pauseOverlay.bottomLeftText,
        bottomRightText:
          initialVideoSettings?.youtube?.pauseOverlay?.bottomRightText ||
          defaultValues.youtube.pauseOverlay.bottomRightText,
        topBackgroundClass:
          initialVideoSettings?.youtube?.pauseOverlay?.topBackgroundClass ||
          defaultValues.youtube.pauseOverlay.topBackgroundClass,
        bottomBackgroundClass:
          initialVideoSettings?.youtube?.pauseOverlay?.bottomBackgroundClass ||
          defaultValues.youtube.pauseOverlay.bottomBackgroundClass,
        topGradientColor:
          initialVideoSettings?.youtube?.pauseOverlay?.topGradientColor ||
          defaultValues.youtube.pauseOverlay.topGradientColor,
        topGradientStartOpacity:
          initialVideoSettings?.youtube?.pauseOverlay
            ?.topGradientStartOpacity ??
          defaultValues.youtube.pauseOverlay.topGradientStartOpacity,
        topGradientMidOpacity:
          initialVideoSettings?.youtube?.pauseOverlay?.topGradientMidOpacity ??
          defaultValues.youtube.pauseOverlay.topGradientMidOpacity,
        bottomGradientColor:
          initialVideoSettings?.youtube?.pauseOverlay?.bottomGradientColor ||
          defaultValues.youtube.pauseOverlay.bottomGradientColor,
        bottomGradientStartOpacity:
          initialVideoSettings?.youtube?.pauseOverlay
            ?.bottomGradientStartOpacity ??
          defaultValues.youtube.pauseOverlay.bottomGradientStartOpacity,
        bottomGradientMidOpacity:
          initialVideoSettings?.youtube?.pauseOverlay
            ?.bottomGradientMidOpacity ??
          defaultValues.youtube.pauseOverlay.bottomGradientMidOpacity,
      },
    },
    vdocipher: {
      enabled:
        initialVideoSettings?.vdocipher?.enabled ??
        defaultValues.vdocipher.enabled,
      apiKey:
        initialVideoSettings?.vdocipher?.apiKey ||
        defaultValues.vdocipher.apiKey,
      secretKey:
        initialVideoSettings?.vdocipher?.secretKey ||
        defaultValues.vdocipher.secretKey,
    },
  };

  // If no color/opacity values exist, parse from existing Tailwind classes
  if (
    initialVideoSettings?.youtube?.pauseOverlay &&
    !initialVideoSettings.youtube.pauseOverlay.topGradientColor
  ) {
    const topParsed = parseGradientClass(
      initialVideoSettings.youtube.pauseOverlay.topBackgroundClass
    );
    const bottomParsed = parseGradientClass(
      initialVideoSettings.youtube.pauseOverlay.bottomBackgroundClass
    );

    initialValues.youtube.pauseOverlay.topGradientStartOpacity =
      topParsed.startOpacity;
    initialValues.youtube.pauseOverlay.topGradientMidOpacity =
      topParsed.midOpacity;
    initialValues.youtube.pauseOverlay.bottomGradientStartOpacity =
      bottomParsed.startOpacity;
    initialValues.youtube.pauseOverlay.bottomGradientMidOpacity =
      bottomParsed.midOpacity;
  }

  const form = useForm<VideoSettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  });

  const onSubmit = (values: VideoSettingsFormValues) => {
    startTransition(async () => {
      console.log("Form values before processing:", values);

      // Use solid colors (no gradient generation needed)
      if (values.youtube?.pauseOverlay) {
        const topColor =
          values.youtube.pauseOverlay.topGradientColor || "#000000";
        const bottomColor =
          values.youtube.pauseOverlay.bottomGradientColor || "#000000";

        // Store solid color values
        values.youtube.pauseOverlay.topBackgroundClass = "bg-black";
        values.youtube.pauseOverlay.bottomBackgroundClass = "bg-black";
        values.youtube.pauseOverlay.topGradientColor = topColor;
        values.youtube.pauseOverlay.bottomGradientColor = bottomColor;
      }

      console.log("Form values after processing:", values);

      const result = await updateVideoSettings(values);
      if (result.success) {
        toast.success("Video player settings saved successfully");
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
      <Tabs defaultValue="youtube" className="w-full">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-full bg-slate-100 p-1 text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
          <TabsTrigger
            value="youtube"
            className="data-[state=active]:bg-linear-to-r data-[state=active]:from-rose-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-500 dark:data-[state=inactive]:text-slate-400 rounded-full px-4 py-1 text-xs font-medium tracking-wide"
          >
            YouTube
          </TabsTrigger>
          <TabsTrigger
            value="vdocipher"
            className="data-[state=active]:bg-linear-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-500 dark:data-[state=inactive]:text-slate-400 rounded-full px-4 py-1 text-xs font-medium tracking-wide"
          >
            VdoCipher
          </TabsTrigger>
        </TabsList>

        <TabsContent value="youtube" className="mt-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 max-w-3xl"
            >
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                  YouTube Pause Overlay
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-[3px] text-[11px] font-medium text-emerald-500 ring-1 ring-emerald-500/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.4)]" />
                    Live Preview in Player
                  </span>
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Control the bars that appear on top of YouTube when the video
                  is paused. Use them to hide YouTube&apos;s own UI and show
                  your own secure messaging.
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="youtube.pauseOverlay.topLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          Top status label *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            maxLength={50}
                            placeholder="Paused"
                            className="h-9 text-xs"
                          />
                        </FormControl>
                        <p className="mt-1 text-[11px] text-slate-400">
                          Short status chip, e.g.
                          <span className="font-medium">Paused</span> or
                          <span className="font-medium">Secure Mode</span>.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="youtube.pauseOverlay.titleText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Title text *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            maxLength={100}
                            placeholder="Secure Lesson"
                            className="h-9 text-xs"
                          />
                        </FormControl>
                        <p className="mt-1 text-[11px] text-slate-400">
                          Appears below the status chip, e.g. course title or
                          &quot;Secure Lesson&quot;.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="youtube.pauseOverlay.bottomLeftText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          Bottom left text *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            maxLength={100}
                            placeholder="Suggestions disabled for secure mode"
                            className="h-9 text-xs"
                          />
                        </FormControl>
                        <p className="mt-1 text-[11px] text-slate-400">
                          Small hint text on the left side of the bottom bar.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="youtube.pauseOverlay.bottomRightText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          Bottom right text *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            maxLength={100}
                            placeholder="Focus Mode"
                            className="h-9 text-xs"
                          />
                        </FormControl>
                        <p className="mt-1 text-[11px] text-slate-400">
                          A short &quot;mode&quot; label, like Focus Mode or
                          Exam Mode.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Top Bar Color Settings */}
                <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                  <h4 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Top Bar Color
                  </h4>
                  <div className="grid gap-4">
                    <FormField
                      control={form.control}
                      name="youtube.pauseOverlay.topGradientColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Solid Color</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={field.value || "#000000"}
                                onChange={field.onChange}
                                className="h-9 w-16 cursor-pointer rounded border border-slate-300 dark:border-slate-600"
                              />
                              <Input
                                value={field.value || ""}
                                onChange={field.onChange}
                                maxLength={7}
                                placeholder="#000000"
                                className="h-9 flex-1 text-xs font-mono"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Live Preview */}
                  <div className="mt-3 rounded border border-slate-300 p-3 dark:border-slate-600">
                    <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      Preview
                    </p>
                    <div
                      className="h-16 rounded"
                      style={{
                        backgroundColor:
                          form.watch("youtube.pauseOverlay.topGradientColor") ||
                          "#000000",
                      }}
                    />
                  </div>

                  {/* Hidden field for backward compatibility */}
                  <FormField
                    control={form.control}
                    name="youtube.pauseOverlay.topBackgroundClass"
                    render={({ field }) => <input type="hidden" {...field} />}
                  />
                </div>

                {/* Bottom Bar Color Settings */}
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                  <h4 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Bottom Bar Color
                  </h4>
                  <div className="grid gap-4">
                    <FormField
                      control={form.control}
                      name="youtube.pauseOverlay.bottomGradientColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Solid Color</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={field.value || "#000000"}
                                onChange={field.onChange}
                                className="h-9 w-16 cursor-pointer rounded border border-slate-300 dark:border-slate-600"
                              />
                              <Input
                                value={field.value || ""}
                                onChange={field.onChange}
                                maxLength={7}
                                placeholder="#000000"
                                className="h-9 flex-1 text-xs font-mono"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Live Preview */}
                  <div className="mt-3 rounded border border-slate-300 p-3 dark:border-slate-600">
                    <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      Preview
                    </p>
                    <div
                      className="h-16 rounded"
                      style={{
                        backgroundColor:
                          form.watch(
                            "youtube.pauseOverlay.bottomGradientColor"
                          ) || "#000000",
                      }}
                    />
                  </div>

                  {/* Hidden field for backward compatibility */}
                  <FormField
                    control={form.control}
                    name="youtube.pauseOverlay.bottomBackgroundClass"
                    render={({ field }) => <input type="hidden" {...field} />}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full max-w-xs bg-linear-to-r from-emerald-500 via-cyan-500 to-indigo-500 text-white shadow-md hover:from-emerald-600 hover:via-cyan-600 hover:to-indigo-600"
                >
                  {isPending ? "Saving..." : "Save Video Settings"}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="vdocipher" className="mt-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 max-w-2xl"
            >
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                  VdoCipher Integration
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-3 py-[3px] text-[11px] font-medium text-amber-300 ring-1 ring-amber-500/40">
                    Coming Soon
                  </span>
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Configure DRM-grade secure streaming using VdoCipher. Enabling
                  this will allow you to serve videos that are much harder to
                  download.
                </p>

                <div className="mt-4 space-y-4">
                  <FormField
                    control={form.control}
                    name="vdocipher.enabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60">
                        <div className="space-y-0.5">
                          <FormLabel className="text-xs">
                            Enable VdoCipher
                          </FormLabel>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Toggle this on when you are ready to connect your
                            VdoCipher account.
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vdocipher.apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">API Key</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            maxLength={200}
                            placeholder="Your VdoCipher API key"
                            className="h-9 text-xs font-mono"
                            disabled
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vdocipher.secretKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Secret Key</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            maxLength={200}
                            placeholder="Your VdoCipher secret key"
                            className="h-9 text-xs font-mono"
                            disabled
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full max-w-xs bg-linear-to-r from-slate-400 via-slate-500 to-slate-600 text-white shadow-md hover:from-slate-500 hover:via-slate-600 hover:to-slate-700"
                >
                  {isPending ? "Saving..." : "Save for Later"}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
