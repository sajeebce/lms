import { getTenantId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Film } from "lucide-react";
import { VideoPlayerSettingsClient } from "./video-player-settings-client";
import type { TenantVideoSettings } from "@/types/video-settings";

export const metadata = {
  title: "Video Player Settings | LMS",
  description: "Configure YouTube and VdoCipher video playback settings",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VideoPlayerSettingsPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const tenantId = await getTenantId();

  let tenantSettings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
  });

  if (!tenantSettings) {
    tenantSettings = await prisma.tenantSettings.create({
      data: {
        tenantId,
      },
    });
  }

  let videoSettings: TenantVideoSettings | null = null;

  if (tenantSettings.videoSettings) {
    try {
      videoSettings = JSON.parse(
        tenantSettings.videoSettings
      ) as TenantVideoSettings;
    } catch (error) {
      console.error("Failed to parse videoSettings JSON", error);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Video Player Settings"
        description="Configure how YouTube and VdoCipher videos behave across your LMS."
        icon={Film}
        bgColor="bg-slate-900/80"
        iconBgColor="bg-linear-to-br from-emerald-500 via-cyan-500 to-indigo-500"
      />
      <VideoPlayerSettingsClient
        initialVideoSettings={videoSettings}
        searchParams={resolvedSearchParams}
      />
    </div>
  );
}
