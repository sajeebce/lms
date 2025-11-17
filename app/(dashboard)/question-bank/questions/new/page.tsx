import { getSubjects } from "@/lib/actions/subject.actions";
import { getClasses } from "@/lib/actions/class.actions";
import { getChapters } from "@/lib/actions/chapter.actions";
import { getTopics } from "@/lib/actions/topic.actions";
import { getQuestionSources } from "@/lib/actions/question-source.actions";
import QuestionFormFull from "../_components/question-form-full";

export const metadata = {
  title: "Create Question | Question Bank",
  description: "Create a new question with math support",
};

export default async function NewQuestionPage() {
  const [subjects, classes, chapters, topics, sources] = await Promise.all([
    getSubjects({ status: "ACTIVE" }),
    getClasses(),
    getChapters(),
    getTopics(),
    getQuestionSources(),
  ]);

  return (
    <QuestionFormFull
      subjects={subjects}
      classes={classes}
      chapters={chapters}
      topics={topics}
      sources={sources}
    />
  );
}
