'use client'

import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from './button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type CopyablePhoneProps = {
  phone: string
  prefix?: string
  className?: string
  showIcon?: boolean
}

export function CopyablePhone({ phone, prefix, className, showIcon = true }: CopyablePhoneProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const fullPhone = prefix ? `${prefix}${phone}` : phone
      await navigator.clipboard.writeText(fullPhone)
      setCopied(true)
      toast.success('Phone number copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy')
    }
  }

  const displayPhone = prefix ? `${prefix} ${phone}` : phone

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <a
        href={`tel:${prefix || ''}${phone}`}
        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
      >
        {displayPhone}
      </a>
      {showIcon && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleCopy}
          title="Copy phone number"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-gray-500" />
          )}
        </Button>
      )}
    </div>
  )
}

type CopyableEmailProps = {
  email: string
  className?: string
  showIcon?: boolean
}

export function CopyableEmail({ email, className, showIcon = true }: CopyableEmailProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      toast.success('Email copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <a
        href={`mailto:${email}`}
        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
      >
        {email}
      </a>
      {showIcon && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleCopy}
          title="Copy email"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-gray-500" />
          )}
        </Button>
      )}
    </div>
  )
}

type CopyableTextProps = {
  text: string
  label?: string
  className?: string
  showIcon?: boolean
}

export function CopyableText({ text, label, className, showIcon = true }: CopyableTextProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success(`${label || 'Text'} copied!`)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span>{text}</span>
      {showIcon && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleCopy}
          title={`Copy ${label || 'text'}`}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-gray-500" />
          )}
        </Button>
      )}
    </div>
  )
}

