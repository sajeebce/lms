# Question Bank – Questions List View & Lazy Preview Plan

## 1. Goals

This document defines how `/question-bank/questions` should behave and look so we can implement it step by step.

**Primary goals**

- Make the Questions list **fast** on first load (small payload, no heavy HTML/options).
- Provide a **modern, gamified dashboard** feel (chips, pills, subtle cards).
- Allow teachers to **scan questions quickly**, then drill down into options and explanations only when needed.
- Support filtering by **every path/location tag** that appears with a question (Subject → Class → Chapter → Topic, Type, Difficulty, Source, etc.).
- Preserve full **rich-text fidelity** (tables, images, formatting) whenever we choose to show options/explanations.
- Stay fully **multi-tenant SaaS safe**: all queries/actions are scoped by `tenantId`, and no filter or view ever mixes data across tenants.

---

## 2. Filters & Query Model

### 2.1 Filter dimensions

A question is associated with a hierarchy and tags that must all be filterable:

- **Subject** (e.g. Mathematics)
- **Class** (e.g. Nine)
- **Chapter** (e.g. Number Systems)
- **Topic** (e.g. Introduction)
- **Difficulty** (EASY, MEDIUM, HARD, EXPERT)
- **Question Type** (MCQ, TRUE_FALSE, SHORT_ANSWER, LONG_ANSWER, FILL_BLANK, MATCHING)
- **Institution / Board / College** (ExamBoard entity – e.g. “Dhaka Board”, “Notre Dame College”) – optional
- **Exam Year** (ExamYear entity – e.g. `2024`, label `SSC 2024`) – optional
- **Source Type** (UI-only tag such as “📘 Board Exam”, “📗 Textbook” – optional; legacy `sourceId` from `QuestionSource` is still supported for older data)

Marks **do not live on the Question Bank model**. Marks are assigned later at the **exam-question level**, so the same question can carry different marks in different exams. Therefore there is **no marks filter** on the `/question-bank/questions` screen; marks-based filtering will live on the Exam/Question Paper screens.

> Rule: *Whatever we show as a tag/chip on a question card should be usable as a filter.*

### 2.2 Filter UI

- Filters live in the top panel (already present):
  - Subject, Class, Difficulty, Type.
- Extend filters to include:
  - **Chapter** (SearchableDropdown)
  - **Topic** (SearchableDropdown)
  - **Institution / Board / College** (SearchableDropdown backed by `ExamBoard`)
  - **Exam Year** (SearchableDropdown backed by `ExamYear`)
  - **Source Type** (SearchableDropdown with static options: Board Exam, Textbook, Reference Book, Custom, Previous Year, Mock Test) – optional.
  - Keep a free-text **Search** box that searches in question text and maybe correct answer.
- All dropdowns must use the shared **SearchableDropdown** component (per global dropdown standards).

### 2.3 Clickable chips as quick-filters

- Each card shows chips like: Subject, Class, Chapter, Topic, Type, Difficulty.
- Clicking on a chip should **set the corresponding filter** and re-run the query.
  - e.g. click `Mathematics` → `filterSubject = that subjectId`.
  - click `MCQ` → `filterType = 'MCQ'`.
  - click `MEDIUM` → `filterDifficulty = 'MEDIUM'`.
- This keeps the list feeling interactive and modern.

### 2.4 Server-side filters

`getQuestions(filters)` should support (and be extended to include):

```ts
{
  subjectId?: string
  classId?: string
  chapterId?: string
  topicId?: string
  difficulty?: string
  questionType?: string
  institutionId?: string
  examYearId?: string
  sourceId?: string // legacy QuestionSource-based filter (optional)
  // Future: sourceType?: SourceType
  search?: string
  page?: number
  pageSize?: number
}
```

Implementation must ensure:

- All filters are combined in the Prisma `where` clause with `tenantId` and `status: 'ACTIVE'`.
- Pagination (page/pageSize) continues to work.
- **Indexing idea (later):** if needed we can add DB indexes on `(tenantId, topicId, difficulty, questionType)` etc. for performance.

---

## 3. View Modes (Questions / +Options / +Explanations)

### 3.1 Modes

We will use a `viewMode` enum in the client:

```ts
type ViewMode = 'QUESTION' | 'QUESTION_OPTIONS' | 'FULL'
```

- `QUESTION` – default; shows only question text + tags.
- `QUESTION_OPTIONS` – also show options / answers.
- `FULL` – show options + explanations.

### 3.2 View mode toolbar

Under the filter bar we show a small segmented control:

- `Questions` (QUESTION)
- `+ Options` (QUESTION_OPTIONS)
- `+ Explanations` (FULL)

Behaviour:

- On first page load, `viewMode = 'QUESTION'`.
- Switching to `QUESTION_OPTIONS` or `FULL` triggers lazy loading (see below).

---

## 4. Data Loading Strategy

### 4.1 Initial `getQuestions` – light payload

On first load and whenever filters/pagination change, `getQuestions` should return **only lightweight fields**:

