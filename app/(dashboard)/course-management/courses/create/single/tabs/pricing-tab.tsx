'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { SearchableDropdown } from '@/components/ui/searchable-dropdown'
import { Switch } from '@/components/ui/switch'
import type { CourseFormData } from '../single-course-form'

type Props = {
  data: CourseFormData
  onChange: (data: Partial<CourseFormData>) => void
}

export default function PricingTab({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      {/* Payment Type */}
      <div className="space-y-2">
        <Label>Payment Type *</Label>
        <SearchableDropdown
          options={[
            { value: 'FREE', label: '🎁 Free' },
            { value: 'ONE_TIME', label: '💰 One-Time Payment' },
            { value: 'SUBSCRIPTION', label: '🔄 Subscription' },
          ]}
          value={data.paymentType}
          onChange={(value) => onChange({ paymentType: value as 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION' })}
          placeholder="Select payment type"
        />
      </div>

      {/* Show pricing fields only if not FREE */}
      {data.paymentType !== 'FREE' && (
        <>
          {/* Invoice Title */}
          <div className="space-y-2">
            <Label htmlFor="invoiceTitle">Invoice Title</Label>
            <Input
              id="invoiceTitle"
              placeholder="e.g., Course Fee - Introduction to Programming"
              value={data.invoiceTitle || ''}
              onChange={(e) => onChange({ invoiceTitle: e.target.value })}
              maxLength={200}
            />
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label>Currency</Label>
            <SearchableDropdown
              options={[
                { value: 'BDT', label: '🇧🇩 BDT (Bangladeshi Taka)' },
                { value: 'USD', label: '🇺🇸 USD (US Dollar)' },
                { value: 'EUR', label: '🇪🇺 EUR (Euro)' },
                { value: 'GBP', label: '🇬🇧 GBP (British Pound)' },
                { value: 'INR', label: '🇮🇳 INR (Indian Rupee)' },
              ]}
              value={data.currency}
              onChange={(value) => onChange({ currency: value })}
              placeholder="Select currency"
            />
          </div>

          {/* Pricing */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="regularPrice">Regular Price</Label>
              <Input
                id="regularPrice"
                type="number"
                placeholder="e.g., 5000"
                value={data.regularPrice || ''}
                onChange={(e) => onChange({ regularPrice: parseFloat(e.target.value) || undefined })}
                min={0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="offerPrice">Offer Price (Optional)</Label>
              <Input
                id="offerPrice"
                type="number"
                placeholder="e.g., 3500"
                value={data.offerPrice || ''}
                onChange={(e) => onChange({ offerPrice: parseFloat(e.target.value) || undefined })}
                min={0}
              />
              <p className="text-xs text-neutral-500">Leave empty if no discount</p>
            </div>
          </div>

          {/* Subscription Settings */}
          {data.paymentType === 'SUBSCRIPTION' && (
            <>
              <div className="space-y-2">
                <Label>Subscription Type</Label>
                <SearchableDropdown
                  options={[
                    { value: 'MONTHLY', label: '📅 Monthly' },
                    { value: 'QUARTERLY', label: '📅 Quarterly (3 months)' },
                    { value: 'YEARLY', label: '📅 Yearly (12 months)' },
                    { value: 'CUSTOM', label: '⚙️ Custom Duration' },
                  ]}
                  value={data.subscriptionType || ''}
                  onChange={(value) => onChange({ subscriptionType: value as any })}
                  placeholder="Select subscription type"
                />
              </div>

              {data.subscriptionType === 'CUSTOM' && (
                <div className="space-y-2">
                  <Label htmlFor="subscriptionDuration">Subscription Duration (Days)</Label>
                  <Input
                    id="subscriptionDuration"
                    type="number"
                    placeholder="e.g., 90"
                    value={data.subscriptionDuration || ''}
                    onChange={(e) => onChange({ subscriptionDuration: parseInt(e.target.value) || undefined })}
                    min={1}
                  />
                </div>
              )}
            </>
          )}

          {/* Auto Generate Invoice */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label>Auto-Generate Invoice</Label>
              <p className="text-sm text-neutral-500">
                Automatically create invoice when student enrolls
              </p>
            </div>
            <Switch
              checked={data.autoGenerateInvoice}
              onCheckedChange={(checked) => onChange({ autoGenerateInvoice: checked })}
            />
          </div>
        </>
      )}
    </div>
  )
}

