'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, X, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectDropdownProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  label?: string
  className?: string
  disabled?: boolean
}

export function MultiSelectDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select items...',
  label,
  className,
  disabled = false,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [options, searchQuery])

  // Get selected option labels
  const selectedLabels = React.useMemo(() => {
    return value
      .map((val) => options.find((opt) => opt.value === val)?.label)
      .filter(Boolean) as string[]
  }, [value, options])

  const handleSelect = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue]
    onChange(newValue)
  }

  const handleRemove = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue))
  }

  const handleClearAll = () => {
    onChange([])
  }

  return (
    <div className={cn('w-full', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between min-h-[40px] h-auto',
              !value.length && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {value.length === 0 ? (
                <span>{placeholder}</span>
              ) : (
                value.slice(0, 3).map((val) => {
                  const option = options.find((opt) => opt.value === val)
                  return (
                    <Badge
                      key={val}
                      variant="secondary"
                      className="mr-1 mb-1 cursor-pointer hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemove(val)
                      }}
                    >
                      {option?.label}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  )
                })
              )}
              {value.length > 3 && (
                <Badge variant="secondary" className="mb-1">
                  +{value.length - 3} more
                </Badge>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                placeholder="Search..."
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {value.length > 0 && (
              <div className="flex items-center justify-between border-b px-3 py-2">
                <span className="text-sm text-muted-foreground">
                  {value.length} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-sm text-destructive hover:text-destructive hover:bg-transparent"
                  onClick={handleClearAll}
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear All
                </Button>
              </div>
            )}

            <CommandList className="max-h-[300px] overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <CommandEmpty>No results found.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredOptions.map((option) => {
                    const isSelected = value.includes(option.value)
                    return (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={() => handleSelect(option.value)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center space-x-2 flex-1">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleSelect(option.value)}
                            className="pointer-events-none"
                          />
                          <span className="flex-1">{option.label}</span>
                        </div>
                        {isSelected && (
                          <Check className="ml-2 h-4 w-4 text-primary" />
                        )}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

