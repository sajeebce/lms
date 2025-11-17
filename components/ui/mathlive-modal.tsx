
'use client'

import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import 'mathlive/static.css'

type MathLiveModule = typeof import('mathlive')

let mathLiveImportPromise: Promise<MathLiveModule> | null = null

function loadMathLiveModule(): Promise<MathLiveModule> {
  if (!mathLiveImportPromise) {
    mathLiveImportPromise = import('mathlive')
      .then((mathlive) => {
        if (mathlive?.MathfieldElement) {
          mathlive.MathfieldElement.soundsDirectory = null
        }
        return mathlive
      })
      .catch((error) => {
        mathLiveImportPromise = null
        throw error
      })
  }

  return mathLiveImportPromise
}

type MathFieldElement = HTMLElement & {
  value: string
  executeCommand?: (command: unknown[]) => void
}

type MathLiveModalProps = {
  open: boolean
  onClose: () => void
  onInsert: (latex: string) => void
}

export default function MathLiveModal({ open, onClose, onInsert }: MathLiveModalProps) {
  const mathFieldRef = useRef<MathFieldElement | null>(null)
  const [latex, setLatex] = useState('')
  const [mathLiveLoaded, setMathLiveLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const triggerElementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) {
      const activeElement = document.activeElement
      if (activeElement instanceof HTMLElement) {
        triggerElementRef.current = activeElement
        activeElement.blur()
      }
    } else if (triggerElementRef.current instanceof HTMLElement) {
      triggerElementRef.current.focus()
      triggerElementRef.current = null
    }
  }, [open])

  // Load MathLive library once when the modal opens
  useEffect(() => {
    if (!open || mathLiveLoaded || loadError) {
      return
    }

    let isActive = true

    loadMathLiveModule()
      .then(() => {
        if (isActive) {
          setMathLiveLoaded(true)
        }
      })
      .catch((error) => {
        console.error('Failed to load MathLive', error)
        if (isActive) {
          setLoadError('Failed to load the visual math editor. Please retry.')
        }
      })

    return () => {
      isActive = false
    }
  }, [open, mathLiveLoaded, loadError])

  // Reset and initialize MathLive field when the modal opens
  useEffect(() => {
    if (!open || !mathLiveLoaded || loadError) {
      return
    }

    let mathField: MathFieldElement | null = null
    let rafId: number | null = null

    const handleInput = (evt: Event) => {
      const target = evt.target as MathFieldElement | null
      const valueFromEvent = target?.value ?? mathField?.value ?? ''
      setLatex(valueFromEvent)
    }

    const initializeField = () => {
      const instance = mathFieldRef.current

      if (!instance) {
        rafId = requestAnimationFrame(initializeField)
        return
      }

      mathField = instance
      mathField.removeEventListener('input', handleInput)
      mathField.addEventListener('input', handleInput)
      mathField.value = ''
      setLatex('')

      rafId = null
      requestAnimationFrame(() => {
        if (mathFieldRef.current === mathField) {
          mathField.focus()
        }
      })
    }

    initializeField()

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }

      if (mathField) {
        mathField.removeEventListener('input', handleInput)
      }
    }
  }, [open, mathLiveLoaded, loadError])

  const handleInsert = () => {
    const mathField = mathFieldRef.current
    const rawLatex = mathField?.value ?? latex
    const trimmedLatex = rawLatex.trim()

    if (!trimmedLatex) {
      return
    }

    // ✅ Close modal FIRST, then insert (prevents aria-hidden warning)
    const latexToInsert = trimmedLatex
    handleClose()

    // Wait for modal to fully close before inserting
    setTimeout(() => {
      onInsert(latexToInsert)
    }, 200)
  }

  const handleClose = () => {
    // Blur all focused elements inside dialog
    const activeElement = document.activeElement as HTMLElement | null
    if (activeElement) {
      activeElement.blur()
    }

    // Reset MathLive field
    const mathField = mathFieldRef.current
    if (mathField) {
      mathField.blur()
      mathField.value = ''
    }

    // Reset state
    setLatex('')
    setLoadError(null)

    // Close dialog
    onClose()
  }

  const handleTemplateClick = (template: string) => {
    const mathField = mathFieldRef.current
    if (mathField && mathLiveLoaded && !loadError) {
      if (typeof mathField.executeCommand === 'function') {
        mathField.executeCommand(['insert', template])
      }
      const updatedLatex = mathField.value || ''
      setLatex(updatedLatex)
      mathField.focus()
    }
  }

  const handleRetryLoad = () => {
    setLatex('')
    setLoadError(null)
  }

  const templates = {
    basic: [
      { label: 'Fraction', latex: '\\frac{a}{b}' },
      { label: 'Square Root', latex: '\\sqrt{x}' },
      { label: 'Power', latex: 'x^{n}' },
      { label: 'Subscript', latex: 'x_{n}' },
      { label: 'Absolute', latex: '\\left|x\\right|' },
      { label: 'Parentheses', latex: '\\left(x\\right)' },
    ],
    calculus: [
      { label: 'Integral', latex: '\\int_{a}^{b} f(x) dx' },
      { label: 'Derivative', latex: '\\frac{d}{dx} f(x)' },
      { label: 'Partial', latex: '\\frac{\\partial}{\\partial x} f(x)' },
      { label: 'Limit', latex: '\\lim_{x \\to \\infty} f(x)' },
      { label: 'Summation', latex: '\\sum_{i=1}^{n} x_i' },
      { label: 'Product', latex: '\\prod_{i=1}^{n} x_i' },
    ],
    matrix: [
      { label: '2×2 Matrix', latex: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}' },
      { label: '3×3 Matrix', latex: '\\begin{bmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{bmatrix}' },
      { label: 'Determinant', latex: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}' },
      { label: 'Vector', latex: '\\begin{pmatrix} x \\\\ y \\\\ z \\end{pmatrix}' },
    ],
    trigonometry: [
      { label: 'Sin', latex: '\\sin(x)' },
      { label: 'Cos', latex: '\\cos(x)' },
      { label: 'Tan', latex: '\\tan(x)' },
      { label: 'Arcsin', latex: '\\arcsin(x)' },
      { label: 'Arccos', latex: '\\arccos(x)' },
      { label: 'Arctan', latex: '\\arctan(x)' },
    ],
    greek: [
      { label: 'Alpha', latex: '\\alpha' },
      { label: 'Beta', latex: '\\beta' },
      { label: 'Gamma', latex: '\\gamma' },
      { label: 'Delta', latex: '\\delta' },
      { label: 'Theta', latex: '\\theta' },
      { label: 'Pi', latex: '\\pi' },
      { label: 'Sigma', latex: '\\sigma' },
      { label: 'Omega', latex: '\\omega' },
    ],
    symbols: [
      { label: 'Infinity', latex: '\\infty' },
      { label: 'Plus/Minus', latex: '\\pm' },
      { label: 'Not Equal', latex: '\\neq' },
      { label: 'Less Equal', latex: '\\leq' },
      { label: 'Greater Equal', latex: '\\geq' },
      { label: 'Approximately', latex: '\\approx' },
      { label: 'Proportional', latex: '\\propto' },
      { label: 'Element Of', latex: '\\in' },
    ],
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleClose()
      }
    }}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => {
          // Prevent auto-focus to avoid focus issues
          e.preventDefault()
        }}
        onCloseAutoFocus={(e) => {
          // Prevent auto-focus on close to avoid aria-hidden warning
          e.preventDefault()
        }}
        onInteractOutside={(event) => {
          const target = event.target as HTMLElement | null
          if (!target) return

          const isMathLiveElement =
            target.closest('math-field') ||
            target.closest('.ML__keyboard') ||
            target.closest('.ML__virtual-keyboard') ||
            target.closest('[slot="virtual-keyboard"]')

          if (isMathLiveElement) {
            event.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-orange-500 bg-clip-text text-transparent">
            Math Editor (MathLive)
          </DialogTitle>
          <DialogDescription>
            Use the visual editor below or click templates to insert math equations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* MathLive Editor */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Visual Math Editor</Label>
            {loadError ? (
              <div className="w-full border rounded-lg p-4 text-center space-y-2">
                <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
                <Button type="button" size="sm" variant="outline" onClick={handleRetryLoad}>
                  Retry
                </Button>
              </div>
            ) : mathLiveLoaded ? (
              <math-field
                ref={mathFieldRef}
                className="w-full border rounded-lg p-4 text-2xl min-h-[100px] bg-white dark:bg-slate-900"
                style={{
                  fontSize: '24px',
                  padding: '16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              >
                {latex}
              </math-field>
            ) : (
              <div className="w-full border rounded-lg p-4 text-center text-muted-foreground">
                Loading MathLive editor...
              </div>
            )}
          </div>

          {/* LaTeX Output */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">LaTeX Code</Label>
            <Input
              value={latex}
              onChange={(e) => {
                const newValue = e.target.value
                setLatex(newValue)
                if (mathFieldRef.current) {
                  mathFieldRef.current.value = newValue
                }
              }}
              placeholder="LaTeX will appear here..."
              className="font-mono text-sm"
            />
          </div>

          {/* Templates */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick Templates</Label>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="calculus">Calculus</TabsTrigger>
                <TabsTrigger value="matrix">Matrix</TabsTrigger>
                <TabsTrigger value="trigonometry">Trig</TabsTrigger>
                <TabsTrigger value="greek">Greek</TabsTrigger>
                <TabsTrigger value="symbols">Symbols</TabsTrigger>
              </TabsList>

              {Object.entries(templates).map(([key, items]) => (
                <TabsContent key={key} value={key} className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    {items.map((template) => (
                      <Button
                        key={template.label}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleTemplateClick(template.latex)}
                        className="justify-start text-left h-auto py-2"
                      >
                        <span className="text-xs font-medium">{template.label}</span>
                      </Button>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleInsert}
              disabled={!latex.trim()}
              className="bg-gradient-to-r from-violet-600 to-orange-500 hover:from-violet-700 hover:to-orange-600 text-white"
            >
              Insert Math
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

