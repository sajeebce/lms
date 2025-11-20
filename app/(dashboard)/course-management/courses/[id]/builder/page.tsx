import { getTenantId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getChapters } from "@/lib/actions/chapter.actions";
import { PageHeader } from "@/components/page-header";
import { LayoutDashboard } from "lucide-react";
import CourseBuilderClient from "./course-builder-client";

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
        include: {
          lessons: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!course) {
    notFound();
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
        iconBgColor="bg-gradient-to-br from-cyan-500 to-violet-500"
      />
      <CourseBuilderClient course={course} syllabusChapters={syllabusChapters} />
    </div>
  );
}

