import { redirect } from "next/navigation";
import { requireRole, getTenantId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LessonFormPage } from "../../lesson-form-page";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ topicId?: string; type?: string }>;
}

export default async function NewLessonPage({ params, searchParams }: PageProps) {
  await requireRole("ADMIN");
  const tenantId = await getTenantId();
  const { id: courseId } = await params;
  const { topicId, type } = await searchParams;

  if (!topicId || !type) {
    redirect(`/course-management/courses/${courseId}/builder`);
  }

  // Verify topic belongs to this course and tenant
  const topic = await prisma.courseTopic.findFirst({
    where: {
      id: topicId,
      courseId,
      tenantId,
    },
    select: {
      id: true,
      title: true,
      course: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!topic) {
    redirect(`/course-management/courses/${courseId}/builder`);
  }

  const lessonType = type.toUpperCase() as
    | "TEXT"
    | "VIDEO_YOUTUBE"
    | "DOCUMENT"
    | "ADVANCED";

  return (
    <LessonFormPage
      courseId={courseId}
      courseTitle={topic.course.title}
      topicId={topicId}
      topicTitle={topic.title}
      lessonType={lessonType}
      mode="create"
    />
  );
}