- `id`, `questionText`, `questionType`, `difficulty`, `status`.
- Hierarchy & tag relations: `topic` (+ chapter, subject, class), `institution` (ExamBoard), `examYear`, and, for legacy data only, `source`.
- **Do NOT include**:
  - `options` JSON.
  - `explanation` (rich HTML).

This keeps the initial response fast and small.

### 4.2 Lazy loading options & explanations

We introduce a second server action, conceptually:

```ts
getQuestionDetailsForPage({
  questionIds: string[],
  includeExplanations: boolean,
})
```

- Guarded with `requireRole(['ADMIN', 'TEACHER'])` and `getTenantId()` as usual.
- Returns a map keyed by question ID:

```ts
Record<string, {
  options?: { text: string; isCorrect: boolean; explanation?: string }[]
  explanation?: string
}>
```

**When to call:**

- When user first switches to `QUESTION_OPTIONS` → call with `includeExplanations = false`.
- When user first switches to `FULL`:
  - If options already cached, re-use them.
  - Call again with `includeExplanations = true` (or a dedicated explanation-only action) to fetch missing explanations.

### 4.3 Client-side cache

Client keeps:

```ts
const [detailsCache, setDetailsCache] = useState<
  Record<string, { options?: Option[]; explanation?: string }>
>({})
```

- Once loaded for a question, options/explanation are stored in `detailsCache` so toggling modes feels instant.
- Batch fetching uses current page IDs: `questions.map(q => q.id)`.

---

## 5. Rendering Rules

### 5.1 Question text preview (all modes)

- Store question text as HTML from the rich editor.
- For list view, convert to plain text snippet to avoid raw `<p>` tags.
- Use max 1–2 lines in the card.

Example helper (client-side):

```ts
function getPlainPreview(html: string, maxLength = 140) {
  if (!html) return ''
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '…'
}
```

Card usage:

- Apply `line-clamp-2` (Tailwind plugin) or equivalent to visually clamp to 2 lines.

### 5.2 Tags row

- Below question text, show chips for:
  - Subject, Class, Chapter, Topic (hierarchy).
  - Question Type.
  - Difficulty.
  - Institution / Board / College (if `institutionId` is set).
  - Exam Year (if `examYearId` is set).
  - (Optional, future) Source Type (e.g. "📘 Board Exam") once we persist it per question.
- These chips must be **clickable filters** per §2.3.

### 5.3 MCQ options (when viewMode ≠ QUESTION)

For `QUESTION_OPTIONS` and `FULL` modes:

- Look up `detailsCache[question.id].options`.
- Render each option in a pill/card:
  - Correct option background: green/emerald soft.
  - Incorrect options: soft slate background.
  - Option label (A, B, C…) in front.
- Option text is rendered as HTML with TipTap styles:
  - Container: `ProseMirror prose prose-sm dark:prose-invert max-w-none overflow-x-auto`.
  - This ensures tables/images render exactly like in the editor.
  - `overflow-x-auto` prevents wide tables from breaking the layout.

For non-MCQ types in `QUESTION_OPTIONS` mode:

- Show a compact “Answer” pill with the correct answer rendered as rich text.

### 5.4 Explanations (FULL mode only)

When `viewMode === 'FULL'` and `detailsCache[question.id].explanation` exists:

- Render an **Explanation** section under the options:
  - Label line: small `Explanation` text.
  - Content box:
    - `ProseMirror prose prose-sm dark:prose-invert max-w-none max-h-64 overflow-auto`.
    - Again, this reuses TipTap’s CSS so tables, images, math, etc. look correct.
- The `max-h-64` limit ensures huge explanations don’t stretch the whole card; scrolling stays inside the box.

### 5.5 Loading states

- When switching to a richer mode and details are not yet in cache:
  - Show a small skeleton or shimmer where options/explanations will appear.
  - Show a tiny spinner on the view mode button while the fetch is in progress.
- Once data is cached, switching view modes should be instant.

---

## 6. Implementation Steps (High Level)

1. **Update `getQuestions`** to return only lightweight fields (no options/explanations) while keeping all filter params.
2. **Add `getQuestionDetailsForPage` server action** for lazy loading options/explanations.
3. **Extend QuestionsClient state** with `viewMode` and `detailsCache`.
4. **Add the view mode toolbar** under filters and wire it to `viewMode` state and lazy-load calls.
5. **Refactor card rendering**:
   - Use `getPlainPreview` for the main question text.
   - Keep/adjust tag chips (subject/class/chapter/topic/type/difficulty/institution/examYear/[future] source type) and make them clickable filters.
   - Render options/explanations according to `viewMode` and `detailsCache` using `.ProseMirror` + `prose` classes.
6. **Test filters** to ensure every visible tag/location is actually filterable via either the top controls or chip clicks.
7. **Polish**: loading states, hover effects on chips, responsive behaviour.

This document should be used as the reference when refactoring the Questions list page so we can implement the behaviour step by step without losing the existing multi-tenant/RBAC patterns.
