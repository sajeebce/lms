'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import type { CourseFormData } from '../single-course-form'

type Props = {
  data: CourseFormData
  onChange: (data: Partial<CourseFormData>) => void
}

export default function FaqTab({ data, onChange }: Props) {
  const [newQuestion, setNewQuestion] = useState('')
  const [newAnswer, setNewAnswer] = useState('')

  const addFaq = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return

    onChange({
      faqs: [...data.faqs, { question: newQuestion, answer: newAnswer }],
    })
    setNewQuestion('')
    setNewAnswer('')
  }

  const removeFaq = (index: number) => {
    onChange({
      faqs: data.faqs.filter((_, i) => i !== index),
    })
  }

  const moveFaq = (index: number, direction: 'up' | 'down') => {
    const newFaqs = [...data.faqs]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex < 0 || targetIndex >= newFaqs.length) return
    
    ;[newFaqs[index], newFaqs[targetIndex]] = [newFaqs[targetIndex], newFaqs[index]]
    onChange({ faqs: newFaqs })
  }

  return (
    <div className="space-y-6">
      {/* Existing FAQs */}
      {data.faqs.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">Existing FAQs ({data.faqs.length})</h3>
          {data.faqs.map((faq, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 space-y-2 bg-neutral-50 dark:bg-neutral-900"
            >
              <div className="flex items-start gap-2">
                <div className="flex flex-col gap-1 mt-1">
                  <button
                    type="button"
                    onClick={() => moveFaq(index, 'up')}
                    disabled={index === 0}
                    className="text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="font-medium text-sm text-neutral-600 dark:text-neutral-400">
                      Question {index + 1}:
                    </p>
                    <p className="text-sm">{faq.question}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-neutral-600 dark:text-neutral-400">
                      Answer:
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {faq.answer}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFaq(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New FAQ */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <Plus className="h-5 w-5 text-violet-600" />
          Add New FAQ
        </h3>

        <div className="space-y-2">
          <Label htmlFor="newQuestion">Question</Label>
          <Input
            id="newQuestion"
            placeholder="e.g., What are the prerequisites for this course?"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            maxLength={500}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="newAnswer">Answer</Label>
          <Textarea
            id="newAnswer"
            placeholder="Provide a clear and helpful answer..."
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            rows={4}
          />
        </div>

        <Button
          type="button"
          onClick={addFaq}
          disabled={!newQuestion.trim() || !newAnswer.trim()}
          className="w-full bg-gradient-to-r from-[var(--theme-button-from)] to-[var(--theme-button-to)] hover:opacity-90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add FAQ
        </Button>
      </div>

      {/* Info */}
      <div className="border rounded-lg p-4 space-y-2 bg-orange-50 dark:bg-orange-950/20">
        <h3 className="font-medium text-orange-600 dark:text-orange-400">FAQ Tips</h3>
        <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
          <li>• Answer common questions students might have</li>
          <li>• Keep answers clear and concise</li>
          <li>• Include prerequisites, duration, and requirements</li>
          <li>• You can reorder FAQs by dragging</li>
        </ul>
      </div>
    </div>
  )
}

