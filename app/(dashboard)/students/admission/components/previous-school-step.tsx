'use client'

import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { School, Plus, Trash2, Award } from 'lucide-react'

type AcademicResult = {
  examName: string
  year: string
  gpa: string
  grade: string
}

export function PreviousSchoolStep({ form }: { form: UseFormReturn<any> }) {
  const [academicResults, setAcademicResults] = useState<AcademicResult[]>(
    form.getValues('previousAcademicResults') || []
  )

  const addResult = () => {
    const newResults = [...academicResults, { examName: '', year: '', gpa: '', grade: '' }]
    setAcademicResults(newResults)
    form.setValue('previousAcademicResults', newResults)
  }

  const removeResult = (index: number) => {
    const newResults = academicResults.filter((_, i) => i !== index)
    setAcademicResults(newResults)
    form.setValue('previousAcademicResults', newResults)
  }

  const updateResult = (index: number, field: keyof AcademicResult, value: string) => {
    const newResults = [...academicResults]
    newResults[index][field] = value
    setAcademicResults(newResults)
    form.setValue('previousAcademicResults', newResults)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
          <School className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Previous School Details</h3>
          <p className="text-sm text-muted-foreground">Optional - Information about previous institution</p>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-4 mb-6">
        <p className="text-sm text-amber-800 dark:text-amber-300">
          ℹ️ This section is optional. You can skip it if the student is a new admission or hasn't attended any previous school.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="previousSchoolName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>School Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter previous school name" maxLength={200} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="previousSchoolAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>School Address</FormLabel>
              <FormControl>
                <Input placeholder="Enter school address" maxLength={200} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="previousClass"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Class/Grade</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Class 9" maxLength={50} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="previousBoard"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Board/Curriculum</FormLabel>
              <FormControl>
                <Input placeholder="e.g., CBSE, ICSE, State Board" maxLength={100} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tcNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transfer Certificate (TC) Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter TC number" maxLength={50} {...field} />
              </FormControl>
              <FormDescription>If available</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Academic Results Section */}
      <Card className="border-2 border-dashed border-amber-300 dark:border-amber-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Previous Academic Results
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addResult}
              className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Result
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {academicResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No academic results added yet.</p>
              <p className="text-xs mt-1">Click "Add Result" to add previous exam results.</p>
            </div>
          ) : (
            academicResults.map((result, index) => (
              <Card key={index} className="border-amber-200 dark:border-amber-800/50">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                      Result #{index + 1}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeResult(index)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Exam Name *</label>
                      <Input
                        placeholder="e.g., SSC, Class 10 Board Exam"
                        maxLength={100}
                        value={result.examName}
                        onChange={(e) => updateResult(index, 'examName', e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Year *</label>
                      <Input
                        placeholder="e.g., 2023"
                        maxLength={4}
                        value={result.year}
                        onChange={(e) => updateResult(index, 'year', e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">GPA / Marks</label>
                      <Input
                        placeholder="e.g., 4.5 or 85%"
                        maxLength={20}
                        value={result.gpa}
                        onChange={(e) => updateResult(index, 'gpa', e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Grade</label>
                      <Input
                        placeholder="e.g., A+, First Division"
                        maxLength={50}
                        value={result.grade}
                        onChange={(e) => updateResult(index, 'grade', e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

