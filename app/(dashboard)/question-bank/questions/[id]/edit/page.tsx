import { getTenantId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getSubjects } from "@/lib/actions/subject.actions";
import { getClasses } from "@/lib/actions/class.actions";
import { getChapters } from "@/lib/actions/chapter.actions";
import { getTopics } from "@/lib/actions/topic.actions";
import { getExamBoards } from "@/lib/actions/exam-board.actions";
import { getExamYears } from "@/lib/actions/exam-year.actions";
import QuestionFormFull from "../../_components/question-form-full";

export const metadata = {
  title: "Edit Question | Question Bank",
  description: "Edit an existing question with math support",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditQuestionPage({ params }: Props) {
  const { id } = await params;
  const tenantId = await getTenantId();

  const [question, subjects, classes, chapters, topics, institutions, examYears] =
    await Promise.all([
      prisma.question.findFirst({
        where: { id, tenantId },
        include: {
          topic: {
            include: {
              chapter: {
                include: {
                  subject: true,
                  class: true,
                },
              },
            },
          },
          source: true,
          institution: true,
          examYear: true,
        },
      }),
      getSubjects({ status: "ACTIVE" }),
      getClasses(),
      getChapters(),
      getTopics(),
      getExamBoards({ status: "ACTIVE" }),
      getExamYears({ status: "ACTIVE" }),
    ]);

  if (!question) {
    notFound();
  }

  return (
    <QuestionFormFull
      subjects={subjects}
      classes={classes}
      chapters={chapters}
      topics={topics}
      institutions={institutions}
      examYears={examYears}
      initialData={question}
    />
  );
}

