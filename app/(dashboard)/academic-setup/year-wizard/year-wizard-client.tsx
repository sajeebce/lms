'use client'

import { useState } from 'react'
import { Wand2, Eye, Sparkles, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { previewYearWizard, executeYearWizard } from './actions'

type Branch = { id: string; name: string }
type AcademicYear = { id: string; name: string }
type Class = { id: string; name: string }

type PreviewItem = {
  classId: string
  className: string
  cohortName: string
  sections: { name: string; capacity: number }[]
  exists: boolean
}

export function YearWizardClient({
  branches,
  academicYears,
  classes,
}: {
  branches: Branch[]
  academicYears: AcademicYear[]
  classes: Class[]
}) {
  const [formData, setFormData] = useState({
    yearId: '',
    branchId: '',
    classIds: [] as string[],
  })

  const [preview, setPreview] = useState<PreviewItem[] | null>(null)
  const [previewMeta, setPreviewMeta] = useState<{
    year: string
    branch: string
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const handlePreview = async () => {
    if (!formData.yearId || !formData.branchId || formData.classIds.length === 0) {
      toast.error('Please fill all fields')
      return
    }

    setLoading(true)
    const result = await previewYearWizard(formData)
    setLoading(false)

    if (result.success && result.preview) {
      setPreview(result.preview)
      setPreviewMeta({ year: result.year!, branch: result.branch! })
      toast.success('Preview generated')
    } else {
      toast.error(result.error || 'Failed to generate preview')
    }
  }

  const handleExecute = async () => {
    if (!preview) return

    if (
      !confirm(
        'Are you sure you want to create these cohorts and sections? This action cannot be undone.'
      )
    )
      return

    setLoading(true)
    const result = await executeYearWizard(formData)
    setLoading(false)

    if (result.success && result.stats) {
      const { cohortsCreated, sectionsCreated, skipped } = result.stats
      toast.success('Cohorts & Sections created 🎉', {
        description: `Created ${cohortsCreated} cohort(s) and ${sectionsCreated} section(s). Skipped ${skipped} existing.`,
      })
      setPreview(null)
      setPreviewMeta(null)
      setFormData({ yearId: '', branchId: '', classIds: [] })
    } else {
      toast.error(result.error || 'Failed to execute wizard')
    }
  }

  const toggleClass = (classId: string) => {
    setFormData((prev) => ({
      ...prev,
      classIds: prev.classIds.includes(classId)
        ? prev.classIds.filter((id) => id !== classId)
        : [...prev.classIds, classId],
    }))
    setPreview(null) // Reset preview when selection changes
  }

  return (
    <div className="space-y-6">
      {/* Form Card */}
      <Card className="border-violet-200 dark:border-violet-800/30 bg-gradient-to-br from-white to-violet-50/30 dark:from-card dark:to-violet-950/20">
        <CardHeader className="bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-950/30 dark:to-indigo-950/30 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-600 dark:bg-violet-700 rounded-lg">
              <Wand2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Year Wizard</CardTitle>
              <CardDescription className="text-violet-900 dark:text-violet-300">
                Select academic year, branch, and classes to auto-generate cohorts and
                sections
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="yearId">Academic Year *</Label>
              <Select
                value={formData.yearId}
                onValueChange={(value) => {
                  setFormData({ ...formData, yearId: value })
                  setPreview(null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="branchId">Branch *</Label>
              <Select
                value={formData.branchId}
                onValueChange={(value) => {
                  setFormData({ ...formData, branchId: value })
                  setPreview(null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Classes * (select multiple)</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => toggleClass(cls.id)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.classIds.includes(cls.id)
                      ? 'border-violet-600 dark:border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-900 dark:text-violet-200'
                      : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-card hover:border-violet-300 dark:hover:border-violet-600 text-foreground'
                  }`}
                >
                  <div className="font-medium">{cls.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handlePreview}
              disabled={loading}
            >
              <Eye className="h-4 w-4 mr-2" />
              {loading ? 'Generating...' : 'Preview'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Table */}
      {preview && previewMeta && (
        <Card className="border-indigo-200 dark:border-indigo-800/30">
          <CardHeader className="bg-indigo-50 dark:bg-indigo-950/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Preview</CardTitle>
                <CardDescription className="dark:text-neutral-300">
                  {previewMeta.year} at {previewMeta.branch}
                </CardDescription>
              </div>
              <Button
                onClick={handleExecute}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Generate Now'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow className="bg-violet-50/50 dark:bg-slate-800/50">
                  <TableHead>Class</TableHead>
                  <TableHead>Cohort Name</TableHead>
                  <TableHead>Sections</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((item) => (
                  <TableRow key={item.classId}>
                    <TableCell className="font-medium">{item.className}</TableCell>
                    <TableCell>{item.cohortName}</TableCell>
                    <TableCell>
                      {item.sections.length === 0 ? (
                        <span className="text-muted-foreground text-sm">
                          No templates defined
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {item.sections.map((section, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {section.name} ({section.capacity})
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.exists ? (
                        <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Already Exists
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300">
                          Will Create
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

