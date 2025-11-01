'use client'

import { UseFormReturn } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { School } from 'lucide-react'

export function PreviousSchoolStep({ form }: { form: UseFormReturn<any> }) {
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
    </div>
  )
}

