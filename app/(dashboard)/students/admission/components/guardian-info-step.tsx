'use client'

import { UseFormReturn, useFieldArray } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SearchableDropdown } from '@/components/ui/searchable-dropdown'
import { Button } from '@/components/ui/button'
import { Users, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function GuardianInfoStep({ form }: { form: UseFormReturn<any> }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'guardians',
  })

  const addGuardian = () => {
    append({
      name: '',
      relationship: '',
      phone: '',
      email: '',
      occupation: '',
      address: '',
      isPrimary: fields.length === 0, // First guardian is primary by default
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Guardian Information</h3>
            <p className="text-sm text-muted-foreground">Add parent or guardian details</p>
          </div>
        </div>
        <Button type="button" onClick={addGuardian} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Guardian
        </Button>
      </div>

      {fields.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">No guardians added yet</p>
          <Button type="button" onClick={addGuardian} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add First Guardian
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {fields.map((field, index) => (
          <Card key={field.id} className="border-emerald-200 dark:border-emerald-800/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold flex items-center gap-2">
                  Guardian {index + 1}
                  {form.watch(`guardians.${index}.isPrimary`) && (
                    <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full">
                      Primary
                    </span>
                  )}
                </h4>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`guardians.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter guardian name" maxLength={100} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`guardians.${index}.relationship`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship *</FormLabel>
                      <FormControl>
                        <SearchableDropdown
                          options={[
                            { value: 'Father', label: 'Father' },
                            { value: 'Mother', label: 'Mother' },
                            { value: 'Uncle', label: 'Uncle' },
                            { value: 'Aunt', label: 'Aunt' },
                            { value: 'Grandfather', label: 'Grandfather' },
                            { value: 'Grandmother', label: 'Grandmother' },
                            { value: 'Brother', label: 'Brother' },
                            { value: 'Sister', label: 'Sister' },
                            { value: 'Other', label: 'Other' },
                          ]}
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Select relationship"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`guardians.${index}.phone`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter mobile number" maxLength={20} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`guardians.${index}.email`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="guardian@example.com" maxLength={100} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`guardians.${index}.occupation`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Occupation</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter occupation" maxLength={100} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`guardians.${index}.address`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter address" maxLength={200} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {index === 0 && fields.length > 1 && (
                <div className="mt-4">
                  <FormField
                    control={form.control}
                    name={`guardians.${index}.isPrimary`}
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => {
                              // Set this as primary and unset others
                              fields.forEach((_, i) => {
                                form.setValue(`guardians.${i}.isPrimary`, i === index)
                              })
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0 cursor-pointer">Set as primary contact</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {fields.length > 0 && fields.length < 3 && (
        <Button type="button" onClick={addGuardian} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Another Guardian
        </Button>
      )}
    </div>
  )
}

