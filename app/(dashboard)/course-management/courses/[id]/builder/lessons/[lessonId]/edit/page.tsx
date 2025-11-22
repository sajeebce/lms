import { redirect } from "next/navigation";
import { requireRole, getTenantId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LessonFormPage } from "../../../lesson-form-page";

interface PageProps {
  params: Promise<{ id: string; lessonId: string }>;
}

export default async function EditLessonPage({ params }: PageProps) {
  await requireRole("ADMIN");
  const tenantId = await getTenantId();
  const { id: courseId, lessonId } = await params;

  // Fetch lesson with topic and course info
  const lesson = await prisma.courseLesson.findFirst({
    where: {
      id: lessonId,
      tenantId,
      topic: {
        courseId,
        tenantId,
      },
    },
    include: {
      topic: {
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
      },
    },
  });

  if (!lesson) {
    redirect(`/course-management/courses/${courseId}/builder`);
  }

  // Determine form lesson type from database lesson type
  const getFormLessonType = (
    dbLessonType: string
  ): "TEXT" | "VIDEO_YOUTUBE" | "DOCUMENT" | "ADVANCED" => {
    if (dbLessonType.startsWith("VIDEO_")) {
      return "VIDEO_YOUTUBE";
    }
    if (dbLessonType === "TEXT") {
      return "TEXT";
    }
    if (dbLessonType === "DOCUMENT") {
      return "DOCUMENT";
    }
    if (dbLessonType === "ADVANCED") {
      return "ADVANCED";
    }
    return "TEXT"; // fallback
  };

  return (
    <LessonFormPage
      courseId={courseId}
      courseTitle={lesson.topic.course.title}
      topicId={lesson.topic.id}
      topicTitle={lesson.topic.title}
      lessonType={getFormLessonType(lesson.lessonType)}
      mode="edit"
      editingLesson={{
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        lessonType: lesson.lessonType,
        videoUrl: lesson.videoUrl,
        documentPath: lesson.documentPath,
        textContent: lesson.textContent,
        duration: lesson.duration,
        accessType: lesson.accessType,
        password: lesson.password,
        isPreview: lesson.isPreview,
        allowDownload: lesson.allowDownload,
        scheduledAt: lesson.scheduledAt,
        attachmentsJson: lesson.attachmentsJson,
        topicId: lesson.topicId,
      }}
    />
  );
}

