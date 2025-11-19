'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import type { CourseFormData } from '../single-course-form'
import RichTextEditor from '@/components/ui/rich-text-editor'

type Props = {
  data: CourseFormData
  onChange: (data: Partial<CourseFormData>) => void
}

export default function FaqTab({ data, onChange }: Props) {
  const [newQuestion, setNewQuestion] = useState('')
  const [newAnswer, setNewAnswer] = useState('')

  const addFaq = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return

    const clientId = `faq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    onChange({
      faqs: [...data.faqs, { clientId, question: newQuestion, answer: newAnswer }],
    })
    setNewQuestion('')
    setNewAnswer('')
  }

  const removeFaq = (index: number) => {
    onChange({
      faqs: data.faqs.filter((_, i) => i !== index),
    })
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(data.faqs)
    const [moved] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, moved)

    onChange({ faqs: items })
  }

  return (
    <div className="space-y-6">
      {/* Existing FAQs */}
      {data.faqs.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">Existing FAQs ({data.faqs.length})</h3>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="faqs">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-3"
                >
                  {data.faqs.map((faq, index) => {
                    const faqId = faq.id ?? faq.clientId ?? `${index}`

                    return (
                      <Draggable key={faqId} draggableId={faqId} index={index}>
                        {(dragProvided) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            className="border rounded-lg p-4 space-y-2 bg-neutral-50 dark:bg-neutral-900"
                          >
                            <div className="flex items-start gap-2">
                              <button
                                type="button"
                                className="mt-1 text-neutral-400 hover:text-neutral-600 cursor-grab active:cursor-grabbing"
                                aria-label="Drag to reorder FAQ"
                                {...dragProvided.dragHandleProps}
                              >
                                <GripVertical className="h-4 w-4" />
                              </button>
                              <div className="flex-1 space-y-2">
                                <div>
                                  <p className="font-medium text-sm text-neutral-600 dark:text-neutral-400">
                                    Question {index + 1}:
                                  </p>
                                  <div
                                    className="prose prose-sm dark:prose-invert max-w-none text-sm"
                                    dangerouslySetInnerHTML={{ __html: faq.question }}
                                  />
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-neutral-600 dark:text-neutral-400">
                                    Answer:
                                  </p>
                                  <div
                                    className="prose prose-sm dark:prose-invert max-w-none text-sm text-neutral-600 dark:text-neutral-400"
                                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                                  />
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
                        )}
                      </Draggable>
                    )
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}

      {/* Add New FAQ */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <Plus className="h-5 w-5 text-violet-600" />
          Add New FAQ
        </h3>

        <div className="space-y-2">
          <Label>Question</Label>
          <RichTextEditor
            value={newQuestion}
            onChange={setNewQuestion}
            placeholder="e.g., What are the prerequisites for this course?"
            minHeight="120px"
          />
        </div>

        <div className="space-y-2">
          <Label>Answer</Label>
          <RichTextEditor
            value={newAnswer}
            onChange={setNewAnswer}
            placeholder="Provide a clear and helpful answer..."
            minHeight="150px"
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
          <li>• Drag the handle on the left to reorder FAQs</li>
        </ul>
      </div>
    </div>
  )
}

