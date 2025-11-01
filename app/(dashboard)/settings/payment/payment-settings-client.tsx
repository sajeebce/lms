'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { updatePaymentMethods } from './actions'
import { CreditCard } from 'lucide-react'

interface PaymentSettingsClientProps {
  settings: {
    id: string
    tenantId: string
    paymentMethods: string | null
  }
}

export function PaymentSettingsClient({ settings }: PaymentSettingsClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Parse payment methods
  let paymentMethods: any = {}
  try {
    paymentMethods = settings.paymentMethods ? JSON.parse(settings.paymentMethods) : {}
  } catch (e) {
    paymentMethods = {}
  }

  const [methods, setMethods] = useState({
    stripe: { enabled: paymentMethods.stripe?.enabled || false, apiKey: paymentMethods.stripe?.apiKey || '' },
    paypal: { enabled: paymentMethods.paypal?.enabled || false, clientId: paymentMethods.paypal?.clientId || '' },
    razorpay: { enabled: paymentMethods.razorpay?.enabled || false, keyId: paymentMethods.razorpay?.keyId || '' },
    paytm: { enabled: paymentMethods.paytm?.enabled || false, merchantId: paymentMethods.paytm?.merchantId || '' },
    pesapal: { enabled: paymentMethods.pesapal?.enabled || false, consumerKey: paymentMethods.pesapal?.consumerKey || '' },
    paystack: { enabled: paymentMethods.paystack?.enabled || false, publicKey: paymentMethods.paystack?.publicKey || '' },
    sslcommerz: { enabled: paymentMethods.sslcommerz?.enabled || false, storeId: paymentMethods.sslcommerz?.storeId || '' },
    bankTransfer: { enabled: paymentMethods.bankTransfer?.enabled || false, accountNo: paymentMethods.bankTransfer?.accountNo || '', branchCode: paymentMethods.bankTransfer?.branchCode || '', instructions: paymentMethods.bankTransfer?.instructions || '' },
    upi: { enabled: paymentMethods.upi?.enabled || false, upiId: paymentMethods.upi?.upiId || '' },
    amberpay: { enabled: paymentMethods.amberpay?.enabled || false, merchantId: paymentMethods.amberpay?.merchantId || '' },
  })

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      const result = await updatePaymentMethods({
        paymentMethods: JSON.stringify(methods),
      })
      if (result.success) {
        toast.success('Payment methods updated successfully')
      } else {
        toast.error(result.error || 'Failed to update payment methods')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const paymentGateways = [
    { id: 'stripe', name: 'Stripe', description: 'Global payment gateway', fields: [{ name: 'apiKey', label: 'API Key', placeholder: 'sk_live_...' }] },
    { id: 'paypal', name: 'PayPal', description: 'Global payment gateway', fields: [{ name: 'clientId', label: 'Client ID', placeholder: 'AXX...' }] },
    { id: 'razorpay', name: 'Razorpay', description: 'India payment gateway', fields: [{ name: 'keyId', label: 'Key ID', placeholder: 'rzp_live_...' }] },
    { id: 'paytm', name: 'Paytm', description: 'India payment gateway', fields: [{ name: 'merchantId', label: 'Merchant ID', placeholder: 'MERCHANT_ID' }] },
    { id: 'pesapal', name: 'Pesapal', description: 'Kenya, Malawi, Rwanda, Tanzania, Uganda, Zambia, Zimbabwe', fields: [{ name: 'consumerKey', label: 'Consumer Key', placeholder: 'Consumer Key' }] },
    { id: 'paystack', name: 'Paystack', description: 'Nigeria payment gateway', fields: [{ name: 'publicKey', label: 'Public Key', placeholder: 'pk_live_...' }] },
    { id: 'sslcommerz', name: 'SSLCommerz', description: 'Bangladesh payment gateway', fields: [{ name: 'storeId', label: 'Store ID', placeholder: 'Store ID' }] },
    { id: 'upi', name: 'UPI Transfer', description: 'India UPI payment', fields: [{ name: 'upiId', label: 'UPI ID', placeholder: 'yourname@upi' }] },
    { id: 'amberpay', name: 'Amberpay', description: 'Payment gateway', fields: [{ name: 'merchantId', label: 'Merchant ID', placeholder: 'Merchant ID' }] },
  ]

  return (
    <div className="space-y-6">
      {/* Payment Gateways */}
      {paymentGateways.map((gateway) => (
        <Card key={gateway.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {gateway.name}
                </CardTitle>
                <CardDescription>{gateway.description}</CardDescription>
              </div>
              <Switch
                checked={methods[gateway.id as keyof typeof methods]?.enabled || false}
                onCheckedChange={(checked) =>
                  setMethods((prev) => ({
                    ...prev,
                    [gateway.id]: { ...prev[gateway.id as keyof typeof prev], enabled: checked },
                  }))
                }
              />
            </div>
          </CardHeader>
          {methods[gateway.id as keyof typeof methods]?.enabled && (
            <CardContent className="space-y-4">
              {gateway.fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label>{field.label}</Label>
                  <Input
                    placeholder={field.placeholder}
                    value={(methods[gateway.id as keyof typeof methods] as any)[field.name] || ''}
                    onChange={(e) =>
                      setMethods((prev) => ({
                        ...prev,
                        [gateway.id]: { ...prev[gateway.id as keyof typeof prev], [field.name]: e.target.value },
                      }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      ))}

      {/* Bank Transfer */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Bank Transfer
              </CardTitle>
              <CardDescription>Manual bank transfer payment method</CardDescription>
            </div>
            <Switch
              checked={methods.bankTransfer.enabled}
              onCheckedChange={(checked) =>
                setMethods((prev) => ({ ...prev, bankTransfer: { ...prev.bankTransfer, enabled: checked } }))
              }
            />
          </div>
        </CardHeader>
        {methods.bankTransfer.enabled && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Branch Code</Label>
              <Input
                placeholder="Branch Code"
                value={methods.bankTransfer.branchCode}
                onChange={(e) =>
                  setMethods((prev) => ({ ...prev, bankTransfer: { ...prev.bankTransfer, branchCode: e.target.value } }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input
                placeholder="Account No."
                value={methods.bankTransfer.accountNo}
                onChange={(e) =>
                  setMethods((prev) => ({ ...prev, bankTransfer: { ...prev.bankTransfer, accountNo: e.target.value } }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Instructions</Label>
              <Input
                placeholder="Instructions to be shown to students for bank transfer"
                value={methods.bankTransfer.instructions}
                onChange={(e) =>
                  setMethods((prev) => ({ ...prev, bankTransfer: { ...prev.bankTransfer, instructions: e.target.value } }))
                }
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSubmitting}
          className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium"
        >
          {isSubmitting ? 'Saving...' : 'Save Payment Methods'}
        </Button>
      </div>
    </div>
  )
}

