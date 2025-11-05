'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SearchableDropdown } from '@/components/ui/searchable-dropdown'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createQuestion, updateQuestion } from '@/lib/actions/question.actions'
import { Plus, Trash2, Check, Upload } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

type Props = {
  subjects: any[]
  classes: any[]
  chapters: any[]
  topics: any[]
  sources: any[]
  initialData?: any
  onSuccess: () => void
  onCancel: () => void
}

export default function QuestionForm({
  subjects,
  classes,
  chapters,
  topics,
  sources,
  initialData,
  onSuccess,
  onCancel,
}: Props) {
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [step, setStep] = useState(1)

  // Step 1: Location
  const [selectedSubject, setSelectedSubject] = useState(initialData?.topic?.chapter?.subjectId || '')
  const [selectedClass, setSelectedClass] = useState(initialData?.topic?.chapter?.classId || '')
  const [selectedChapter, setSelectedChapter] = useState(initialData?.topic?.chapterId || '')
  const [selectedTopic, setSelectedTopic] = useState(initialData?.topicId || '')

  // Step 2: Question Details
  const [questionType, setQuestionType] = useState(initialData?.questionType || 'MCQ')
  const [questionText, setQuestionText] = useState(initialData?.questionText || '')
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '')

  // Step 3: Answer
  const [mcqOptions, setMcqOptions] = useState<{ text: string; isCorrect: boolean }[]>(
    initialData?.options ? JSON.parse(initialData.options) : [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ]
  )
  const [trueFalseAnswer, setTrueFalseAnswer] = useState(initialData?.correctAnswer || 'TRUE')
  const [textAnswer, setTextAnswer] = useState(initialData?.correctAnswer || '')

  // Step 4: Metadata
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || 'MEDIUM')
  const [marks, setMarks] = useState(initialData?.marks?.toString() || '1')
  const [negativeMarks, setNegativeMarks] = useState(initialData?.negativeMarks?.toString() || '0')
  const [sourceId, setSourceId] = useState(initialData?.sourceId || '')
  const [explanation, setExplanation] = useState(initialData?.explanation || '')

  // Filter chapters based on subject and class
  const filteredChapters = chapters.filter(
    (ch) => ch.subjectId === selectedSubject && ch.classId === selectedClass
  )

  // Filter topics based on chapter
  const filteredTopics = topics.filter((t) => t.chapterId === selectedChapter)

  const addMcqOption = () => {
    setMcqOptions([...mcqOptions, { text: '', isCorrect: false }])
  }

  const removeMcqOption = (index: number) => {
    if (mcqOptions.length > 2) {
      setMcqOptions(mcqOptions.filter((_, i) => i !== index))
    }
  }

  const updateMcqOption = (index: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    const updated = [...mcqOptions]
    updated[index] = { ...updated[index], [field]: value }
    setMcqOptions(updated)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.')
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('questionId', initialData?.id || 'temp')

      const response = await fetch('/api/questions/upload-image', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setImageUrl(result.url)
        toast.success('Image uploaded successfully')
      } else {
        toast.error(result.error || 'Failed to upload image')
      }
    } catch (error) {
      toast.error('An error occurred while uploading image')
    } finally {
      setUploading(false)
    }
  }

  const canProceedStep1 = selectedSubject && selectedClass && selectedChapter && selectedTopic
  const canProceedStep2 = questionText.trim().length > 0
  const canProceedStep3 = () => {
    if (questionType === 'MCQ') {
      const validOptions = mcqOptions.filter((opt) => opt.text.trim().length > 0)
      const correctOptions = mcqOptions.filter((opt) => opt.isCorrect)
      return validOptions.length >= 2 && correctOptions.length > 0
    }
    if (questionType === 'TRUE_FALSE') {
      return trueFalseAnswer.length > 0
    }
    if (questionType === 'SHORT_ANSWER' || questionType === 'LONG_ANSWER') {
      return textAnswer.trim().length > 0
    }
    return true
  }

  const handleSubmit = async () => {
    setSaving(true)

    try {
      const payload: any = {
        topicId: selectedTopic,
        questionText,
        questionType,
        difficulty,
        marks: parseFloat(marks),
        negativeMarks: parseFloat(negativeMarks),
        sourceId: sourceId || undefined,
        explanation: explanation || undefined,
        imageUrl: imageUrl || undefined,
      }

      if (questionType === 'MCQ') {
        payload.options = mcqOptions.filter((opt) => opt.text.trim().length > 0)
      } else if (questionType === 'TRUE_FALSE') {
        payload.correctAnswer = trueFalseAnswer
      } else if (questionType === 'SHORT_ANSWER' || questionType === 'LONG_ANSWER') {
        payload.correctAnswer = textAnswer
      }

      let result
      if (initialData) {
        result = await updateQuestion(initialData.id, payload)
      } else {
        result = await createQuestion(payload)
      }

      if (result.success) {
        toast.success(initialData ? 'Question updated successfully' : 'Question created successfully')
        onSuccess()
      } else {
        toast.error(result.error || 'Failed to save question')
      }
    } catch (error) {
      toast.error('An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s === step
                  ? 'bg-gradient-to-r from-[var(--theme-button-from)] to-[var(--theme-button-to)] text-white'
                  : s < step
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {s < step ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 4 && (
              <div
                className={`w-12 h-1 mx-2 ${
                  s < step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Location */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Step 1: Question Location</h3>

          <div>
            <Label>Subject *</Label>
            <SearchableDropdown
              options={subjects.map((s) => ({ value: s.id, label: s.name }))}
              value={selectedSubject}
              onChange={setSelectedSubject}
              placeholder="Select subject"
            />
          </div>

          <div>
            <Label>Class *</Label>
            <SearchableDropdown
              options={classes.map((c) => ({ value: c.id, label: c.name }))}
              value={selectedClass}
              onChange={setSelectedClass}
              placeholder="Select class"
            />
          </div>

          <div>
            <Label>Chapter *</Label>
            <SearchableDropdown
              options={filteredChapters.map((ch) => ({ value: ch.id, label: ch.name }))}
              value={selectedChapter}
              onChange={setSelectedChapter}
              placeholder="Select chapter"
              disabled={!selectedSubject || !selectedClass}
            />
          </div>

          <div>
            <Label>Topic *</Label>
            <SearchableDropdown
              options={filteredTopics.map((t) => ({ value: t.id, label: t.name }))}
              value={selectedTopic}
              onChange={setSelectedTopic}
              placeholder="Select topic"
              disabled={!selectedChapter}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="bg-gradient-to-r from-[var(--theme-button-from)] to-[var(--theme-button-to)] hover:opacity-90 text-white"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Question Details */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Step 2: Question Details</h3>

          <div>
            <Label>Question Type *</Label>
            <SearchableDropdown
              options={[
                { value: 'MCQ', label: '📝 Multiple Choice (MCQ)' },
                { value: 'TRUE_FALSE', label: '✓✗ True/False' },
                { value: 'SHORT_ANSWER', label: '📄 Short Answer' },
                { value: 'LONG_ANSWER', label: '📋 Long Answer' },
                { value: 'FILL_BLANK', label: '⬜ Fill in the Blank' },
                { value: 'MATCHING', label: '🔗 Matching' },
              ]}
              value={questionType}
              onChange={setQuestionType}
              placeholder="Select question type"
            />
          </div>

          <div>
            <Label>Question Text *</Label>
            <Textarea
              placeholder="Enter the question..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              maxLength={2000}
              rows={5}
            />
            <p className="text-xs text-neutral-500 mt-1">Max 2000 characters</p>
          </div>

          <div>
            <Label>Question Image (Optional)</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Image URL or upload..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('question-image-upload')?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : <Upload className="h-4 w-4" />}
                </Button>
                <input
                  id="question-image-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              {imageUrl && (
                <div className="relative w-full max-w-md">
                  <img
                    src={imageUrl}
                    alt="Question preview"
                    className="w-full rounded-lg border"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setImageUrl('')}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!canProceedStep2}
              className="bg-gradient-to-r from-[var(--theme-button-from)] to-[var(--theme-button-to)] hover:opacity-90 text-white"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Answer */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Step 3: Answer</h3>

          {questionType === 'MCQ' && (
            <div className="space-y-3">
              <Label>Options *</Label>
              {mcqOptions.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Checkbox
                    checked={option.isCorrect}
                    onCheckedChange={(checked) => updateMcqOption(index, 'isCorrect', checked as boolean)}
                  />
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option.text}
                    onChange={(e) => updateMcqOption(index, 'text', e.target.value)}
                    maxLength={500}
                    className="flex-1"
                  />
                  {mcqOptions.length > 2 && (
                    <Button variant="ghost" size="sm" onClick={() => removeMcqOption(index)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addMcqOption}>
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
              <p className="text-xs text-neutral-500">Check the box for correct answer(s)</p>
            </div>
          )}

          {questionType === 'TRUE_FALSE' && (
            <div>
              <Label>Correct Answer *</Label>
              <RadioGroup value={trueFalseAnswer} onValueChange={setTrueFalseAnswer}>
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

          {(questionType === 'SHORT_ANSWER' || questionType === 'LONG_ANSWER') && (
            <div>
              <Label>Model Answer *</Label>
              <Textarea
                placeholder="Enter the model answer..."
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                maxLength={2000}
                rows={questionType === 'LONG_ANSWER' ? 8 : 4}
              />
              <p className="text-xs text-neutral-500 mt-1">Max 2000 characters</p>
            </div>
          )}

          {questionType === 'FILL_BLANK' && (
            <div>
              <Label>Correct Answer *</Label>
              <Input
                placeholder="Enter the correct answer..."
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                maxLength={500}
              />
            </div>
          )}

          {questionType === 'MATCHING' && (
            <div className="text-center py-8 text-neutral-500">
              <p>Matching question type is coming soon 🚧</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              onClick={() => setStep(4)}
              disabled={!canProceedStep3()}
              className="bg-gradient-to-r from-[var(--theme-button-from)] to-[var(--theme-button-to)] hover:opacity-90 text-white"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Metadata */}
      {step === 4 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Step 4: Metadata</h3>

          <div>
            <Label>Difficulty *</Label>
            <SearchableDropdown
              options={[
                { value: 'EASY', label: '🟢 Easy' },
                { value: 'MEDIUM', label: '🟡 Medium' },
                { value: 'HARD', label: '🟠 Hard' },
                { value: 'EXPERT', label: '🔴 Expert' },
              ]}
              value={difficulty}
              onChange={setDifficulty}
              placeholder="Select difficulty"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Marks *</Label>
              <Input
                type="number"
                placeholder="1"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                min={0}
                max={100}
                step={0.5}
              />
            </div>

            <div>
              <Label>Negative Marks</Label>
              <Input
                type="number"
                placeholder="0"
                value={negativeMarks}
                onChange={(e) => setNegativeMarks(e.target.value)}
                min={0}
                max={10}
                step={0.25}
              />
            </div>
          </div>

          <div>
            <Label>Question Source (Optional)</Label>
            <SearchableDropdown
              options={[
                { value: '', label: 'None' },
                ...sources.map((s) => ({ value: s.id, label: `${s.name} ${s.year ? `(${s.year})` : ''}` })),
              ]}
              value={sourceId}
              onChange={setSourceId}
              placeholder="Select source"
            />
          </div>

          <div>
            <Label>Explanation (Optional)</Label>
            <Textarea
              placeholder="Enter explanation for the answer..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              maxLength={1000}
              rows={4}
            />
            <p className="text-xs text-neutral-500 mt-1">Max 1000 characters</p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setStep(3)}>
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-gradient-to-r from-[var(--theme-button-from)] to-[var(--theme-button-to)] hover:opacity-90 text-white"
            >
              {saving ? 'Saving...' : initialData ? 'Update Question' : 'Create Question'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

