"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import { toast } from "sonner";
import { createQuestion, updateQuestion } from "@/lib/actions/question.actions";
import { Plus, Trash2, Save, X, Eye, ArrowUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import RichTextEditor from "@/components/ui/rich-text-editor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


const getSourceTypeLabel = (type: string): string => {
  switch (type) {
    case "BOARD_EXAM":
      return "📘 Board Exam";
    case "TEXTBOOK":
      return "📗 Textbook";
    case "REFERENCE_BOOK":
      return "📙 Reference Book";
    case "CUSTOM":
      return "✏️ Custom";
    case "PREVIOUS_YEAR":
      return "📅 Previous Year";
    case "MOCK_TEST":
      return "🧪 Mock Test";
    default:
      return "Custom";
  }
};

type Props = {
  subjects: any[];
  classes: any[];
  chapters: any[];
  topics: any[];
  institutions: any[];
  examYears: any[];
  initialData?: any;
};

export default function QuestionFormFull({
  subjects,
  classes,
  chapters,
  topics,
  institutions,
  examYears,
  initialData,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Form State (all in one view - no steps!)
  const [selectedSubject, setSelectedSubject] = useState(
    initialData?.topic?.chapter?.subjectId || ""
  );
  const [selectedClass, setSelectedClass] = useState(
    initialData?.topic?.chapter?.classId || ""
  );
  const [selectedChapter, setSelectedChapter] = useState(
    initialData?.topic?.chapterId || ""
  );
  const [selectedTopic, setSelectedTopic] = useState(
    initialData?.topicId || ""
  );
  const [questionType, setQuestionType] = useState(
    initialData?.questionType || "MCQ"
  );
  const [questionText, setQuestionText] = useState(
    initialData?.questionText || ""
  );
  const [mcqOptions, setMcqOptions] = useState<
    { text: string; isCorrect: boolean; explanation?: string }[]
  >(
    initialData?.options
      ? JSON.parse(initialData.options)
      : [
          { text: "", isCorrect: false, explanation: "" },
          { text: "", isCorrect: false, explanation: "" },
        ]
  );
  const [trueFalseAnswer, setTrueFalseAnswer] = useState(
    initialData?.correctAnswer || "TRUE"
  );
  const [textAnswer, setTextAnswer] = useState(
    initialData?.correctAnswer || ""
  );
  const [institutionId, setInstitutionId] = useState(
    initialData?.institutionId || ""
  );
  const [examYearId, setExamYearId] = useState(
    initialData?.examYearId || ""
  );

  const [difficulty, setDifficulty] = useState(
    initialData?.difficulty || "MEDIUM"
  );
  const [sourceType, setSourceType] = useState(
    initialData?.source?.type || ""
  );
  const [explanation, setExplanation] = useState(
    initialData?.explanation || ""
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filter logic
  const filteredChapters = chapters.filter(
    (ch) => ch.subjectId === selectedSubject && ch.classId === selectedClass
  );
  const filteredTopics = topics.filter((t) => t.chapterId === selectedChapter);

  const addMcqOption = () => {
    setMcqOptions([
      ...mcqOptions,
      { text: "", isCorrect: false, explanation: "" },
    ]);
  };

  const removeMcqOption = (index: number) => {
    if (mcqOptions.length > 2) {
      setMcqOptions(mcqOptions.filter((_, i) => i !== index));
    }
  };

  const updateMcqOption = (
    index: number,
    field: "text" | "isCorrect" | "explanation",
    value: string | boolean
  ) => {
    const updated = [...mcqOptions];
    updated[index] = { ...updated[index], [field]: value };
    setMcqOptions(updated);
  };

  const handleSubmit = async () => {
    setFieldErrors({});

    // Validation
    if (!selectedTopic) {
      toast.error("Please select a topic");
      return;
    }
    if (!questionText.trim()) {
      toast.error("Please enter question text");
      return;
    }

    // Type-specific validation
    if (questionType === "MCQ") {
      const hasCorrect = mcqOptions.some((opt) => opt.isCorrect);
      const allFilled = mcqOptions.every((opt) => opt.text.trim());
      if (!allFilled) {
        toast.error("Please fill all MCQ options");
        return;
      }
      if (!hasCorrect) {
        toast.error("Please mark at least one correct answer");
        return;
      }
    }

    setSaving(true);

    try {
      const data = {
        topicId: selectedTopic,
        questionText,
        questionType,
        options: questionType === "MCQ" ? mcqOptions : undefined,
        correctAnswer:
          questionType === "TRUE_FALSE"
            ? trueFalseAnswer
            : questionType !== "MCQ"
            ? textAnswer
            : undefined,
        explanation,
        difficulty,
        marks: 1, // Default marks, will be set at exam/quiz level
        negativeMarks: 0, // Default negative marks, will be set at exam/quiz level
        institutionId: institutionId || undefined,
        examYearId: examYearId || undefined,
      };

      const result = initialData
        ? await updateQuestion(initialData.id, data)
        : await createQuestion(data);

      if (result.success) {
        toast.success(
          initialData
            ? "Question updated successfully!"
            : "Question created successfully!"
        );
        router.push("/question-bank/questions");
        router.refresh();
      } else {
        if (result.fieldErrors && typeof result.fieldErrors === "object") {
          setFieldErrors(result.fieldErrors as Record<string, string>);
        }
        toast.error(result.error || "Failed to save question");
      }
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* STICKY HEADER - Always visible */}
      <div className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-border dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold dark:text-slate-200">
                {initialData ? "Edit Question" : "Create New Question"}
              </h1>
              <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">
                Fill in all fields below to create a complete question
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="bg-gradient-to-r from-[var(--theme-button-from)] to-[var(--theme-button-to)] hover:opacity-90 text-white font-medium"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving
                  ? "Saving..."
                  : initialData
                  ? "Update Question"
                  : "Save Question"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Section 1: Location */}
          <div className="bg-card dark:bg-slate-800/50 rounded-lg border dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold mb-4 dark:text-slate-200">
              📍 Question Location
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Subject *</Label>
                <SearchableDropdown
                  options={subjects.map((s) => ({
                    value: s.id,
                    label: s.name,
                  }))}
                  value={selectedSubject}
                  onChange={setSelectedSubject}
                  placeholder="Select subject"
                />
              </div>
              <div className="space-y-2">
                <Label>Class *</Label>
                <SearchableDropdown
                  options={classes.map((c) => ({ value: c.id, label: c.name }))}
                  value={selectedClass}
                  onChange={setSelectedClass}
                  placeholder="Select class"
                />
              </div>
              <div className="space-y-2">
                <Label>Chapter *</Label>
                <SearchableDropdown
                  options={filteredChapters.map((ch) => ({
                    value: ch.id,
                    label: ch.name,
                  }))}
                  value={selectedChapter}
                  onChange={setSelectedChapter}
                  placeholder="Select chapter"
                  disabled={!selectedSubject || !selectedClass}
                />
              </div>
              <div className="space-y-2">
                <Label>Topic *</Label>
                <SearchableDropdown
                  options={filteredTopics.map((t) => ({
                    value: t.id,
                    label: t.name,
                  }))}
                  value={selectedTopic}
                  onChange={setSelectedTopic}
                  placeholder="Select topic"
                  disabled={!selectedChapter}
                />
              </div>
              <div className="space-y-2">
                <Label>Institution / Board / College (Optional)</Label>
                <SearchableDropdown
                  options={[
                    { value: "", label: "No Institution" },
                    ...institutions.map((inst) => ({
                      value: inst.id,
                      label: inst.name,
                    })),
                  ]}
                  value={institutionId}
                  onChange={setInstitutionId}
                  placeholder="Select institution / board"
                />
              </div>
              <div className="space-y-2">
                <Label>Exam Year (Optional)</Label>
                <SearchableDropdown
                  options={[
                    { value: "", label: "No Year" },
                    ...examYears.map((year) => ({
                      value: year.id,
                      label: year.label
                        ? `${year.year} - ${year.label}`
                        : String(year.year),
                    })),
                  ]}
                  value={examYearId}
                  onChange={setExamYearId}
                  placeholder="Select exam year"
                />
              </div>

              <div className="space-y-2">
                <Label>Difficulty *</Label>
                <SearchableDropdown
                  options={[
                    { value: "EASY", label: "🟢 Easy" },
                    { value: "MEDIUM", label: "🟡 Medium" },
                    { value: "HARD", label: "🟠 Hard" },
                    { value: "EXPERT", label: "🔴 Expert" },
                  ]}
                  value={difficulty}
                  onChange={setDifficulty}
                  placeholder="Select difficulty"
                />
              </div>
              <div className="space-y-2">
                <Label>Source (Optional)</Label>
                <SearchableDropdown
                  options={[
                    { value: "", label: "No Source" },
                    { value: "BOARD_EXAM", label: getSourceTypeLabel("BOARD_EXAM") },
                    { value: "TEXTBOOK", label: getSourceTypeLabel("TEXTBOOK") },
                    { value: "REFERENCE_BOOK", label: getSourceTypeLabel("REFERENCE_BOOK") },
                    { value: "CUSTOM", label: getSourceTypeLabel("CUSTOM") },
                    { value: "PREVIOUS_YEAR", label: getSourceTypeLabel("PREVIOUS_YEAR") },
                    { value: "MOCK_TEST", label: getSourceTypeLabel("MOCK_TEST") },
                  ]}
                  value={sourceType}
                  onChange={setSourceType}
                  placeholder="Select source type"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Question Details */}
          <div className="bg-card dark:bg-slate-800/50 rounded-lg border dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold mb-4 dark:text-slate-200">
              ❓ Question Details
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Question Type *</Label>
                <SearchableDropdown
                  options={[
                    { value: "MCQ", label: "📝 Multiple Choice (MCQ)" },
                    { value: "TRUE_FALSE", label: "✓✗ True/False" },
                    { value: "SHORT_ANSWER", label: "📄 Short Answer" },
                    { value: "LONG_ANSWER", label: "📋 Long Answer" },
                  ]}
                  value={questionType}
                  onChange={setQuestionType}
                  placeholder="Select question type"
                />
              </div>

              <div className="space-y-2">
                <Label
                  className={fieldErrors.questionText ? "text-red-600" : undefined}
                >
                  Question Text * (Supports Math Equations)
                </Label>
                <div
                  className={
                    fieldErrors.questionText
                      ? "rounded-md ring-1 ring-red-500"
                      : undefined
                  }
                >
                  <RichTextEditor
                    value={questionText}
                    onChange={setQuestionText}
                    placeholder="Enter your question here... Click 'Math' button to add equations like E=mc², ∫x²dx, etc."
                    minHeight="150px"
                  />
                </div>
                {fieldErrors.questionText && (
                  <p className="text-xs text-red-500 mt-1">
                    {fieldErrors.questionText}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Tip: Use the <strong>Math</strong> button to insert LaTeX
                  equations. Examples: E=mc², \frac{"{a}"}
                  {"{b}"}, \sqrt{"{x}"}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Answer */}
          <div className="bg-card dark:bg-slate-800/50 rounded-lg border dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold mb-4 dark:text-slate-200">
              ✅ Answer
            </h2>

            {questionType === "MCQ" && (
              <div className="space-y-4">
                <Label
                  className={fieldErrors.options ? "text-red-600" : undefined}
                >
                  Options * (Check correct answer)
                </Label>
                {fieldErrors.options && (
                  <p className="text-xs text-red-500">
                    {fieldErrors.options}
                  </p>
                )}
                {mcqOptions.map((opt, idx) => (
                  <div
                    key={idx}
                    className={`border dark:border-slate-700 rounded-lg p-4 ${
                      fieldErrors.options ? "border-red-500" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <Checkbox
                        checked={opt.isCorrect}
                        onCheckedChange={(checked) =>
                          updateMcqOption(idx, "isCorrect", checked as boolean)
                        }
                        className="mt-3"
                      />
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground mb-1">
                          Option {idx + 1} Text *
                        </Label>
                        <RichTextEditor
                          value={opt.text}
                          onChange={(value) =>
                            updateMcqOption(idx, "text", value)
                          }
                          placeholder={`Enter option ${idx + 1}...`}
                          minHeight="80px"
                        />
                      </div>
                      {mcqOptions.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMcqOption(idx)}
                          className="mt-2"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                    <div className="ml-9">
                      <Label className="text-xs text-muted-foreground mb-1">
                        Explanation for Option {idx + 1} (Optional)
                      </Label>
                      <RichTextEditor
                        value={opt.explanation || ""}
                        onChange={(value) =>
                          updateMcqOption(idx, "explanation", value)
                        }
                        placeholder="Explain this option with reasoning, steps, or why students might choose it..."
                        minHeight="60px"
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMcqOption}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </div>
            )}

            {questionType === "TRUE_FALSE" && (
              <div>
                <Label>Correct Answer *</Label>
                <RadioGroup
                  value={trueFalseAnswer}
                  onValueChange={setTrueFalseAnswer}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="TRUE" id="true" />
                    <Label htmlFor="true">True</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="FALSE" id="false" />
                    <Label htmlFor="false">False</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {(questionType === "SHORT_ANSWER" ||
              questionType === "LONG_ANSWER") && (
              <div>
                <Label>Correct Answer *</Label>
                <RichTextEditor
                  value={textAnswer}
                  onChange={setTextAnswer}
                  placeholder="Enter the correct answer..."
                  minHeight="120px"
                />
              </div>
            )}

            {/* Overall Explanation - Only for non-MCQ questions */}
            {questionType !== "MCQ" && (
              <div className="mt-4 space-y-2">
                <Label>Explanation (Optional)</Label>
                <RichTextEditor
                  value={explanation}
                  onChange={setExplanation}
                  placeholder="Explain the answer with steps, formulas, etc..."
                  minHeight="150px"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="w-full sm:max-w-5xl max-h-[calc(100vh-5rem)] overflow-y-auto p-0 sm:p-6">
          <DialogHeader className="px-4 pt-4 sm:px-0 sm:pt-0">
            <DialogTitle>Question Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 px-4 pb-4 sm:px-0 sm:pb-0">
            {/* Question Text */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                Question
              </h3>
              <div className="ProseMirror prose dark:prose-invert max-w-none bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border overflow-x-auto">
                <div
                  dangerouslySetInnerHTML={{
                    __html:
                      questionText ||
                      "<p class='text-muted-foreground'>No question text entered yet</p>",
                  }}
                />
              </div>
            </div>

            {/* MCQ Options */}
            {questionType === "MCQ" && mcqOptions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                  Options
                </h3>
                <div className="space-y-3">
                  {mcqOptions.map((opt, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg border ${
                        opt.isCorrect
                          ? "bg-green-50 dark:bg-green-950/20 border-green-500"
                          : "bg-slate-50 dark:bg-slate-900"
                      }`}
                    >
                      <div className="p-3">
                        <div className="flex items-start gap-2">
                          <span className="font-semibold text-sm mt-1">
                            {String.fromCharCode(65 + idx)}.
                          </span>
                          <div className="flex-1 ProseMirror prose dark:prose-invert prose-sm max-w-none overflow-x-auto">
                            <div
                              dangerouslySetInnerHTML={{
                                __html:
                                  opt.text ||
                                  "<span class='text-muted-foreground'>Empty option</span>",
                              }}
                            />
                          </div>
                          {opt.isCorrect && (
                            <span className="text-green-600 dark:text-green-400 text-xs font-semibold">
                              ✓ Correct
                            </span>
                          )}
                        </div>
                      </div>
                      {opt.explanation && (
                        <div className="px-3 pb-3 pt-0">
                          <div className="ml-6 pl-3 border-l-2 border-blue-400 dark:border-blue-600">
                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                              💡 Explanation:
                            </p>
                            <div className="ProseMirror prose dark:prose-invert prose-sm max-w-none text-sm overflow-x-auto">
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: opt.explanation,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* True/False Answer */}
            {questionType === "TRUE_FALSE" && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                  Correct Answer
                </h3>
                <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-500">
                  <span className="font-semibold text-green-700 dark:text-green-400">
                    {trueFalseAnswer}
                  </span>
                </div>
              </div>
            )}

            {/* Short/Long Answer */}
            {(questionType === "SHORT_ANSWER" ||
              questionType === "LONG_ANSWER") &&
              textAnswer && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                    Correct Answer
                  </h3>
                  <div className="ProseMirror prose dark:prose-invert max-w-none bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-500 overflow-x-auto">
                    <div dangerouslySetInnerHTML={{ __html: textAnswer }} />
                  </div>
                </div>
              )}

            {/* Overall Explanation - Only for non-MCQ questions */}
            {questionType !== "MCQ" && explanation && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                  Explanation
                </h3>
                <div className="ProseMirror prose dark:prose-invert max-w-none bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-500 overflow-x-auto">
                  <div dangerouslySetInnerHTML={{ __html: explanation }} />
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <span className="text-sm text-muted-foreground">
                  Difficulty:
                </span>
                <span className="ml-2 font-semibold">
                  {difficulty === "EASY" && "🟢 Easy"}
                  {difficulty === "MEDIUM" && "🟡 Medium"}
                  {difficulty === "HARD" && "🟠 Hard"}
                  {difficulty === "EXPERT" && "🔴 Expert"}
                </span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Type:</span>
                <span className="ml-2 font-semibold">
                  {questionType === "MCQ" && "📝 Multiple Choice"}
                  {questionType === "TRUE_FALSE" && "✓✗ True/False"}
                  {questionType === "SHORT_ANSWER" && "📄 Short Answer"}
                  {questionType === "LONG_ANSWER" && "📋 Long Answer"}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* SCROLL TO TOP BUTTON */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          size="lg"
          className="fixed bottom-6 right-6 z-40 rounded-full h-14 w-14 p-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-[var(--theme-button-from)] to-[var(--theme-button-to)] hover:opacity-90 text-white"
          title="Scroll to top"
        >
          <ArrowUp className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
