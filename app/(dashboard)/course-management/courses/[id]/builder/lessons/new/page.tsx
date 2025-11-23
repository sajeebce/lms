import { redirect } from "next/navigation";
import { requireRole, getTenantId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LessonFormPage } from "../../lesson-form-page";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ topicId?: string; type?: string }>;
}

export default async function NewLessonPage({ params, searchParams }: PageProps) {
  await requireRole("ADMIN");
  const tenantId = await getTenantId();
  const { slug } = await params;
  const { topicId, type } = await searchParams;

  if (!topicId || !type) {
    redirect(`/course-management/courses/${slug}/builder`);
  }

  // Find course by slug for validation and internal IDs
  const course = await prisma.course.findFirst({
    where: {
      slug,
      tenantId,
    },
    select: {
      id: true,
      title: true,
    },
  });

  if (!course) {
    redirect("/course-management/courses");
  }

  // Verify topic belongs to this course and tenant
  const topic = await prisma.courseTopic.findFirst({
    where: {
      id: topicId,
      courseId: course.id,
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
    redirect(`/course-management/courses/${slug}/builder`);
  }

  const lessonType = type.toUpperCase() as
    | "TEXT"
    | "VIDEO_YOUTUBE"
    | "DOCUMENT"
    | "ADVANCED";

  return (
    <LessonFormPage
      courseId={course.id}
      courseSlug={slug}
      courseTitle={course.title}
      topicId={topicId}
      topicTitle={topic.title}
      lessonType={lessonType}
      mode="create"
    />
  );
}

