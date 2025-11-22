import { getTenantId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getChapters } from "@/lib/actions/chapter.actions";
import { PageHeader } from "@/components/page-header";
import { LayoutDashboard } from "lucide-react";
import CourseBuilderClient from "./course-builder-client";
import type { TenantVideoSettings } from "@/types/video-settings";

export const metadata = {
  title: "Course Builder | LMS",
  description: "Design chapters and lessons for this course",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CourseBuilderPage({ params }: Props) {
  const { id } = await params;
  const tenantId = await getTenantId();

  const course = await prisma.course.findFirst({
    where: { id, tenantId },
    include: {
      class: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, icon: true } },
      stream: { select: { id: true, name: true } },
      topics: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          order: true,
          subjectId: true,
          chapterId: true,
          topicId: true,
          sourceType: true,
          lessons: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              description: true,
              lessonType: true,
              videoUrl: true,
              documentPath: true,
              textContent: true,
              duration: true,
              order: true,
              accessType: true,
              password: true,
              allowDownload: true,
              isPreview: true,
            },
          },
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  const tenantSettings = await prisma.tenantSettings.findFirst({
    where: { tenantId },
  });

  let videoSettings: TenantVideoSettings | null = null;

  if (tenantSettings?.videoSettings) {
    try {
      videoSettings = JSON.parse(
        tenantSettings.videoSettings
      ) as TenantVideoSettings;
    } catch (error) {
      console.error("Failed to parse videoSettings JSON", error);
    }
  }

  const syllabusChapters = course.subjectId
    ? await getChapters({
        subjectId: course.subjectId,
        classId: course.classId ?? undefined,
        status: "ACTIVE",
      })
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Course Builder"
        description="Organize chapters and lessons for this course. Start from syllabus or build freely."
        icon={LayoutDashboard}
        bgColor="bg-slate-900/80"
        iconBgColor="bg-linear-to-br from-cyan-500 to-violet-500"
      />
      <CourseBuilderClient
        course={course}
        syllabusChapters={syllabusChapters}
        videoSettings={videoSettings}
      />
    </div>
  );
}
